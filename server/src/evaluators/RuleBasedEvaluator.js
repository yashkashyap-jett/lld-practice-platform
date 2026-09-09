const Evaluator = require('./Evaluator');
const { RUBRIC, calculateOverallScore } = require('../config/rubric');

/**
 * RuleBasedEvaluator — deterministic fallback evaluator.
 *
 * Produces meaningful evaluation WITHOUT calling any external API.
 * Used when GEMINI_API_KEY is not set (dev/demo mode).
 *
 * Scoring strategy:
 *   Each criterion is scored based on:
 *   1. Word count across relevant submission sections
 *   2. Presence of domain-relevant keywords
 *   3. Section completeness
 *
 * This is intentionally honest: it produces a real score reflecting
 * submission depth, not a flat "5/10 default". Clearly marked as
 * evaluatorType: 'rule_based' in the result.
 */
class RuleBasedEvaluator extends Evaluator {
  getType() {
    return 'rule_based';
  }

  async evaluate(submissionPayload, problem) {
    const criteria = RUBRIC.map((rubricItem) =>
      this._scoreCriterion(rubricItem, submissionPayload, problem)
    );

    const overallScore = calculateOverallScore(criteria);

    const strengths = this._extractStrengths(criteria);
    const priorityImprovements = this._extractImprovements(criteria, submissionPayload);

    return {
      overallScore,
      summary: this._buildSummary(overallScore, submissionPayload, problem),
      criteria,
      strengths,
      priorityImprovements,
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  _scoreCriterion(rubricItem, payload, problem) {
    const score = this._computeScore(rubricItem.name, payload, problem);
    return {
      name: rubricItem.name,
      score,
      evidence: this._extractEvidence(rubricItem.name, payload),
      concern: score < 5 ? this._getConcern(rubricItem.name, score) : '',
      suggestion: score < 8 ? this._getSuggestion(rubricItem.name, score) : '',
      confidence: 0.6, // rule-based is less confident than AI
    };
  }

  _computeScore(criterionName, payload, _problem) {
    switch (criterionName) {
      case 'Requirement Understanding':
        return this._scoreByWordCount(payload.requirements, 50, 200) +
          this._scoreByWordCount(payload.assumptions, 20, 100);

      case 'Class Responsibilities':
        return this._scoreByWordCount(payload.classes, 50, 150) +
          this._scoreByWordCount(payload.responsibilities, 50, 200);

      case 'Coupling & Cohesion':
        return this._scoreByKeywords(
          payload.relationships + ' ' + payload.responsibilities,
          ['single responsibility', 'interface', 'depend', 'decouple', 'cohes', 'couple', 'inject']
        );

      case 'Encapsulation & Interfaces':
        return this._scoreByWordCount(payload.interfaces, 30, 150) +
          this._scoreByKeywords(payload.interfaces, ['interface', 'abstract', 'private', 'encapsul', 'hide', 'contract']);

      case 'Abstraction & Design Patterns':
        return this._scoreByWordCount(payload.patterns, 30, 150) +
          this._scoreByKeywords(payload.patterns, [
            'factory', 'strategy', 'observer', 'singleton', 'command',
            'decorator', 'template', 'facade', 'proxy', 'pattern',
          ]);

      case 'Extensibility':
        return this._scoreByKeywords(
          payload.explanation + ' ' + payload.patterns,
          ['extend', 'open', 'closed', 'future', 'change', 'modif', 'flexib', 'plug']
        );

      case 'Edge Cases & Testability':
        return this._scoreByWordCount(payload.edgeCases, 40, 150) +
          this._scoreByKeywords(payload.edgeCases, ['full', 'empty', 'null', 'concurrent', 'overflow', 'invalid', 'boundary']);

      case 'Design Explanation & Trade-offs':
        return this._scoreByWordCount(payload.explanation, 80, 300) +
          this._scoreByKeywords(payload.explanation, ['trade-off', 'tradeoff', 'because', 'chose', 'decided', 'reason', 'alternative']);

      default:
        return 5;
    }
  }

  /**
   * Score based on word count: 0 words → 0, target range → max, scales linearly.
   * Returns 0–5 (combined with keyword score for full 0–10).
   */
  _scoreByWordCount(text, minWords, targetWords) {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    if (words < 5) return 0;
    const score = Math.min(5, (words / targetWords) * 5);
    return Math.round(score * 10) / 10;
  }

  /**
   * Score based on keyword presence: each keyword found adds points.
   * Returns 0–5.
   */
  _scoreByKeywords(text, keywords) {
    if (!text) return 0;
    const lower = text.toLowerCase();
    const found = keywords.filter((kw) => lower.includes(kw)).length;
    const score = Math.min(5, (found / Math.max(keywords.length, 1)) * 10);
    return Math.round(score * 10) / 10;
  }

  _extractEvidence(criterionName, payload) {
    const sectionMap = {
      'Requirement Understanding': payload.requirements,
      'Class Responsibilities': payload.responsibilities,
      'Coupling & Cohesion': payload.relationships,
      'Encapsulation & Interfaces': payload.interfaces,
      'Abstraction & Design Patterns': payload.patterns,
      'Extensibility': payload.explanation,
      'Edge Cases & Testability': payload.edgeCases,
      'Design Explanation & Trade-offs': payload.explanation,
    };
    const text = sectionMap[criterionName] || '';
    const words = text.trim().split(/\s+/);
    return words.length > 10
      ? '"' + words.slice(0, 15).join(' ') + '..."'
      : text.length > 0
      ? '"' + text + '"'
      : 'No content provided in this section.';
  }

  _getConcern(criterionName, score) {
    const concerns = {
      'Requirement Understanding': 'Requirements section lacks sufficient detail or coverage.',
      'Class Responsibilities': 'Classes and responsibilities are not clearly defined.',
      'Coupling & Cohesion': 'Relationships between classes are not described.',
      'Encapsulation & Interfaces': 'Interfaces and encapsulation principles are not addressed.',
      'Abstraction & Design Patterns': 'Design patterns are not identified or justified.',
      'Extensibility': 'Extensibility considerations are missing from the explanation.',
      'Edge Cases & Testability': 'Edge cases are not adequately identified.',
      'Design Explanation & Trade-offs': 'Design reasoning and trade-offs are not explained.',
    };
    return concerns[criterionName] || 'This area needs more depth.';
  }

  _getSuggestion(criterionName, _score) {
    const suggestions = {
      'Requirement Understanding': 'Explicitly list what the system must and must not do. State your assumptions clearly.',
      'Class Responsibilities': 'For each class, write one sentence: "This class is responsible for X and only X."',
      'Coupling & Cohesion': 'Describe how classes communicate. Prefer dependencies on interfaces, not concrete types.',
      'Encapsulation & Interfaces': 'Define at least one interface per extension point. Hide internal state behind methods.',
      'Abstraction & Design Patterns': 'Name the pattern, quote the Gang of Four definition, explain why it fits here.',
      'Extensibility': 'Describe specifically what can change in the future and how your design accommodates it.',
      'Edge Cases & Testability': 'List at least 5 edge cases. For each, state how your design handles it.',
      'Design Explanation & Trade-offs': 'For each major decision, explain what alternative you considered and why you rejected it.',
    };
    return suggestions[criterionName] || 'Expand this section with more detail.';
  }

  _extractStrengths(criteria) {
    return criteria
      .filter((c) => c.score >= 7)
      .map((c) => `Strong ${c.name.toLowerCase()} demonstrated in the submission.`);
  }

  _extractImprovements(criteria, _payload) {
    return criteria
      .filter((c) => c.score < 6)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((c) => c.suggestion)
      .filter(Boolean);
  }

  _buildSummary(score, payload, problem) {
    const level = score >= 8 ? 'strong' : score >= 6 ? 'solid' : score >= 4 ? 'developing' : 'early-stage';
    const wordCount = Object.values(payload)
      .filter((v) => typeof v === 'string')
      .reduce((sum, v) => sum + v.split(/\s+/).length, 0);
    return (
      `This is a ${level} submission for the ${problem.title} problem (${wordCount} words total). ` +
      `Note: This evaluation was performed by the deterministic rule-based evaluator (no AI API key configured). ` +
      `Set GEMINI_API_KEY for richer AI-powered feedback.`
    );
  }
}

module.exports = RuleBasedEvaluator;
