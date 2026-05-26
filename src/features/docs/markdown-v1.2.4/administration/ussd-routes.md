---
title: USSD Routes
---

# USSD Routes

USSD Routes manage the connection between your USSD channel and gateway providers that deliver messages. Each route maps to a provider and can be activated or deactivated independently.

## USSD Routes List

The list displays all USSD routes with:

- **Route Name** - The name of the USSD route
- **Description** - Additional details about the route
- **Status** - Active or Inactive indicator
- **Actions** - Buttons for toggling status, editing, and deleting

### List Features

- **Search** - Find routes by name or description
- **Toggle Status** - Click the Activate/Deactivate button to enable or disable a route. Only active routes appear in dropdowns elsewhere in the app
- **Edit** - Click Edit to modify a route's details
- **Delete** - Click Delete to remove a route (confirmation required)

## Creating a USSD Route

Click the **Create** button to open the form.

**Form Fields:**

**Route Configuration Section:**
- **Route Name** (required) - Unique name for this USSD route
- **USSD Gateway Configuration** (required) - Select the USSD gateway provider
- **Description** (optional) - Details about the route's purpose or provider

**USSD Configuration Section:**
- **USSD Code** (required) - The shortcode for USSD requests (e.g., *123#)
- **Network Code** (optional) - Specific network operator code if applicable
- **Session Timeout** (optional) - How long (in seconds) a USSD session remains active (default: 60)
- **Encoding** (optional) - Character encoding for messages:
  - UTF-8 (default)
  - GSM-7
  - UCS2

**Failover Configuration Section:**
- **Use backup route if this route fails** (optional checkbox) - Enable automatic failover to a backup route
  - If enabled, you can configure:
    - **Backup Route** - Which route to use if this route fails
    - **Retry Attempts Before Failover** - How many times to retry this route before switching to the backup route (default: 3)

Click **Save** to create the route. You'll be redirected to the USSD routes list.

## Editing a USSD Route

Click the **Edit** button on any route to modify its details.

**Editable Fields:**

- Route Name
- USSD Gateway Configuration
- Description
- USSD Code
- Network Code
- Session Timeout
- Encoding
- Use backup route if this route fails (and related backup settings)

Click **Save** to update the route.

## Toggling Route Status

From the USSD routes list, use the **Activate/Deactivate** button in the Actions column to enable or disable a route:

- **Active** - Route is enabled and available for use
- **Inactive** - Route is disabled and hidden from dropdowns

Status changes apply immediately without needing to edit the route.

## Deleting a USSD Route

Click the **Delete** button on any route to remove it.

1. Confirm the deletion when prompted
2. The route will be permanently deleted
3. You'll remain on the USSD routes list

**Note:** Deletion cannot be undone.
