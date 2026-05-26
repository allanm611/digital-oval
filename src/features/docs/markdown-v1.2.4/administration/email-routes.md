---
title: Email Routes
---

# Email Routes

Email Routes manage the connection between your Email channel and gateway providers that deliver messages. Each route maps to a provider and can be activated or deactivated independently.

## Email Routes List

The list displays all email routes with:

- **Route Name** - The name of the email route
- **Description** - Additional details about the route
- **Status** - Active or Inactive indicator
- **Actions** - Buttons for toggling status, editing, and deleting

### List Features

- **Search** - Find routes by name or description
- **Toggle Status** - Click the Activate/Deactivate button to enable or disable a route. Only active routes appear in dropdowns elsewhere in the app
- **Edit** - Click Edit to modify a route's details
- **Delete** - Click Delete to remove a route (confirmation required)

## Creating an Email Route

Click the **Create** button to open the form.

**Form Fields:**

**Route Configuration Section:**
- **Route Name** (required) - Unique name for this email route (e.g., "Primary Email Route", "Sendgrid SMTP")
- **Email Gateway Configuration** (required) - Select the SMTP gateway provider to use
- **Description** (optional) - Details about the route's purpose or provider
- **Use backup route if this route fails** (optional checkbox) - Enable automatic failover to a backup route
  - If enabled, you can configure:
    - **Backup Route** - Which route to use if this route fails
    - **Retry Attempts Before Failover** - How many times to retry this route before switching to the backup route (default: 3)

Click **Save** to create the route. You'll be redirected to the email routes list.

## Editing an Email Route

Click the **Edit** button on any route to modify its details.

**Editable Fields:**

- Route Name
- Email Gateway Configuration
- Description
- Use backup route if this route fails (and related backup settings)

Click **Save** to update the route.

## Toggling Route Status

From the email routes list, use the **Activate/Deactivate** button in the Actions column to enable or disable a route:

- **Active** - Route is enabled and available for use
- **Inactive** - Route is disabled and hidden from dropdowns

Status changes apply immediately without needing to edit the route.

## Deleting an Email Route

Click the **Delete** button on any route to remove it.

1. Confirm the deletion when prompted
2. The route will be permanently deleted
3. You'll remain on the email routes list

**Note:** Deletion cannot be undone.
