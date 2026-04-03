---
title: Edit KPI
---


# Edit KPI

## Overview

The Edit KPI form allows you to modify existing KPI configuration. You can update the metric calculation, data source, thresholds, and other settings.

## Accessing Edit Form

1. Navigate to **Infrastructure > KPIs**
2. Find the KPI you want to edit
3. Click on the KPI row or click the menu icon (⋮)
4. Select **Edit**

Or from KPI Details page:
1. Click **Edit** button in the top-right corner

## Form Fields

All fields are the same as [Create KPI](/documentation/infrastructure/create-kpi) with the following notes:

### Required Fields
- KPI Name*
- KPI Code*
- Metric Type*
- Measurement Unit*
- Connection Profile*
- Data Entity*
- Measurement Interval*
- Refresh Frequency*
- Data Retention Period*

### Optional Fields
- Description
- Filter Conditions
- Aggregation Column
- Group By Dimensions
- Join Configuration
- Display Decimal Places
- Warning/Critical Thresholds
- Alert Recipients
- Metadata
- Tags

## Making Changes

### Change KPI Name
1. Click in the Name field
2. Update the text
3. New name will be reflected in lists and reports

### Change Description
1. Modify description text area
2. Updated in KPI details
3. Helps other users understand the KPI

### Update Metric Configuration

#### Change Metric Type
1. Select different metric type
2. Aggregation column requirements may change
3. Unit may need updating
4. Test calculations after change

#### Update Measurement Unit
1. Modify unit value
2. Reflects in reports and displays
3. Used for data interpretation

#### Adjust Decimal Places
1. Modify decimal places value
2. Range: 0-6
3. Changes how values are displayed

### Modify Data Source

#### Change Connection Profile
1. Select different connection profile
2. Must have required data entity
3. Data source changes apply to next calculation
4. Test with new connection after saving

#### Update Data Entity
1. Change table or entity name
2. Verify entity exists in connection
3. Aggregation columns must exist in new entity
4. Previous data may not be compatible

#### Update Filter Conditions
1. Add, modify, or remove filter conditions
2. Affects which records are included
3. Can significantly change KPI values
4. Test filters before saving

### Change Calculation Logic

#### Modify Aggregation Column
1. Change column being aggregated
2. Column must be numeric for Sum/Average
3. Select appropriate column for metric type
4. Verify column exists and is appropriate

#### Update Group By Dimensions
1. Add or remove grouping dimensions
2. Creates sub-metrics by dimension
3. Increases calculation complexity
4. May impact performance

#### Adjust Join Configuration
1. Add, modify, or remove joins
2. Specify join conditions
3. Multiple joins supported
4. Test joins for data accuracy

### Update Time Configuration

#### Change Measurement Interval
1. Select different interval
2. Daily, Weekly, Monthly, Quarterly, Annually
3. Changes how data is grouped
4. Historical data remains unchanged

#### Adjust Data Retention Period
1. Change how long data is retained
2. Range: 30-3650 days
3. Older data archived after period expires
4. Can be increased but not retroactively decreased

#### Modify Refresh Frequency
1. Change calculation schedule
2. Options: Real-time, Hourly, Daily, Weekly, Manual
3. More frequent = higher resource usage
4. Apply based on business needs

### Update Classification & Compliance

#### Change Data Classification
1. Select appropriate classification level
2. Public, Internal, Confidential, Restricted
3. Affects access controls
4. Downgrading requires verification

#### Update PII Status
1. Enable/disable Contains PII toggle
2. Mark if personal information included
3. Affects compliance tracking

#### Modify GDPR Applicability
1. Enable/disable GDPR Applicable toggle
2. Required for EU data
3. Enables compliance monitoring

### Configure Alerts

#### Enable or Disable Alerts
1. Toggle Alerts Enabled
2. If enabling:
   - Set Warning Threshold
   - Set Critical Threshold
   - Add Alert Recipients
3. Notifications sent when thresholds exceeded

#### Update Threshold Values
1. Modify Warning Threshold
2. Modify Critical Threshold
3. Critical value should be > Warning value
4. Test alert conditions

