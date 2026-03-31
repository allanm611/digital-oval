---
title: View Job Dependency Details
---


# View Job Dependency Details

## Overview

The Job Dependency Details page displays complete information about a specific job dependency relationship.

## Page Layout

### Header
- Dependent Job Name - Job that depends
- Arrow or connector indicator
- Parent Job Name - Job that parent waits for
- Status indicator - Active/Inactive

## Information Sections

### Basic Information

**Dependent Job**
- Name and ID of waiting job
- Job that will wait for parent

**Parent Job**
- Name and ID of prerequisite job
- Job that must complete first

**Status**
- Active - Dependency is enforced
- Inactive - Dependency is ignored

**Created Date**
- When dependency was created

### Dependency Configuration

**Dependency Type**
- Blocking, Optional, Cross-Day, or Conditional

**Wait For Status**
- Any, Success, Completed, or Failure

**Max Wait Minutes**
- Maximum time to wait for parent
- "Unlimited" if not set

**Lookback Days**
- How many days back to look for parent execution

## Actions

### Edit
- Function: Open edit form
- Allows: Modify dependency settings

### View Parent Job
- Function: Navigate to parent job details
- Shows: Parent job configuration

### View Dependent Job
- Function: Navigate to dependent job details
- Shows: Dependent job configuration

### Deactivate/Activate
- Function: Toggle enforcement
- Active state: Shows Deactivate button
- Inactive state: Shows Activate button

### Delete
- Function: Remove dependency
- Requires: Confirmation
- Irreversible: Yes

## Related Information

### Parent Job Details
- Shows: Parent job configuration
- Link to: Parent job details page
- Actions: View parent execution history

### Dependent Job Details
- Shows: Dependent job configuration
- Link to: Dependent job details page
- Actions: View dependent execution history

### Other Dependencies
- Related dependencies for parent job
- Related dependencies for dependent job
- Full dependency network view

## Common Tasks

### Check Dependency Status
1. Open dependency details
2. Look at Status field
3. Verify Active or Inactive
4. Check configuration

### View Parent Job Configuration
1. Click "View Parent Job" button
2. See parent job settings
3. Check parent execution schedule
4. Verify parent is healthy

### View Dependent Job Configuration
1. Click "View Dependent Job" button
2. See dependent job settings
3. Check dependent job schedule
4. Verify dependent handles waiting

### Modify Dependency Settings
1. Click "Edit" button
2. Change dependency type if needed
3. Update wait status if needed
4. Adjust max wait minutes
5. Save changes

### Temporarily Disable Dependency
1. Click "Deactivate" button
2. Dependency no longer enforced
3. Dependent job runs independently
4. Can be reactivated later

### Remove Dependency
1. Click "Delete" button
2. Confirm deletion
3. Dependency is removed
4. Dependent job no longer waits

