# View Job Workflow Step

Workflow Step Details gives a full read view of one step definition.

## What You See

- step identity and ordering
- step action/type settings
- retry, timeout, and failure policy
- dependency and condition logic
- validation and expected row count constraints

![Job workflow step details](/img/jobmanagement-images/jobworkflowdetailsimage1.png)

![Job workflow step details (extended)](/img/jobmanagement-images/jobworkflowdetailimage2.png)

## Key Fields Explained

- **Retry Count / Retry Delay**: failure retry behavior.
- **Timeout Seconds**: max execution time before timeout handling.
- **Execution Condition**: when step should run.
- **Skip Condition**: when step should be bypassed.

## Related Pages

- [Job Management Overview](/documentation/jobs/overview)
- [Scheduled Jobs](/documentation/jobs/scheduled-jobs)
- [Job Executions](/documentation/jobs/job-executions)
- [Job Workflows](/documentation/jobs/job-workflows)
