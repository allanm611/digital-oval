# Notification Type List

View all available notification types and manage notification configuration for the platform.

## Accessing the List

**Navigation:** Configuration → Notification Types

## List Columns

**Notification Type Name** - The readable name of the notification type (e.g., "Campaign Approval Request", "Segment Computation Completed")

**Description** - Additional context about the notification

**Table Name** - The database table associated with this notification (e.g., "campaigns", "segments", "offers")

**Action Type** - The type of action that triggers the notification (CREATE, UPDATE, DELETE)

**Status** - Active or Inactive

**Actions** - Available management actions

## Using This View

Use this view to:
- Review all available notification types at a glance
- Understand which system actions generate notifications
- Identify which notification types are active
- Manage notification type configuration

## Search and Filtering

Use the **Search** field to find notification types by:
- Notification type name
- Description
- Table name
- Action type

This is helpful when you have many notification types configured.

## Action Buttons

Each notification type row has the following actions:

**Edit** - Opens the form to modify the notification type configuration

**View Details** - Opens the [Notification Type Details](/documentation/configuration/view-notification-type) page

**Delete** - Removes the notification type (requires confirmation)

## Create New Notification Type

Click the **Create** button in the top right to open the notification type creation form.

See [Create a Notification Type](/documentation/configuration/create-notification-type) for detailed steps.

## Empty State

If no notification types exist, the list shows a message prompting you to create the first notification type.

## Tips

- Create notification types for all important system events you want to track
- Use clear, descriptive names so users understand what notifications they're subscribing to
- Ensure message templates are informative and include relevant details
- Keep descriptions updated to explain when notifications are sent
- Review inactive notification types periodically to clean up unused ones
- Test notification delivery before activating new notification types
