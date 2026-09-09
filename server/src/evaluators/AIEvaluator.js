const { GoogleGenerativeAI } = require('@google/generative-ai');
const Evaluator = require('./Evaluator');
const { RUBRIC, calculateOverallScore } = require('../config/rubric');

/**
 * AIEvaluator — uses Google Gemini to evaluate learner submissions.
 *
 * Key design choices:
 * - Uses a detailed system prompt with the fixed rubric
 * - Requires structured JSON output (enforced via prompt + JSON.parse)
 * - Retries ONCE on malformed JSON before failing
 * - Never exposes raw AI errors to the client
 * - All AI calls are wrapped in a timeout
 *
 * Change Test B compliance:
 *   To add a HumanEvaluator, extend Evaluator and update config/evaluator.js.
 *   This class and EvaluationService are NOT touched.
 */
class AIEvaluator extends Evaluator {
  constructor() {
    super();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required for AIEvaluator');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this._model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    });
    this._timeoutMs = 45000; // 45s — Gemini can be slow on first request
  }

  getType() {
    return 'ai';
  }

  async evaluate(submissionPayload, problem) {
    const prompt = this._buildPrompt(submissionPayload, problem);

    let rawText;
    try {
      rawText = await this._callWithTimeout(prompt);
    } catch (err) {
      throw new Error(`Gemini API call failed: ${err.message}`);
    }

    // Parse + validate — retry once on malformed JSON
    let result;
    try {
      result = this._parseResponse(rawText);
    } catch (_parseErr) {
      // One retry with a stricter prompt
      try {
        const retryPrompt = this._buildRetryPrompt(rawText);
        const retryText = await this._callWithTimeout(retryPrompt);
        result = this._parseResponse(retryText);
      } catch (retryErr) {
        throw new Error(`Failed to parse AI response after retry: ${retryErr.message}`);
      }
    }

    this._validateResult(result);

    // Recalculate overallScore from criteria for consistency
    result.overallScore = calculateOverallScore(result.criteria);

    return result;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  _buildPrompt(payload, problem) {
    const criteriaList = RUBRIC.map(
      (r, i) => `${i + 1}. **${r.name}** (0-10): ${r.description}`
    ).join('\n');

    return `You are an expert software engineer evaluating a learner's Low-Level Design (LLD) submission.

## Problem
**Title:** ${problem.title}
**Difficulty:** ${problem.difficulty}
**Description:** ${problem.description}

**Requirements:**
${(problem.requirements || []).map((r) => `- ${r}`).join('\n')}

**Constraints:**
${(problem.constraints || []).map((c) => `- ${c}`).join('\n')}

**Expected Design Considerations:**
${(problem.expectedConsiderations || []).map((c) => `- ${c}`).join('\n')}

## Learner's Submission

**Requirements / Assumptions:**
${payload.requirements}
${payload.assumptions ? `\n**Additional Assumptions:**\n${payload.assumptions}` : ''}

**Classes Identified:**
${payload.classes}

**Class Responsibilities:**
${payload.responsibilities}

**Relationships:**
${payload.relationships}

**Interfaces / Abstractions:**
${payload.interfaces}

**Design Patterns:**
${payload.patterns}

**Edge Cases:**
${payload.edgeCases}

**Design Explanation:**
${payload.explanation}

${payload.optionalCode ? `**Optional Code:**\n\`\`\`\n${payload.optionalCode}\n\`\`\`` : ''}

## Evaluation Task

Evaluate this submission against the following rubric. Score each criterion from 0 to 10.

${criteriaList}

## CRITICAL INSTRUCTIONS

1. Return ONLY valid JSON — no markdown, no code blocks, no explanation outside JSON.
2. The "evidence" field MUST be a direct quote or specific reference from the learner's submission above.
3. Do NOT give generic praise. Every "concern" and "suggestion" must be specific to this submission.
4. "priorityImprovements" must be concrete, actionable, and specific to what the learner wrote.
5. Be honest and calibrated: a brief, shallow submission should score 3-5, not 7-8.

Return this exact JSON structure:
{
  "overallScore": <number 0-10>,
  "summary": "<2-3 sentence honest assessment referencing the submission>",
  "criteria": [
    {
      "name": "<exact criterion name from rubric>",
      "score": <0-10>,
      "evidence": "<direct quote or reference from learner's submission>",
      "concern": "<specific weakness, or empty string if none>",
      "suggestion": "<concrete actionable improvement, or empty string if score >= 8>",
      "confidence": <0.0-1.0>
    }
  ],
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "priorityImprovements": [
    "<specific improvement 1>",
    "<specific improvement 2>",
    "<specific improvement 3>"
  ]
}`;
  }

  _buildRetryPrompt(previousResponse) {
    return `The following text was supposed to be valid JSON but failed to parse.
Extract and return ONLY the valid JSON object from it. No explanation, no markdown, just raw JSON.

Text to fix:
${previousResponse.substring(0, 3000)}`;
  }

  async _callWithTimeout(prompt) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 45s')), this._timeoutMs)
    );

    const apiPromise = this._model
      .generateContent(prompt)
      .then((res) => res.response.text());

    return Promise.race([apiPromise, timeoutPromise]);
  }

  _parseResponse(rawText) {
    // Strip markdown code blocks if present
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    // Find the JSON object boundaries
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error('No JSON object found in response');
    }

    const jsonStr = cleaned.substring(start, end + 1);
    return JSON.parse(jsonStr);
  }

  _validateResult(result) {
    if (typeof result.overallScore !== 'number') {
      throw new Error('Missing or invalid overallScore');
    }
    if (!Array.isArray(result.criteria) || result.criteria.length === 0) {
      throw new Error('Missing or empty criteria array');
    }
    // Ensure all rubric criteria are present
    for (const rubricItem of RUBRIC) {
      const found = result.criteria.find((c) => c.name === rubricItem.name);
      if (!found) {
        // Add a default if AI missed a criterion
        result.criteria.push({
          name: rubricItem.name,
          score: 5,
          evidence: 'Not explicitly evaluated.',
          concern: '',
          suggestion: '',
          confidence: 0.5,
        });
      }
    }
    if (!Array.isArray(result.strengths)) result.strengths = [];
    if (!Array.isArray(result.priorityImprovements)) result.priorityImprovements = [];
    if (!result.summary) result.summary = 'Evaluation completed.';
  }
}

module.exports = AIEvaluator;
