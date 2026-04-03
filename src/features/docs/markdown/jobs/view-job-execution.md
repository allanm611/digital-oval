---
title: View Job Execution Details
---

# View Job Execution Details

## Overview

View details about a job execution.

---

## Information

- **Execution ID** - Unique execution identifier
- **Job Name** - Name of the executed job
- **Status** - Execution status (Pending, Queued, Running, Success, Failure, Aborted, Timeout, Cancelled)
- **Started At** - Date and time execution began
- **Completed At** - Date and time execution finished
- **Duration** - Total execution time
- **Trace ID** - Distributed tracing identifier
- **Correlation ID** - Request correlation identifier
- **SLA Breached** - Whether SLA was exceeded

---

## Actions

**Admin or with feature flag enabled:**
- **Abort** - Stop running execution
- **Retry** - Rerun failed execution
- **Archive** - Mark execution for cleanup
