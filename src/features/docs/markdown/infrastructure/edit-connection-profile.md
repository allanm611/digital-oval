---
title: Edit Connection Profile
---


# Edit Connection Profile

## Overview

The Edit Connection Profile form allows you to modify existing profile configuration. You can update connection settings, performance tuning, reliability settings, compliance parameters, and health check configuration.

## Accessing Edit Form

1. Navigate to **Infrastructure > Connection Profiles**
2. Find the profile you want to edit
3. Click on the profile row or click the menu icon (⋮)
4. Select **Edit**

Or from Connection Profile Details page:
1. Click **Edit** button in the top-right corner

## Form Fields

All fields are the same as [Create Connection Profile](./create-connection-profile.md) with the following notes:

### Required Fields
- Profile Name*
- Profile Code*
- Connection Type*
- Server*
- Load Strategy*
- Environment*
- Batch Size*
- Parallel Threads*
- Min Pool Size*
- Max Pool Size*
- Connection Timeout*
- Idle Timeout*
- Max Retries*
- Retry Backoff Multiplier*
- Circuit Breaker Threshold*
- Data Classification*
- Valid From*

### Optional Fields
- Database Type (if Database connection)
- Database Name (if Database connection)
- Sync Column Name (if Incremental Load)
- Sync Column Type (if Incremental Load)
- Valid To
- Health Check Query (required if health checks enabled)
- Encryption Key Version
- Metadata

## Making Changes

### Change Profile Name
1. Click in the Name field
2. Update the text
3. New name will be reflected in lists and dashboards

### Change Connection Details
1. Modify Connection Type or Server
2. Note: Changing these affects how data is accessed
3. Database-specific fields may appear/disappear based on type
4. Test with "Push Health" after saving

### Update Load Strategy
1. Select Full Load or Incremental Load
2. If Incremental:
   - Provide Sync Column Name
   - Specify Sync Column Type
3. Changes apply to next sync

### Adjust Performance Settings

#### Batch Size
1. Modify batch size value
2. Higher values = better performance, more memory
3. Range: 100-10000
4. Monitor system resources after change

#### Parallel Threads
1. Increase or decrease thread count
2. More threads = faster processing, more resource usage
3. Range: 1-32
4. Test impact before production use

#### Connection Pool
1. Modify Min Pool Size and/or Max Pool Size
2. Ensure: Min Pool Size ≤ Max Pool Size
3. Higher min ensures available connections
4. Higher max limits resource usage
5. Adjust based on load patterns

#### Timeouts
1. Modify Connection Timeout or Idle Timeout
2. Connection Timeout: for establishing new connections
3. Idle Timeout: for keeping idle connections alive
4. Higher timeouts may mask connectivity issues
5. Lower timeouts may cause unnecessary reconnections

### Adjust Reliability Settings

#### Max Retries
1. Increase or decrease retry attempts
2. Range: 0-10
3. More retries = more resilient but slower failure detection
4. Fewer retries = faster failure detection but less resilient

#### Retry Backoff Multiplier
1. Modify backoff multiplier value
2. Range: 1-5
3. Example: multiplier=2 gives delays: 1s, 2s, 4s, 8s...
4. Higher values increase wait time between retries

#### Circuit Breaker Threshold
1. Modify failure threshold
2. Range: 1-100
3. Lower values = circuit opens faster (more protection)
4. Higher values = more tolerant to transient failures

### Update Classification & Compliance

#### Data Classification
1. Select appropriate classification level
2. Options: Public, Internal, Confidential, Restricted
3. Affects access controls and audit logging
4. Confidential/Restricted may require additional approvals

#### Contains PII
1. Enable/disable toggle
2. If enabled: Profile contains personal information
3. Triggers GDPR tracking and compliance checks
4. Ensure accuracy for legal compliance

#### GDPR Applicable
1. Enable/disable toggle
2. If enabled: GDPR compliance is required
3. Applies to EU data or EU residents
4. Enables additional compliance monitoring

### Update Validity Period

#### Valid From
1. Change activation date
2. Profile not usable before this date
3. Useful for scheduling profile activation

#### Valid To
1. Set or remove expiration date
2. Profile becomes inactive after this date
3. Leave blank for no expiration

### Configure Health Checks

1. Enable/disable Health Check toggle
2. If enabling:
   - Provide Health Check Query
   - Example: SELECT 1 (SQL), /health (API)
3. Health checks validate connectivity
4. Click "Push Health" after saving for immediate test

### Update Encryption

