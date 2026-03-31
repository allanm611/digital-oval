---
title: Create Job Workflow
---


# Create Job Workflow

## Overview

The Create Job Workflow form allows you to define a new workflow. Configure the workflow basics and add steps to create a complete job procedure.

## Form Fields

### Workflow Name*
Type: Text input
Required: Yes
- Display name for the workflow
- Examples: "Daily Data Sync", "Customer Report Generation"
- Used in lists and job references
- 1-255 characters

### Workflow Code*
Type: Text input
Required: Yes
- Unique identifier for the workflow
- Alphanumeric with underscores (e.g., "daily_sync", "cust_report")
- Used in APIs and references
- Cannot be changed after creation

### Workflow Type
Type: Dropdown select
Optional
- Category for the workflow
- Examples: ETL, Reporting, Integration, Maintenance, Analytics
- Helps organize workflows by purpose

### Description
Type: Text area
Optional
- Detailed explanation of workflow purpose
- What the workflow does
- When it runs and why
- Usage guidelines

### Initial Status
Type: Dropdown select
Default: Draft
- Draft - Configure before activating
- Active - Ready to use immediately

## After Creating

After successful creation:
1. Workflow created in specified status
2. Appears in workflow list
3. Ready to add steps
4. Next steps:
   - Add workflow steps
   - Configure step execution
   - Test workflow
   - Activate if in Draft status

## Adding Steps to Workflow

### Create Workflow First
1. Fill in basic information
2. Create workflow
3. Open workflow for editing
4. Add steps from details page

### Step Configuration
1. Open workflow details
2. Click "Add Step" button
3. Configure step properties
4. Reorder steps as needed
5. Set up dependencies

### Step Details
For each step you'll configure:
- Step name and code
- Step type (SQL, API, Script, etc.)
- Step action (query, endpoint, code)
- Execution settings
- Timeout and retry
- Error handling
- Validation rules

## Validation Rules

- Workflow Name - Required, 1-255 characters
- Workflow Code - Required, alphanumeric/underscores, unique
- Description - Optional, up to 1000 characters

## Common Workflows

### ETL Workflow
1. Validate input data
2. Extract from source
3. Transform data
4. Load to destination
5. Verify results

### Reporting Workflow
1. Fetch data from sources
2. Calculate metrics
3. Format report
4. Generate output
5. Distribute report

### Integration Workflow
1. Prepare data
2. Call external API
3. Handle response
4. Transform if needed
5. Store results

### Maintenance Workflow
1. Identify old data
2. Archive if needed
3. Delete old records
4. Optimize tables
5. Generate summary

## Best Practices

### Naming
- Use clear, descriptive names
- Include workflow purpose in name
- Use consistent naming patterns
- Make codes readable

### Organization
- Group related steps logically
- Keep workflows focused on single purpose
- Use meaningful step names
- Document step purposes

### Error Handling
- Plan for step failures
- Configure appropriate retry logic
- Define error handling steps
- Set critical step markers

### Validation
- Validate before critical steps
- Validate after transformations
- Check data quality
- Set row count expectations

### Documentation
- Write clear descriptions
- Document expected inputs
- Document expected outputs
- Explain complex logic

