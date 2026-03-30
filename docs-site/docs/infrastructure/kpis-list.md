---
title: KPI List
---

import { EditButton } from '@site/src/components/EditButton';

# KPI List

## Overview

The KPI List displays all configured Key Performance Indicators. From this page, you can filter KPIs, view statistics, manage metrics, and access detailed KPI information.

## Page Layout

### Statistics Cards
Summary of KPI statistics:
- **Total KPIs** - Count of all configured KPIs
- **Active KPIs** - Enabled and operational
- **KPIs with PII** - Contain sensitive data
- **Recent Changes** - Recently modified KPIs

### Metric Type Distribution
Bar chart showing breakdown by metric type:
- Count metrics
- Sum metrics
- Average metrics
- Percentage metrics
- Ratio metrics
- Custom metrics

### Performance Status
Statistics by performance status:
- Healthy - KPIs calculating normally
- Warning - KPIs with issues
- Error - KPIs with failures

## Filtering KPIs

### Search
- **Type:** Text input
- **Function:** Search by KPI name or code
- **Real-time:** Results update as you type

### Metric Type Filter
- **Count** - Counting metrics
- **Sum** - Sum aggregations
- **Average** - Average calculations
- **Percentage** - Percentage metrics
- **Ratio** - Ratio comparisons
- **Custom** - Custom calculations
- **All** - Show all types

### Status Filter
- **Active** - Enabled KPIs
- **Inactive** - Disabled KPIs
- **Error** - KPIs with errors
- **All** - Show all statuses

### PII Filter
- **With PII** - Contains personal data
- **Without PII** - No personal data
- **All** - Show all KPIs

### Classification Filter
- **Public** - Public data
- **Internal** - Internal use
- **Confidential** - Sensitive data
- **Restricted** - Highly restricted
- **All** - Show all classifications

### Connection Profile Filter
- **Type:** Dropdown select
- **Function:** Filter by source connection
- **Usage:** Show only KPIs using specific profile

## KPI List

Each entry displays:
- **KPI Name** - Metric name
- **KPI Code** - Unique identifier
- **Metric Type** - Type of calculation
- **Status** - Active/Inactive/Error
- **Classification** - Data classification level
- **PII Indicator** - Shows if contains personal data
- **Current Value** - Latest metric value
- **Last Updated** - Most recent calculation
- **Action Menu** - Quick actions

## Actions

### Individual KPI Actions

Click the menu icon (⋮) on any KPI:

**View Details**
- Open KPI details page
- See full configuration

**Edit**
- Modify KPI settings
- Update calculation logic

**View Reports**
- See analytics and trends
- View historical values
- Compare periods

**Deactivate/Activate**
- Toggle KPI status
- Disable/enable without deleting

**Delete**
- Remove KPI (with confirmation)
- Irreversible action

### Bulk Actions

Select multiple KPIs to:
- **Activate Multiple** - Enable several KPIs
- **Deactivate Multiple** - Disable several KPIs
- **Delete Multiple** - Remove multiple KPIs

## Selection Mode

**Header Checkbox**
- Select all visible KPIs
- Deselect all KPIs
- Toggle selection

**Individual Checkboxes**
- Select specific KPIs
- Bulk actions appear when selected

## Search and Connection Filter

### Search KPIs
- Type KPI name or code
- Results filter in real-time
- Shows matching KPIs

### Filter by Connection Profile
- Select source connection
- Shows only KPIs using that profile
- Helps track data dependencies

## Sorting

**Available Sort Options**
- Name (A-Z)
- Created date
- Modified date
- Status
- Metric Type
- Current Value

## Pagination

- **15 KPIs per page**
- Navigate between pages
- Total count displayed

## Status Indicators

- **Active** - Calculating normally
- **Inactive** - Disabled KPI
- **Warning** - Issues detected
- **Error** - Calculation failed

## Classification Colors

- **Public** - Green
- **Internal** - Blue
- **Confidential** - Orange
- **Restricted** - Red

## PII Indicator

- **Has PII** - Contains personal data
- **No PII** - No personal data

## Common Tasks

### Find KPIs Using a Connection Profile
1. Select connection from Filter dropdown
2. View all KPIs using that profile
3. Monitor dependencies

### Filter by Metric Type
1. Click Metric Type Filter
2. Select desired type
3. View KPIs of that type

### Check Active KPIs
1. Click Status Filter
2. Select "Active"
3. Review operational KPIs

### Find PII KPIs
1. Click PII Filter
2. Select "With PII"
3. Ensure compliance

<EditButton docSlug="infrastructure/kpis-list" docTitle="KPI List" />
