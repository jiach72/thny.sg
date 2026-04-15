---
name: plan-eng-review
description: Use before writing code - engineering architecture review from an engineering manager's perspective, forces diagram generation to expose hidden assumptions
---

# /plan-eng-review - Engineering Architecture Review

## Overview

Review proposals from an engineering manager's perspective before writing code. Force diagram generation to expose hidden assumptions.

**Core principle:** Architecture decisions are expensive to reverse.

## Review Dimensions (10)

Each dimension scored 0-10, below 8 must explain reason.

1. **Architecture Design** — Component boundaries, dependencies, interface definitions
2. **Data Flow** — How data flows through the system
3. **State Machine** — State transitions for key entities
4. **Error Paths** — Failure scenarios at each step
5. **Edge Cases** — Extreme inputs, concurrency, idempotency
6. **Security Boundaries** — Trust boundaries, auth/authz, data isolation
7. **Test Matrix** — What needs testing, which scenarios covered
8. **Performance Considerations** — Bottlenecks, scalability
9. **Deployment Strategy** — How to release, rollback plan
10. **Monitoring & Alerting** — What metrics to monitor

## Required Diagrams

### System Architecture (ASCII)

```
┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Database   │
                    └─────────────┘
```

### Data Flow Diagram (ASCII)

Show complete path from input to output

```
User Input → Validation → Processing → Storage → Response
                ↓
            Error Handler
```

### State Machine (ASCII)

Show state transitions for key entities

```
┌───────┐   submit   ┌──────────┐   approve   ┌──────────┐
│ Draft │───────────▶│ Pending  │───────────▶│ Approved │
└───────┘            └──────────┘            └──────────┘
                          │
                      reject
                          │
                          ▼
                    ┌──────────┐
                    │ Rejected │
                    └──────────┘
```

### Test Matrix Table

| Scenario | Input | Expected Output | Priority |
|----------|-------|-----------------|----------|
| Normal flow | Valid data | Success response | P0 |
| Validation error | Invalid data | Error message | P0 |
| Auth failure | No token | 401 response | P0 |
| Edge case | Empty input | Handled gracefully | P1 |

## Output Format

```markdown
# Engineering Architecture Review: {Project Name}

## Overall Score: {X}/10

## Dimension Scores
| Dimension | Score | Key Issues |
|-----------|-------|------------|
| Architecture Design | ?/10 | |
| Data Flow | ?/10 | |
| State Machine | ?/10 | |
| Error Paths | ?/10 | |
| Edge Cases | ?/10 | |
| Security Boundaries | ?/10 | |
| Test Matrix | ?/10 | |
| Performance | ?/10 | |
| Deployment | ?/10 | |
| Monitoring | ?/10 | |

## Architecture Diagrams
{ASCII diagrams}

## Risk Register
| Risk | Level | Mitigation |
|------|-------|------------|
| {risk} | High/Medium/Low | {how to address} |

## Must-Address Before Implementation
- [Issue 1]
- [Issue 2]

## Conclusion
GO / NO-GO / CONDITIONAL
```

## Review Checklist

### Architecture
- [ ] Component boundaries are clear
- [ ] Dependencies are reasonable
- [ ] No single points of failure
- [ ] Supports horizontal scaling

### API Design
- [ ] Endpoint naming is consistent
- [ ] Request/response formats are standard
- [ ] Error codes are unified
- [ ] Versioning strategy is clear
- [ ] Pagination/filtering/sorting supported

### Data Design
- [ ] Schema is normalized
- [ ] Indexes are reasonable
- [ ] Migration plan exists
- [ ] Data consistency considered

### Reliability
- [ ] Retry mechanism is reasonable
- [ ] Circuit breaker configured
- [ ] Timeouts are set
- [ ] Degradation plan is clear

### Observability
- [ ] Logs are structured
- [ ] Metrics are collected
- [ ] Tracing is enabled
- [ ] Alerts are configured

## The Bottom Line

**Architecture is not about being clever.**

It's about making the right trade-offs visible and deliberate.
