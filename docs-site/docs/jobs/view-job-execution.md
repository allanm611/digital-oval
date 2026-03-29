---
title: View Job Execution Details
---

import { EditButton } from '@site/src/components/EditButton';

# View Job Execution Details

## Overview

The Job Execution Details page displays complete information about a specific job execution. From here, you can review metrics, analyze performance, investigate failures, and access execution logs.

## Page Layout

### Header
- **Job Name** - Name of the executed job
- **Execution ID** - Unique execution identifier
- **Status Badge** - Execution status
- **Duration** - How long execution took
- **Action Menu** - Additional options

## Information Sections

### Basic Information

**Execution ID**
- Unique identifier for this execution
- Used for tracking and troubleshooting

**Job Name**
- Name of the job that executed

**Job ID**
- Internal job identifier

**Status**
- Current execution status
- Success, Failure, Running, Aborted, Timeout, or Cancelled

**Execution Date**
- Date of execution (YYYY-MM-DD)

### Timing Information

**Started At**
- Date and time execution began

**Completed At**
- Date and time execution finished
- Empty if still running

**Duration (seconds)**
- Total execution time
- Calculated from start to completion

### Trigger Information

**Triggered By**
- Source of trigger (Scheduler, Manual, API, Webhook, Event, Retry, Dependency, System)

**Triggered By User**
- Which user triggered (if manual trigger)

**Trace ID**
- Distributed tracing identifier

**Correlation ID**
- Request correlation identifier

### Server & Resource Information

**Server Instance**
- Which server executed the job
- Useful for debugging server-specific issues

**Worker Node ID**
- Which worker process executed it
- Useful for resource tracking

### Performance Metrics

**Peak Memory (MB)**
- Maximum memory usage during execution
- Used for resource planning

**Peak CPU (%)**
- Maximum CPU utilization
- Used for performance analysis

**Duration Seconds**
- Total execution time in seconds

### Data Processing Metrics

**Rows Read**
- Number of input records

**Rows Processed**
- Records processed through pipeline

**Rows Inserted**
- New records added

**Rows Updated**
- Existing records modified

**Rows Deleted**
- Records removed

**Data Quality Score**
- Quality percentage (0-100%)

### Workflow Step Metrics

**Steps Total**
- Total number of workflow steps

**Steps Completed**
- Steps that completed successfully

**Steps Failed**
- Steps that failed

### Error Information

**Error Code**
- Error classification code
- Identifies error type

**Error Message**
- Human-readable error description

**Error Step ID**
- Which workflow step failed

**Error Details**
- Detailed error context
- Additional troubleshooting information

### SLA Information

**SLA Breached**
- Yes/No - Whether execution exceeded SLA target
- Important for tracking service level compliance

### Archival Information

**Archived**
- Whether execution is archived

**Archived At**
- When it was archived (if applicable)

## Execution Context

**Execution Context**
- Custom context data passed to execution
- JSON format with custom fields
- May contain business or technical context

## Actions

### View Logs
- **Icon:** FileText
- **Function:** Access execution logs
- **Shows:**
  - Detailed execution output
  - Step-by-step progress
  - Debug information
  - Error stack traces

### View Analytics
- **Icon:** BarChart
- **Function:** Performance visualization
- **Shows:**
  - Duration trends
  - Resource usage charts
  - Data processing graphs
  - Comparison with other runs

### Retry** (if failed)
- **Icon:** RotateCcw
- **Function:** Rerun the job
- **Result:** Creates new execution record
- **Use:** When execution failed and issue is resolved

### Cancel** (if running)
- **Icon:** Ban
- **Function:** Stop execution
- **Result:** Marks as cancelled
- **Use:** To stop long-running jobs

### Archive
- **Icon:** Archive
- **Function:** Mark for cleanup
- **Use:** For old, unneeded executions

### Delete
- **Icon:** Trash
- **Function:** Permanently remove
- **Warning:** Irreversible action
- **Requires:** Confirmation

### More Menu
- **View Job Details** - Open the job configuration
- **View All Executions** - Back to execution list
- **Compare with Other Runs** - Performance comparison

## Log Viewer

### Log Display
- Real-time log streaming (if still running)
- Complete log history (if finished)
- Search and filter capabilities
- Syntax highlighting

### Log Sections
- **Startup logs** - Job initialization
- **Step logs** - Individual step output
- **Data processing** - Record processing details
- **Error logs** - Failure information
- **Cleanup logs** - Resource cleanup

### Log Filtering
- By log level (DEBUG, INFO, WARN, ERROR)
- By step name
- By component
- By keyword

## Performance Charts

### Execution Duration Chart
- Duration compared to other runs
- Trend line showing changes over time
- Baseline performance marker

### Resource Usage Chart
- Memory usage over time
- CPU utilization over time
- Resource peaks highlighted

### Data Processing Chart
- Records processed rate
- Insert/update/delete counts
- Data quality scores

## Metrics Summary

### Quick Stats
- Execution ID and date
- Total duration
- Success/failure status
- Record counts
- Resource usage peaks
- Error (if any)

## Related Information

### Related Executions
- Previous execution of same job
- Next execution (if scheduled)
- Other recent executions
- Retries of this execution

### Job Configuration
- Link to job details
- Review job schedule and settings
- Edit job configuration

## Common Tasks

### Review Failed Execution
1. Open execution details
2. Review Error Code and Message
3. Check which step failed
4. View logs for details
5. Review error context
6. Take corrective action

### Analyze Performance
1. View Analytics
2. Compare duration trends
3. Check resource peaks
4. Identify bottlenecks
5. Optimize job configuration

### Check Data Processing
1. Review Rows metrics
2. Check data quality score
3. Verify insert/update/delete counts
4. Monitor processing rate

### Debug Failed Execution
1. Open execution
2. Click "View Logs"
3. Search for ERROR level logs
4. Review step-by-step output
5. Check error details section

### Retry Failed Job
1. Open failed execution
2. Click "Retry" button
3. Confirm action
4. New execution created
5. Monitor new execution

### View Job Configuration
1. Click "View Job Details"
2. Review scheduled job settings
3. Check dependencies
4. Review resource limits
5. Return to execution view

### Compare with Other Runs
1. Click "Compare with Other Runs"
2. Select comparison execution
3. Review metric differences
4. Analyze performance variations

<EditButton docSlug="jobs/view-job-execution" docTitle="View Job Execution Details" />
