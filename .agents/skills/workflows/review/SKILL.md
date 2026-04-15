---
name: review
description: Use for Staff Engineer level code review - finds bugs that pass CI but break production
---

# /review - Code Review

## Overview

Staff Engineer level code review. Find bugs that pass CI but break production.

**Core principle:** CI passing ≠ production ready.

## Review Process

### Step 1: Understand Changes

- Read git diff
- Understand change purpose
- Identify impact scope

### Step 2: Auto-Fix

Directly fix obvious issues:

- Format issues
- Unused variables
- Missing types
- Simple logic errors

### Step 3: Deep Review

Focus on these patterns:

| Pattern | Detection |
|---------|-----------|
| **Race conditions** | Concurrent access to shared resources without locks |
| **Memory leaks** | Event listeners not removed, timers not cleared |
| **Resource leaks** | File handles, DB connections, network connections |
| **Error swallowing** | Catch blocks with empty handling or just console.log |
| **Hardcoded config** | API keys, URLs, timeouts hardcoded |
| **Security vulnerabilities** | SQL injection, XSS, CSRF, sensitive data exposure |

### Step 4: Completeness Check

Check if code covers:

- Error handling (every place that can fail)
- Edge cases (null, huge values, concurrency)
- Type safety
- Test coverage

## Review Readiness Dashboard

```
| Dimension | Status | Notes |
|-----------|--------|-------|
| Error Handling | ✅/❌ | |
| Edge Cases | ✅/❌ | |
| Type Safety | ✅/❌ | |
| Test Coverage | ✅/❌ | |
| Security | ✅/❌ | |
| VERDICT | CLEARED/NEEDS WORK | |
```

## Output Format

```markdown
# Code Review: {Scope}

## Summary
[Brief summary of changes and overall assessment]

## Auto-Fixed Issues
- [Issue]: [How fixed]

## Critical Issues (Must Fix)
### Issue 1: [Title]
- Location: `file:line`
- Problem: [Description]
- Impact: [What breaks]
- Fix: [How to fix]

## Warnings (Should Fix)
### Warning 1: [Title]
- Location: `file:line`
- Problem: [Description]
- Suggestion: [Improvement]

## Suggestions (Nice to Have)
- [Suggestion 1]

## Review Readiness
| Dimension | Status |
|-----------|--------|
| Error Handling | ✅/❌ |
| Edge Cases | ✅/❌ |
| Type Safety | ✅/❌ |
| Test Coverage | ✅/❌ |
| Security | ✅/❌ |
| VERDICT | CLEARED/NEEDS WORK |

## Conclusion
[Final recommendation]
```

## Common Bug Patterns

### Race Conditions

```typescript
// BAD: Race condition
let cachedData = null;
async function getData() {
  if (!cachedData) {
    cachedData = await fetchData(); // Multiple calls can race
  }
  return cachedData;
}

// GOOD: Lock or promise deduplication
let cachedData = null;
let fetchPromise = null;
async function getData() {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetchData();
  cachedData = await fetchPromise;
  fetchPromise = null;
  return cachedData;
}
```

### Memory Leaks

```typescript
// BAD: Event listener never removed
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);

// GOOD: Cleanup on unmount
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Error Swallowing

```typescript
// BAD: Silent failure
try {
  await saveData(data);
} catch (e) {
  console.log(e);
}

// GOOD: Proper error handling
try {
  await saveData(data);
} catch (e) {
  logger.error('Failed to save data', { data, error: e });
  throw new SaveError('Failed to save data', { cause: e });
}
```

## Behavior Rules

- Fix obvious issues directly (don't ask user)
- Mark risky issues as ASK, wait for user confirmation
- Each fix is an independent commit
- Don't suggest "nice to have" refactoring

## The Bottom Line

**Passing tests ≠ Working code.**

Review for production reality, not CI green.
