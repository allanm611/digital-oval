---
title: Push Notification Routes
---

# Push Notification Routes

Push Notification Routes manage the connection between your Push channel and gateway providers that deliver notifications. Each route maps to a provider and can be activated or deactivated independently.

## Push Notification Routes List

The list displays all push notification routes with:

- **Route Name** - The name of the push notification route
- **Description** - Additional details about the route
- **Status** - Active or Inactive indicator
- **Actions** - Buttons for toggling status, editing, and deleting

### List Features

- **Search** - Find routes by name or description
- **Toggle Status** - Click the Activate/Deactivate button to enable or disable a route. Only active routes appear in dropdowns elsewhere in the app
- **Edit** - Click Edit to modify a route's details
- **Delete** - Click Delete to remove a route (confirmation required)

## Creating a Push Notification Route

Click the **Create** button to open the form.

**Form Fields:**

**Route Configuration Section:**
- **Route Name** (required) - Unique name for this push notification route (e.g., "Firebase Production")
- **Push Gateway Configuration** (required) - Select the push gateway provider
- **Description** (optional) - Details about the route's purpose or provider
- **Webhook URL** (optional) - URL for receiving delivery callbacks or events
- **Supported Platforms** (checkboxes) - Select which platforms this route supports (iOS, Android, Web, etc.)

**Delivery Settings Section:**
- **Default TTL (seconds)** (optional) - How long (in seconds) the notification is valid before expiry (default: 3600)
- **Priority Level** (optional) - Set the delivery priority (NORMAL, HIGH, etc.)

**Failover Configuration Section:**
- **Use backup route if this route fails** (optional checkbox) - Enable automatic failover to a backup route
  - If enabled, you can configure:
    - **Backup Route** - Which route to use if this route fails
    - **Retry Attempts Before Failover** - How many times to retry this route before switching to the backup route (default: 3)

Click **Save** to create the route. You'll be redirected to the push notification routes list.

## Editing a Push Notification Route

Click the **Edit** button on any route to modify its details.

**Editable Fields:**

- Route Name
- Push Gateway Configuration
- Description
- Webhook URL
- Supported Platforms
- Default TTL
- Priority Level
- Use backup route if this route fails (and related backup settings)

Click **Save** to update the route.

## Toggling Route Status

From the push notification routes list, use the **Activate/Deactivate** button in the Actions column to enable or disable a route:

- **Active** - Route is enabled and available for use
- **Inactive** - Route is disabled and hidden from dropdowns

Status changes apply immediately without needing to edit the route.

## Deleting a Push Notification Route

Click the **Delete** button on any route to remove it.

1. Confirm the deletion when prompted
2. The route will be permanently deleted
3. You'll remain on the push notification routes list

**Note:** Deletion cannot be undone.
