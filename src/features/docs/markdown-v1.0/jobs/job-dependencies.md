# Job Dependencies

Job Dependencies defines prerequisite relationships between jobs.

## Open The Page

Go to `Jobs -> Job Dependencies`.

## What You Manage Here

- which job waits for which upstream job
- what completion status is required
- how long a dependent job should wait
- whether dependency is active

![Job dependencies list page](/img/jobmanagement-images/jobdepencieslistpage.png)

## Core Field Meaning

- **Job ID**: target job that is waiting.
- **Depends On Job ID**: upstream job it waits for.
- **Dependency Type**: behavior class (blocking/optional/cross-day/conditional).
- **Wait For Status**: required upstream outcome before continuing.
- **Max Wait Minutes**: timeout for dependency wait.
- **Lookback Days**: historical dependency lookup window.

![Job dependency details page](/img/jobmanagement-images/jobdepencydetails.png)

## Related Pages

- [Job Dependencies List](/documentation/jobs/job-dependencies-list)
- [Create Job Dependency](/documentation/jobs/create-job-dependency)
- [View Job Dependency](/documentation/jobs/view-job-dependency)
- [Job Dependencies Analytics](/documentation/jobs/job-dependencies-analytics)
