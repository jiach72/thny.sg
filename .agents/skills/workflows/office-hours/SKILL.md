---
name: office-hours
description: Use when user proposes "I want to do X" - reframes requirements to find the real problem before implementation
---

# /office-hours - Requirements Reframing

## Overview

When user proposes "I want to do X", don't execute directly. First help user think through what they really need.

**Core principle:** Understand the problem before solving it.

## Workflow

### Step 0: Capture Requirements

1. Restate in one sentence: "I understand you want to: [restatement]. Correct?"
2. Choose mode (Startup or Builder)

### Step 1: Progressive Questioning

**Startup Mode** - 6 questions:

1. **Requirement Reality**: Has anyone specifically experienced the pain point you described?
2. **Current State**: How do users currently solve this problem?
3. **Specificity**: Can you describe a specific user's specific scenario?
4. **Narrowest Cut**: What's the minimum version that could launch tomorrow?
5. **Observations & Surprises**: Any unexpected discoveries?
6. **Future Fit**: Will this solution still hold in 6 months?

**Builder Mode** - 3 questions:

1. **Wow Factor**: What would make users say "wow"?
2. **Fastest Shareable Path**: How long from now to something demonstrable?
3. **Reference Objects**: What existing solutions are there?

### Step 2: Generate Design Doc

```markdown
# {Project Name} - Design Doc

## Problem Definition (Reframed)
{The real problem to solve}

## Core Capabilities List
| Capability | Priority | Description |
|------------|----------|-------------|
| {capability} | P0/P1/P2 | {what it does} |

## Implementation Options Comparison
### Option A: {Name}
- Approach: {one sentence}
- Tech Stack: {main technologies}
- Effort: {estimate}

### Option B: {Name}
{same structure as above}

## Recommended Approach
**Recommend: Option {X}** - Reason: {core reason}
```

### Step 3: Confirm Completion

"Design doc generated. Any adjustments needed? Or ready to start building?"

## Rules

- Do NOT skip Q&A and generate directly
- Do NOT answer for the user
- Complete entire flow within 5-10 conversation rounds
- Focus on understanding, not solutionizing
- Ask one question at a time, wait for response

## Mode Selection Guide

| Mode | When to Use |
|------|-------------|
| Startup | New product/feature, uncertain requirements |
| Builder | Clear goal, need execution plan |

## Example Session

```
User: I want to add a notification system

Agent: I understand you want to add a notification system to alert users of important events. Correct?

User: Yes

Agent: Let's use Startup Mode. First question: Has anyone specifically experienced the pain point of missing important updates?

User: Yes, several customers complained they missed project deadline changes

Agent: Good, that's a concrete pain point. How do users currently handle this?

User: They manually check the project page or email us

Agent: [Continue with remaining questions...]
```

## The Bottom Line

**Don't build the wrong thing.**

Understanding takes minutes. Rework takes days.
