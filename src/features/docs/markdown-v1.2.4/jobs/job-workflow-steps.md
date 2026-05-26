# Job Workflow Steps

Job Workflow Steps defines step-level execution logic inside jobs.

## Open The Page

Go to `Jobs -> Job Workflow Steps`.

## What You Manage Here

- step sequencing and ordering
- step execution behavior (type, action, timeout, retry)
- failure policy and skip/condition logic
- validation queries and expected row count checks

![Job workflow steps list page](/img/v1.1/jobmanagement-images/jobworkflowstepslistpage.png)

## Core Field Meaning

- **Step Order**: execution position in flow.
- **Step Type**: action category (SQL/API/script/etc).
- **On Failure Action**: what happens when step fails.
- **Is Critical**: marks step importance for workflow success.
- **Is Parallel / Parallel Group**: controls parallel execution grouping.

![Job workflow step details](/img/v1.1/jobmanagement-images/jobworkflowdetailsimage1.png)

## Create And Edit Behavior

The app uses one page for both creating and editing steps:

- Create route: `/dashboard/job-workflow-steps/create`
- Edit route: `/dashboard/job-workflow-steps/:id/edit`

This form also supports batch create mode using query params in the frontend.

## Related Pages

- [Job Workflow Steps List](/documentation/jobs/job-workflow-steps-list)
- [Create Job Workflow Step](/documentation/jobs/create-job-workflow-step)
- [View Job Workflow Step](/documentation/jobs/view-job-workflow-step)
