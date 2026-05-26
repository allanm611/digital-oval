# Communication Routes

## Overview

Communication Routes establish the connection between your messaging channels (SMS, Email, USSD, Push, WhatsApp) and external gateway providers that actually deliver messages to customers. Routes Management provides a unified view of all routes across all channels in one place.

## Accessing Routes Management

Navigate to **Administration → Routes Management** to see all communication routes across all channels.

## Routes Management Page

The routes management page displays all routes in a unified table with:

- **Name** - Route name identifier
- **Description** - Additional details about the route
- **Channel** - Which communication channel the route is for (SMS, Email, WhatsApp, Push, USSD)
- **Gateway Provider** - The external provider name (e.g., Twilio, SendGrid, Firebase)
- **Status** - Active or Inactive indicator
- **Actions** - Edit or Delete buttons

### Search and Filter

**Search:**
- Search for routes by name

**Filter by Channel:**
- All Channels - Show all routes
- SMS - Show only SMS routes
- Email - Show only Email routes
- WhatsApp - Show only WhatsApp routes
- Push Notification - Show only Push routes
- USSD - Show only USSD routes

## Creating Routes

Routes are created individually for each channel. To create a new route:

1. Navigate to the specific channel page:
   - [SMS Routes](/documentation/administration/sms-routes)
   - [Email Routes](/documentation/administration/email-routes)
   - [Push Notification Routes](/documentation/administration/push-routes)
   - [USSD Routes](/documentation/administration/ussd-routes)
   - [WhatsApp Routes](/documentation/administration/whatsapp-routes)

2. Click **Create** to add a new route for that channel

Each channel has unique configuration options specific to that provider type.

## Editing Routes

From the Routes Management page:

1. Find the route you want to edit in the table
2. Click the **Edit** button
3. You'll be taken to the channel-specific edit page
4. Modify the route details
5. Click **Save** to apply changes

## Deleting Routes

From the Routes Management page:

1. Find the route you want to delete
2. Click the **Delete** button
3. Confirm deletion in the modal
4. The route will be permanently removed

## Route Status

Routes can be Active or Inactive:

- **Active** - Route is enabled and available for use in campaigns and communications
- **Inactive** - Route is disabled and not available for use

To toggle status, visit the specific channel's route page and use the Activate/Deactivate button.

## Channel-Specific Documentation

Each channel has different configuration options:

- [SMS Routes](/documentation/administration/sms-routes) - Configure SMS gateway, sender IDs, and backup routing
- [Email Routes](/documentation/administration/email-routes) - Configure SMTP gateway and status
- [Push Notification Routes](/documentation/administration/push-routes) - Configure push gateway, platforms, TTL, and priority
- [USSD Routes](/documentation/administration/ussd-routes) - Configure USSD gateway, code, encoding, and session timeout
- [WhatsApp Routes](/documentation/administration/whatsapp-routes) - Configure WhatsApp gateway, webhook, and quality settings
