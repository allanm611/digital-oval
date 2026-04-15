# Notification Types

Notification types define the different kinds of events and actions that can trigger notifications to users in the system. They control which notifications are available for users to subscribe to in their notification preferences.

![Notification Types List](../../../../../../public/img/v1.1/configuration/notificationtypeslist.png)

## Accessing Notification Types

**Navigation:** Configuration → Notification Types

From the main Configuration page, Notification Types is available as a dedicated section. Use this view to:
- Review all available notification types at a glance
- Understand which system actions generate notifications
- Identify which notification types are active
- Manage notification type configuration

## What You Can Do

- Review notification types in one list
- Search by notification type name or description
- Create a new notification type
- Edit an existing notification type
- Delete a notification type
- View detailed configuration of a notification type

![Create Notification Type](../../../../../../public/img/v1.1/configuration/createnotificationtype.png)
![Edit Notification Type](../../../../../../public/img/v1.1/configuration/editnotificationtype.png)

## Why This Page Matters

Notification types provide a structured way to manage which events generate notifications. They ensure users can:
- Receive relevant updates based on their role and interests
- Control their notification preferences by subscribing/unsubscribing to specific types
- Filter the types of notifications they care about

Effective notification type management improves user engagement by delivering the right information at the right time.

## Key Concepts

**Notification Type Name** - The readable display name (e.g., "Campaign Approval Request", "Segment Computation Completed")

**Description** - Additional context about when and why this notification is sent

**Table Name** - The database table that triggers this notification (e.g., "campaigns", "segments", "offers")

**Action Type** - The type of action that triggers the notification (e.g., "CREATE", "UPDATE", "DELETE")

**Message Template** - The message content template for this notification

**Status** - Whether the notification type is active and available for users to subscribe to

## Creating and Managing Notification Types

To create a new notification type, click the **Create** button in the top right. Fill in the following fields:

- **Notification Type Name** (required): The readable name of the notification type
- **Description** (optional): Explain what triggers this notification and why users would care
- **Message Template** (required): The message content template for notifications of this type
- **Table Name** (required): Select the database table that triggers this notification
- **Action Type** (required): Select the type of action that triggers the notification (CREATE, UPDATE, DELETE)

You can edit or delete existing notification types using the actions in the list. Editing allows you to update any of the fields above. Deleting will permanently remove the notification type after confirmation.

## Tips

- Create notification types for all important system events you want to track
- Use clear, descriptive names so users understand what notifications they're subscribing to
- Ensure message templates are informative and include relevant details
- Keep descriptions updated to explain when notifications are sent
- Review inactive notification types periodically to clean up unused ones
- Test notification delivery before activating new notification types
