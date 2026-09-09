# LLD Practice Platform

A focused platform for practicing **Low-Level Design (LLD)** skills. Learners choose a problem, describe their design in structured text, submit, receive AI-powered rubric-based feedback, review history, and iterate.

---

## Features

- **3 seeded LLD problems**: Parking Lot, Vending Machine, Elevator System
- **Structured 8-section submission form** (requirements, classes, responsibilities, relationships, interfaces, patterns, edge cases, explanation)
- **AI-powered evaluation** via Google Gemini with an 8-criterion fixed rubric
- **Deterministic fallback** evaluator when no API key is set
- **Attempt state machine**: IN_PROGRESS → SUBMITTED → EVALUATING → COMPLETED/FAILED
- **Attempt history** with score timeline and difficulty tags
- **Retry flow**: previous priority improvements shown when retrying; score comparison after new attempt
- **Evaluation retry**: re-trigger evaluation for FAILED attempts without losing the submission

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6 |
| Backend | Node.js, Express 4 |
| Database | MongoDB via Mongoose |
| AI | Google Gemini API (`@google/generative-ai`) |
| Testing | Jest 29, Supertest |

---

## Project Structure

```
lldAssignment/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── api/             # Axios wrappers
│       ├── components/      # Shared components
│       ├── hooks/           # useEvaluationPoller
│       └── pages/           # 6 pages
├── server/
│   └── src/
│       ├── config/          # db.js, rubric.js, evaluator.js
│       ├── domain/          # Attempt.js, Submission.js, Evaluation.js
│       ├── evaluators/      # Evaluator base, AIEvaluator, RuleBasedEvaluator
│       ├── models/          # Mongoose models (4 collections)
│       ├── services/        # ProblemService, AttemptService, EvaluationService
│       ├── controllers/     # Thin controllers
│       ├── routes/          # Express router
│       ├── middleware/      # errorHandler.js
│       └── seed/            # seed.js
└── tests/
    ├── unit/                # 36 unit tests (domain + service layer)
    └── integration/         # API integration tests
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB running locally (default: `mongodb://localhost:27017`)
- (Optional) Google Gemini API key

### 1. Clone and install

```bash
git clone <repo>
cd lldAssignment

# Install root test dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
# Edit server/.env
```

### 3. Seed the database

```bash
cd server && npm run seed
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `PORT` | No | Server port (default: 5000) |
| `GEMINI_API_KEY` | No | Google Gemini API key. If absent, RuleBasedEvaluator is used |
| `GEMINI_MODEL` | No | Gemini model (default: `gemini-3.1-flash-lite`) |
| `NODE_ENV` | No | `development` or `production` |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |

---

## Running the Application

### Backend

```bash
cd server
npm run dev     # Development with nodemon
npm start       # Production
```

Server runs on `http://localhost:5000`

### Frontend

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`

The Vite dev server proxies `/api` requests to the backend automatically.

---

## How AI Evaluation Works

1. Learner submits their design (8 text sections)
2. **Deterministic pre-validation** runs first (required fields, minimum content, duplicate guard)
3. Attempt transitions to `EVALUATING`
4. `AIEvaluator` sends a structured prompt to Gemini requesting JSON output
5. The prompt includes the full problem (requirements, constraints, expected considerations) and the learner's complete submission
6. Gemini evaluates against 8 rubric criteria, scores each 0–10, and returns evidence + concerns + suggestions
7. `overallScore` is recalculated server-side as the mean of all 8 criteria (not trusted from AI)
8. If Gemini fails or returns malformed JSON: one retry → if still failed → `FAILED` state
9. Submission is **never lost** — it's persisted before evaluation starts
10. If no `GEMINI_API_KEY`: `RuleBasedEvaluator` scores deterministically using word count + keyword presence

---

## Test Commands

```bash
# All unit tests (48 tests, no DB needed)
npm run test:unit

# All tests
npm test

# From server/ directory
cd server && npm test
```

---

## Known Limitations

1. **No authentication** — session identity uses `localStorage` UUID. Clearing browser storage loses history.
2. **No real-time WebSocket** — evaluation status is polled every 3 seconds.
3. **Single-node MongoDB** — no replica set or transactions. Submission + state update are sequential (submission first).
4. **Gemini rate limits** — no retry queue; only one JSON-parse retry per evaluation.
5. **Diagram submission** — architecture supports it (`type` discriminator on Submission) but not implemented in UI.
6. **No admin panel** — problems are seeded via `npm run seed`.
