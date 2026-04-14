# Create Job Workflow Step

Create Job Workflow Step is used to define one executable step inside a job workflow.

The same page is used for both create and edit:

- Create route: `/dashboard/job-workflow-steps/create`
- Edit route: `/dashboard/job-workflow-steps/:id/edit`

## Required Inputs

- **Job ID**
- **Step Order**
- **Step Name**
- **Step Code**
- **Step Description**
- **Step Type**
- **Step Action**

![Create job workflow step form - part 1](/img/v1.0/jobmanagement-images/createjobworkflowimage1.png)

![Create job workflow step form - part 2](/img/v1.0/jobmanagement-images/createjobworkflowimage2.png)

## Behavior Fields

- **On Failure Action**: abort, continue, retry, or skip remaining steps.
- **Retry Count / Retry Delay**: retry policy after failure.
- **Timeout Seconds**: max execution time before timeout handling.
- **Is Critical**: marks whether failure should be treated as high-impact.
- **Is Parallel / Parallel Group ID**: enables grouped parallel execution.
- **Depends On Step Codes**: explicit step dependencies.
- **Execution Condition / Skip Condition**: conditional run and skip logic.

## Validation Fields

- **Pre Validation Query**: checks before running action.
- **Post Validation Query**: checks after action.
- **Expected Row Count Min/Max**: validation thresholds for data movement.

## Notes

- In batch mode, multiple steps can be created in a single submission.
- Step order must not collide with other steps in the same job.

The edit flow uses the same form fields with existing values pre-filled.

![Job workflow step details](/img/v1.0/jobmanagement-images/jobworkflowdetailimage2.png)

## Related Pages

- [Job Workflow Steps](/documentation/jobs/job-workflow-steps)
- [Job Workflow Steps List](/documentation/jobs/job-workflow-steps-list)
- [View Job Workflow Step](/documentation/jobs/view-job-workflow-step)
