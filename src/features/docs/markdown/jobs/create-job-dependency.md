---
title: Create Job Dependency
---


# Create Job Dependency

## Overview

The Create Job Dependency form allows you to define relationships between jobs. Specify which jobs must complete before others can run.

## Form Fields

### Dependent Job*
Type: Job selector dropdown
Required: Yes
- The job that depends on another
- Job that will wait for parent to complete
- The "waiting" job in the relationship

### Parent Job*
Type: Job selector dropdown
Required: Yes
- The job that must complete first
- Job that dependent waits for
- The "prerequisite" job

### Dependency Type*
Type: Dropdown select
Default: blocking
- Blocking - Parent must succeed (most common)
- Optional - Parent failure doesn't block dependent
- Cross-Day - Parent from previous day
- Conditional - Condition-based dependency

### Wait For Status*
Type: Dropdown select
Default: success
- Any - Parent can succeed or fail
- Success - Only proceed if parent succeeds
- Completed - Parent finished (may be partial)
- Failure - Only proceed if parent fails (error handling)

### Max Wait Minutes
Type: Number input
Optional
- Maximum time to wait for parent job
- Examples: 60 (1 hour), 1440 (1 day)
- Leave blank for unlimited wait
- Prevents indefinite waiting

### Lookback Days
Type: Number input
Default: 0
- How many days back to look for parent execution
- 0 = Today only
- 1 = Today and yesterday
- Used for cross-day dependencies

### Active
Type: Toggle
Default: On
- Whether dependency is currently enforced
- Can be toggled on/off without deleting
- Off = dependency ignored

## Form Actions

### Save Dependency
- Creates the dependency relationship
- Validates both jobs exist
- Checks for circular dependencies
- Shows error if validation fails

### Cancel
- Return to dependencies list
- Discard unsaved changes

## Validation Rules

- Both jobs must exist
- Dependent and parent must be different jobs
- Cannot create circular dependencies (A depends on B, B depends on A)
- Max wait must be positive number (if specified)
- Lookback days must be 0 or positive

## Common Scenarios

### Simple Sequential Workflow
1. Dependent Job: Report Generation
2. Parent Job: Data Import
3. Type: Blocking
4. Wait Status: Success
5. Creates: Report waits for Import to succeed

### Error Handling Job
1. Dependent Job: Error Alert
2. Parent Job: Data Process
3. Type: Blocking
4. Wait Status: Failure
5. Creates: Alert runs if Process fails

### Optional Dependency
1. Dependent Job: Enhanced Report
2. Parent Job: Optional Enhancement
3. Type: Optional
4. Wait Status: Success
5. Creates: Report proceeds even if Enhancement fails

### Cross-Day Dependency
1. Dependent Job: Daily Report
2. Parent Job: Previous Day Sync
3. Type: Cross-Day
4. Lookback Days: 1
5. Creates: Report waits for yesterday's sync

## After Creating

After successful creation:
1. Dependency created and active by default
2. Appears in dependencies list
3. Dependent job respects new dependency
4. Next execution considers dependency
5. Next steps:
   - Monitor job executions
   - Verify parent job completes on time
   - Adjust max wait if needed

## Best Practices

### Dependency Design
- Keep dependency chains reasonably short (less than 5 levels)
- Avoid circular dependencies
- Document why each dependency exists
- Review dependencies periodically

### Wait Configuration
- Set realistic max wait times
- Base on actual execution times
- Add buffer for variability
- Monitor actual wait durations

### Error Handling
- Plan for parent job failures
- Create recovery/error handling jobs
- Use optional dependencies for non-critical parents
- Document failure scenarios

### Monitoring
- Monitor dependent jobs
- Verify parent jobs complete on time
- Check wait times are reasonable
- Alert on failed parents affecting dependents

