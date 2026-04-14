# Job Executions

Job Executions tracks runtime attempts for jobs and is the main place to inspect run outcomes.

## Open The Page

Go to `Jobs -> Job Executions`.

## What You Manage Here

- execution status monitoring
- runtime timing and duration checks
- failure/timeout tracking
- trace and correlation-based troubleshooting

![Job executions list page](/img/jobmanagement-images/jobexecutionslistpage.png)

## Core Field Meaning

- **Execution Status**: pending, queued, running, success, failure, timeout, aborted, or cancelled.
- **Started / Completed At**: run timing boundaries.
- **Duration**: runtime length for performance comparison.
- **Trace ID / Correlation ID**: identifiers for end-to-end debugging.
- **SLA Breached**: flag for delayed or out-of-threshold execution.

![Job executions details execution and system info](/img/jobmanagement-images/jobexecutionsdetailexecutionandsysteinfoimage.png)

## Related Pages

- [Job Executions List](/documentation/jobs/job-executions-list)
- [View Job Execution](/documentation/jobs/view-job-execution)
- [Job Executions Analytics](/documentation/jobs/job-executions-analytics)
