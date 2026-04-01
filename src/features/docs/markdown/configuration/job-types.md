# Job Types

## Overview

Job Types are categories used to classify and organize scheduled jobs in your system. They provide a way to group jobs by function or purpose, making it easier to manage, filter, and report on your jobs. Job types are fully customizable and can be created based on your organization's specific needs.

## Purpose & Benefits

### Why Use Job Types?

**Better Organization**
- Categorize jobs by function (import, export, cleanup, etc.)
- Group related jobs together
- Create a taxonomy of your job operations

**Improved Discoverability**
- Find jobs easily by type
- Filter job lists by category
- Identify all jobs of a specific type

**Type-Specific Management**
- Create type-specific metrics and reports
- Track performance by job type
- Monitor usage patterns by category

**Template-Based Workflow**
- Use types as conceptual templates
- Standardize similar job configurations
- Maintain consistency across jobs

### Key Benefits

- **Organization:** Clear categorization of all your jobs
- **Filtering:** Quick access to jobs by type
- **Reporting:** Metrics and analytics by job type
- **Scalability:** Manage growing numbers of jobs efficiently
- **Flexibility:** Fully customizable job type definitions

---

## Common Job Types

While job types are fully customizable, here are common examples used in CVM systems:

### Data Operations

**Data Import**
- ETL and data ingestion jobs
- File uploads and data loads
- Integration data imports
- Bulk customer imports

**Data Export**
- Data extraction from system
- File generation and exports
- Integration data exports
- Report data exports

**Data Cleanup**
- Maintenance and housekeeping jobs
- Database cleanup and optimization
- Duplicate removal
- Data validation and correction

### Analytics & Reporting

**Report Generation**
- Business report creation
- Scheduled reporting jobs
- Analytics calculations
- Dashboard data refreshes

**Analytics Processing**
- Data analysis jobs
- Metric calculations
- Trend analysis
- Performance analytics

### Integration & Synchronization

**Integration**
- Third-party system integration
- Data synchronization
- API synchronization
- External service calls

**Backup & Recovery**
- Data backup jobs
- System snapshots
- Recovery operations
- Archive creation

### Notifications & Communication

**Notification**
- Alert and notification jobs
- Email dispatching
- SMS sending
- Customer notifications

---

## Job Type Properties

### Core Fields

**Name**
- Display name of the job type
- Human-readable identifier
- Examples: "Data Import", "Report Generation", "Data Cleanup"
- Required, 1-255 characters

**Code**
- Unique system identifier
- Alphanumeric with underscores only
- Lowercase snake_case format
- Must start with a letter
- Used for API references and automation
- Examples: `data_import`, `report_generation`, `data_cleanup`
- Required, 1-100 characters
- Must be unique across all job types

**Description**
- Optional explanation of the job type's purpose
- Helps team members understand the type's use
- Examples: "ETL processes for importing customer data", "Monthly report generation jobs"
- Optional, up to 500 characters

**Created At**
- Timestamp when the job type was created
- System-generated, read-only
- Useful for audit trails and tracking

### Code Format Rules

The code field follows strict naming conventions:

**Requirements:**
- Must start with a letter (a-z)
- Can contain letters, numbers, and underscores
- Must be lowercase
- No spaces or special characters allowed
- Must be unique (no duplicates)

**Valid Examples:**
- `data_import`
- `report_generation`
- `data_cleanup`
- `etl_process_1`
- `customer_sync`

**Invalid Examples:**
- `Data Import` (contains space)
- `1_data_import` (starts with number)
- `DATA_IMPORT` (contains uppercase)
- `data-import` (contains hyphen)
- `data import` (contains space)

---

## Creating Job Types

### Step-by-Step Guide

**Step 1: Access Job Types**
- Navigate to Configuration
- Select "Job Types" from the configuration menu
- Click "Create Job Type" button

**Step 2: Enter Job Type Details**

Fill in the following fields:

1. **Name** (Required)
   - Enter a clear, descriptive name
   - Example: "Data Import"

2. **Code** (Required)
   - Enter the unique system code
   - Use lowercase snake_case format
   - Example: `data_import`
   - System will validate uniqueness in real-time

3. **Description** (Optional)
   - Add context about this job type's purpose
   - Example: "ETL processes for importing customer data"

**Step 3: Save**
- Click "Create Job Type" button
- System validates all fields
- New job type is added to your configuration

### Code Validation

The system provides real-time validation for the code field:

- **Uniqueness Check:** Validates no duplicate code exists (with 500ms debounce)
- **Format Check:** Validates snake_case format and character rules
- **Error Display:** Shows clear error messages for invalid codes
- **Real-time Feedback:** Validation happens as you type

---

## Managing Job Types

### Viewing Job Types

**Job Types List**
- Access main Job Types page to see all configured types
- View summary information: Name, Code, Description, Created Date
- See count of jobs using each type

**Filtering & Search**
- Search by name, code, or description
- Server-side search with debouncing for performance
- Results update as you type

**Statistics**
- **Total Job Types:** Count of all configured job types
- **Active Job Types:** Count of types with associated jobs
- **Unused Job Types:** Count of types with no jobs

### Editing Job Types

**Update Existing Job Type**

1. Locate the job type in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Name can be changed freely
   - Code cannot be changed (to preserve job references)
   - Description can be added or updated
4. Click "Save" to update

**What Can Be Changed:**
- Name (display name)
- Description (purpose explanation)

**What Cannot Be Changed:**
- Code (unique system identifier - to prevent breaking job references)

### Deleting Job Types

**Delete Job Type**

