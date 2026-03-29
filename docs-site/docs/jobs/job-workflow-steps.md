---
title: Job Workflow Steps
---

import { EditButton } from '@site/src/components/EditButton';

# Job Workflow Steps

## Overview

Job Workflow Steps are individual units of work within a job workflow. Each step represents a specific action like running SQL, calling an API, executing a script, or validating data.

## Key Concepts

### Step Types

**SQL**
- Execute SQL queries against databases
- Data manipulation and retrieval
- Schema modifications

**Stored Procedure**
- Call database stored procedures
- Complex database logic
- Parameterized execution

**API Call**
- Call external REST or SOAP APIs
- Third-party system integration
- HTTP methods supported

**Python Script**
- Execute Python code
- Data processing and transformation
- Custom business logic

**Node.js Script**
- Run Node.js code
- JavaScript-based processing
- Async/await support

**Shell Script**
- Execute shell commands
- System-level operations
- File operations

**File Transfer**
- Move/copy files between systems
- FTP, SFTP, cloud storage
- File format conversions

**Data Validation**
- Validate data quality
- Check constraints and rules
- Generate validation reports

**Notification**
- Send alerts and messages
- Email, Slack, webhooks
- Business notifications

**Wait**
- Pause execution
- Wait for external events
- Timing delays

### Execution Control

**Parallel Execution**
- Run steps simultaneously
- Grouped via parallel_group_id
- Better performance for independent steps

**Sequential Execution**
- Steps run one after another
- Default execution mode
- Dependent steps wait for previous

**Step Dependencies**
- Steps can depend on other steps
- Specified by step code reference
- Creates execution order

### Failure Handling

**Abort**
- Stop entire workflow on failure
- No further steps execute
- Job marked as failed

**Continue**
- Continue to next step on failure
- Failure logged but ignored
- Workflow completes with partial success

**Retry**
- Automatically retry failed step
- Configurable retry count and delay
- Exponential backoff support

**Skip Remaining**
- Skip remaining steps on failure
- Stop workflow gracefully
- Job marked as partially complete

### Validation

**Pre-Validation**
- Validate before step executes
- Check data readiness
- Can block step execution

**Post-Validation**
- Validate after step completes
- Verify results are correct
- Check row counts and data quality

**Expected Row Counts**
- Minimum and maximum expected rows
- Triggers validation failure if out of range
- Ensures data integrity

## Step Configuration

### Basic Settings
- Step Name - Display name
- Step Code - Unique identifier
- Step Order - Execution sequence
- Step Type - Type of step
- Step Action - What to do

### Execution Settings
- Parallel Execution - Run simultaneously
- Parallel Group ID - Group for parallel steps
- Timeout - Maximum execution time
- Retry Count - Failure retry attempts
- Retry Delay - Wait between retries

### Conditions
- Execution Condition - When to execute
- Skip Condition - When to skip
- Depends On Steps - Prerequisites

### Error Handling
- On Failure Action - What to do if step fails
- Is Critical - Whether step is critical
- Continue on Failure - Non-blocking failures

### Validation
- Pre-Validation Query - Check before execution
- Post-Validation Query - Check after execution
- Expected Row Count Min/Max - Data quality checks

### Parameters
- Custom parameters for step
- Variable substitution
- Dynamic configuration

## Available Actions

- View Steps - See all steps in job
- Create Step - Add new step
- Edit Step - Modify step settings
- View Details - See step configuration
- Delete - Remove step
- Reorder - Change execution sequence

<EditButton docSlug="jobs/job-workflow-steps" docTitle="Job Workflow Steps" />
