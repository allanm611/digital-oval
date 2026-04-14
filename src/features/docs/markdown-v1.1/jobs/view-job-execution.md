# View Job Execution

Job Execution Details is the deep-dive page for one execution record.

## What You See

- execution identity and status
- start/end timing and total duration
- error messages and error context fields
- resource/data metrics (memory, CPU, rows)
- step-progress information

![Job execution details execution and system info](/img/jobmanagement-images/jobexecutionsdetailexecutionandsysteinfoimage.png)

## Key Fields Explained

- **Error Code / Error Step ID**: points to where failure occurred.
- **Rows Read/Processed/Inserted/Updated/Deleted**: data movement footprint.
- **Peak Memory / CPU**: runtime resource profile.
- **Steps Completed / Failed**: workflow progression status.

![Job execution details peak execution times](/img/jobmanagement-images/jobexecutiondetailspeakexecutiontimes.png)

![Job execution details job analytics and insights graph](/img/jobmanagement-images/jobexecutiondetailjobanalyticsandisnightsgraph.png)

## Actions

Depending on state and permissions: **Abort**, **Retry**, and **Archive** actions may be available.

## Related Pages

- [Job Executions](/documentation/jobs/job-executions)
- [Job Executions List](/documentation/jobs/job-executions-list)
- [Job Executions Analytics](/documentation/jobs/job-executions-analytics)
