---
title: Job Dependencies
---

# Job Dependencies

## Overview

Job Dependencies define relationships between jobs. One job must complete before another job can execute.

---

## Dependency Configuration

**Job** - The job that has the dependency
**Depends On Job** - The job that must complete first
**Dependency Type** - Blocking (only type available)
**Wait For Status** - Success (job must succeed before dependent job runs)
**Max Wait Minutes** - Maximum time to wait for parent job (optional, 0-1440 minutes)
**Lookback Days** - How far back to look for parent job executions (default: 0)
**Is Active** - Whether dependency is active

---

## Lookback Days

Specifies how far back to look for parent job executions:
- **0** - Look for parent execution from today only
- **>0** - Look for parent execution from N days back

---

## Filters

- **Search** - Search by job name or code
- **Status** - Filter by dependency status (active, inactive)

---

## Statistics

- **Total Dependencies** - Total number of dependencies
- **Active Dependencies** - Number of active dependencies
- **Unsatisfied Dependencies** - Dependencies waiting for parent job

---

## Actions

**Individual Dependency Actions:**
- **View** - See dependency details
- **Edit** - Modify dependency settings
- **Delete** - Remove dependency

**Batch Actions:**
- **Activate/Deactivate** - Toggle dependency status
- **Delete** - Delete multiple dependencies

