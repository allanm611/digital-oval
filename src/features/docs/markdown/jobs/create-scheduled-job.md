---
title: Create Scheduled Job
---


# Create Scheduled Job

## Overview

The Create Scheduled Job form allows you to add a new automated job. Configure the job schedule, execution parameters, dependencies, resources, and monitoring settings.

## Basic Information

### Job Name*
**Type:** Text input
**Required:** Yes
- Display name for the job
- Should be descriptive (e.g., "Daily Customer Data Sync")
- Used in lists and reports
- 1-255 characters

### Job Code*
**Type:** Text input
**Required:** Yes
- Unique identifier for the job
- Used in APIs and references
- Alphanumeric with underscores allowed
- Cannot be changed after creation

### Job Type*
**Type:** Dropdown select
**Required:** Yes
- Category/template for the job
- Determines job capabilities and workflow
- Examples: Data Import, Campaign, Report, Cleanup

### Description
**Type:** Text area
**Optional**
- Detailed explanation of job purpose
- Business context and use case
- Usage notes for team

### Job Category
**Type:** Text input
**Optional**
- Business category/grouping
- Examples: Data Pipeline, Reporting, Maintenance

## Ownership & Responsibility

### Business Owner
**Type:** Text input
**Optional**
- Name or email of business owner
- Person accountable for job business value

### Technical Owner
**Type:** User select
**Optional**
- Team member responsible for technical maintenance
- Receives technical alerts

## Schedule Configuration

### Schedule Type*
**Type:** Dropdown select
**Required:** Yes
- **Manual** - Trigger on-demand only
- **Cron** - Custom schedule using cron expressions
- **Interval** - Repeat every N seconds
- **Event Driven** - Trigger on specific events
- **Dependency Based** - Run after other jobs complete

### Cron Expression
**Type:** Text input
**Required:** If Schedule Type = Cron
- Unix cron format (5 fields)
- Examples:
  - `0 0 * * *` = Daily at midnight
  - `0 9 * * MON-FRI` = Weekdays at 9 AM
  - `*/30 * * * *` = Every 30 minutes
- Help available for cron syntax

### Interval (seconds)
**Type:** Number input
**Required:** If Schedule Type = Interval
- How often to repeat (in seconds)
- Examples: 300 (5 min), 3600 (1 hour), 86400 (1 day)
- Minimum: 60 seconds
- Maximum: 31,536,000 seconds (1 year)

### Trigger Event Type
**Type:** Dropdown select
**Optional** (Required if Schedule Type = Event Driven)
- **Webhook** - External system event
- **Event Bus** - Internal platform event
- **Message Queue** - Queue-based trigger
- **Data Ingest** - Data arrival trigger
- **Custom** - Custom event trigger

### Trigger Condition
**Type:** Advanced builder
**Optional** (Recommended if event-driven)
- Define conditions for event triggering
- Filter which events trigger the job
- Examples: File type = CSV, Status = Active

### Timezone*
**Type:** Dropdown select
**Default:** UTC
- Timezone for cron schedules
- Examples: America/New_York, Europe/London, Asia/Tokyo

## Execution Windows

