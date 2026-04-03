# Role Management

## Overview

Role Management is the first tab on the Access Control page.

Use it to create, edit, clone, activate/deactivate, and delete roles.


## Access Path

1. Open the dashboard.
2. Go to **Access Control**.
3. Select the **Roles Management** tab.


## Roles Table

The tab displays roles in a table with these columns:

- **Role Name**
- **Code**
- **Level**
- **Data Access**
- **Users**
- **Status**
- **Actions**

Status is shown as **Active** or **Inactive**.


## Search And Filters

You can narrow the roles list using:

- **Search roles...** (matches role name or code)
- **All Levels / Level filter**
- **All Data Access / Data access filter**

When filters change, pagination resets to the first page.

---

## Actions In The Roles Tab

Each role row provides these actions:

- **Edit**
- **Clone**
- **Deactivate / Reactivate**
- **Delete**

### Clone Role

Clone opens a modal with:

- **Role Name**
- **Role Code**
- **Description**

Saving creates a new role from the selected role.

### Deactivate Role

Deactivating a role opens a confirmation modal that requires:

- **Deactivation Reason** (required)
- **Deactivate child roles too** (optional checkbox)

System and default roles cannot be deactivated while active.

### Reactivate Role

Inactive roles can be reactivated from the row action.

### Delete Role

Delete opens a confirmation dialog and removes the selected role after confirmation.

## Create Or Edit Role

Use **Create Role** to open the role form.

Role form fields:

- **Role Name** (required)
- **Code** (required)
- **Description** (optional)
- **Role Level**
- **Data Access Level** (optional)
- **Parent Role** (optional)
- **Max Users** (optional)
- **Set as Default** (checkbox)
- **Tags** (enter and add)

On edit, **Code** is read-only.

### Validation

- Role name is required.
- Role code is required.
- Parent role must exist if selected.
- Max users must be greater than 0 when provided.

Duplicate role name/code responses are shown as field errors.

## Empty State

If no roles match the current search/filter, the page shows:

- `No roles found matching the selected filters`

## Related Topics

- [Access Control](/documentation/users/access-control)
- [Permissions](/documentation/users/permissions)
- [Assign Permissions](/documentation/users/assign-permissions)
- [Users List](/documentation/users/users-list)
