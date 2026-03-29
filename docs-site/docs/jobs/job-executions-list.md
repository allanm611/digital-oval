---
title: Job Executions List
---

import { EditButton } from '@site/src/components/EditButton';

# Job Executions List

## Overview

The Job Executions List displays all job execution records. From this page, you can monitor job runs, analyze performance, and investigate failures.

## Page Layout

### Statistics Cards
Summary of execution statistics:
- **Total Executions** - Count of all recorded executions
- **Successful Executions** - Completed successfully
- **Failed Executions** - Encountered errors
- **Running Executions** - Currently executing
- **SLA Breaches** - Exceeded SLA targets
- **Average Duration** - Mean execution time

### Execution List

Each execution entry displays:
- **Job Name** - Name of the executed job
- **Status** - Execution status (Success/Failure/Running/etc.)
- **Started** - When execution began
- **Duration** - How long it took
- **Completed** - When execution finished
- **Triggered By** - Source of trigger (Manual/Scheduler/API/etc.)
- **Rows Processed** - Records affected
- **Error** - Error message (if failed)
- **SLA** - Whether SLA was breached
- **Action Menu** - Quick actions

## Filtering Executions

### Search
- **Type:** Text input
- **Function:** Search by job name or execution ID
- **Real-time:** Results update as you type

### Status Filter
- **Pending** - Scheduled, awaiting execution
- **Queued** - In queue, waiting for worker
- **Running** - Currently executing
- **Success** - Completed successfully
- **Failure** - Completed with errors
- **Aborted** - Manually stopped
- **Timeout** - Exceeded time limit
- **Cancelled** - Cancelled before start

### Triggered By Filter
- **Scheduler** - Scheduled execution
- **Manual** - User-triggered
- **API** - API call triggered
- **Webhook** - External webhook
- **Event** - Business event triggered
- **Retry** - Automatic retry
- **Dependency** - Dependency triggered
- **System** - System-triggered

### Date Range Filter
- **Type:** Date picker range
- **Function:** Filter by execution date
- **Options:** Last 7 days, Last 30 days, Custom range

### SLA Filter
- **Breached** - Show executions over SLA
- **Compliant** - Show SLA-compliant executions
- **All** - Show all executions

### Advanced Filters
- **Job ID** - Filter by specific job
- **Server Instance** - Filter by execution server
- **Worker Node** - Filter by worker process
- **Archived Status** - Show/hide archived executions

## Execution Status Indicators

### Status Colors and Icons
- ✅ **Success** - Green, execution completed successfully
- ❌ **Failure** - Red, execution encountered errors
- ⏳ **Pending** - Gray, waiting to execute
- ⏱️ **Queued** - Blue, in queue
- ⚙️ **Running** - Yellow, currently executing
- 🛑 **Aborted** - Dark red, manually stopped
- ⏱️ **Timeout** - Orange, exceeded time limit
- ❎ **Cancelled** - Gray, cancelled

## Sorting

**Available Sort Options**
- Job Name (A-Z)
- Status
- Started Date (Newest/Oldest)
- Completed Date (Newest/Oldest)
- Duration (Longest/Shortest)
- Triggered By

## Pagination

- **20 executions per page**
- Navigate between pages
- Total count displayed
- Jump to specific page

## Actions

### Individual Execution Actions

Click the menu icon (⋮) on any execution:

**View Details**
- Open execution details page
- See full metrics and logs
- Review error information

**View Logs**
- Access execution logs
- See detailed output
- Debug failed executions

**View Analytics**
- See performance visualization
- Compare with other runs
- Analyze trends

**Retry** (if failed)
- Rerun the failed job
- Same configuration used
- Creates new execution record

**Cancel** (if running)
- Stop execution immediately
- Execution marked as cancelled
- Triggers cleanup

**Archive**
- Mark for cleanup
- Removed from active view
- Retained for history

**Delete**
- Permanently remove record
- Irreversible action
- Requires confirmation

### Bulk Actions

Select multiple executions to:
- **Archive Multiple** - Bulk archive old executions
- **Delete Multiple** - Bulk delete executions
- **Retry Failed** - Retry all selected failed executions

## Selection Mode

**Header Checkbox**
- Select all visible executions
- Deselect all
- Toggle selection

**Individual Checkboxes**
- Select specific executions
- Bulk actions appear when selected

## Common Filtering Scenarios

### Find Failed Executions
1. Click Status Filter
2. Select "Failure"
3. Review error messages
4. Click to view details

### Monitor Recent Executions
1. Set Date Range to "Last 7 days"
2. Sort by "Started Date" (Newest)
3. Monitor status and duration
4. Watch for failures

### Find SLA Breaches
1. Click SLA Filter
2. Select "Breached"
3. Review duration metrics
4. Identify pattern issues

### Find Manually Triggered Executions
1. Click Triggered By Filter
2. Select "Manual"
3. View user-triggered runs
4. Compare with scheduled

### Analyze Specific Job
1. Type job name in search
2. Review all executions
3. Analyze success rate
4. Check performance trends

### Track Retried Executions
1. Click Triggered By Filter
2. Select "Retry"
3. See automatic retries
4. Understand failure patterns

## Performance Analysis

### Execution Metrics View
- Duration information
- Resource usage (memory, CPU)
- Data processing counts
- SLA status

### Trend Analysis
- Compare multiple executions
- Identify slow runs
- Spot performance degradation
- Understand patterns

## Error Investigation

### Finding Failed Executions
1. Filter by Status = Failure
2. Sort by recent date
3. Click to view details
4. Review error messages

### Understanding Failures
- Check error code and message
- Review which step failed
- Examine error details
- Check job logs

### Common Failure Patterns
- Data validation failures
- Connection timeouts
- Resource exhaustion
- Configuration errors
- Dependency failures

<EditButton docSlug="jobs/job-executions-list" docTitle="Job Executions List" />
