---
title: Job Executions
---

# Job Executions

## Overview

Job Executions are records of actual job runs. Track execution status, timing, and outcomes.

---

## Execution Statuses

- **Pending** - Scheduled to run, waiting for slot
- **Queued** - In queue waiting for worker availability
- **Running** - Currently executing
- **Success** - Completed successfully
- **Failure** - Completed with errors
- **Aborted** - Manually stopped
- **Timeout** - Exceeded maximum execution time
- **Cancelled** - Cancelled before execution

---

## Filters

- **Status** - Filter by execution status
- **Job ID** - Filter by job
- **Date Range** - Filter by execution start/end date
- **Trace ID** - Search by trace ID for distributed tracing
- **Correlation ID** - Search by correlation ID
- **Days Back** - Filter recent executions (default: 7 days)
- **Long Running Threshold** - Find executions exceeding duration (in minutes)

---

## Quick Filters

- **SLA Breached** - Show executions that exceeded SLA
- **Long Running** - Show executions exceeding threshold
- **Currently Running** - Show active executions

---

## Statistics

- **Total Executions** - Total number of executions
- **Successful Executions** - Number of successful executions
- **Failed Executions** - Number of failed executions
- **Timed Out** - Number of timeout executions
- **Aborted** - Number of aborted executions
- **SLA Breaches** - Number of SLA breaches

---

## Actions

**Individual Execution Actions (admin only or with feature flag enabled):**
- **View** - See execution details
- **Abort** - Stop running execution
- **Retry** - Rerun failed execution
- **Archive** - Mark execution for cleanup

**Batch Actions:**
- **Abort** - Stop multiple running executions
- **Archive** - Archive multiple executions

