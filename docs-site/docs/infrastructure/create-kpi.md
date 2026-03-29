---
title: Create KPI
---

import { EditButton } from '@site/src/components/EditButton';

# Create KPI

## Overview

The Create KPI form allows you to add a new Key Performance Indicator. Configure the metric calculation, data source, classification, and monitoring parameters.

## Basic Information

### KPI Name*
**Type:** Text input
**Required:** Yes
- Display name for the KPI
- Should be descriptive (e.g., "Campaign Conversion Rate")
- Used in lists and reports
- 1-255 characters

### KPI Code*
**Type:** Text input
**Required:** Yes
- Unique identifier for the KPI
- Used in APIs and references
- Alphanumeric with underscores allowed
- 1-100 characters

### Description
**Type:** Text area
**Optional**
- Detailed explanation of the KPI
- Business purpose and usage
- Formula or calculation logic explanation

## Metric Configuration

### Metric Type*
**Type:** Dropdown select
**Required:** Yes
- **Count** - Total count of events/records
- **Sum** - Aggregate numeric values
- **Average** - Calculate mean values
- **Percentage** - Track percentage changes
- **Ratio** - Compare two metrics
- **Custom** - User-defined calculations

### Measurement Unit*
**Type:** Text input
**Required:** Yes
- Unit of measurement
- Examples: "Count", "Percentage (%)", "Amount ($)", "Days"
- Displayed in reports and dashboards

### Display Decimal Places
**Type:** Number input
**Default:** 2
- Number of decimal places to display
- Range: 0-6
- Used for rounding display values

## Data Source

### Connection Profile*
**Type:** Dropdown select
**Required:** Yes
- Select source connection profile
- Data is retrieved from this profile
- Must be configured first

### Data Entity/Table*
**Type:** Text input
**Required:** Yes
- Name of table or data entity
- Source of metric data
- Must exist in selected connection

### Filter Conditions
**Type:** Advanced builder
**Optional**
- WHERE clause conditions
- Filter data before calculation
- Multiple conditions with AND/OR logic

## Calculation Logic

### Aggregation Column
**Type:** Text input
**Optional** (Required for Sum/Average)
- Column name to aggregate
- Must be numeric for Sum/Average
- Examples: amount, count, duration

### Group By Dimensions
**Type:** Multi-select
**Optional**
- Dimensions to group data by
- Creates sub-metrics by dimension
- Examples: geography, segment, channel

### Join Configuration
**Type:** Advanced builder
**Optional**
- Join with other tables if needed
- Define join conditions
- Multiple joins supported

## Time Configuration

### Measurement Interval*
**Type:** Dropdown select
**Required:** Yes
- **Daily** - Calculate every day
- **Weekly** - Calculate every week (Sunday-Saturday)
- **Monthly** - Calculate every month
- **Quarterly** - Calculate every quarter
- **Annually** - Calculate every year

### Data Retention Period*
**Type:** Number input
**Required:** Yes
- Days to retain historical values
- Range: 30-3650 (10 years)
- Default: 365 (1 year)
- After this period, old data is archived

### Refresh Frequency*
**Type:** Dropdown select
**Required:** Yes
- **Real-time** - Recalculate continuously
- **Hourly** - Recalculate every hour
- **Daily** - Recalculate once per day
- **Weekly** - Recalculate once per week
- **Manual** - Only on demand

## Data Classification & Compliance

### Data Classification*
**Type:** Dropdown select
**Default:** Internal
- **Public** - Public data
- **Internal** - Internal use only
- **Confidential** - Sensitive data
- **Restricted** - Highly restricted

### Contains PII
**Type:** Toggle
**Default:** Off
- Does metric include personal information
- Enables GDPR tracking

### GDPR Applicable
**Type:** Toggle
**Default:** Off
- Is GDPR compliance required
- Enables compliance monitoring

## Alerts & Thresholds

### Enable Alerts
**Type:** Toggle
**Default:** Off
- Enable anomaly detection
- If enabled, configure thresholds

### Warning Threshold
**Type:** Number input
**Optional** (Required if alerts enabled)
- Value that triggers warning
- Used for anomaly detection

### Critical Threshold
**Type:** Number input
**Optional** (Required if alerts enabled)
- Value that triggers critical alert
- Used for anomaly detection

### Alert Recipients
**Type:** Multi-select
**Optional**
- Email addresses to notify
- Notified when thresholds exceeded

## Additional Settings

### Metadata
**Type:** Text area
**Optional**
- JSON or free-form metadata
- Custom configuration
- Example:
```json
{
  "owner": "analytics-team",
  "business_unit": "marketing",
  "last_reviewed": "2026-03-15"
}
```

### Tags
**Type:** Multi-select
**Optional**
- Categorize KPI with tags
- Used for filtering and organization
- Examples: "campaign", "offers", "revenue"

## Form Actions

### Save KPI
- Creates new KPI
- Validates all required fields
- Shows error messages if validation fails

### Cancel
- Return to KPI list
- Discard unsaved changes

## Validation Rules

- **KPI Name** - Required, 1-255 characters
- **KPI Code** - Required, alphanumeric and underscores
- **Metric Type** - Required selection
- **Measurement Unit** - Required, 1-50 characters
- **Connection Profile** - Must select valid profile
- **Data Entity** - Required, must exist in connection
- **Measurement Interval** - Required selection
- **Refresh Frequency** - Required selection
- **Data Retention** - 30-3650 days
- **Decimal Places** - 0-6

## After Creating

After successful creation:
1. Redirected to KPI details page
2. KPI appears in list
3. KPI is Active by default
4. Initial calculation scheduled
5. Next steps:
   - View KPI details
   - Monitor calculation status
   - View reports and trends
   - Add to dashboards
   - Configure alerts if needed

## Best Practices

### Naming Conventions
- Use descriptive names: "Campaign Click-Through Rate"
- Use consistent naming: metric_type_dimension
- Make codes searchable and readable

### Data Selection
- Validate data entity exists in connection
- Test filter conditions before saving
- Use appropriate aggregation methods

### Performance
- Limit grouping dimensions for performance
- Use appropriate refresh frequency
- Archive old data to maintain performance

### Compliance
- Mark KPIs with PII appropriately
- Use restrictive classifications for sensitive data
- Set GDPR applicability correctly
- Document in metadata

<EditButton docSlug="infrastructure/create-kpi" docTitle="Create KPI" />
