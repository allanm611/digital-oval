---
title: Edit Server
---

import { EditButton } from '@site/src/components/EditButton';

# Edit Server

## Overview

The Edit Server form allows you to modify existing server configuration. You can update connection settings, health check parameters, circuit breaker settings, and other server properties.

## Accessing Edit Form

1. Navigate to **Infrastructure > Servers**
2. Find the server you want to edit
3. Click on the server row or click the menu icon (⋮)
4. Select **Edit**

Or from Server Details page:
1. Click **Edit** button in the top-right corner

## Form Fields

All fields are the same as [Create Server](./create-server.md) with the following notes:

### Required Fields
- Server Name*
- Server Code*
- Protocol*
- Host*
- Port*
- Environment*
- Timeout (seconds)*
- Max Retries*

### Optional Fields
- Base Path
- Region
- Server Type
- Health Check URL (required if health check enabled)
- Authentication Type
- Metadata

## Making Changes

### Change Server Name
1. Click in the Name field
2. Update the text
3. New name will be reflected in lists and dashboards

### Update Connection Details
1. Modify Protocol, Host, or Port
2. Verify the new endpoint is accessible
3. Test with "Push Health" after saving

### Adjust Performance Settings
1. Modify Timeout or Max Retries
2. Changes apply to all future requests
3. Existing connections unaffected

### Configure Health Checks
1. Enable/disable Health Check toggle
2. If enabling:
   - Provide Health Check URL
   - Set Health Check Interval
3. First health check runs after interval
4. Click "Push Health" for immediate test

### Circuit Breaker Settings
1. Enable/disable Circuit Breaker
2. Adjust Circuit Breaker Threshold
3. Higher = more tolerant to failures
4. Changes apply immediately

### Security Settings
1. Enable/disable TLS
2. Update Authentication Type
3. Changes apply to new requests

## Saving Changes

### Save Button
- All changes are saved to database
- Form validates all required fields
- Error messages shown if validation fails

### Validation
Before saving, the system checks:
- All required fields are filled
- Port is valid (1-65535)
- Timeout is valid (1-300 seconds)
- Health Check URL is provided if health checks enabled
- Timeout is 30-3600 seconds if health checks enabled

### Success
After successful save:
1. Redirect to server details page
2. Updated values displayed
3. Changes take effect immediately
4. Confirmation message shown

## Error Handling

### Validation Errors
- **Missing Required Fields** - Fill in all required fields marked with *
- **Invalid Port** - Enter a number between 1 and 65535
- **Invalid Timeout** - Enter seconds between 1 and 300
- **Invalid Health Check URL** - Provide valid endpoint if health checks enabled

### Server Errors
- **Server Not Found** - Server may have been deleted
- **Insufficient Permissions** - Contact administrator
- **Network Error** - Check connection and retry

## Reverting Changes

### Cancel Button
- Discard all unsaved changes
- Return to server details page
- No confirmation required if no changes made

### Before Saving
- Any modifications not yet saved are lost
- You return to the previous state

## Common Update Scenarios

### Fixing Connection Issues
1. Server is failing health checks
2. Edit the server
3. Verify/update Host and Port
4. Save changes
5. Test with "Push Health"

### Increasing Resilience
1. Edit the server
2. Increase Max Retries
3. Adjust Circuit Breaker Threshold
4. Save changes

### Adjusting Health Monitoring
1. Edit the server
2. Update Health Check URL or Interval
3. Adjust timeout if needed
4. Save and monitor changes

### Enabling Security
1. Edit the server
2. Enable TLS
3. Set Authentication Type if needed
4. Save changes
5. Test connectivity

### Updating Environment Tags
1. Change Environment (dev/staging/prod)
2. Update Region if needed
3. Modify Server Type if applicable
4. Save changes

## After Editing

### Immediate Effects
- Connection settings applied to new requests
- Timeout/retry changes effective immediately
- Health check settings updated
- Circuit breaker configuration refreshed

### Monitoring Changes
1. Return to server details
2. Monitor health status
3. Check recent request metrics
4. Use "Push Health" to test

### Confirming Changes
- Visit [Server Details](./view-server.md) page
- Verify all updated values
- Check health status indicators

## Tips

- **Test connectivity** after changing Host/Port
- **Use "Push Health"** to immediately verify changes
- **Note timestamps** before major changes for troubleshooting
- **Check related services** that depend on this server
- **Document changes** in metadata if making significant updates

<EditButton docSlug="infrastructure/edit-server" docTitle="Edit Server" />
