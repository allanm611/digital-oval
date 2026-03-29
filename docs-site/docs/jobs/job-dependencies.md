---
title: Job Dependencies
---

import { EditButton } from '@site/src/components/EditButton';

# Job Dependencies

## Overview

Job Dependencies define relationships between jobs. They specify which jobs must complete before other jobs can run, enabling complex job orchestration and data pipeline workflows.

## Key Concepts

### Dependency Relationships
A dependency specifies that one job (dependent job) must wait for another job (parent job) to complete before it can execute.

Example: Report Generation job depends on Data Import job completing successfully.

### Dependency Types

**Blocking Dependencies**
- Parent job must complete successfully before dependent job runs
- Job waits indefinitely until parent completes
- Most common dependency type

**Optional Dependencies**
- Preferred but not required
- Dependent job can proceed even if parent fails
- Useful for non-critical prerequisites

**Cross-Day Dependencies**
- Parent job from previous day must complete
- Enables daily workflow orchestration
- Common in batch processing pipelines

**Conditional Dependencies**
- Triggered based on specific conditions
- Custom logic determines if dependency applies
- Advanced workflow control

### Wait For Status

Specifies what status to wait for:

**Any Status**
- Wait for parent to complete (success or failure)
- Doesn't matter if parent succeeds or fails

**Success Status**
- Only proceed if parent job succeeds
- Most common wait status

**Completed Status**
- Parent finished processing (may be partial success)
- Useful for partial data scenarios

**Failure Status**
- Only proceed if parent job fails
- Used for error handling and recovery jobs

### Wait Duration

**Max Wait Minutes**
- Maximum time to wait for parent job
- Job fails if parent doesn't complete in time
- Prevents indefinite waiting

**Lookback Days**
- How far back to look for parent executions
- Default: 0 (today only)
- Used for cross-day dependencies

## Dependency Features

### Job Orchestration
- Define complex job workflows
- Create data pipelines
- Sequence dependent operations
- Build job chains and networks

### Error Handling
- Trigger error jobs on failure
- Implement recovery procedures
- Route to escalation jobs
- Implement cleanup jobs

### Workflow Control
- Control job execution order
- Prevent premature execution
- Implement retry strategies
- Enable advanced scheduling

## Available Actions

- View Dependencies - See all job relationships
- Create Dependency - Add new dependency
- Edit Dependency - Modify dependency settings
- View Dependent Jobs - See jobs affected by dependency
- Delete - Remove dependency relationship

<EditButton docSlug="jobs/job-dependencies" docTitle="Job Dependencies" />
