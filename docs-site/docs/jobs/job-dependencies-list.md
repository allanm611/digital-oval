---
title: Job Dependencies List
---

import { EditButton } from '@site/src/components/EditButton';

# Job Dependencies List

## Overview

The Job Dependencies List displays all job dependency relationships. From this page, you can manage job orchestration and view dependency networks.

## Page Layout

### Statistics Cards
- Total Dependencies - Count of all relationships
- Active Dependencies - Currently enforced dependencies
- Blocking Dependencies - Critical path dependencies
- Cross-Day Dependencies - Multi-day workflow dependencies

### Dependencies Table

Each dependency entry displays:
- Dependent Job - Job that depends on another
- Parent Job - Job that must complete first
- Dependency Type - Blocking, Optional, Cross-Day, Conditional
- Wait For Status - What status to wait for
- Max Wait - Maximum wait time in minutes
- Lookback Days - Days to look back for parent
- Status - Active or Inactive
- Created - When dependency was created
- Action Menu - Quick actions

## Filtering

### Search
- Type: Text input
- Function: Search by job name
- Real-time results update

### Active Only Filter
- Toggle to show only active dependencies
- Hide inactive relationships

### Dependency Type Filter
- Blocking - Parent must succeed
- Optional - Parent failure doesn't block
- Cross-Day - Previous day dependencies
- Conditional - Condition-based

### Status Filter
- Active - Currently enforced
- Inactive - Disabled dependencies

### Sort Options
- Dependent Job Name (A-Z)
- Parent Job Name (A-Z)
- Created Date (Newest/Oldest)
- Type
- Status

## Actions

### Individual Dependency Actions

Click menu icon (⋮):

**View Details**
- Open dependency details page
- See full configuration

**Edit**
- Modify dependency settings
- Change type or wait status
- Update max wait time

**View Parent Job**
- Navigate to parent job details
- Check parent configuration

**View Dependent Job**
- Navigate to dependent job details
- Check dependent configuration

**Deactivate/Activate**
- Toggle dependency enforcement
- Disable without deleting

**Delete**
- Remove dependency relationship
- Confirmation required

### Bulk Actions

Select multiple dependencies to:
- Activate Multiple - Enable several dependencies
- Deactivate Multiple - Disable several dependencies
- Delete Multiple - Remove multiple relationships

## Selection Mode

Header Checkbox - Select all visible
Individual Checkboxes - Select specific dependencies

## Pagination

- 20 dependencies per page
- Navigate between pages
- Total count displayed

## Common Tasks

### Find All Dependencies for a Job
1. Enter job name in search
2. View all dependencies for that job
3. Analyze dependency network

### Create New Dependency
1. Click "Create Dependency" button
2. Select dependent and parent jobs
3. Choose dependency type
4. Configure wait status
5. Save dependency

### Disable Dependency Temporarily
1. Find dependency in list
2. Click "Deactivate"
3. Dependency no longer enforced
4. Can be reactivated later

### View Job Network
1. Click dependent job name
2. See all dependencies affecting it
3. Trace back to parent jobs
4. Understand full workflow

### Modify Wait Time
1. Click "Edit"
2. Change max wait minutes
3. Update lookback days if needed
4. Save changes

<EditButton docSlug="jobs/job-dependencies-list" docTitle="Job Dependencies List" />
