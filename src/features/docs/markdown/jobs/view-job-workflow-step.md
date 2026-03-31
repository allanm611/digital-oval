---
title: View Job Workflow Step Details
---


# View Job Workflow Step Details

## Overview

The Job Workflow Step Details page displays complete information about a specific workflow step.

## Page Layout

### Header
- Step Name - Display name
- Step Code - Unique identifier
- Step Order - Position in workflow
- Status indicator - Active/Inactive

## Information Sections

### Basic Information

**Name**
- Display name of the step

**Code**
- Unique step identifier

**Description**
- Detailed explanation of step purpose

**Step Order**
- Position in workflow execution sequence

**Step Type**
- Type of action (SQL, API, Script, etc.)

**Status**
- Active or Inactive

**Is Critical**
- Whether step is critical
- Failure aborts workflow if critical

### Step Configuration

**Step Action**
- Specific action or code to execute
- SQL query, API endpoint, script, etc.

**Step Type Details**
- Type-specific configuration
- Examples: SQL query text, API URL, script code

### Execution Configuration

**Is Parallel**
- Whether step runs in parallel

**Parallel Group ID**
- Group ID for parallel steps
- Steps with same ID run together

**Depends On Steps**
- Other steps that must complete first
- Execution prerequisites

**Execution Condition**
- Condition determining if step executes
- Can be conditional execution

**Skip Condition**
- Condition for skipping step
- Overrides normal execution

### Timeout and Retry

**Timeout (seconds)**
- Maximum execution time
- Step fails if timeout exceeded

**Retry Count**
- Number of retry attempts on failure
- Default: 0 (no retries)

**Retry Delay (seconds)**
- Delay between retry attempts
- Exponential backoff support

### Failure Handling

**On Failure Action**
- Abort - Stop entire workflow
- Continue - Keep executing other steps
- Retry - Automatically retry step
- Skip Remaining - Stop gracefully

### Validation

**Pre-Validation Query**
- Query to run before step execution
- Validates data readiness
- Can block step if validation fails

**Post-Validation Query**
- Query to run after step execution
- Validates step results
- Checks data quality

**Expected Row Count Min**
- Minimum expected rows in result

**Expected Row Count Max**
- Maximum expected rows in result
- Triggers validation failure if exceeded

### Parameters

**Parameters**
- Custom parameters for step
- Key-value configuration
- Variable substitution support

## Actions

### Edit
- Function: Open edit form
- Allows: Modify all step settings

### Duplicate
- Function: Create copy
- Result: New step with similar configuration

### Delete
- Function: Remove step
- Requires: Confirmation
- Note: Cannot delete if job is running

### View Execution History
- Function: See step executions
- Shows: Past run results and metrics

### View Analytics
- Function: Performance visualization
- Shows: Duration trends, failure patterns

## Related Information

### Parent Job
- Link to parent job
- View job configuration
- See all job steps

### Dependent Steps
- Steps that depend on this step
- View dependent configuration

### Step Executions
- Historical execution records
- Results and metrics
- Error information

## Common Tasks

### Edit Step Configuration
1. Click "Edit" button
2. Modify step details
3. Update validation rules
4. Save changes

### Configure Error Handling
1. Open step details
2. Review on_failure_action
3. Configure retry if needed
4. Save configuration

### View Step Execution History
1. Click "View Execution History"
2. See all step runs
3. Review results and timing
4. Identify issues

### Duplicate Step
1. Click "Duplicate" button
2. New step created
3. Assign new step code
4. Modify as needed

### Remove Step from Workflow
1. Click "Delete" button
2. Confirm deletion
3. Step removed from workflow
4. Workflow reordered automatically

### Verify Validation Rules
1. Check pre-validation query
2. Check post-validation query
3. Review row count expectations
4. Ensure rules are appropriate

