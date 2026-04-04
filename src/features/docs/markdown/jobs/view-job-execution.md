# View Job Execution

Job Execution Details is the deep-dive page for one execution record.

## What You See

- execution identity and status
- start/end timing and total duration
- error messages and error context fields
- resource/data metrics (memory, CPU, rows)
- step-progress information

## Key Fields Explained

- **Error Code / Error Step ID**: points to where failure occurred.
- **Rows Read/Processed/Inserted/Updated/Deleted**: data movement footprint.
- **Peak Memory / CPU**: runtime resource profile.
- **Steps Completed / Failed**: workflow progression status.

## Actions

Depending on state and permissions: **Abort**, **Retry**, and **Archive** actions may be available.
