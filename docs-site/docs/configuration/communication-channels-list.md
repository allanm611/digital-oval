# Communication Channels

## Overview

Communication Channels define the different methods available for sending messages to customers. Each channel represents a distinct communication medium with its own configuration, delivery mechanisms, and capabilities.

## Available Channels

### SMS Channels

#### SMS - Normal
- **Description:** Standard SMS delivery routed via telecom SMSC (Short Message Service Center)
- **Use Case:** Standard text messages, notifications, alerts
- **Status:** Active by default
- **Characteristics:**
  - Full SMS compatibility
  - Universal mobile reach
  - Standard delivery speed
  - Character limitations apply

#### SMS - Flash
- **Description:** Flash SMS (display only) used for urgent notifications
- **Use Case:** Urgent alerts that display without user action
- **Status:** Active by default
- **Characteristics:**
  - Appears directly on screen
  - No storage on device
  - Limited to 160 characters
  - Ideal for critical alerts

### Email Channel

#### Email
- **Description:** Transactional and marketing email channel
- **Use Case:** Account notifications, marketing campaigns, password resets
- **Status:** Active by default
- **Characteristics:**
  - Rich formatting support
  - Attachments allowed
  - Large message capacity
  - Trackable delivery

### USSD Channels

#### USSD - Push
- **Description:** Push USSD messages triggered automatically
- **Use Case:** Automatic USSD messages, non-interactive alerts
- **Status:** Can be active/inactive
- **Characteristics:**
  - Automatic triggering
  - Quick customer response
  - Session-based interaction
  - Mobile-first experience

#### USSD - Interactive
- **Description:** Interactive USSD menu journeys
- **Use Case:** Multi-step customer interactions, menu-driven services
- **Status:** Active by default
- **Characteristics:**
  - Menu-driven navigation
  - Customer input collection
  - Complex workflows supported
  - Limited display on mobile

### Push Notification Channel

#### Push Notification
- **Description:** Mobile app push via FCM/APNS (Firebase Cloud Messaging / Apple Push Notification Service)
- **Use Case:** In-app notifications, app engagement, time-sensitive alerts
- **Status:** Active by default
- **Characteristics:**
  - App-only delivery
  - Rich media support
  - Real-time delivery
  - High engagement rates

## Accessing Communication Channels

1. Navigate to **Configuration** from the main menu
2. Select **Communication Channels**
3. The system displays all configured channels

## Channel List Features

### Search & Filter
- Use the search field to find channels by name or description
- Real-time search results
- Filter by channel type

### Display Information

Each channel shows:
- **Channel Name** - The identifier and type
- **Description** - Purpose and use case
- **Status** - Active (green) or Inactive (blue) badge
- **Created/Updated** - Timestamp information

### Status Indicators

- **Active** (Green badge) - Channel is available for campaigns
- **Inactive** (Blue badge) - Channel exists but cannot be used

### Available Actions

For each channel, you can:
- **Edit** - Modify channel name or description
- **Delete** - Remove the channel (if not in use)
- **View Details** - Click channel name for full information

## Toggling Channel Availability

To activate or deactivate a channel:
1. Click the channel from the list
2. Edit the channel
3. Toggle the Status field
4. Save changes

## SMS Routes Integration

SMS channels can be connected to SMS Routes:
- Click on any SMS channel
- View linked SMS routes
- Configure gateway providers
- See [SMS Routes](../routes) for details

## Channel Dependencies

Before deleting a channel, check:
- Is it used by active campaigns?
- Is it referenced in communication policies?
- Are there pending messages using this channel?

## Best Practices

- Keep commonly used channels active
- Document the purpose of each channel
- Review inactive channels quarterly
- Test new channels with pilot campaigns
- Maintain redundancy for critical channels
- Monitor delivery rates by channel

## Related Documentation

- [Create Communication Channel](./create-communication-channel) - Add new channels
- [Edit Communication Channel](./edit-communication-channel) - Modify channels
- [View Communication Channel](./view-communication-channel) - See channel details
