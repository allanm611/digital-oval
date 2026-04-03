---
title: Edit Scheduled Job
---


# Edit Scheduled Job

## Overview

The Edit Scheduled Job form allows you to modify existing job configuration. You can update the schedule, execution parameters, dependencies, resources, and monitoring settings.

## Accessing Edit Form

1. Navigate to **Job Management > Scheduled Jobs**
2. Find the job you want to edit
3. Click on the job row to open details
4. Click **Edit** button in the top-right corner

Or from job list:
1. Click menu icon (⋮) on the job
2. Select **Edit**

## Form Fields

All fields are the same as [Create Scheduled Job](/documentation/jobs/create-scheduled-job) with the following notes:

### Non-Editable Fields
- **Job Code** - Cannot be changed after creation
- **Created Date** - System managed
- **Version Number** - System managed

### Editable Fields
- Job Name
- Description
- Job Category
- Owner information
- Schedule configuration
- Execution parameters
- Resource settings
- Dependencies
- Monitoring settings
- Compliance information
- Metadata and tags

## Making Changes

### Change Job Name
1. Click in the Name field
2. Update the text
3. Name updates in lists and dashboards

### Update Schedule

#### Change Schedule Type
1. Select different schedule type
2. Different fields appear based on type
3. Remove previous schedule configuration
4. Fill in new schedule details

#### Update Cron Expression
1. Modify cron expression value
2. Validate syntax
3. Preview next 5 run times
4. Save changes

#### Adjust Interval
1. Change interval value (in seconds)
2. Update execution frequency
3. Note: Affects next run calculation
4. Save changes

#### Change Timezone
1. Select different timezone
2. Affects cron schedule interpretation
3. Next run times recalculated
4. Save changes

### Modify Execution Settings

#### Change Max Concurrent Executions
1. Modify concurrent execution count
2. Range: 1-100
3. Prevents resource exhaustion
4. Changes apply to next execution

#### Update Execution Timeout
1. Change timeout value (in minutes)
2. Applies to future executions
3. Running executions unaffected
4. Be realistic with timeout values

#### Adjust Priority
1. Change job priority (1-10)
2. Higher = runs first in queue
3. Affects scheduling order
4. Apply immediately

#### Change Processing Mode
1. Select different mode
2. Options: Batch, Streaming, Real-time
3. Affects data processing approach
4. Test after change

### Update Resource Configuration

#### Change Resource Pool
1. Select different resource pool
2. Future executions use new pool
3. Monitor performance after change

#### Adjust Memory Limit
1. Modify max memory in MB
2. Test adequacy of new limit
3. Monitor resource usage

#### Update CPU Allocation
1. Change CPU core count
2. Ensure pool has capacity
3. Monitor actual usage

### Modify Dependencies

#### Update Depends On Jobs
1. Add or remove dependent jobs
2. Dependency modes affect behavior
3. Test dependency chain
4. Monitor for circular dependencies

#### Change Dependency Mode
1. Select AND, OR, or ALL
2. Determines when job is eligible to run
3. Affects job timing

#### Adjust Downstream Triggers
1. Modify jobs triggered on success
2. Modify jobs triggered on failure
3. Test trigger chains
4. Verify error handling

### Update Monitoring & Alerts

#### Change SLA Duration
1. Modify expected execution time
2. Used for breach detection
3. Base on historical data
4. Document reason for change

#### Update Alert Threshold
1. Change failure percentage threshold
2. Affects alert frequency
3. Balance over-alerting vs under-alerting

#### Modify Notification Recipients
1. Add or remove email addresses
2. Verify email validity
3. Notify recipients of changes

### Update Compliance Information

#### Change GDPR Purpose
1. Select appropriate GDPR category
2. Update if processing changed
3. Document reason for change

#### Adjust Compliance Tags
1. Add or remove compliance tags
2. Ensures proper classification
3. Enables compliance tracking

