# Assign Permissions

## Overview

Assign Permissions is the third tab on the Access Control page.

Use it to assign or remove permissions for a selected role.

## Access Path

1. Open Dashboard.
2. Go to Access Control.
3. Select the **Assign Permissions** tab.

## Select Role

At the top of the tab:

- Use **Select Role** dropdown.
- After selection, a badge shows `assigned/total` permissions for that role.

## Permissions Table For Selected Role

The table includes:

- Permission Name
- Code
- Action
- Sensitive
- Assign/Unassign controls

A search box filters permissions by name, code, or action.

If no role is selected, the tab shows a prompt to select a role.

## Per-Permission Actions

For each permission row:

- **Assign** adds the permission to the selected role.
- **Unassign** removes the permission from the selected role.

## Selection Mode And Bulk Actions

The page supports multi-select mode:

- Click **Select Multiple** in the page header to enter selection mode.
- Checkboxes appear in the permissions table.
- A bulk toolbar appears when items are selected.

Bulk actions:

- **Assign Selected**: assigns selected unassigned permissions
- **Remove Selected**: removes selected assigned permissions

Selection mode also supports select-all behavior for visible permissions.

## Notes

- The tab works at role-permission level, not user edit forms.
- Role assignment to users is documented under user creation/edit flows.

## Related Topics

- [Access Control](/documentation/users/access-control)
- [Role Management](/documentation/users/role-management)
- [Permissions](/documentation/users/permissions)
- [Create User](/documentation/users/create-user)
