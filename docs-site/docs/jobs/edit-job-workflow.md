---
title: Edit Job Workflow
---

import { EditButton } from '@site/src/components/EditButton';

# Edit Job Workflow

## Overview

The Edit Job Workflow form allows you to modify an existing workflow. You can update basic information, add/remove/reorder steps, and adjust workflow configuration.

## Accessing Edit Form

1. Navigate to Job Management > Job Workflows
2. Find the workflow you want to edit
3. Click on the workflow to open details
4. Click "Edit" button in the top-right corner

Or from workflow list:
1. Click menu icon (⋮) on the workflow
2. Select "Edit"

## Form Fields

All fields are the same as Create Job Workflow with the following notes:

### Non-Editable Fields
- Workflow Code - Cannot change after creation
- Created Date - System managed
- Created By - System managed

### Editable Fields
- Workflow Name
- Description
- Workflow Type
- Status

## Making Changes

### Change Workflow Name
1. Click in the Name field
2. Update the text
3. Name updates in lists and references

### Update Description
1. Modify description text area
2. Explain what workflow does
3. Document any changes

### Change Workflow Type
1. Select different type
2. Affects categorization
3. Used for filtering and organization

### Update Status
1. Change to Draft or Active
2. Draft allows configuration changes
3. Active means workflow is ready

## Managing Workflow Steps

### Add New Step
1. Click "Add Step" button
2. Configure step details
3. Set execution properties
4. Save step

### Edit Existing Step
1. Click on step
2. Modify properties
3. Update configuration
4. Save changes

### Remove Step
1. Click step menu
2. Select delete option
3. Confirm removal
4. Step removed from workflow

### Reorder Steps
1. Drag step to new position
2. Drop in desired location
3. Order updates automatically
4. Workflow saves changes

### Configure Step Dependencies
1. Open step configuration
2. Set depends_on_steps field
3. Specify prerequisite steps
4. Step waits for dependencies

### Adjust Execution Settings
1. Set parallel_execution flag
2. Set parallel_group_id for grouped steps
3. Configure timeout
4. Set retry count and delay

## Validation Configuration

### Pre-Validation
1. Set pre_validation_query if needed
2. Query runs before step
3. Can block step execution
4. Validates data readiness

### Post-Validation
1. Set post_validation_query if needed
2. Query runs after step
3. Validates step results
4. Checks data quality

### Row Count Validation
1. Set expected_row_count_min
2. Set expected_row_count_max
3. Triggers validation if out of range
4. Ensures data integrity

## Failure Handling Configuration

### Step Failure Actions
1. Set on_failure_action for each step
2. Options: Abort, Continue, Retry, Skip
3. Abort stops entire workflow
4. Continue allows partial success

### Critical Steps
1. Mark critical steps with is_critical flag
2. Failure of critical step aborts workflow
3. Non-critical steps can fail gracefully
4. Use for essential steps

### Retry Configuration
1. Set retry_count for automatic retries
2. Set retry_delay between attempts
3. Exponential backoff possible
4. Configure for unreliable steps

## Saving Changes

### Save Button
- All changes saved to database
- Form validates configuration
- Error messages shown if validation fails

### Validation

Before saving, system checks:
- Workflow name is provided
- No circular dependencies in steps
- All step codes are unique
- Timeout values are reasonable
- Required step fields are filled

### Success

After successful save:
1. Changes take effect immediately
2. Workflow updated in database
3. Confirmation message shown
4. Redirect to workflow details
5. Changes available to jobs using workflow

## Error Handling

### Validation Errors
- Missing workflow name - Provide name
- Duplicate step codes - Make codes unique
- Circular dependencies - Remove circular references
- Invalid timeout - Provide reasonable value

### Server Errors
- Workflow not found - May have been deleted
- Insufficient permissions - Contact administrator
- Conflict - Workflow modified elsewhere

## Reverting Changes

### Cancel Button
- Discard all unsaved changes
- Return to workflow details page
- No confirmation required if no changes

### Before Saving
- Any modifications not saved are lost
- Return to previous state

## Common Update Scenarios

### Adding Steps to Workflow
1. Edit the workflow
2. Click "Add Step"
3. Configure new step
4. Insert in correct position
5. Save workflow

### Reordering Workflow Steps
1. Edit the workflow
2. Drag steps to new positions
3. Verify new order is correct
4. Save changes

### Fixing Failed Step
1. Edit the workflow
2. Find problematic step
3. Adjust configuration
4. Update timeout if needed
5. Add validation if appropriate
6. Save changes

### Improving Error Handling
1. Edit the workflow
2. Set on_failure_action for steps
3. Configure retry for flaky steps
4. Mark critical steps
5. Save configuration

### Adding Validation
1. Edit the workflow
2. Add pre_validation_query if needed
3. Add post_validation_query if needed
4. Set row count expectations
5. Save changes

### Optimizing Performance
1. Edit the workflow
2. Identify independent steps
3. Set parallel execution for groups
4. Adjust timeout values
5. Remove unnecessary steps
6. Save changes

## After Editing

### Immediate Effects
- Changes take effect immediately
- Workflow updated in database
- Jobs using workflow see changes
- Next execution uses new configuration

### Testing Changes
1. Return to workflow details
2. Run test execution
3. Monitor results
4. Verify changes work correctly
5. Check performance

### Confirming Changes
- Visit workflow details page
- Verify all updated values
- Review step configuration
- Check execution order

## Tips

- Test workflow after major changes
- Verify step dependencies are correct
- Document why changes were made
- Monitor first execution after changes
- Backup complex workflows
- Use meaningful step names
- Keep related steps grouped
- Document step purposes in descriptions
- Validate after transformations
- Plan error handling upfront

<EditButton docSlug="jobs/edit-job-workflow" docTitle="Edit Job Workflow" />
