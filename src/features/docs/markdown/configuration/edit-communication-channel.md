# Edit Communication Channel

## Overview

Modify an existing Communication Channel to update its name, description, status, or configuration. Changes may affect campaigns using this channel.

## How to Edit a Channel

### Step 1: Open the Edit Form

#### From the List View
1. Navigate to **Configuration → Communication Channels**
2. Find the channel to edit
3. Click the **Edit** button (pencil icon) next to the channel
4. The edit modal opens with current settings pre-filled

#### From the Details View
1. Navigate to **Configuration → Communication Channels**
2. Click the channel name to view details
3. Click the **Edit** button on the details page
4. The edit modal opens

### Step 2: Update Channel Information

#### Channel Name
- **Field Type:** Text input (max 120 characters)
- **Current Value:** Shows existing name
- **To Update:**
  1. Click in the field
  2. Modify the name as needed
  3. Ensure new name is unique

#### Channel Description
- **Field Type:** Text area (max 600 characters)
- **Current Value:** Shows existing description
- **To Update:**
  1. Update the text
  2. Clarify the channel purpose
  3. Document any special characteristics

#### Channel Status
- **Field Type:** Active/Inactive toggle
- **Current Value:** Shows current status
- **To Update:**
  1. Toggle between Active and Inactive
  2. Active: Channel available for campaigns
  3. Inactive: Channel archived, not usable

### Step 3: Update Configuration Settings

Depending on channel type, you may update:

#### SMS Channel Settings
- **Sender ID Configuration** - Add/remove sender IDs
- **SMS Routes** - Link to SMS gateways
- **Delivery Preferences** - Message priority, timeout
- **Encoding** - Character set and encoding
- **Concatenation** - Handle long messages

#### Email Channel Settings
- **SMTP Configuration** - Server address and port
- **Sender Email** - Default from address
- **Authentication** - Username and password
- **TLS/SSL** - Security settings
- **Bounce Handling** - Error handling rules

#### USSD Channel Settings
- **Gateway Provider** - USSD gateway selection
- **Session Timeout** - Session duration
- **Menu Structure** - Navigation configuration
- **Character Limit** - Per message limits

#### Push Notification Settings
- **FCM Configuration** - Firebase Cloud Messaging setup
- **APNS Configuration** - Apple Push Notification setup
- **Certificate Management** - Upload/update certificates
- **Payload Settings** - Message size and format

### Step 4: Save Changes

1. Review all modifications
2. Click the **Save** or **Update** button
3. System validates:
   - Name is unique
   - Name is not empty
   - Character limits respected
   - Configuration is valid
4. Upon success:
   - Confirmation message appears
   - Modal closes
   - List updates with changes

## Validation Rules

- **Channel name is required** - Cannot be empty
- **Channel name must be unique** - No duplicate names
- **Character limits:**
  - Name: Maximum 120 characters
  - Description: Maximum 600 characters

## Impact Analysis

### Before Making Changes

Consider impact on:

**Active Campaigns**
- Which campaigns use this channel
- Pending messages through channel
- Delivery criticality

**Communication Policies**
- Policies referencing this channel
- Impact of status changes

**Customer Impact**
- How changes affect message delivery
- Any service interruptions needed

### Planning Channel Changes

1. **Assess Current Usage**
   - Review active campaigns using channel
   - Check message volume
   - Identify dependencies

2. **Plan Changes**
   - Schedule maintenance window if needed
   - Communicate to stakeholders
   - Prepare rollback plan

3. **Make Changes**
   - Update channel configuration
   - Test changes thoroughly
   - Monitor delivery metrics

4. **Verify Impact**
   - Monitor message delivery
   - Check success rates
   - Review error logs

## Common Edit Scenarios

### Renaming a Channel
**Scenario:** Need clearer channel naming
- **Change:** "SMS1" to "SMS - Normal Delivery"
- **Effect:** Better clarity for team members
- **Impact:** No effect on delivery

### Deactivating a Channel
**Scenario:** Retiring an old SMS gateway
- **Change:** Status from Active to Inactive
- **Effect:** Channel no longer available for new campaigns
- **Impact:** Existing campaigns continue using channel

### Updating Channel Description
**Scenario:** Document new use cases
- **Change:** Add description detailing SMS types
- **Effect:** Team understands channel purpose better
- **Impact:** No delivery impact

### Modifying SMS Routes
**Scenario:** Change primary SMS gateway
- **Change:** Update SMS route configuration
- **Effect:** New messages use new gateway
- **Impact:** May affect delivery speed/rates

### Updating Email Settings
**Scenario:** Change SMTP server
- **Change:** Update SMTP configuration
- **Effect:** Emails route through new server
- **Impact:** Email delivery continues without interruption

### Changing Push Notification Config
**Scenario:** Upgrade FCM project
- **Change:** Update Firebase credentials
- **Effect:** Use new FCM project
- **Impact:** Improved notification delivery

## Undo Changes

### Before Saving
- Click **Cancel** or close modal without saving
- All changes are discarded
- Original settings remain unchanged

### After Saving
- Changes are permanent immediately
- To revert:
  1. Edit the channel again
  2. Restore previous values
  3. Save changes
- Keep documentation of all changes

## Error Handling

Common errors and solutions:

- **"Channel name is required"** - Ensure name field is not empty
- **"Channel name already exists"** - Choose a different name
- **"Name exceeds 120 characters"** - Shorten channel name
- **"Description exceeds 600 characters"** - Shorten description
- **"Invalid configuration"** - Verify all settings are correct

## Configuring Channel-Specific Settings

### Setting Up SMS Routes
1. Edit SMS channel
2. Link to SMS gateway routes
3. Verify gateway credentials
4. Test SMS delivery

### Configuring Email SMTP
1. Edit email channel
2. Enter SMTP server details
3. Configure authentication
4. Test email sending

### Setting Up USSD Gateway
1. Edit USSD channel
2. Configure gateway provider
3. Define menu structure
4. Test USSD sessions

### Configuring Push Notifications
1. Edit push channel
2. Upload FCM credentials
3. Configure APNS certificates
4. Test push delivery

## Testing Changes

After editing a channel:

1. **Send Test Message**
   - Use test/preview mode
   - Send to test recipient
   - Verify delivery

2. **Monitor Logs**
   - Check delivery logs
   - Review error messages
   - Analyze performance

3. **Verify Configuration**
   - Confirm settings applied
   - Test error scenarios
   - Validate failover behavior

## Best Practices

- Document the reason for changes
- Test changes on pilot campaigns first
- Notify team of significant changes
- Keep version history of configurations
- Review changes regularly
- Plan maintenance during low-traffic periods
- Have rollback plan ready

## Related Documentation

- [Communication Channels List](/documentation/communication-channels-list) - View all channels
- [View Communication Channel](/documentation/view-communication-channel) - See detailed information
- [Create Communication Channel](/documentation/create-communication-channel) - Add new channels