1. Modify Encryption Key Version (optional)
2. Leave default if unsure
3. Credentials automatically encrypted with selected version

### Update Metadata

1. Add or modify JSON metadata
2. Example:
```json
{
  "team": "data-engineering",
  "cost_center": "data-123",
  "owner": "john.doe@company.com",
  "retention_days": 90
}
```
3. Use for custom tracking and documentation

## Saving Changes

### Save Button
- All changes are saved to database
- Form validates all required fields
- Error messages shown if validation fails

### Validation

Before saving, the system checks:
- All required fields are filled
- Profile Name is 1-255 characters
- Profile Code is alphanumeric and underscores
- Batch Size is 100-10000
- Parallel Threads is 1-32
- Pool Sizes: Min ≤ Max, both 1-100
- Timeouts are 5-3600 seconds
- Retries are 0-10
- Backoff Multiplier is 1-5
- Health Check Query provided if enabled
- Valid From date is set
- Valid To (if set) is after Valid From

### Success

After successful save:
1. Redirect to profile details page
2. Updated values displayed
3. Changes take effect immediately
4. Confirmation message shown

## Error Handling

### Validation Errors
- **Missing Required Fields** - Fill in all required fields marked with *
- **Invalid Batch Size** - Enter a number between 100 and 10000
- **Invalid Pool Sizes** - Min Pool Size must be ≤ Max Pool Size
- **Invalid Timeouts** - Enter seconds between 5 and 3600
- **Invalid Validity Period** - Valid To must be after Valid From
- **Invalid Health Check Query** - Provide valid query if health checks enabled

### Server Errors
- **Profile Not Found** - Profile may have been deleted
- **Insufficient Permissions** - Contact administrator
- **Network Error** - Check connection and retry
- **Server Connection Error** - Server may be unreachable

## Reverting Changes

### Cancel Button
- Discard all unsaved changes
- Return to profile details page
- No confirmation required if no changes made

### Before Saving
- Any modifications not yet saved are lost
- You return to the previous state

## Common Update Scenarios

### Fixing Connection Issues
1. Profile is failing health checks
2. Edit the profile
3. Verify/update Connection Type and Server
4. Verify Health Check Query is correct
5. Save changes
6. Test with "Push Health"

### Improving Performance
1. Edit the profile
2. Increase Batch Size (if memory allows)
3. Increase Parallel Threads (for large data volumes)
4. Adjust Connection Pool sizes
5. Save changes
6. Monitor performance metrics

### Increasing Resilience
1. Edit the profile
2. Increase Max Retries
3. Adjust Retry Backoff Multiplier
4. Increase Circuit Breaker Threshold
5. Save changes

### Updating Compliance Status
1. Edit the profile
2. Update Data Classification if needed
3. Update Contains PII flag if needed
4. Update GDPR Applicable flag if needed
5. Save changes

### Scheduling Profile Activation
1. Edit the profile
2. Set Valid From to future date
3. Leave Valid To blank (unless expiration needed)
4. Save changes
5. Profile activates at specified date

### Setting Profile Expiration
1. Edit the profile
2. Set Valid To to expiration date
3. Profile becomes inactive after this date
4. Provides automatic cleanup for temporary connections

### Adjusting Health Monitoring
1. Edit the profile
2. Update Health Check Query (if needed)
3. Enable/disable health checks
4. Save changes
5. Monitor health status

## After Editing

### Immediate Effects
- Connection settings applied to new data syncs
- Performance settings effective immediately
- Timeout/retry changes applied to future requests
- Health check settings updated
- Classification changes logged for audit

### Monitoring Changes
1. Return to profile details
2. Monitor health status
3. Check sync performance metrics
4. Use "Push Health" to test if health checks enabled

### Confirming Changes
- Visit [Connection Profile Details](./view-connection-profile.md) page
- Verify all updated values
- Check health status indicators

### Validation After Changes
1. If changed connection settings: Run test
2. If changed performance settings: Monitor metrics
3. If changed classification: Verify compliance flags
4. If changed dates: Check validity indicators

## Tips

- **Test connectivity** after changing Connection Type or Server
- **Use "Push Health"** to immediately verify health check changes
- **Monitor resource usage** after increasing Batch Size or Threads
- **Document changes** in metadata for team visibility
- **Verify compliance** before reducing data classification level
- **Check related syncs** that depend on this profile
- **Note timestamps** before major changes for troubleshooting
- **Stage changes** in lower environments first (dev → staging → prod)

