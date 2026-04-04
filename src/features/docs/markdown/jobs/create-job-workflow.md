# Create Job Workflow

Create Job Workflow adds a new workflow record.

The frontend uses one form page for both create and edit:

- Create route: `/dashboard/workflows/create`
- Edit route: `/dashboard/workflows/:id/edit`

## Required Fields

- **Name**

![Create job workflow form](/img/jobmanagement-images/createworkflowimage.png)

![Create job workflow form - part 1](/img/jobmanagement-images/createjobworkflowimage1.png)

## Optional Fields

- **Description**
- **Workflow Type**
- **Is Active**

![Create job workflow form - part 2](/img/jobmanagement-images/createjobworkflowimage2.png)

## Field Meaning

- **Name** should clearly identify the orchestration purpose.
- **Workflow Type** helps classify usage and filtering.
- **Is Active** controls whether workflow is operationally enabled.

## Related Pages

- [Job Workflows List](/documentation/jobs/job-workflows-list)
- [View Job Workflow](/documentation/jobs/view-job-workflow)
- [Workflows Analytics](/documentation/jobs/workflows-analytics)
