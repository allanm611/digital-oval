# Edit Scheduled Job

Edit Scheduled Job uses the same structure as create, but pre-fills current values.

This route (`/dashboard/scheduled-jobs/:id/edit`) uses the same component as create.

## What Teams Usually Update

- schedule type and timing fields
- execution controls (priority, timeout, concurrency)
- owner/tenant metadata
- notifications and tags

![Scheduled job edit form schedule configuration](/img/jobmanagement-images/scheduledetailscheduleconfiguration.png)

![Scheduled job edit ownership notifications and tags](/img/jobmanagement-images/schedulejobdetailsownership%26notifications%26tagsimage.png)

## Field Meaning Reminder

- **Schedule fields** define when execution is attempted.
- **Execution controls** protect platform stability.
- **Status** determines whether the job can actively run.

## Save Behavior

Changes are validated and applied to the existing job definition.

## Related Pages

- [Create Scheduled Job](/documentation/jobs/create-scheduled-job)
- [Scheduled Jobs List](/documentation/jobs/scheduled-jobs-list)
- [View Scheduled Job](/documentation/jobs/view-scheduled-job)
