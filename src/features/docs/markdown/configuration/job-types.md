# Job Types Overview

Job Types are categories used to classify and organize scheduled jobs. Each job type helps you group and identify jobs by function or purpose.

## What are Job Types?

Job Types allow you to:
- **Categorize Jobs** - Group jobs by function or purpose
- **Organize Scheduling** - Group related jobs together
- **Track Job Usage** - Monitor which jobs use each type

## Managing Job Types

Navigate to **Configuration → Job Types** to manage all job types.

### View Job Types List

The job types list displays all configured types with:
- **Name** - Job type identifier
- **Code** - Unique system code identifier
- **Description** - Additional details about the type
- **Created Date** - When the job type was created

You can:
- **Search** - Find job types by name, code, or description
- **View Usage Statistics** - See how many jobs use each type

### Create Job Type

Click the **Create Job Type** button to add a new job type.

**Required Fields:**
- **Name** - The name of the job type (max 255 characters)
- **Code** - Unique system identifier (max 100 characters)
  - Must start with a lowercase letter (a-z)
  - Can only contain lowercase letters, numbers (0-9), and underscores (_)
  - No spaces or special characters
  - Example: `data_import`, `report_generation`, `daily_cleanup`

**Optional Fields:**
- **Description** - Explain the purpose of this job type (max 500 characters)

Click **Save** to create the job type.

### Edit Job Type

Click **Edit** on any job type to update:
- Name
- Code
- Description

Click **Save** to apply changes.

### Delete Job Type

Click **Delete** to remove a job type. The job type will be permanently removed from the system.

## Using Job Types

When creating a scheduled job, you select a job type to categorize and organize the job.
