# AI Usage Log — LLD Practice Platform

This document records 5 meaningful AI-assisted decisions made during this project. Each entry explains what the AI suggested, what was accepted or rejected, and the engineering reasoning behind the final decision.

---

## Decision 1: Evaluation Prompt Engineering

**Context:** Designing the Gemini prompt to produce structured, evidence-backed feedback rather than generic praise.

**What AI suggested (initial approach):**  
A simple prompt: *"Rate this LLD submission on a scale of 1-10 and explain what's good and bad."*

**What I rejected:** This produces a single number with vague commentary. There's no guarantee the feedback references the learner's actual submission, and there's no consistent structure for the frontend to parse.

**What I accepted:** A structured prompt that:
1. Includes the full problem (requirements, constraints, expected considerations) as context
2. Lists all 8 rubric criteria explicitly with their definitions
3. Requires JSON output with a fixed schema (`evidence`, `concern`, `suggestion`, `confidence` per criterion)
4. Explicitly warns: *"Be honest and calibrated: a brief, shallow submission should score 3-5, not 7-8"*
5. Requires evidence to be a "direct quote or specific reference from the learner's submission"

**Final implementation:** `AIEvaluator._buildPrompt()` with a ~60-line structured prompt. The `overallScore` from the AI response is discarded and recalculated server-side using `calculateOverallScore()` to ensure consistency regardless of AI arithmetic errors.

---

## Decision 2: Evaluator Abstraction Design

**Context:** Deciding how to isolate the application from the specific AI provider.

**What AI suggested:**  
Inject the Gemini SDK directly into the service and use a feature flag (`if (process.env.USE_AI) { ... } else { ... }`) to switch between modes.

**What I rejected:** Feature flags scattered through service code create tight coupling. Adding a third evaluator (e.g., `HumanEvaluator`) would require modifying the service.

**What I accepted:** A proper abstract base class `Evaluator` with a single `evaluate(submissionPayload, problem)` contract. `EvaluationService` depends on `Evaluator` only. A factory (`config/evaluator.js`) selects the implementation at startup. This is the Strategy pattern applied at the infrastructure boundary.

**Final implementation:** `Evaluator.js` (base) → `AIEvaluator`, `RuleBasedEvaluator`. Adding `HumanEvaluator` requires: extend `Evaluator`, update one factory function. Zero changes to `EvaluationService`, `AttemptService`, or any controller.

---

## Decision 3: Submission Persistence Strategy

**Context:** Ensuring the learner's submission is never lost even if the AI evaluation fails.

**What AI suggested:**  
Save the submission and trigger evaluation in a single atomic transaction (MongoDB session).

**What I rejected:** MongoDB transactions require a replica set, adding infrastructure complexity for a prototype. More importantly, the intent was simpler: just guarantee submission is written before any state change.

**What I accepted:** A deliberate ordering: (1) persist Submission to DB, (2) transition Attempt to SUBMITTED, (3) trigger evaluation asynchronously and non-blocking. If evaluation fails, the submission is already safe. The evaluation can be retried against the existing submission without any data loss.

**Final implementation:** `AttemptService.submitAttempt()` calls `SubmissionModel.create()` first, then `attempt.submit()`, then `EvaluationService.triggerEvaluation()` with `.catch()` (non-blocking). This is documented as a known trade-off in DESIGN.md.

---

## Decision 4: RuleBasedEvaluator Scoring Approach

**Context:** Designing the deterministic fallback evaluator to be meaningful rather than returning a flat default score.

**What AI suggested:**  
Return `score: 5` for every criterion with a message like "AI evaluation unavailable."

**What I rejected:** A flat 5/10 on every criterion is dishonest and useless. It doesn't reflect the learner's actual submission quality and defeats the purpose of having a fallback evaluator.

**What I accepted:** A scoring model based on (a) word count per section against a target range, and (b) keyword presence for domain-relevant terms. This produces genuinely variable scores that reflect submission depth. Short, empty submissions score low; thorough, detailed submissions score higher. Clearly marked as `evaluatorType: 'rule_based'` with a note in the summary.

**Final implementation:** `RuleBasedEvaluator._computeScore()` uses two sub-scores (0–5 each) combined per criterion. Keywords are hand-curated per criterion (e.g., "encapsulation" criterion looks for: `interface`, `abstract`, `private`, `encapsul`, `hide`, `contract`).

---

## Decision 5: Session Identity Without Authentication

**Context:** The spec has no authentication, but the History page and "Recent Attempts" need to show only the current user's data.

**What AI suggested (Option A):**  
Show all attempts from all sessions (no identity at all).

**What AI suggested (Option B):**  
Implement lightweight JWT authentication.

**What I rejected:**
- Option A: Makes history unusable in a shared environment; the evaluator sees everyone's attempts mixed together.
- Option B: Adds auth complexity (registration, login, token management) that's explicitly out of scope.

**What I accepted:** A `sessionId` generated as a `crypto.randomUUID()` on first visit, stored in `localStorage`, and sent on every request as `X-Session-ID` header. The backend filters all attempt queries by this ID. This gives personal-feeling history without any auth overhead. Documented limitation: clearing localStorage loses history.

**Final implementation:** `client/src/api/index.js` `getSessionId()` function manages the UUID. `AttemptModel` has a `sessionId` field with an index. All queries in `AttemptService.getAttemptsBySession()` filter by this field.
