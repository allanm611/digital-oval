# Permissions

## Overview

Permissions is the second tab on the Access Control page.

Use it to view, create, edit, activate, and deactivate permission records.

## Access Path

1. Open Dashboard.
2. Go to Access Control.
3. Select the **Permissions** tab.

## Permissions Table

The table shows:

- Permission Name
- Code
- Action
- Sensitive
- Requires MFA
- Status
- Actions

Status is displayed as **Active** or **Inactive**.

## Search And Filter

The tab supports:

- Search (`Search permissions...`) by permission name or code
- Action filter (`All Actions`)

When search/filter changes, pagination resets to page 1.

## Row Actions

Each permission row provides:

- **Edit**
- **Deactivate** (for active records)
- **Reactivate** (for inactive records)

## Create Or Edit Permission

Use **Create Permission** to open the modal.

Permission modal fields:

- Permission Name (required)
- Code (required)
- Description (optional)
- Action (required)
- Resource Type ID (optional)
- Mark as Sensitive (checkbox)
- Requires MFA Authentication (checkbox)
- Requires Justification (checkbox)

On edit, **Code** is read-only.

## Validation

- Permission name is required.
- Permission code is required.
- Code must use dot notation.
- Action must be valid.

Duplicate name/code responses are shown as field errors.

## Empty State

If no permissions match current filters, the page shows:

- `No permissions found matching the selected filters`

## Related Topics

- [Access Control](/documentation/users/access-control)
- [Role Management](/documentation/users/role-management)
- [Assign Permissions](/documentation/users/assign-permissions)
- [View User Details](/documentation/users/view-user-details)
