---
title: View KPI Details
---

import { EditButton } from '@site/src/components/EditButton';

# View KPI Details

## Overview

The KPI Details page displays complete information about a specific Key Performance Indicator. From here, you can view configuration details, monitor calculation status, access reports, and perform various KPI management actions.

## Page Layout

### Header
- **KPI Name** - Display name
- **Current Value** - Latest metric value
- **Status Badge** - Active/Inactive indicator
- **Action Menu** - Additional options

## Information Sections

### Basic Information

**Name**
- Display name of the KPI

**Code**
- Unique KPI identifier

**Status**
- Active - KPI is operational
- Inactive - KPI is disabled

**Description**
- Detailed explanation of the KPI

### Metric Configuration

**Metric Type**
- Count, Sum, Average, Percentage, Ratio, or Custom

**Measurement Unit**
- Unit of measurement (%, $, days, etc.)

**Display Decimal Places**
- Number of decimal places shown

**Current Value**
- Latest calculated metric value
- Timestamp of most recent calculation

### Data Source

**Connection Profile**
- Source connection used for calculation
- Shows profile name and code

**Data Entity**
- Table or data entity being measured

**Filter Conditions**
- WHERE clause conditions applied
- Shows filtering logic

### Calculation Logic

**Aggregation Column**
- Column being aggregated (if applicable)

**Group By Dimensions**
- Dimensions for data grouping

**Join Configuration**
- Join conditions with other tables

### Time Configuration

**Measurement Interval**
- Daily, Weekly, Monthly, Quarterly, or Annually

**Data Retention Period**
- Days historical data is retained

**Refresh Frequency**
- Real-time, Hourly, Daily, Weekly, or Manual

**Last Calculation**
- Date and time of most recent calculation

**Next Calculation**
- Scheduled time for next calculation

### Data Classification & Compliance

**Data Classification**
- Public, Internal, Confidential, or Restricted

**Contains PII**
- Yes/No indicator
- Identifies if personal information included

**GDPR Applicable**
- Yes/No indicator
- GDPR compliance required

### Alerts & Thresholds

**Alerts Enabled**
- Yes/No indicator

**Warning Threshold**
- Value triggering warning alert (if enabled)

**Critical Threshold**
- Value triggering critical alert (if enabled)

**Alert Recipients**
- Email addresses to notify

### Metadata & Tags

**Metadata**
- Custom JSON or configuration data

**Tags**
- Categorization tags for organization

### Additional Information

**Created**
- Date and time KPI was created

**Modified**
- Date and time of last modification

## Actions

### Edit
- **Icon:** Pencil
- **Function:** Open edit form
- **Allows:** Modify all KPI settings

### Activate/Deactivate
- **Icon:** Power
- **Function:** Toggle KPI operational status
- **Active state:** Shows Deactivate button
- **Inactive state:** Shows Activate button

### View Reports
- **Icon:** BarChart
- **Function:** Access analytics and trends
- **Shows:**
  - Historical metric values
  - Trend charts and graphs
  - Period-over-period comparisons
  - Performance analysis

### Recalculate Now
- **Icon:** RotateCw
- **Function:** Trigger immediate recalculation
- **Use:** Force update if needed
- **Shows:** Calculation status and result

### View Calculation Details
- **Icon:** Details
- **Function:** See calculation logic details
- **Shows:**
  - SQL or formula used
  - Last calculation duration
  - Calculation logs
  - Any errors encountered

### More Menu
- **Archive** - Mark KPI as archived
- **View Logs** - See operation logs
- **Delete** - Remove KPI (with confirmation)

## Calculation Status

### Healthy Status
- 🟢 Green indicator
- KPI calculating normally
- Values up-to-date
- Last calculation: recent timestamp

### Calculating Status
- 🟡 Yellow indicator
- Calculation currently in progress
- Will be updated shortly

### Warning Status
- 🟠 Orange indicator
- KPI has issues
- Check alert conditions
- Manual recalculation may help

### Error Status
- 🔴 Red indicator
- Calculation failed
- Check connection and data source
- Review error logs

### Unknown Status
- ⚪ Gray indicator
- Status not yet determined
- First calculation not yet run

## Metrics Display

**Current Value**
- Latest calculated metric
- Timestamp of calculation

**Trend Indicator**
- Arrow showing direction (↑ ↓ →)
- Compared to previous period

**Historical Values**
- Timeline of past values
- View trends over time

**Period Comparison**
- Compare against previous period
- Shows change percentage

## Status Change Confirmation

When performing actions that change KPI state, a confirmation dialog appears:

**Activate KPI**
- Title: "Activate KPI"
- Message: Confirm activation
- Buttons: Activate, Cancel

**Deactivate KPI**
- Title: "Deactivate KPI"
- Message: Warn about impact
- Buttons: Deactivate, Cancel

**Recalculate KPI**
- Title: "Recalculate KPI"
- Message: Confirm recalculation
- Note: Current calculation will be overwritten
- Buttons: Recalculate, Cancel

## Reports & Analytics

**Value History Chart**
- Line chart showing metric values over time
- Trend visualization
- Anomaly detection highlights

**Calculation Performance**
- Time taken to calculate
- Data volume processed
- Query efficiency metrics

**Comparison Charts**
- Compare against targets
- Period-over-period trends
- Benchmark comparisons

## Related Actions

**Edit KPI**
- Modify settings
- Opens KPI edit form

**Back to List**
- Return to KPI list
- Preserves filter and sort settings

**View Other KPIs**
- Navigate using breadcrumbs
- Quick navigation menu

## Common Tasks

### Monitor KPI Value
1. Open KPI details
2. Look for Current Value
3. Check Last Calculation timestamp
4. View trend indicator

### View Historical Trends
1. Open KPI details
2. Click "View Reports" button
3. See value history chart
4. Analyze trends and patterns

### Check Calculation Status
1. Open KPI details
2. Look at Calculation Status indicator
3. View Last Calculation time
4. Check error logs if needed

### Force Recalculation
1. Open KPI details
2. Click "Recalculate Now" button
3. Confirm action in dialog
4. Monitor calculation progress

### Update KPI Configuration
1. Open KPI details
2. Click Edit button
3. Modify desired settings
4. Save changes
5. Return to details view

### Review Compliance
1. Check Data Classification level
2. Verify PII indicator
3. Confirm GDPR Applicable status
4. Review metadata documentation

<EditButton docSlug="infrastructure/view-kpi" docTitle="View KPI Details" />
