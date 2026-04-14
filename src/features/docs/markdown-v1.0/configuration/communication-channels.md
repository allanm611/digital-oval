# Communication Channels Overview

Communication Channels are the foundation of the messaging infrastructure. They represent the different methods available for sending messages to customers SMS, Email, USSD, and Push Notifications.

## What are Communication Channels?

Communication Channels define:
- **How** messages are sent (via SMS, Email, USSD, Push)
- **Which** providers handle delivery (SMS gateways, SMTP servers, USSD providers, FCM/APNS)
- **Configuration** specific to each channel type
- **Availability** for use in campaigns and communications

## Default Communication Channels

### SMS Channels
- **SMS - Normal:** Standard text message delivery
- **SMS - Flash:** Display-only urgent notifications

### Email Channel
- **Email:** Transactional and marketing emails

### USSD Channels
- **USSD - Push:** Automatic USSD messages
- **USSD - Interactive:** Menu-driven customer interactions

### Push Notifications Channel
- **Push Notification:** Mobile app notifications via FCM/APNS

## Key Features

### Channel Management
- Create new communication channels
- Edit existing channel configuration
- Activate or deactivate channels
- Delete unused channels
<!-- 
### Configuration
- Set channel name and description
- Define channel type and purpose
- Configure gateway credentials
- Set delivery preferences

### Integration
- Link SMS routes to SMS channels
- Configure SMTP for email delivery
- Set up USSD gateway connections
- Configure FCM/APNS for push notifications -->


## Communication Channels List

Navigate to **Configuration → Communication Channels** to manage all communication channels.

![Communication Channels List](/img/v1.0/configuration/communicationchannelslist.png)

The list displays all configured channels with options to:
- View complete configuration
- Edit channel settings
- Activate or deactivate channels
- Delete unused channels

## Creating a Communication Channel

### Steps

1. Click **Create Channel** button
2. Enter **Channel Name** - Unique identifier for the channel
3. Enter **Description** - Explain the channel's purpose
4. Select **Channel Type** from dropdown:
   - SMS (Normal)
   - SMS (Flash)
   - Email
   - USSD (Push)
   - USSD (Interactive)
   - Push Notification

<!-- 5. Configure **Channel-Specific Settings**: -->

<!-- #### SMS Channel Configuration
- **Gateway Provider** - Select SMS provider (e.g., Twilio, Amazon SNS)
- **Provider Credentials** - Enter API key/account details
- **Sender ID** - Set default sender name/number
- **Rate Limiting** - Configure message sending rate

#### Email Channel Configuration
- **SMTP Server** - Email service provider details
- **SMTP Host** - Server address
- **SMTP Port** - Port number (usually 587 or 465)
- **Authentication** - Username and password
- **From Email** - Default sender email address
- **SSL/TLS** - Enable secure connection

#### USSD Channel Configuration
- **USSD Gateway Provider** - Select provider
- **Provider Credentials** - API keys and authentication
- **Service Code** - USSD service code
- **Menu Configuration** - Default menu settings

#### Push Notification Configuration
- **FCM/APNS Provider** - Select Firebase or Apple Push
- **Server Key/Certificate** - Provider credentials
- **App Configuration** - App ID and settings

6. Set **Status** - Active or Inactive
7. Click **Save** to create the channel

![Create Communication Channel](/img/v1.0/configuration/create-communication-channel.png)

--- -->

## Editing a Communication Channel

Click **Edit**  to modify:

1. **Channel Name** - Update the channel identifier
2. **Description** - Modify channel purpose
<!-- 3. **Channel-Specific Settings**:
   - Update provider credentials (if needed)
   - Modify sender ID or email settings
   - Adjust rate limiting or configuration
4. **Status** - Enable or disable the channel -->
3. Click **Save** to apply changes

![Edit Communication Channel](/img/v1.0/configuration/editcommunicationchannel.png)

<!-- **Note:** 
- Changes apply to future communications only
- Already-scheduled messages are not affected
- Cannot change channel type after creation

--- -->

## Deleting a Communication Channel

Click **Delete** (trash icon) to remove a channel:
<!-- 
**Warning:** Cannot delete a channel that is:
- Currently in use by active campaigns
- Referenced by SMS routes
- Set as default channel for any channel type

**Resolution:**
1. Reassign all campaigns and routes to different channels
2. Remove channel from any default assignments
3. Then delete the channel

--- -->
<!-- 
## Channel Activation/Deactivation

Toggle the **Status** switch to:
- **Activate**: Make channel available for campaigns
- **Deactivate**: Temporarily disable without deleting

--- -->

## Next Steps

After configuring communication channels:
- [Configure SMS Routes](/documentation/configuration/sms-routes) — Set up SMS delivery
- [Campaign Communication Policy](/documentation/configuration/campaign-communication-policy-list) — Define frequency and compliance policies
- [Configure Sender IDs](/documentation/configuration/sender-ids) — Set up sender identities
- [Create Campaign](/documentation/campaigns/create-campaign) — Use channels in campaigns

