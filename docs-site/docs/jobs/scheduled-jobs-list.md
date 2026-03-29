---
title: Scheduled Jobs List
---

import { EditButton } from '@site/src/components/EditButton';

# Scheduled Jobs List

## Overview

The Scheduled Jobs List displays all configured jobs in the system. From this page, you can view job status, execution history, and manage job lifecycle.

## Page Layout

### Statistics Cards
Summary of job statistics:
- **Total Jobs** - Count of all scheduled jobs
- **Active Jobs** - Currently enabled jobs
- **Draft Jobs** - Jobs not yet activated
- **SLA Breached** - Jobs that missed SLA targets
- **Stale Jobs** - Jobs not executed recently
- **Due for Execution** - Jobs scheduled to run soon

### Job List

Each job entry displays:
- **Job Name** - Display name of the job
- **Job Code** - Unique identifier
- **Status** - Current status (Active/Paused/Draft/Archived)
- **Schedule Type** - How job is scheduled (Manual/Cron/Interval/Event/Dependency)
- **Last Run** - Date/time of most recent execution
- **Last Status** - Result of last execution (Success/Failed/Running)
- **Next Run** - When job will execute next
- **Success Rate** - Percentage of successful executions
- **Owner** - Business or technical owner
- **Action Menu** - Quick actions

## Filtering Jobs

### Search
- **Type:** Text input
- **Function:** Search by job name or code
- **Real-time:** Results update as you type

### Status Filter
- **Active** - Enabled, operational jobs
- **Paused** - Jobs with execution paused
- **Draft** - Not yet activated
- **Archived** - No longer in use
- **All** - Show all statuses

### Job Type Filter
- Filter by job type category
- Shows only jobs of selected type

### Schedule Type Filter
- **Manual** - Manually triggered
- **Cron** - Scheduled expressions
- **Interval** - Repeating intervals
- **Event Driven** - Event-triggered
- **Dependency Based** - Depends on other jobs

### Owner Filter
- Filter by business or technical owner
- Shows jobs owned by selected person

### Advanced Filters
- **Tag Filter** - Filter by tags
- **Connection Profile** - Filter by data connection
- **Tenant Filter** - Filter by tenant
- **Job Code** - Search by exact job code
- **Active Jobs Only** - Toggle to show only active

## Search Functionality

### Quick Search
- Type job name or partial match
- Search executes in real-time
- Results filter immediately

### Advanced Search
- Access advanced filter options
- Combine multiple filter criteria
- Saved search filters available

## Actions

### Individual Job Actions

Click the menu icon (⋮) on any job:

**View Details**
- Open job details page
- See full configuration
- View execution history

**Edit**
- Modify job settings
- Update schedule or configuration

**Execute Now**
- Trigger immediate execution
- Ignores normal schedule
- Useful for testing

**View Analytics**
- See performance metrics
- Review execution history
- Analyze trends

**Pause**
- Stop job execution
- Job won't run per schedule
- Can be resumed later

**Resume**
- Re-enable paused job
- Job resumes per schedule

**Clone**
- Duplicate job configuration
- Useful for creating similar jobs

**Archive**
- Mark job as no longer in use
- Retains history for auditing

**Delete**
- Permanently remove job
- Irreversible action
- Requires confirmation

### Bulk Actions

Select multiple jobs to:
- **Activate Multiple** - Enable several jobs
- **Pause Multiple** - Pause several jobs
- **Resume Multiple** - Resume paused jobs
- **Archive Multiple** - Archive several jobs
- **Delete Multiple** - Remove multiple jobs

## Selection Mode

**Header Checkbox**
- Select all visible jobs
- Deselect all jobs
- Toggle selection

**Individual Checkboxes**
- Select specific jobs
- Bulk actions appear when selected

## Sorting

**Available Sort Options**
- Name (A-Z)
- Status
- Schedule Type
- Last Run Date (Newest/Oldest)
- Next Run Date (Soonest/Latest)
- Success Rate (Highest/Lowest)
- Created Date

## Pagination

- **20 jobs per page**
- Navigate between pages
- Total count displayed
- Jump to specific page

## Status Indicators

- **Active** - Running per schedule
- **Paused** - Execution temporarily stopped
- **Draft** - Not yet activated
- **Archived** - No longer in use

## Last Execution Status

- **Success** - Last execution completed successfully
- **Failed** - Last execution encountered errors
- **Running** - Currently executing
- **Queued** - Waiting for execution slot
- **Unknown** - Status not determined

## Common Tasks

### Find Active Jobs
1. Click Status Filter
2. Select "Active"
3. View all enabled jobs

### Search for Specific Job
1. Type job name in search box
2. Results filter in real-time
3. Click job to view details

### Pause a Job
1. Find job in list
2. Click menu (⋮)
3. Select "Pause"
4. Job stops executing

### Resume Paused Job
1. Filter by status "Paused"
2. Click menu (⋮)
3. Select "Resume"
4. Job resumes per schedule

### Trigger Immediate Execution
1. Find job in list
2. Click menu (⋮)
3. Select "Execute Now"
4. Job runs immediately

### Monitor Job Health
1. Check Last Status column
2. Review Success Rate
3. Look for consecutive failures
4. Check for SLA breaches

### Create New Job
1. Click "Create Job" button
2. Fill in job configuration
3. Define schedule
4. Save job
5. Activate when ready

### View Job Performance
1. Click menu (⋮)
2. Select "View Analytics"
3. Review execution history
4. Analyze performance trends

<EditButton docSlug="jobs/scheduled-jobs-list" docTitle="Scheduled Jobs List" />
