# Notification Type Details

View complete information about a notification type including its configuration, message template, and trigger conditions.

## Accessing Notification Type Details

From the [Notification Type List](/documentation/configuration/notification-types-list):

1. Find the notification type you want to view
2. Click the **View Details** button (eye icon) on the row

The details page opens showing the complete notification type configuration.

## Notification Type Information

**Notification Type Name**
- The readable identifier for this notification type
- Displayed to users when they manage their notification preferences

**Description**
- Additional context about when and why this notification is sent
- Helps users understand what triggers this notification

**Status**
- Active or Inactive
- Active notification types are available for users to subscribe to
- Inactive notification types are hidden from user preferences

## Notification Configuration

**Table Name** - The database table associated with this notification type (e.g., "campaigns", "segments", "offers")

**Action Type** - The type of action that triggers the notification
- CREATE - Triggered when a new record is created
- UPDATE - Triggered when an existing record is updated
- DELETE - Triggered when a record is deleted

**Message Template** - The message content sent to users when this notification is triggered
- May include dynamic variables based on the trigger context
- This is the actual message users see in their inbox

## Editing

To modify this notification type:

1. Click the **Edit** button
2. Update the desired fields:
   - Notification type name
   - Description
   - Message template
   - Status
3. Click **Save** to apply changes

## Deleting

To remove this notification type:

1. Click the **Delete** button
2. Confirm deletion in the modal
3. The notification type is permanently removed

**Warning:** Ensure no users are actively subscribed to this notification type before deleting, or the subscription will become orphaned.

## Using This Notification Type

Once created, this notification type can be:

- Subscribed to by users in their notification preferences
- Used to generate notifications when the trigger condition occurs
- Modified or deactivated as needed
- Referenced in user notification histories and analytics

## Tips

- Keep notification type names clear and concise
- Update descriptions if the notification behavior changes
- Monitor notification types to ensure they're delivering relevant information
- Deactivate notification types that are no longer needed instead of deleting them
- Test message templates to ensure they display properly
- Review user subscription patterns to understand which notifications are most valuable
