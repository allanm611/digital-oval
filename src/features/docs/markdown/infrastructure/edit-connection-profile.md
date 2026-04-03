# Edit Connection Profile

## Overview

Edit Connection Profile uses the same form sections as create mode, but pre-fills the current profile values.

## Open Edit

You can open edit from:

- Connection Profiles list row action
- Connection Profile Details page Edit button

## Form Sections

The page includes these sections:

- Basic Information
- Performance Settings
- Data Governance
- Sync Settings (shown for incremental, delta, and cdc load methods)
- Health Checks
- Advanced Settings

## Required Inputs

Core required fields include:

- Profile Name
- Profile Code
- Connection Type
- Environment
- Data Load Method
- Valid From

When Health Checks are enabled, Health Check Query is required.

## Save Behavior

Click Update Profile to submit changes.

On success:

- A success toast is shown
- The app navigates back to `/dashboard/connection-profiles`

## Cancel Behavior

Cancel returns to the previous page or falls back to the connection profiles list.

## Related Topics

- [Create Connection Profile](/documentation/infrastructure/create-connection-profile)
- [Connection Profiles List](/documentation/infrastructure/connection-profiles-list)
- [View Connection Profile Details](/documentation/infrastructure/view-connection-profile)

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

- Visit [Connection Profile Details](/documentation/infrastructure/view-connection-profile) page
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
