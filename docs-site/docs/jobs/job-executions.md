---
title: Job Executions
---

import { EditButton } from '@site/src/components/EditButton';

# Job Executions

## Overview

Job Executions are records of actual job runs. Each execution captures when a job ran, how long it took, whether it succeeded or failed, and detailed performance metrics.

## Key Concepts

### Execution Lifecycle
Every job execution passes through various states from initial trigger to completion:
- **Pending** - Scheduled to run, waiting for slot
- **Queued** - In queue waiting for worker availability
- **Running** - Currently executing
- **Success** - Completed successfully
- **Failure** - Completed with errors
- **Aborted** - Manually stopped
- **Timeout** - Exceeded maximum execution time
- **Cancelled** - Cancelled before execution

### Triggered By
Execution can be triggered by different sources:
- **Scheduler** - Per regular schedule
- **Manual** - User triggered via UI
- **API** - Triggered via API call
- **Webhook** - External system webhook
- **Event** - Business event trigger
- **Retry** - Automatic retry after failure
- **Dependency** - Triggered by dependency completion
- **System** - System-triggered

## Execution Metrics

### Timing Metrics
- **Started At** - When execution began
- **Completed At** - When execution finished
- **Duration** - Total execution time in seconds
- **Execution Date** - Date (YYYY-MM-DD) of execution

### Data Processing Metrics
- **Rows Read** - Input records processed
- **Rows Processed** - Records processed through pipeline
- **Rows Inserted** - New records added
- **Rows Updated** - Existing records modified
- **Rows Deleted** - Records removed
- **Data Quality Score** - Quality of processed data (0-100%)

### Performance Metrics
- **Peak Memory** - Maximum memory usage in MB
- **Peak CPU** - Maximum CPU utilization percentage
- **Steps Total** - Total workflow steps
- **Steps Completed** - Steps that completed
- **Steps Failed** - Steps that failed

### Error Information
- **Error Code** - Error classification code
- **Error Message** - Description of error
- **Error Step ID** - Which step failed
- **Error Details** - Detailed error context

### Execution Context
- **Trace ID** - For distributed tracing
- **Correlation ID** - For request correlation
- **Server Instance** - Which server executed
- **Worker Node ID** - Which worker process

## SLA Tracking

### SLA Breach Detection
- **SLA Breached** - Whether execution exceeded SLA target
- Used to track service level compliance
- Triggers alerts for breaches

## Archival

### Archiving Executions
- **Archived** - Whether execution is archived
- **Archived At** - When it was archived
- Old executions can be archived for cleanup
- Bulk archival supported

## Execution Analysis

### Historical Analysis
- View all executions for a job
- Analyze success/failure trends
- Identify performance patterns
- Detect anomalies

### Failure Analysis
- Review error messages
- Understand failure reasons
- Compare failures over time
- Improve job resilience

### Performance Analysis
- Track duration trends
- Monitor resource usage
- Identify slow executions
- Optimize job configuration

## Execution Filtering

### By Status
- View executions by status
- Find failing executions
- Monitor running jobs
- Track successful completions

### By Time Range
- Filter by execution date
- View recent executions
- Analyze historical trends

### By Trigger Type
- Manual executions
- Scheduled executions
- Event-triggered executions
- Retried executions

### By SLA
- Show SLA breaches
- Track compliance
- Identify problem jobs

## Available Actions

- **View Details** - See full execution information
- **View Logs** - Access execution logs
- **View Analytics** - Performance metrics
- **Retry Execution** - Rerun failed job
- **Cancel Execution** - Stop running job
- **Archive** - Mark for cleanup
- **Delete** - Permanently remove record

<EditButton docSlug="jobs/job-executions" docTitle="Job Executions" />
