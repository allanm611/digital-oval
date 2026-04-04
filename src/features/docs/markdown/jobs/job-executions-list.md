# Job Executions List

Job Executions List is the operational table for filtering and acting on execution records.

## Table Fields

- **Job ID**
- **Execution Status**
- **Started At / Completed At**
- **Duration**
- **Triggered By**
- **Trace ID / Correlation ID**
- **SLA Breached**

## Search And Filters

Common filters include status, job ID, date range, trace ID, correlation ID, and quick views such as long-running or currently-running executions.

![Job executions list page](/img/jobmanagement-images/jobexecutionslistpage.png)

## Actions

- **View** execution details
- **Abort** running executions when allowed
- **Retry** failed runs where supported
- **Archive** records where supported
- batch operations via selection mode

![Job executions batch operations page](/img/jobmanagement-images/jobexecutionsbatchoperationspage.png)

## Related Pages

- [Job Management Overview](/documentation/jobs/overview)
- [Scheduled Jobs](/documentation/jobs/scheduled-jobs)
- [Job Executions](/documentation/jobs/job-executions)
- [Job Workflows](/documentation/jobs/job-workflows)
