---
title: Job Types List
---

import { EditButton } from '@site/src/components/EditButton';

# Job Types List

## Overview

The Job Types List displays all configured job types. From this page, you can manage job type categories and view statistics.

## Page Layout

### Statistics Cards
- **Total Types** - Count of all job types
- **Active Types** - Types with associated jobs
- **Total Jobs** - Count of all jobs across types

### Job Types Table

Each type entry displays:
- **Type Name** - Display name of job type
- **Type Code** - Unique identifier
- **Description** - Purpose and usage
- **Job Count** - How many jobs use this type
- **Created** - When type was created
- **Action Menu** - Quick actions

## Filtering

### Search
- **Type:** Text input
- **Function:** Search by type name or code
- **Real-time:** Results update as you type

### Sort Options
- Name (A-Z)
- Job Count (Most/Least)
- Created Date (Newest/Oldest)

## Actions

### Individual Type Actions

Click menu icon (⋮):

**View Details**
- Open type details page
- See type information

**Edit**
- Modify type name/description
- Update type configuration

**View Jobs**
- See all jobs of this type
- Navigate to job list filtered by type

**Delete**
- Remove type (if no jobs use it)
- Confirmation required

### Create New Type
- **Button:** Create Type
- Opens create form
- Define new job type category

## Pagination

- **20 types per page**
- Navigate between pages
- Total count displayed

## Common Tasks

### Find Jobs of Type
1. Click type in list
2. Select "View Jobs"
3. See all jobs using type

### Create New Type
1. Click "Create Type" button
2. Fill in name and code
3. Add description
4. Save type

### Search for Type
1. Type name in search box
2. Results filter in real-time
3. Click type for details

<EditButton docSlug="jobs/job-types-list" docTitle="Job Types List" />
