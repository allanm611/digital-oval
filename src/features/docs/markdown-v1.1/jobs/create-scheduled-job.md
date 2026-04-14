# Create Scheduled Job

Create Scheduled Job is used to add a new job definition and its execution rules.

The frontend uses the same page component for both create and edit:

- Create route: `/dashboard/scheduled-jobs/create`
- Edit route: `/dashboard/scheduled-jobs/:id/edit`

## Create Modal: ETL Vs Campaign

From Scheduled Jobs List, clicking **Create** opens a selection modal asking what the job should run:

- **Campaign**: marketing campaign execution job.
- **ETL**: data processing/ETL style job.

This choice affects how the create form behaves.

![Scheduled job create type selection modal](/img/v1.1/jobmanagement-images/selectwhichjobtorunmodalscheduledjobscreate.png)

## ETL Form Vs Campaign Form (Actual Difference)

- **Shared in both**:
  - Name, Code, Description, Job Type
  - Schedule configuration (manual/cron/interval/event/dependency)
  - Status, priority, timeout, concurrency, execution windows
  - Owner/tenant/client fields, tags, notifications
- **Campaign-specific fields**:
  - Campaign selector
  - Segment selection for the chosen campaign
  - Per-segment channel codes
  - Campaign metadata in payload (mode, batch size, max parallel broadcasts)
- **ETL path**:
  - No campaign selector or segment/channel mapping section
  - Uses the base scheduled job fields only

In the frontend, campaign mode is detected from `type=campaign` (or campaign metadata in edit mode), and additional campaign blocks are loaded only in that mode.

![Scheduled job create form with basic info and campaign configuration](/img/v1.1/jobmanagement-images/createformscheduledjobimage1basicinfoand%20campaignconfiguration.png)

![Scheduled job create form additional configuration](/img/v1.1/jobmanagement-images/createscheduledjobimage2.png)

## Required Fields

- **Name**
- **Code**
- **Description**
- **Job Type**

## Schedule Fields And Meaning

- **Schedule Type**: selects run model (manual/cron/interval/event/dependency).
- **Cron Expression**: required when schedule type is cron.
- **Interval Seconds**: required for interval mode, minimum constrained.
- **Execution Window**: optional run-time boundaries.

![Scheduled job schedule configuration](/img/v1.1/jobmanagement-images/scheduledetailscheduleconfiguration.png)

## Execution And Control Fields

- **Priority**: relative order (typically lower urgency vs higher urgency settings based on team policy).
- **Max Concurrent Executions**: caps overlapping runs.
- **Execution Timeout**: stops jobs that exceed allowed runtime.
- **Technical Owner / Tenant / Client**: ownership and tenancy context.
- **Notification Recipients**: who receives execution updates.
- **Tags**: quick grouping labels.

## Status And Processing Notes

- **Status** options in form: `active`, `draft`, `paused`, `archived`.
- **Schedule Type** controls conditional inputs:
  - `cron` requires cron expression.
  - `interval` requires interval seconds (minimum validation enforced).
- **Processing Mode** supports batch/streaming/real-time style execution.

## Validation Notes

Save is blocked until required fields are complete. Conditional fields (like cron or interval settings) must be provided when their schedule type is selected.

## Related Pages

- [Scheduled Jobs List](/documentation/jobs/scheduled-jobs-list)
- [View Scheduled Job](/documentation/jobs/view-scheduled-job)
- [Scheduled Jobs Analytics](/documentation/jobs/scheduled-jobs-analytics)
