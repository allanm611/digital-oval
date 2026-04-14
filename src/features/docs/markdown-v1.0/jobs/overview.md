# Job Management Overview

Job Management is where teams define what runs, when it runs, how steps depend on each other, and how execution results are tracked.

In the app, the `/dashboard/jobs` entry route opens the Scheduled Jobs experience, then other job pages are used for type setup, workflow design, dependency control, and runtime monitoring.

## Main Areas

- **Scheduled Jobs**: job definitions and schedules
- **Job Executions**: runtime history and status
- **Job Types**: reusable job classification
- **Job Dependencies**: prerequisite relationships between jobs
- **Job Workflow Steps**: step-by-step logic within jobs
- **Job Workflows**: workflow-level grouping and lifecycle

## Why This Module Matters

This area keeps operations predictable. You can control execution behavior, monitor health, and troubleshoot failures using one connected set of pages.

## How The Flow Works In Practice

- Define reusable categories in **Job Types**.
- Create orchestration patterns in **Job Workflows** and **Job Workflow Steps**.
- Configure runtime jobs in **Scheduled Jobs**.
- Track outcomes in **Job Executions**.
- Use dependency rules to prevent downstream jobs from running before prerequisites are satisfied.

## Related Pages

- [Scheduled Jobs](/documentation/jobs/scheduled-jobs)
- [Job Executions](/documentation/jobs/job-executions)
- [Job Workflow Steps](/documentation/jobs/job-workflow-steps)
- [Job Workflows](/documentation/jobs/job-workflows)
