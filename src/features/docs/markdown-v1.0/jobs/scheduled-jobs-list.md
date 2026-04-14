# Scheduled Jobs List

Scheduled Jobs List is where teams monitor and operate job definitions.

## Table Fields

- **Name**
- **Code**
- **Status**
- **Schedule Type**
- **Job Type**
- **Owner**
- **Last Run / Next Run**
- **Success Rate**

## Search And Filters

Use search for name/code lookup, and use filters for status, job type, owner, schedule type, tags, tenant, connection profile, and active-only view.

![Scheduled Jobs list page](/img/v1.0/jobmanagement-images/scheduledjobslistpage.png)

## Actions

- **Create**
- **View**
- **Edit**
- **Delete**
- **Execute Now**
- **Pause / Resume**
- batch operations when selection mode is enabled

![Scheduled Jobs bulk operation page](/img/v1.0/jobmanagement-images/scheduledjobsbulkoperationpage.png)

## Create Action Behavior

When you click **Create**, the app first opens a modal to choose job intent:

- **Campaign** job
- **ETL** job

After selection, you are taken to the scheduled job form, where campaign mode shows additional campaign/segment/channel fields while ETL mode stays on the base job configuration fields.

![Select job type modal for scheduled job create](/img/v1.0/jobmanagement-images/selectwhichjobtorunmodalscheduledjobscreate.png)

## Related Pages

- [Scheduled Jobs](/documentation/jobs/scheduled-jobs)
- [Create Scheduled Job](/documentation/jobs/create-scheduled-job)
- [View Scheduled Job](/documentation/jobs/view-scheduled-job)
- [Scheduled Jobs Analytics](/documentation/jobs/scheduled-jobs-analytics)