### Update Metadata
1. Modify JSON metadata
2. Add relevant context
3. Document business changes

## Schedule Window Changes

### Update Execution Windows
1. Modify start and end times
2. Job only executes within window
3. Affects schedule eligibility
4. Test window configuration

### Add Blackout Dates
1. Select dates job shouldn't run
2. Examples: holidays, maintenance
3. Job automatically skipped
4. Can be modified later

## Saving Changes

### Save Button
- All changes saved to database
- Form validates all required fields
- Error messages shown if validation fails
- Previous version retained for history

### Validation

Before saving, system checks:
- All required fields filled
- Schedule configuration valid
- Dependencies don't create loops
- Timeouts are reasonable
- Resource requests are valid
- Execution windows make sense
- Notification recipients valid

### Success

After successful save:
1. Changes take effect immediately
2. Next run time recalculated if schedule changed
3. Confirmation message shown
4. Redirect to job details
5. Version history updated

## Error Handling

### Validation Errors
- **Missing Required Fields** - Fill in all fields marked with *
- **Invalid Schedule** - Provide valid cron or interval
- **Invalid Timeout** - Must be 1-1440 minutes
- **Circular Dependencies** - Job cannot depend on itself indirectly
- **Invalid Threshold** - Must be 0-100%

### Server Errors
- **Job Not Found** - Job may have been deleted
- **Insufficient Permissions** - Contact administrator
- **Conflict** - Job was modified elsewhere
- **Network Error** - Check connection and retry

## Reverting Changes

### Cancel Button
- Discard all unsaved changes
- Return to job details page
- No confirmation required if no changes

### Before Saving
- Any modifications not saved are lost
- Return to previous state

## Common Update Scenarios

### Adjusting Schedule Timing
1. Edit the job
2. Modify cron expression or interval
3. Change timezone if needed
4. Update execution windows if applicable
5. Save changes
6. Monitor first few executions

### Increasing Job Reliability
1. Edit the job
2. Increase max concurrent executions
3. Extend execution timeout
4. Add retry-on-failure triggers
5. Increase alert recipients
6. Save changes

### Optimizing Resources
1. Edit the job
2. Adjust memory and CPU limits based on usage
3. Change resource pool if available
4. Monitor performance after change
5. Fine-tune as needed

### Fixing Broken Dependencies
1. Edit the job
2. Verify dependent jobs exist and are healthy
3. Update dependency mode if needed
4. Check for circular dependencies
5. Save and test

### Updating Monitoring Configuration
1. Edit the job
2. Adjust SLA duration if needed
3. Change alert threshold
4. Update notification recipients
5. Save changes

### Changing From Manual to Scheduled
1. Edit the job
2. Change schedule type to Cron or Interval
3. Configure timing parameters
4. Set timezone if needed
5. Save and monitor first executions

### Temporarily Pausing Job
1. Open job details
2. Click Pause button (faster than editing)
3. Resume when ready

## After Editing

### Immediate Effects
- Changes take effect immediately
- Next execution uses new configuration
- Running executions use old configuration
- Schedule recalculated if timing changed

### Monitoring Changes
1. Return to job details
2. Monitor first few executions
3. Verify changes work as expected
4. Check health status
5. Review execution logs

### Confirming Changes
- Visit [Job Details](/documentation/jobs/view-scheduled-job) page
- Verify all updated values
- Check version history
- Review next run time

## Tips

- **Test schedule changes** - Verify new timing before making major changes
- **Monitor after changes** - Check first few executions
- **Document why** - Update metadata explaining configuration rationale
- **Verify dependencies** - Ensure dependent jobs are healthy
- **Check downstream impact** - Review jobs triggered by this job
- **Backup critical configs** - Note original values before major changes
- **Stage changes** - Test in non-production environment first if possible
- **Plan ahead** - Schedule changes before they take effect
- **Communicate** - Notify teams affected by schedule changes