#### Adjust Alert Recipients
1. Add or remove email addresses
2. Notified when thresholds exceeded
3. Enter valid email addresses

### Update Metadata and Tags

#### Modify Metadata
1. Update JSON or free-form metadata
2. Document ownership, business unit, etc.
3. Helps with KPI governance

#### Change Tags
1. Add or remove categorization tags
2. Supports filtering and organization
3. Examples: "campaign", "revenue", "marketing"

## Saving Changes

### Save Button
- All changes are saved to database
- Form validates all required fields
- Error messages shown if validation fails

### Validation

Before saving, the system checks:
- All required fields are filled
- KPI Name is 1-255 characters
- KPI Code is alphanumeric and underscores
- Connection Profile is selected
- Data Entity exists in connection
- Measurement Unit is 1-50 characters
- Decimal Places is 0-6
- Data Retention is 30-3650 days
- Thresholds: Warning < Critical

### Success

After successful save:
1. Redirect to KPI details page
2. Updated values displayed
3. Changes take effect on next calculation
4. Confirmation message shown

## Error Handling

### Validation Errors
- **Missing Required Fields** - Fill in all required fields marked with *
- **Invalid Data Retention** - Enter days between 30 and 3650
- **Invalid Decimal Places** - Enter number between 0 and 6
- **Invalid Data Entity** - Entity must exist in selected connection
- **Invalid Thresholds** - Warning Threshold must be less than Critical

### Server Errors
- **KPI Not Found** - KPI may have been deleted
- **Connection Error** - Could not connect to selected profile
- **Data Entity Not Found** - Entity may have been deleted from connection
- **Insufficient Permissions** - Contact administrator

## Reverting Changes

### Cancel Button
- Discard all unsaved changes
- Return to KPI details page
- No confirmation required if no changes made

### Before Saving
- Any modifications not yet saved are lost
- You return to the previous state

## Common Update Scenarios

### Adjusting Metric Thresholds
1. Edit the KPI
2. Update Warning and Critical thresholds
3. Adjust Alert Recipients if needed
4. Save changes
5. Test alerts

### Changing Aggregation Logic
1. Edit the KPI
2. Modify Filter Conditions
3. Update Aggregation Column if needed
4. Change Group By Dimensions if applicable
5. Save and verify results

### Updating Data Source
1. Edit the KPI
2. Change Connection Profile
3. Verify Data Entity exists in new connection
4. Save changes
5. Monitor calculation for accuracy

### Adjusting Refresh Schedule
1. Edit the KPI
2. Modify Refresh Frequency
3. Change Measurement Interval if needed
4. Save changes

### Extending Data Retention
1. Edit the KPI
2. Increase Data Retention Period
3. Save changes
4. Historical data preserved

### Updating Compliance Information
1. Edit the KPI
2. Update Data Classification
3. Verify PII status
4. Update GDPR Applicability
5. Save changes

### Adding Grouping Dimensions
1. Edit the KPI
2. Add Group By Dimensions
3. Configure dimension columns
4. Save changes
5. Monitor performance impact

## After Editing

### Immediate Effects
- KPI settings updated
- Changes apply to next calculation
- Threshold changes take effect immediately
- Compliance updates logged

### Next Calculation
1. KPI recalculates per refresh frequency
2. New configuration applied
3. May affect metric values
4. Check results after first calculation

### Monitoring Changes
1. Return to KPI details
2. Check calculation status
3. Monitor metric values
4. Verify alerts trigger correctly (if enabled)

### Confirming Changes
- Visit [KPI Details](/documentation/infrastructure/view-kpi) page
- Verify all updated values
- Check metric values are reasonable
- Review any error messages

## Tips

- **Test data source changes** - Verify new connection/entity produces valid data
- **Monitor threshold changes** - Check alert behavior after changing thresholds
- **Document major changes** - Update metadata to track significant updates
- **Schedule changes carefully** - Adjust refresh frequency based on actual needs
- **Review compliance** - Ensure PII and GDPR flags are accurate
- **Validate calculations** - After logic changes, verify results are reasonable
- **Plan retention adjustments** - Can only increase retention, not decrease retroactively
- **Stage changes** - Test in lower environments first if possible

