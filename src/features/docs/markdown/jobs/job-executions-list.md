---
title: Job Executions List
---

# Job Executions List

## Overview

View and monitor all job execution records.

---

## Statistics Cards

- **Total Executions** - Count of all recorded executions
- **Successful Executions** - Completed successfully
- **Failed Executions** - Completed with errors
- **Timed Out** - Exceeded maximum execution time
- **Aborted** - Manually stopped
- **SLA Breaches** - Executions that exceeded SLA

---

## Filters

- **Status** - Filter by execution status (pending, queued, running, success, failure, aborted, timeout, cancelled)
- **Job ID** - Filter by specific job
- **Date Range** - Filter by execution start/end date (default: 7 days)
- **Trace ID** - Search by trace ID for distributed tracing
- **Correlation ID** - Search by correlation ID
- **Long Running Threshold** - Find executions exceeding duration in minutes

---

## Quick Filters

- **SLA Breached** - Show executions that exceeded SLA
- **Long Running** - Show executions exceeding threshold
- **Currently Running** - Show active executions

---

## Actions

**Individual Execution Actions (admin or with feature flag enabled):**
- **View** - See execution details
- **Abort** - Stop running execution
- **Retry** - Rerun failed execution
- **Archive** - Mark execution for cleanup

**Batch Actions:**
- **Abort** - Stop multiple running executions
- **Archive** - Archive multiple executions

