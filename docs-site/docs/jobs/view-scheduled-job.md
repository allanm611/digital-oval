---
title: View Scheduled Job Details
---

import { EditButton } from '@site/src/components/EditButton';

# View Scheduled Job Details

## Overview

The Scheduled Job Details page displays complete information about a specific job. From here, you can view configuration, execution history, health status, and perform job management actions.

## Page Layout

### Header
- **Job Name** - Display name
- **Job Code** - Unique identifier
- **Status Badge** - Current status (Active/Paused/Draft/Archived)
- **Action Menu** - Additional options

## Information Sections

### Basic Information

**Name**
- Display name of the job

**Code**
- Unique job identifier

**Status**
- Active - Job is operational
- Paused - Execution temporarily stopped
- Draft - Not yet activated
- Archived - No longer in use

**Description**
- Detailed explanation of job purpose

**Job Category**
- Business category/grouping

### Ownership

**Business Owner**
- Name of business stakeholder

**Technical Owner**
- Team member responsible for maintenance

### Schedule Information

**Schedule Type**
- Manual, Cron, Interval, Event Driven, or Dependency Based

**Schedule Details**
- Cron expression (if cron schedule)
- Interval in seconds (if interval schedule)
- Event type (if event-driven)

**Timezone**
- Timezone used for time-based scheduling

**Last Run**
- Date and time of most recent execution

**Next Run**
- When job will execute next

### Execution Windows

**Execution Window Start**
- Earliest allowed execution time

**Execution Window End**
- Latest allowed execution time

**Blackout Dates**
- Dates when job won't execute

### Execution Settings

**Max Concurrent Executions**
- How many instances can run simultaneously

**Execution Timeout**
- Maximum allowed execution duration
- Job killed if it exceeds this time

**Priority**
- Queue priority (1-10, higher = first)

**Processing Mode**
- Batch, Streaming, or Real-time

### Resource Configuration

**Resource Pool**
- Execution environment/cluster

**Max Memory**
- Memory limit in MB

**Max CPU Cores**
- CPU allocation

### Dependencies

**Depends On Jobs**
- Jobs that must complete first
- Dependency mode (AND, OR, ALL)

**Triggers on Success**
- Jobs to trigger if this succeeds

**Triggers on Failure**
- Jobs to trigger if this fails

### Data Connection

**Connection Profile**
- Data source connection used

### SLA & Performance

**SLA Duration**
- Expected execution time
- Used for breach detection

**SLA Breach Action**
- What to do if SLA exceeded

**Alert Threshold**
- Failure percentage before alerting

**Performance Baseline**
- Expected execution time for anomaly detection

### Monitoring & Alerts

**Notify on Success**
- Yes/No - Send success notifications

**Notify on Failure**
- Yes/No - Send failure notifications

**Notify on SLA Breach**
- Yes/No - Send SLA breach notifications

**Notification Recipients**
- Email addresses for notifications

### Compliance

**GDPR Processing Purpose**
- GDPR category (if applicable)

**Compliance Tags**
- Compliance categorization

### Health Status

**Job Health**
- Overall health indicator
- 🟢 Green - Healthy
- 🟡 Yellow - Warning
- 🔴 Red - Critical

**Success Streak**
- Consecutive successful executions

**Last Execution Status**
- Success, Failed, Running, or Queued

**Dependency Readiness**
- Whether dependencies are satisfied

### Execution History

**Total Executions**
- Count of all executions

**Total Failures**
- Count of failed executions

**Success Rate**
- Percentage of successful executions

**Consecutive Failures**
- Current failure streak

### Timing Information

**Created**
- Date and time job was created

**Modified**
- Date and time of last modification

**Last Success**
- When job last succeeded

**Last Failure**
- When job last failed

### Metadata & Tags

**Tags**
- Categorization tags

**Metadata**
- Custom key-value data
- JSON configuration

## Health Status Section

### Indicators Displayed
- Current health status
- Success streak length
- SLA risk level
- Dependency readiness
- Last run status
- Next scheduled run

### Status Details
- Explanation of current status
- Actions to resolve issues if unhealthy
- Performance metrics

## Execution History

### Recent Executions Table
- Execution ID
- Start time
- End time
- Duration
- Status (Success/Failed)
- Rows processed (if applicable)
- Error message (if failed)

### Actions on History
- Click execution to view details
- View logs for failed executions
- Analyze trends over time

## Actions

### Edit
- **Icon:** Pencil
- **Function:** Open edit form
- **Allows:** Modify all job settings

### Execute Now
- **Icon:** Play
- **Function:** Trigger immediate execution
- **Ignores:** Normal schedule

### Pause
- **Icon:** Pause
- **Function:** Stop job execution
- **Active state:** Shows Pause button
- **Paused state:** Shows Resume button

### Resume
- **Icon:** Play
- **Function:** Resume paused job

### View Analytics
- **Icon:** BarChart
- **Function:** Access performance metrics
- **Shows:**
  - Execution history charts
  - Performance trends
  - Success rate trends
  - Failure patterns

### View Version History
- **Icon:** History
- **Function:** See previous configurations
- **Shows:** All historical versions

### More Menu
- **Archive** - Mark job as no longer in use
- **Clone** - Duplicate job configuration
- **View Logs** - See operation logs
- **Delete** - Remove job (with confirmation)

## Status Change Confirmation

When performing state-changing actions:

**Pause Job**
- Title: "Pause Job"
- Message: Confirm job pause
- Impact: Job won't execute per schedule
- Buttons: Pause, Cancel

**Resume Job**
- Title: "Resume Job"
- Message: Confirm job resumption
- Impact: Job resumes per schedule
- Buttons: Resume, Cancel

**Archive Job**
- Title: "Archive Job"
- Message: Confirm archival
- Note: Can be unarchived later
- Buttons: Archive, Cancel

## Common Tasks

### Monitor Job Health
1. Open job details
2. Review Health Status section
3. Check Success Rate
4. Look for consecutive failures
5. Verify SLA status

### Trigger Immediate Execution
1. Open job details
2. Click "Execute Now" button
3. Confirm in dialog
4. Job runs immediately
5. Monitor progress

### View Execution History
1. Scroll to Execution History section
2. Review recent executions
3. Click execution for details
4. Check logs for failed runs

### Check Next Run Time
1. Look for "Next Run" in schedule information
2. Verify job will run when expected
3. Check execution windows and blackout dates

### Update Job Configuration
1. Click Edit button
2. Modify desired settings
3. Save changes
4. Return to details view

### Review Performance Trends
1. Click "View Analytics" button
2. See execution history charts
3. Analyze performance trends
4. Identify patterns or issues

### Pause Job for Maintenance
1. Click Pause button
2. Confirm in dialog
3. Job stops executing
4. Can be resumed later

### Monitor Dependencies
1. Check "Depends On Jobs" section
2. Verify dependent jobs are healthy
3. Check "Triggers on Success/Failure"
4. Monitor downstream jobs

<EditButton docSlug="jobs/view-scheduled-job" docTitle="View Scheduled Job Details" />
