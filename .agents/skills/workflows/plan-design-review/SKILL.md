---
name: plan-design-review
description: Use before writing code - 7-round design review to find design flaws, with special focus on detecting AI-generated "cookie-cutter" patterns
---

# /plan-design-review - Design Dimension Review

## Overview

Review design proposals before writing code. 7 rounds of scoring to find design flaws. Special focus on detecting AI-generated "cookie-cutter" problems.

**Core principle:** Design flaws are cheaper to fix before code.

## 7 Rounds of Review

### Round 1: Information Architecture

- Is content hierarchy clear?
- Is navigation structure reasonable?
- Is key information in the right place?

### Round 2: Interaction State Coverage

- Loading states (loading/skeleton)
- Empty states (with guidance, not just "No items found")
- Error states (with action suggestions)
- Success states (completion feedback)
- Hover/focus states

### Round 3: User Journey

- Is the path from A to B the shortest?
- Are there unnecessary steps?
- Can users accomplish goals efficiently?

### Round 4: AI Slop Detection

Detect these typical AI-generated patterns:

- "clean, modern UI with cards and icons"
- "hero section with gradient"
- Three-column icon grids
- Uniform border-radius everywhere
- Indistinguishable blue themes
- Empty adjectives like "clean", "modern", "professional"
- Generic placeholder text
- Cookie-cutter component layouts

### Round 5: Design System Consistency

- Are colors, fonts, spacing consistent?
- Are component styles consistent?
- Does it match existing design language?

### Round 6: Responsive and Accessibility

- Mobile layout
- Dark mode support
- Contrast ratio (WCAG AA)
- Keyboard navigation
- Screen reader compatibility

### Round 7: Undecided Design Decisions

List choices that need user confirmation

## Scoring Criteria

| Score | Meaning |
|-------|---------|
| 9-10 | Excellent, no modifications needed |
| 7-8 | Good, minor issues can be optimized later |
| 5-6 | Passing, need to fix key issues |
| 0-4 | Failing, must restructure |

## Output Format

```markdown
# Design Review: {Project Name}

## Overall Score: {X}/10

## Round Scores
| Round | Score | Key Issues |
|-------|-------|------------|
| Information Architecture | ?/10 | |
| Interaction States | ?/10 | |
| User Journey | ?/10 | |
| AI Slop Detection | ?/10 | |
| Design System | ?/10 | |
| Responsive/Accessibility | ?/10 | |
| Undecided Decisions | ?/10 | |

## AI Slop Detection Results
[AI-generated patterns found]

## Must-Fix Issues
- [Issue 1]
- [Issue 2]

## Recommendations
[Specific improvement suggestions]

## Conclusion
CLEARED / NEEDS WORK
```

## AI Slop Detection Checklist

- [ ] Generic descriptions without specifics
- [ ] Standard layouts without differentiation
- [ ] Placeholder content not replaced
- [ ] Missing brand identity
- [ ] No unique visual elements
- [ ] Cookie-cutter component usage
- [ ] Missing context-specific design

## The Bottom Line

**Design for humans, not templates.**

AI-generated designs are functional but forgettable. Add uniqueness and brand identity.
