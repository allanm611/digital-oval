# Create Scheduled Job

Create Scheduled Job is used to add a new job definition and its execution rules.

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

## Execution And Control Fields

- **Priority**: relative order (typically lower urgency vs higher urgency settings based on team policy).
- **Max Concurrent Executions**: caps overlapping runs.
- **Execution Timeout**: stops jobs that exceed allowed runtime.
- **Technical Owner / Tenant / Client**: ownership and tenancy context.
- **Notification Recipients**: who receives execution updates.
- **Tags**: quick grouping labels.

## Validation Notes

Save is blocked until required fields are complete. Conditional fields (like cron or interval settings) must be provided when their schedule type is selected.
