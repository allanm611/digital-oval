# View Job Workflow Step

Workflow Step Details gives a full read view of one step definition.

## What You See

- step identity and ordering
- step action/type settings
- retry, timeout, and failure policy
- dependency and condition logic
- validation and expected row count constraints

![Job workflow step details](/img/v1.1/jobmanagement-images/jobworkflowdetailsimage1.png)

![Job workflow step details (extended)](/img/v1.1/jobmanagement-images/jobworkflowdetailimage2.png)

## Key Fields Explained

- **Retry Count / Retry Delay**: failure retry behavior.
- **Timeout Seconds**: max execution time before timeout handling.
- **Execution Condition**: when step should run.
- **Skip Condition**: when step should be bypassed.

## Related Pages

- [Job Workflow Steps](/documentation/jobs/job-workflow-steps)
- [Job Workflow Steps List](/documentation/jobs/job-workflow-steps-list)
- [Create Job Workflow Step](/documentation/jobs/create-job-workflow-step)
- [Job Workflow Steps Analytics](/documentation/jobs/job-workflow-steps-analytics)
