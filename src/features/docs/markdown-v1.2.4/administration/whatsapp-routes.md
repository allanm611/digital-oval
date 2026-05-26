---
title: WhatsApp Routes
---

# WhatsApp Routes

WhatsApp Routes manage the connection between your WhatsApp channel and gateway providers that deliver messages. Each route maps to a provider and can be activated or deactivated independently.

## WhatsApp Routes List

The list displays all WhatsApp routes with:

- **Route Name** - The name of the WhatsApp route
- **Description** - Additional details about the route
- **Status** - Active or Inactive indicator
- **Actions** - Buttons for toggling status, editing, and deleting

### List Features

- **Search** - Find routes by name or description
- **Toggle Status** - Click the Activate/Deactivate button to enable or disable a route. Only active routes appear in dropdowns elsewhere in the app
- **Edit** - Click Edit to modify a route's details
- **Delete** - Click Delete to remove a route (confirmation required)

## Creating a WhatsApp Route

Click the **Create** button to open the form.

**Form Fields:**

**Route Configuration Section:**
- **Route Name** (required) - Unique name for this WhatsApp route (e.g., "Meta WhatsApp Business")
- **WhatsApp Gateway Configuration** (required) - Select the WhatsApp gateway provider
- **Description** (optional) - Details about the route's purpose or provider
- **Webhook URL** (optional) - URL for receiving delivery callbacks or message status updates

**WhatsApp Settings Section:**
- **Message Template Support** (optional dropdown) - Specify template support level (e.g., Yes, No, Limited)
- **Quality Threshold (%)** (optional number) - Minimum quality threshold for message delivery (0-100%, default: 50)

**Failover Configuration Section:**
- **Use backup route if this route fails** (optional checkbox) - Enable automatic failover to a backup route
  - If enabled, you can configure:
    - **Backup Route** - Which route to use if this route fails
    - **Retry Attempts Before Failover** - How many times to retry this route before switching to the backup route (default: 3)

Click **Save** to create the route. You'll be redirected to the WhatsApp routes list.

## Editing a WhatsApp Route

Click the **Edit** button on any route to modify its details.

**Editable Fields:**

- Route Name
- WhatsApp Gateway Configuration
- Description
- Webhook URL
- Message Template Support
- Quality Threshold (%)
- Use backup route if this route fails (and related backup settings)

Click **Save** to update the route.

## Toggling Route Status

From the WhatsApp routes list, use the **Activate/Deactivate** button in the Actions column to enable or disable a route:

- **Active** - Route is enabled and available for use
- **Inactive** - Route is disabled and hidden from dropdowns

Status changes apply immediately without needing to edit the route.

## Deleting a WhatsApp Route

Click the **Delete** button on any route to remove it.

1. Confirm the deletion when prompted
2. The route will be permanently deleted
3. You'll remain on the WhatsApp routes list

**Note:** Deletion cannot be undone.
