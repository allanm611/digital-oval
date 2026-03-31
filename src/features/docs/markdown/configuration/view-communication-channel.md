# View Communication Channel Details

## Overview

View complete details of a Communication Channel including its configuration, status, and related settings. This page provides comprehensive information about how the channel is configured.

## How to View Channel Details

### From the List View
1. Navigate to **Configuration → Communication Channels**
2. Click on any channel name in the list
3. The details page opens showing all channel information

### From Search Results
1. Use the search field to find a specific channel
2. Click on the matching channel name
3. Details page loads with complete information

## Channel Details Page

### Basic Information

**Channel Name**
- The identifier for the channel
- Used in campaigns and policies
- Examples: "SMS - Normal", "Email", "Push Notification"

**Channel Description**
- Explains the channel's purpose
- Documents intended use cases
- Helps team understand when to use this channel

**Status Badge**
- Green "Active" badge - Channel is available for use
- Blue "Inactive" badge - Channel is archived or disabled

### Channel Type Information

Displays the type of channel:

**SMS Channel**
- SMS - Normal (standard delivery)
- SMS - Flash (display-only delivery)
- Routes to SMS gateways
- Supports sender IDs

**Email Channel**
- Transactional and marketing emails
- Rich formatting support
- Attachment capable
- Delivery trackable

**USSD Channel**
- USSD - Push (automatic messages)
- USSD - Interactive (menu-driven)
- Mobile-first interaction
- Session-based

**Push Notification Channel**
- Mobile app push via FCM/APNS
- Real-time delivery
- Rich media support
- Trackable engagement

### Configuration Summary

Shows the current configuration status:

**SMS Channel Configuration**
- Associated SMS routes
- Configured sender IDs
- Delivery preferences
- Gateway provider

**Email Channel Configuration**
- SMTP server settings
- Sender email addresses
- Bounce handling
- Template configuration

**USSD Channel Configuration**
- Gateway provider
- Menu structure
- Session timeout
- Character limitations

**Push Notification Configuration**
- FCM credentials
- APNS certificates
- Deep linking setup
- Payload limits

### Timestamps

**Created**
- When the channel was created
- User who created it (if available)

**Last Updated**
- When the channel was last modified
- User who made the last change

### Related Information

**Associated Routes**
- For SMS: Links to configured SMS routes
- Click to view route details
- See delivery configuration

**Active Campaigns**
- Campaigns currently using this channel
- Count of in-use instances
- Links to campaign details

**Usage Statistics**
- Message volume through channel
- Success/failure rates
- Average delivery time
- Performance metrics

## Available Actions

### Edit Channel
- Click **Edit** button to modify channel details
- Update name, description, or status
- See [Edit Communication Channel](/documentation/edit-communication-channel)

### Configure Routes/Settings
- For SMS: Configure SMS routes
- For Email: Configure SMTP settings
- For USSD: Set up gateway
- For Push: Configure FCM/APNS

### Delete Channel
- Click **Delete** button to remove channel
- Confirmation dialog appears
- Cannot delete if actively in use
- Permanent action once confirmed

### Back to List
- Returns to Communication Channels list
- All viewed information remains intact

## Understanding Channel Status

### Active Channels
- Available for new campaigns
- Enforced in policies
- Actively processing messages
- Appear in channel selection

### Inactive Channels
- Cannot be used in new campaigns
- Pending messages continue delivery
- Can be reactivated if needed
- Useful for archival

## Channel-Specific Details

### SMS Channels
View details about:
- SMS gateway configuration
- Sender IDs associated
- Delivery reports setup
- SMS routes linking

### Email Channels
View details about:
- SMTP server configuration
- Sender email addresses
- Bounce handling rules
- Email templates

### USSD Channels
View details about:
- USSD gateway setup
- Menu navigation structure
- Session management
- Character encoding

### Push Channels
View details about:
- FCM project setup
- APNS certificate status
- Device token management
- Payload configuration

## Testing Channel Delivery

To verify channel functionality:

1. **Send Test Message**
   - Use test/preview mode
   - Send to test recipient
   - Monitor delivery logs

2. **Monitor Delivery**
   - Check delivery status
   - Review error messages
   - Analyze delivery times

3. **Validate Configuration**
   - Confirm settings match requirements
   - Verify gateway connectivity
   - Test error handling

## Performance Metrics

View channel performance:

**Delivery Statistics**
- Total messages sent
- Successful deliveries
- Failed deliveries
- Pending messages

**Performance Indicators**
- Average delivery time
- Success rate percentage
- Error rate percentage
- Peak usage times

**Quality Metrics**
- Bounce rate (email)
- Failed SMS count
- Push delivery rate
- USSD completion rate

## Dependencies

Before modifying or deleting a channel, understand:

**Active Campaigns**
- Which campaigns use this channel
- Number of pending messages
- Delivery criticality

**Communication Policies**
- Which policies reference this channel
- Impact of channel changes

**Routes & Configuration**
- SMS routes dependencies
- SMTP configuration impact
- Gateway integrations

