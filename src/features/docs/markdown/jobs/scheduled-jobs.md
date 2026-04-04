# Scheduled Jobs

Scheduled Jobs is the operational hub for defining and managing recurring or triggered jobs.

## Open The Page

Go to `Dashboard -> Jobs -> Scheduled Jobs`.

## What You Manage Here

- job identity and ownership
- schedule behavior (manual, cron, interval, event, dependency)
- execution controls (priority, timeout, concurrency)
- notification recipients and tags

## Core Field Meaning

- **Name / Code**: human label and stable identifier.
- **Job Type**: business/technical class of the job.
- **Schedule Type**: when the job should run.
- **Priority**: relative execution importance.
- **Max Concurrent Executions**: parallel run cap.
- **Execution Timeout**: max allowed run time.
- **Status**: active, paused, draft, or archived lifecycle.
