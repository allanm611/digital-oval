# Assign Permissions

## Overview

Assign Permissions is the tab where the access model becomes concrete. After roles and permissions have been defined, this screen is used to decide exactly which permissions belong to a selected role.

This is a role-first workflow: choose one role, review the available permission catalogue, and then add or remove permissions until the role has the correct access profile.

## Select A Role

The first step is to choose the role you want to work on from the **Select Role** dropdown.

![Assign Permissions Select Role Dropdown](/img/v1.1/usermanagement-images/assignpermissionsselectroledropdownimage.png)

Once a role is selected, a badge shows the current assignment summary in the form `assigned / total permissions`. This gives immediate context before any edits are made.

## Permission List For The Selected Role

After a role is selected, the tab shows the permission catalogue with a search field above it. The search matches permission name, code, or action, which makes it practical to narrow the list before assigning or removing anything.

![Assign Permissions Table](/img/v1.1/usermanagement-images/assignpermissionstable.png)

The table shows the permission name, code, action, sensitive flag, and the current assignment control for that row. The row action changes depending on whether the permission is already assigned to the role.

## Per-Permission Assignment

For one-off changes, the row-level controls are the simplest path:

- **Assign** adds the selected permission to the role
- **Unassign** removes the permission from the role

This is useful when you are making a small adjustment or validating one permission at a time.

## Selection Mode And Bulk Actions

For larger access changes, the page supports selection mode. Click **Select Multiple** in the page header to enter bulk-selection mode.

When selection mode is active:

- checkboxes appear in the table
- visible permissions can be selected individually or through the header checkbox
- a bulk toolbar appears when there is an active selection

![Assign Permissions Bulk Operations](/img/v1.1/usermanagement-images/assignpermissionsbulkoperationimage.png)

The toolbar is context-aware:

- if the visible selection contains unassigned permissions, you can use **Assign Selected**
- if the visible selection contains assigned permissions, you can use **Remove Selected**
- if both states are present across the visible set, both actions can appear

This makes the bulk workflow useful for both initial setup and cleanup work.

## Save Feedback And Result

When permissions are assigned successfully, the page updates the local role assignment state and shows a success message so the administrator can confirm the change immediately.

![Assign Permission to Role Success](/img/v1.1/usermanagement-images/assignpermissiontorolesuccessimage.png)

## Related Documentation

- [Access Control](/documentation/users/access-control)
- [Role Management](/documentation/users/role-management)
- [Permissions](/documentation/users/permissions)
- [Create User](/documentation/users/create-user)
