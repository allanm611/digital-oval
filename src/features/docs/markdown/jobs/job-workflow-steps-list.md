---
title: Job Workflow Steps List
---


# Job Workflow Steps List

## Overview

The Job Workflow Steps List displays all steps in a job's workflow. From this page, you can manage workflow execution, configure steps, and build complex job procedures.

## Page Layout

### Statistics Cards
- Total Steps - Count of all steps in workflow
- Active Steps - Currently enabled steps
- Critical Steps - Steps marked as critical
- Parallel Steps - Steps configured for parallel execution

### Steps Table

Each step entry displays:
- Step Order - Execution sequence number
- Step Name - Display name
- Step Code - Unique identifier
- Step Type - Type of action (SQL, API, Script, etc.)
- Timeout - Maximum execution time
- Retry Count - Failure retry attempts
- Parallel - Whether step runs in parallel
- Critical - Whether step is critical
- Status - Active or Inactive
- Action Menu - Quick actions

## Filtering

### Search
- Type: Text input
- Function: Search by step name or code
- Real-time results update

### Step Type Filter
- SQL - Database queries
- Stored Proc - Stored procedures
- API Call - External APIs
- Python Script - Python code
- Node.js Script - Node.js code
- Shell Script - Shell commands
- File Transfer - File operations
- Data Validation - Data validation
- Notification - Alerts/messages
- Wait - Timing delays

### Status Filter
- Active - Currently enabled
- Inactive - Disabled steps

### Critical Only Filter
- Toggle to show only critical steps

### Parallel Only Filter
- Toggle to show only parallel steps

### Sort Options
- Step Order (Sequence)
- Step Name (A-Z)
- Step Type
- Timeout (Duration)
- Retry Count

## Actions

### Individual Step Actions

Click menu icon (⋮):

**View Details**
- Open step details page
- See full configuration

**Edit**
- Modify step settings
- Change type or action
- Update validation

**Duplicate**
- Create copy of step
- Useful for similar steps

**Delete**
- Remove step from workflow
- Confirmation required

### Bulk Actions

Select multiple steps to:
- Activate Multiple - Enable several steps
- Deactivate Multiple - Disable several steps
- Delete Multiple - Remove multiple steps
- Mark as Critical - Mark steps as critical

## Selection Mode

Header Checkbox - Select all visible
Individual Checkboxes - Select specific steps

## Reordering Steps

### Drag and Drop
- Drag steps to reorder
- Visual feedback during drag
- Automatic step order update

### Step Order
- Determines execution sequence
- Parallel steps can have same order
- Sequential steps increment order

## Pagination

- 20 steps per page
- Navigate between pages
- Total count displayed

## Workflow Visualization

### Step Flow Diagram
- Visual representation of workflow
- Shows sequential and parallel steps
- Highlights dependencies
- Color-coded by step type

## Common Tasks

### Add New Step
1. Click "Create Step" button
2. Fill in step details
3. Choose step type and action
4. Configure validation and error handling
5. Save step

### Edit Step Configuration
1. Find step in list
2. Click "Edit"
3. Modify settings
4. Save changes

### Reorder Steps
1. Drag step to new position
2. Drop in desired location
3. Step order updates automatically
4. Other steps adjust accordingly

### Duplicate Complex Step
1. Find step to duplicate
2. Click "Duplicate"
3. Copy created with new code
4. Modify as needed

### Mark Critical Steps
1. Select step
2. Mark as critical
3. Critical steps must succeed
4. Workflow aborts if critical step fails

### Configure Parallel Execution
1. Create multiple steps
2. Set same parallel_group_id
3. Steps run simultaneously
4. Better performance for independent operations

### Set Up Error Handling
1. Open step for editing
2. Choose on_failure_action
3. Options: Abort, Continue, Retry, Skip
4. Configure retry parameters if needed
5. Save configuration

