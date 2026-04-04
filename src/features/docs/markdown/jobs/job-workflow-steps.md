# Job Workflow Steps

Job Workflow Steps defines step-level execution logic inside jobs.

## Open The Page

Go to `Dashboard -> Jobs -> Job Workflow Steps`.

## What You Manage Here

- step sequencing and ordering
- step execution behavior (type, action, timeout, retry)
- failure policy and skip/condition logic
- validation queries and expected row count checks

## Core Field Meaning

- **Step Order**: execution position in flow.
- **Step Type**: action category (SQL/API/script/etc).
- **On Failure Action**: what happens when step fails.
- **Is Critical**: marks step importance for workflow success.
- **Is Parallel / Parallel Group**: controls parallel execution grouping.
