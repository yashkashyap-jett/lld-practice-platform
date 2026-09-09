# Research Notes — LLD Practice Platform

## The Learner Problem

Learners preparing for software engineering interviews struggle with **Low-Level Design (LLD)** for a specific reason: LLD requires synthesizing multiple abstract skills simultaneously — OOP principles, design patterns, state management, encapsulation — and applying them to a concrete, open-ended problem under time pressure.

The core gap is **the feedback loop**. When a learner practices LLD on paper or in a coding interview mock, they either:
1. Get no feedback at all
2. Get delayed human feedback (days later, if at all)
3. Get feedback that is generic ("use SOLID principles") rather than specific to their actual design

This means learners **repeat the same mistakes** across attempts because they never understand exactly what was wrong with their reasoning.

---

## Existing Approaches

### 1. Interview preparation books (e.g., "Designing Data-Intensive Applications", "Head First Design Patterns")
**What they do well:** Comprehensive theory, worked examples, principle-driven explanations.
**Gaps:** No interactive practice, no feedback on learner's own designs, no iterative loop.

### 2. LeetCode / NeetCode
**What they do well:** Excellent for algorithmic problems (DSA). Large community, structured difficulty progression.
**Gaps:** LLD is almost entirely absent. The few OOP problems don't evaluate design quality. There is no rubric — the system only checks code correctness, not design reasoning. Source: [LeetCode Design problems](https://leetcode.com/problemset/?topicSlugs=design)

### 3. Educative.io / Grokking the System Design Interview
**What they do well:** Structured curriculum, guided walkthroughs of canonical problems (Parking Lot, Vending Machine, etc.)
**Gaps:** Learner reads solutions but doesn't produce their own. No submission → feedback loop. The learner is passive. Source: [Educative Grokking OOD](https://www.educative.io/courses/grokking-the-low-level-design-interview-using-ood-principles)

### 4. GitHub repos (e.g., "awesome-low-level-design")
**What they do well:** Reference implementations for common problems. Community-maintained.
**Gaps:** No interactivity, no feedback, no progression tracking. A learner comparing their answer to a reference implementation cannot tell whether their different-but-valid design is better or worse. Source: [awesome-low-level-design](https://github.com/ashishps1/awesome-low-level-design)

### 5. Human mock interviews (Pramp, interviewing.io)
**What they do well:** Real feedback from experienced engineers. Closest to the actual interview.
**Gaps:** Expensive (time and money), requires scheduling, inconsistent evaluators, not scalable for daily practice. Source: [Pramp](https://www.pramp.com/), [interviewing.io](https://interviewing.io/)

---

## Key Research Findings

| Finding | Source / Observation |
|---------|---------------------|
| Most LLD tools are passive (read-only) | Personal analysis of 5 major platforms |
| Feedback specificity matters more than frequency | Educational research: [Hattie & Timperley, 2007, "The Power of Feedback"](https://journals.sagepub.com/doi/10.3102/003465430298487) |
| Deliberate practice requires: task → attempt → feedback → adjust | [Ericsson, 2008, "Deliberate Practice and Acquisition of Expert Performance"](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2396806/) |
| LLMs can provide structured, rubric-based assessment | Emerging pattern: AI as a structured evaluator (not a grader) — see [Chen et al., 2023 on AI feedback in education](https://arxiv.org/abs/2309.03007) |

---

## Product Direction

Based on the gap analysis, this platform targets the **feedback loop problem**:

1. **Active design** — learner produces their own design (not reads a sample)
2. **Structured submission** — 8 sections ensure all LLD dimensions are addressed
3. **Rubric-based AI evaluation** — evaluates specific design reasoning, not just "is this good?"
4. **Evidence-backed feedback** — every criterion references the learner's actual words
5. **Iterative improvement** — retry flow shows previous weaknesses, score comparison reinforces progress

The deliberate decision NOT to build a UML diagram editor (common in "complete LLD platforms") keeps the focus on design reasoning rather than tooling mechanics. Text-based design explanations are closer to what interviewers actually want to hear.
