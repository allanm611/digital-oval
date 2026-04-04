# Edit Scheduled Job

Edit Scheduled Job uses the same structure as create, but pre-fills current values.

## What Teams Usually Update

- schedule type and timing fields
- execution controls (priority, timeout, concurrency)
- owner/tenant metadata
- notifications and tags

## Field Meaning Reminder

- **Schedule fields** define when execution is attempted.
- **Execution controls** protect platform stability.
- **Status** determines whether the job can actively run.

## Save Behavior

Changes are validated and applied to the existing job definition.
