# Design Document — LLD Practice Platform

## MVP Scope

A focused, working end-to-end platform for 3 LLD problems. The MVP deliberately excludes:
- Authentication / user accounts
- Admin panel / CMS
- UML diagram editor
- Real-time WebSocket (polling is sufficient)
- Distributed infrastructure

---

## User Flow

```
Dashboard
  └── Problem List (3 problems, difficulty badges, recent scores)
       └── Problem Details (description, requirements, constraints)
            └── Start Attempt → Practice Form (8 sections)
                 └── Submit → Evaluation Status (polling)
                      ├── Completed → Feedback (criteria, strengths, improvements)
                      │    └── Try Again → Practice Form (with improvement banner)
                      │         └── Completed → Score Comparison ("7.2 → 8.4 +1.2")
                      └── Failed → Retry Evaluation button
```

---

## Architecture

```
React (Vite + Tailwind)
   │  HTTP REST + X-Session-ID header
   ▼
Express API (Node.js)
   │
   ├── ProblemController → ProblemService → ProblemModel
   │
   └── AttemptController
        ├── AttemptService
        │    ├── Attempt domain (state machine)
        │    ├── Submission domain (validation)
        │    └── EvaluationService (async trigger)
        │         └── Evaluator (abstract)
        │              ├── AIEvaluator (Gemini)
        │              └── RuleBasedEvaluator (deterministic)
        │
        └── EvaluationModel → MongoDB
```

---

## Domain Model

### `Attempt` (domain/Attempt.js)
The central domain object. Owns the state machine. All status changes go through this class.

**Responsibility:** Enforce valid state transitions. Record timestamps. Answer state questions.

**Key decisions:**
- Controllers NEVER set `status` directly on the Mongoose doc. They call `attempt.submit()`, `attempt.startEvaluation()`, etc.
- Illegal transitions throw `InvalidTransitionError` immediately
- `canBeRetried()` is the single place that defines what "terminal" means

### `Submission` (domain/Submission.js)
Owns the learner's design content and all deterministic validation.

**Responsibility:** Validate required sections (≥20 chars each). Provide normalized payload for evaluators.

**Key decision:** The `type` discriminator (`'text'` by default) enables future submission types (diagram, code) without touching `Attempt` or `EvaluationService`. This is **Change Test A** compliance.

### `Evaluation` (domain/Evaluation.js)
Read model for evaluation results.

**Responsibility:** Answer questions about evaluation state (`isComplete()`, `hasFailed()`, `canRetry()`).

### `Evaluator` (evaluators/Evaluator.js — abstract base)
The key extensibility abstraction.

**Responsibility:** Define the `evaluate(submissionPayload, problem)` contract.

**Change Test B compliance:** `EvaluationService` depends on `Evaluator` interface. `config/evaluator.js` picks the implementation. To add `HumanEvaluator`: extend `Evaluator`, update `config/evaluator.js`. Zero changes to services or controllers.

---

## Attempt State Machine

```
IN_PROGRESS
    │ submit()
    ▼
SUBMITTED
    │ startEvaluation()
    ▼
EVALUATING ──── failEvaluation() ──→ FAILED (terminal)
    │ completeEvaluation()
    ▼
COMPLETED (terminal)
```

**Transition table** (defined once in `Attempt.js`):
```js
IN_PROGRESS: ['SUBMITTED']
SUBMITTED:   ['EVALUATING']
EVALUATING:  ['COMPLETED', 'FAILED']
COMPLETED:   []   // terminal
FAILED:      []   // terminal — retry = new attempt
```

---

## Evaluation Architecture

### Two-layer evaluation

**Layer 1 — Deterministic pre-validation (always runs, zero AI cost):**
- Required sections present (8 fields)
- Each field ≥ 20 characters (not trivially empty)
- Attempt is in SUBMITTED state
- No existing EVALUATING or COMPLETED evaluation (duplicate guard)

