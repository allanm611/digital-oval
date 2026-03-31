---
title: View Job Workflow Details
---


# View Job Workflow Details

## Overview

The Job Workflow Details page displays complete information about a specific workflow and its configuration.

## Page Layout

### Header
- Workflow Name - Display name
- Workflow Code - Unique identifier
- Status Badge - Active/Draft/Paused/Archived
- Action Menu - Additional options

## Information Sections

### Basic Information

**Name**
- Display name of the workflow

**Code**
- Unique workflow identifier

**Status**
- Active, Draft, Paused, or Archived

**Description**
- Detailed explanation of workflow purpose

**Workflow Type**
- Category type of workflow

### Metadata

**Created**
- Date and time workflow was created

**Created By**
- User who created the workflow

**Modified**
- Date and time of last modification

**Modified By**
- User who last modified the workflow

## Workflow Steps Section

### Steps Summary
- Total number of steps
- Step execution order
- Parallel execution groups

### Steps Table

For each step displays:
- Step Order - Execution sequence
- Step Name - Step display name
- Step Type - Type of action
- Timeout - Maximum execution time
- Retry Count - Failure retry attempts
- Critical - Whether step is critical
- Status - Active/Inactive

### Step Details
Click on any step to see:
- Full step configuration
- Execution settings
- Validation rules
- Error handling
- Dependencies

## Actions

### Edit
- Function: Open edit form
- Allows: Modify workflow details

### Manage Steps
- Function: Add/remove/reorder steps
- Shows: Step management interface
- Allows: Configure step properties

### Clone
- Function: Create copy of workflow
- Result: New workflow with similar configuration
- Use: Quickly create similar workflows

### Activate/Deactivate
- Function: Toggle workflow status
- Active state: Shows Deactivate button
- Inactive state: Shows Activate button

### Test Workflow
- Function: Run workflow execution
- Shows: Execution results and performance
- Use: Verify workflow before production

### View Analytics
- Function: Performance visualization
- Shows: Execution history and metrics

### Archive
- Function: Mark as no longer in use
- Note: Retained for history

### Delete
- Function: Permanently remove workflow
- Requires: Confirmation
- Warning: Cannot undo

## Workflow Execution

### Using in Jobs
- Assign workflow to scheduled job
- Workflow executes per job schedule
- View job executions for results

### Manual Execution
- Test workflow before scheduling
- Verify step configuration
- Check performance metrics

## Step Management

### View Step Details
- Click any step in list
- See full configuration
- Review timeout and retry settings

### Add Step
- Click "Add Step" button
- Configure step properties
- Insert at specific position

### Edit Step
- Click step row
- Modify configuration
- Save changes

### Reorder Steps
- Drag steps to new position
- Drop in desired location
- Order updates automatically

### Delete Step
- Click step menu
- Select delete option
- Confirm deletion

### Configure Dependencies
- Set prerequisites for steps
- Specify which steps must complete first
- Create execution order

## Related Workflows

### Jobs Using This Workflow
- List of jobs that use this workflow
- View job configurations
- Monitor job executions

### Similar Workflows
- Other workflows of same type
- View for comparison
- Clone if needed

## Common Tasks

### View Complete Workflow
1. Open workflow details
2. Review description
3. View all steps
4. Check step configuration
5. Review execution settings

### Add New Step
1. Open workflow
2. Click "Add Step"
3. Configure step properties
4. Set execution parameters
5. Save step

### Edit Step Configuration
1. Click on step
2. Modify properties
3. Update timeout or retry
4. Save changes

### Reorder Workflow Steps
1. Drag step to new position
2. Drop in correct location
3. Workflow order updates
4. Save workflow

### Test Workflow Execution
1. Click "Test Workflow" or similar action
2. Monitor execution
3. Review results
4. Check performance metrics
5. Make adjustments if needed

### Clone Workflow
1. Click "Clone" button
2. Provide new name
3. New workflow created
4. Modify steps as needed
5. Save changes

### Assign to Job
1. Go to scheduled job
2. Select this workflow
3. Configure job schedule
4. Activate job
5. Job executes workflow per schedule

