# Create Job Dependency

Create Job Dependency adds a new dependency rule between two jobs.

## Required Fields

- **Job ID**
- **Depends On Job ID** (must be different from Job ID)

![Create job dependency form](/img/jobmanagement-images/createjobdepency.png)

## Optional / Config Fields

- **Dependency Type**
- **Wait For Status**
- **Max Wait Minutes**
- **Lookback Days**
- **Active** toggle

## Validation Notes

- both job IDs are required
- a job cannot depend on itself
- max wait and lookback values must stay within allowed numeric limits

The edit flow uses the same field structure with existing values pre-filled.

![Edit job dependency form](/img/jobmanagement-images/editjobdependency.png)

## Related Pages

- [Job Management Overview](/documentation/jobs/overview)
- [Scheduled Jobs](/documentation/jobs/scheduled-jobs)
- [Job Executions](/documentation/jobs/job-executions)
- [Job Workflows](/documentation/jobs/job-workflows)