**Layer 2 — AI evaluation (Gemini, reasoning-heavy):**
- 8 rubric criteria evaluated
- Evidence references from learner's submission
- Concerns and suggestions are specific, not generic
- overallScore recalculated server-side (not trusted from AI)

### Failure handling

```
submit()
   │ → Submission persisted to DB (first, before any state change)
   │ → Attempt → SUBMITTED
   │ → EvaluationService.triggerEvaluation() (async, non-blocking)
          │
          ▼
     Attempt → EVALUATING
     Evaluation doc created (status: EVALUATING)
          │
          ├── AI success → COMPLETED, score stored
          └── AI failure → FAILED, error stored
                              │
                        Retry button → triggerEvaluation() again
                        (deletes FAILED eval, resets SUBMITTED, re-runs)
```

### Rubric (8 criteria, equal weight)

| # | Criterion |
|---|-----------|
| 1 | Requirement Understanding |
| 2 | Class Responsibilities |
| 3 | Coupling & Cohesion |
| 4 | Encapsulation & Interfaces |
| 5 | Abstraction & Design Patterns |
| 6 | Extensibility |
| 7 | Edge Cases & Testability |
| 8 | Design Explanation & Trade-offs |

`overallScore = mean(criteria.scores)`, rounded to 1 decimal.

---

## Database Schema

### `problems`
Seeded at startup. Read-only via API.

### `attempts`
- `status`: enum state machine value
- `sessionId`: localStorage UUID (replaces auth for MVP)
- `previousAttemptId`: enables retry chain and score comparison

### `submissions`
- `type`: `'text'` discriminator (Change Test A extensibility point)
- One submission per attempt (`unique: true` on `attemptId`)
- Persisted BEFORE attempt status changes

### `evaluations`
- One evaluation per attempt (`unique: true` on `attemptId`)
- Stores full rubric breakdown, strengths, and priority improvements
- `evaluatorType` audit trail: `'ai'` | `'rule_based'`

---

## Extensibility: Change Tests

### Change Test A — Diagram Submission

**Today:** `type: 'text'`, 8 text fields

**Future:** `type: 'diagram'`, image URL + annotations

**Required changes:**
- Add `DiagramSubmission` class extending base validation logic
- Add diagram upload endpoint
- Update frontend form for diagram upload
- **Zero changes** to: `Attempt`, `Problem`, `EvaluationService`, `AttemptService`

### Change Test B — Human Evaluator

**Today:** `AIEvaluator` via Gemini

**Future:** `HumanEvaluator` — creates a pending evaluation, waits for a reviewer webhook

**Required changes:**
- Add `HumanEvaluator extends Evaluator`
- Update `config/evaluator.js` to route to it
- **Zero changes** to: `EvaluationService`, `AttemptService`, `AttemptController`, any route

---

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Polling (3s) vs WebSocket | Simpler, no WS infrastructure needed; 3s delay is acceptable for 10-30s evaluation |
| Equal rubric weights | Transparent and auditable vs. weighted would allow domain-tuning |
| sessionId in localStorage | Simple identity without auth; cleared on browser wipe = lost history |
| Singleton evaluator | Simple injection; doesn't support per-request evaluator selection |
| Submission before state change | Slightly inconsistent DB state if crash between save, but submission never lost |
| Text submission only | Fastest to implement; architecture supports diagram/code via `type` discriminator |

---

## Future Improvements

1. **Authentication** — JWT sessions for persistent user identity
2. **Diagram submission** — Upload class diagrams, auto-parse for evaluation context  
3. **Human evaluator** — Expert reviewers can provide feedback via webhook
4. **Streaming evaluation** — Stream Gemini response to reduce perceived latency
5. **Problem difficulty auto-scoring** — Calibrate scores against percentile distributions
6. **Admin panel** — Add/edit problems without reseeding
7. **Leaderboard / social** — Compare scores anonymously with other learners