### Execution Window Start
**Type:** Time picker
**Optional**
- Earliest time job can execute
- Example: 09:00 AM (don't start before 9 AM)
- Format: HH:MM (24-hour)

### Execution Window End
**Type:** Time picker
**Optional**
- Latest time job can execute
- Example: 05:00 PM (finish before 5 PM)
- Format: HH:MM (24-hour)

### Blackout Dates
**Type:** Date multi-select
**Optional**
- Dates when job should NOT run
- Examples: Holidays, maintenance windows
- Job automatically skipped on these dates

## Job Dependencies

### Depends on Jobs
**Type:** Multi-select job picker
**Optional**
- List jobs that must complete first
- Job waits for these to succeed before starting

### Dependency Mode
**Type:** Dropdown select
**Default:** AND
- **AND** - All dependencies must complete successfully
- **OR** - Any one dependency must complete
- **ALL** - All dependencies must be present
- Determines when job is eligible to run

### Triggers on Success
**Type:** Multi-select job picker
**Optional**
- Jobs to trigger when this job succeeds
- Downstream dependencies

### Triggers on Failure
**Type:** Multi-select job picker
**Optional**
- Jobs to trigger when this job fails
- Error handling or cleanup jobs

## Execution Parameters

### Max Concurrent Executions*
**Type:** Number input
**Default:** 1
- How many instances can run simultaneously
- Range: 1-100
- Prevents resource exhaustion

### Execution Timeout (minutes)*
**Type:** Number input
**Default:** 60
- Maximum time job can run
- Range: 1-1440 (1 minute to 1 day)
- Job killed if it exceeds timeout

### Priority
**Type:** Number input
**Default:** 5
- Execution priority in queue
- Range: 1-10 (1=lowest, 10=highest)
- Higher priority jobs run first

### Processing Mode
**Type:** Dropdown select
**Default:** Batch
- **Batch** - Process in batches
- **Streaming** - Continuous stream processing
- **Real-time** - Immediate processing
- Affects data processing approach

## Resource Management

### Resource Pool
**Type:** Dropdown select
**Optional**
- Execution environment/cluster
- Examples: Default, High-Performance, Low-Cost

### Max Memory (MB)
**Type:** Number input
**Optional**
- Memory limit for job execution
- Examples: 512, 1024, 2048

### Max CPU Cores
**Type:** Number input
**Optional**
- CPU allocation for job
- Examples: 1, 2, 4

## Data Connection

### Connection Profile
**Type:** Dropdown select
**Optional**
- Data source connection for the job
- Used for data access/authentication

## Monitoring & Alerts

### SLA Duration (minutes)
**Type:** Number input
**Optional**
- Expected execution duration
- Used for SLA breach detection
- Examples: 30 (job should complete in 30 min)

### SLA Breach Action
**Type:** Dropdown select
**Optional**
- What to do if SLA exceeded
- **Alert** - Send alert notification
- **Retry** - Retry the job
- **Escalate** - Escalate to higher level
- **Ignore** - No action

### Alert Threshold (%)
**Type:** Number input
**Default:** 100
- Failure percentage before alerting
- Example: 50 = alert if 50% of runs fail

### Performance Baseline (seconds)
**Type:** Number input
**Optional**
- Expected execution time
- Used for performance anomaly detection

### Notify on Success
**Type:** Toggle
**Default:** Off
- Send notification when job succeeds

### Notify on Failure
**Type:** Toggle
**Default:** On
- Send notification when job fails

### Notify on SLA Breach
**Type:** Toggle
**Default:** On
- Send notification when SLA exceeded

### Notification Recipients
**Type:** Email multi-select
**Optional** (Recommended if notifications enabled)
- Email addresses to notify
- Multiple recipients supported

## Compliance & Governance

### GDPR Processing Purpose
**Type:** Dropdown select
**Optional**
- GDPR processing category
- Examples: Analytics, Customer Service, Legitimate Interest

### Compliance Tags
**Type:** Multi-select tags
**Optional**
- Compliance categorization
- Examples: HIPAA, PCI-DSS, SOX

## Additional Settings

### Metadata
**Type:** JSON text area
**Optional**
- Custom key-value data
- Example:
```json
{
  "team": "data-engineering",
  "cost_center": "CC-123",
  "business_unit": "Analytics"
}
```

### Tags
**Type:** Multi-select tags
**Optional**
- Categorization and filtering
- Examples: critical, daily, pipeline

### Valid From Date
**Type:** Date picker
**Optional**
- Job starts being scheduled from this date
- Job inactive before this date

### Valid To Date
**Type:** Date picker
**Optional**
- Job stops being scheduled after this date
- Leave blank for no expiration

### Initial Status
**Type:** Dropdown select
**Default:** Draft
- **Draft** - Save but don't activate
- **Active** - Save and start executing
- **Paused** - Save but start paused

## Form Actions

### Save Job
- Creates new scheduled job
- Validates all required fields
- Shows error messages if validation fails

### Cancel
- Return to job list
- Discard unsaved changes

## Validation Rules

- **Job Name** - Required, 1-255 characters
- **Job Code** - Required, alphanumeric and underscores, unique
- **Job Type** - Required selection
- **Schedule Type** - Required selection
- **Timezone** - Required for time-based schedules
- **Cron Expression** - Valid cron format if specified
- **Interval** - 60-31,536,000 seconds if specified
- **Max Concurrent** - 1-100
- **Timeout** - 1-1440 minutes
- **Priority** - 1-10
- **Alert Threshold** - 0-100%

## After Creating

After successful creation:
1. Job created in Draft or Active status
2. Appears in job list
3. Next scheduled execution calculated
4. Monitoring begins (if Active)
5. Next steps:
   - Test job execution
   - Monitor execution history
   - View analytics
   - Adjust schedule if needed
   - Set up notifications

## Best Practices

### Naming Conventions
- Use clear, descriptive names
- Include frequency in name: "Daily Customer Sync"
- Use consistent naming patterns

### Schedule Configuration
- Start with longer intervals, optimize after testing
- Use cron for fixed times (better for business processes)
- Use intervals for recurring tasks (better for polling)
- Document cron expressions in description

### Resource Planning
- Set realistic timeouts (don't make them too strict)
- Monitor actual execution times before finalizing SLA
- Leave headroom in resource limits
- Test with representative data volumes

### Dependency Management
- Keep dependency chains short (< 5 jobs)
- Avoid circular dependencies
- Document why jobs depend on others
- Plan error handling for failed dependencies

### Monitoring & Alerts
- Enable alerts for critical jobs
- Set realistic SLA targets (based on historical data)
- Use escalation for critical job failures
- Review notification recipients regularly

### Compliance
- Mark jobs handling personal data appropriately
- Add compliance tags if required
- Document processing purpose if GDPR-relevant
- Include compliance notes in metadata

