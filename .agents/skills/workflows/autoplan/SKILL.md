---
name: autoplan
description: Use for complete review pipeline - CEO → Design → Eng in one command, only surfacing decisions that need user judgment
---

# /autoplan - Automatic Review Pipeline

## Overview

Complete review in one command: CEO → Design → Eng. Only surface decisions that need user judgment.

**Core principle:** Automate the obvious, ask about the ambiguous.

## Pipeline

### Step 1: Product Direction Review (/office-hours)

- Reframe requirements, find the real problem
- Output: Design Doc

### Step 2: Design Review (/plan-design-review)

- 7 rounds of design dimension scoring
- AI Slop detection

### Step 3: Engineering Review (/plan-eng-review)

- 10 dimensions of architecture review
- ASCII diagrams and test matrix

### Step 4: Aggregate Decisions

**Auto-execute** (no need to ask user):

- Clear error fixes
- Obvious security issues
- Standard best practices

**Need user confirmation** (taste decisions):

- Design directions with multiple valid choices
- Brand/aesthetic preferences
- Key trade-offs affecting user experience

## Output Format

```markdown
# Autoplan Review Summary

## Review Results
| Review | Status | Score |
|--------|--------|-------|
| Product Review | ✅/❌ | ?/10 |
| Design Review | ✅/❌ | ?/10 |
| Engineering Review | ✅/❌ | ?/10 |

## Auto-Executed Decisions
- [Decision 1]: [Reason]
- [Decision 2]: [Reason]

## Choices Needing User Confirmation
### Choice 1: [Title]
- Option A: [Description] (Recommended)
- Option B: [Description]
- Option C: [Description]

### Choice 2: [Title]
- Option A: [Description]
- Option B: [Description] (Recommended)

## Overall Recommendation
GO / NO-GO / CONDITIONAL

## Next Steps
1. [Step 1]
2. [Step 2]
```

## Automation Principles

- Each review's output automatically passes to the next
- More than 3 NO-GOs automatically suggests stopping
- If a review fails, skip and note it
- Don't re-ask questions already answered

## Decision Classification

### Auto-Execute (No Confirmation Needed)

| Type | Examples |
|------|----------|
| Security fixes | SQL injection, XSS, missing auth |
| Error handling | Uncaught exceptions, missing validation |
| Performance | N+1 queries, missing indexes |
| Standards | Naming conventions, code style |
| Best practices | Rate limiting, pagination |

### Ask User (Confirmation Required)

| Type | Examples |
|------|----------|
| Design direction | Minimal vs feature-rich |
| UX trade-offs | Speed vs completeness |
| Brand choices | Colors, tone, personality |
| Architecture | Monolith vs microservices |
| Priority | What to build first |

## Pipeline Flow

```
┌─────────────────┐
│ User Request    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Product Review  │───❌──▶ Stop & Clarify
└────────┬────────┘
         │✅
         ▼
┌─────────────────┐
│ Design Review   │───❌──▶ Fix & Re-review
└────────┬────────┘
         │✅
         ▼
┌─────────────────┐
│ Eng Review      │───❌──▶ Fix & Re-review
└────────┬────────┘
         │✅
         ▼
┌─────────────────┐
│ Aggregate       │
│ Decisions       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Present Choices │
│ to User         │
└─────────────────┘
```

## The Bottom Line

**Don't waste user time on obvious decisions.**

But don't make important choices without them.