1. Locate the job type in the list
2. Click the "Delete" action button
3. Confirm deletion in the confirmation dialog
4. Job type is removed from the system

**Deletion Rules:**
- Can only delete job types with no associated jobs
- If jobs reference a job type, deletion will fail
- System prevents accidental deletion of in-use types
- Error message indicates jobs preventing deletion

**Before Deleting:**
- Ensure no scheduled jobs use this type
- Review usage statistics to identify dependent jobs
- Consider archiving instead of deleting for historical tracking

---

## Using Job Types

### In Scheduled Jobs

Job types are referenced when creating or editing scheduled jobs:

**Selection During Job Creation**
1. When setting up a new scheduled job
2. Choose the appropriate job type from dropdown
3. Job type helps categorize and organize the job
4. Job type appears in job management and reporting

**Job Type Reference**
- Each job has a `job_type_id` field
- Stores the ID of the associated job type
- Used for filtering and organization
- Displayed in job lists and details

### In Job Management

**Filtering by Type**
- View all jobs of a specific type
- Create type-specific reports
- Monitor type-specific metrics
- Organize job schedules by type

**Type-Based Organization**
- Group jobs in dashboards
- Create type-specific automation rules
- Set type-specific resource limits
- Monitor type-specific performance

---

## Best Practices

### Naming Conventions

**Consistent Naming**
- Use clear, descriptive names
- Use present tense verbs (e.g., "Data Import" not "Data Imported")
- Be consistent across job types

**Code Standards**
- Use meaningful codes (not single letters or random strings)
- Use snake_case consistently
- Keep codes reasonably short but descriptive
- Document code meaning in description

**Examples:**

**✅ Good** - Data Import - `data_import` - ETL processes for importing customer data


**✅ Good** - Report Generation - `report_generation` - Monthly and on-demand business reports


**❌ Poor** - DI - `di` - Too vague


**❌ Poor** - Import Customer Data From File - `import_customer_data_from_file` - Name too long


### Organization Strategy

**By Function**
- Group types by what the job does (Import, Export, Report)
- Organize around business processes
- Create clear functional categories

**By Frequency**
- Separate one-time jobs from recurring
- Group daily, weekly, monthly types together
- Makes scheduling and monitoring easier

**By Department**
- Create types per department or team
- Prefix with department name if needed
- Example: `hr_import`, `finance_report`, `marketing_sync`

**By System**
- Group types by source/destination system
- Example: `salesforce_sync`, `erp_import`, `warehouse_export`

### Maintenance

**Regular Review**
- Periodically review configured job types
- Identify unused types
- Clean up obsolete types
- Keep taxonomy current

**Documentation**
- Maintain clear description for each type
- Document purpose and use cases
- Keep team aligned on type usage
- Update when purpose changes

**Scaling**
- Plan job type structure as you grow
- Avoid creating too many similar types
- Consolidate related types when appropriate
- Review organization as system expands

---

## Common Use Cases

### Use Case 1: Organization by Process

**Scenario:** Manufacturing company with multiple data operations

**Job Types Created:**
- `inventory_import` - Import inventory from warehouse system
- `sales_export` - Export sales data to analytics system
- `production_sync` - Sync production data with ERP
- `report_generation` - Generate monthly business reports
- `data_cleanup` - Clean and validate data nightly

**Benefit:** Easy to find all jobs related to specific process

### Use Case 2: Organization by System

**Scenario:** Multi-system integration environment

**Job Types Created:**
- `salesforce_sync` - Salesforce data synchronization
- `erp_import` - ERP system imports
- `warehouse_export` - Data warehouse exports
- `crm_integration` - CRM system integration
- `api_sync` - External API synchronization

**Benefit:** Identify all jobs connected to specific system

### Use Case 3: Organization by Frequency

**Scenario:** Varying job execution schedules

**Job Types Created:**
- `daily_operations` - Run every morning
- `weekly_reports` - Run every Monday
- `monthly_closeout` - Run on last day of month
- `quarterly_analysis` - Run quarterly
- `annual_audit` - Run annually
- `ad_hoc_imports` - Run as needed

**Benefit:** Understand system load and scheduling patterns

### Use Case 4: Organization by Department

**Scenario:** Multi-department organization

**Job Types Created:**
- `hr_payroll_import` - HR payroll data
- `finance_reconciliation` - Finance reconciliation
- `marketing_list_export` - Marketing list exports
- `operations_cleanup` - Operations data cleanup
- `executive_reporting` - Executive reports

**Benefit:** Each department manages their own job types

---

## Troubleshooting

### Cannot Create Job Type

**Error: "Code already exists"**
- Solution: Choose a unique code that doesn't exist
- Check: Search for existing job types with similar codes
- Resolution: Append a number or modify code format

**Error: "Invalid code format"**
- Solution: Ensure code uses snake_case format
- Check: Code must start with letter, contain only a-z, 0-9, underscore
- Resolution: Correct code format before saving

**Error: "Name is required"**
- Solution: Enter a name for the job type
- Check: Name field cannot be empty
- Resolution: Provide a descriptive name

### Cannot Delete Job Type

**Error: "Cannot delete job type with associated jobs"**
- Cause: One or more jobs reference this job type
- Solution: Delete or reassign jobs to different job type first
- Steps:
  1. Find jobs using this type
  2. Delete jobs or change their job type
  3. Then delete the job type

**Prevention:**
- Review usage statistics before deletion
- Consider deactivating instead of deleting
- Keep history of job types used

### Code Not Validating

**Issue: Code validation appears stuck**
- Cause: Real-time validation has debounce (500ms delay)
- Solution: Wait a moment for validation to complete
- Alternative: Re-check code format manually

---

