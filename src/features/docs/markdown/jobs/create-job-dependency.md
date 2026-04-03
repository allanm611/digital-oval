---
title: Create Job Dependency
---

# Create Job Dependency

## Overview

Create a dependency relationship between two jobs.

---

## Form Fields

**Job*** 
- The job that has the dependency

**Depends On Job***
- The job that must complete first

**Dependency Type** (Blocking only)
- Blocking - Parent must succeed

**Wait For Status** (Success only)
- Success - Job must succeed before dependent job runs

**Max Wait Minutes** (optional, 0-1440)
- Maximum time to wait for parent job

**Lookback Days** (default: 0)
- How far back to look for parent job executions
- 0 = today only
- >0 = look back N days

**Is Active** (toggle)
- Whether dependency is currently enforced

---

## Validation

- Both jobs must exist and be different
- No circular dependencies allowed
- Max wait must be between 0-1440 minutes

