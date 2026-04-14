# Role Management

## Overview

Role Management is the first tab on the Access Control page and the starting point for shaping the access hierarchy. It is used to define what kinds of user roles exist in the system, how they relate to one another, and whether each role is currently active for use.

![Roles Management Page](/img/v1.0/usermanagement-images/rolesmanagementpage.png)

## What The Tab Shows

The main table lists role records with the information an administrator usually needs before taking action:

- role name
- role code
- role level
- data access level
- current user count
- active or inactive status
- row actions

This makes the page useful both for designing new access structures and for auditing the current role catalogue.

## Search And Filters

The toolbar above the table helps narrow the role list quickly:

- **Search roles...** matches by role name or code
- **All Levels** filters by role level
- **All Data Access** filters by data access level

These controls are intended for finding the role you want to work on without leaving the tab or loading a separate details page.

## Row Actions

Each role row includes the operational actions used most often in access administration:

- **Edit** to update the role definition
- **Clone** to copy the role into a new starting point
- **Deactivate** or **Reactivate** to change availability
- **Delete** to remove the role

### Clone Role

Cloning is useful when a new role should start from an existing structure. The copy dialog asks for a new role name, role code, and description, then creates a separate role record based on the selected one.

### Deactivate Or Reactivate

If a role is active, deactivation opens a confirmation dialog that requires a reason and optionally allows child roles to be deactivated as well. If a role is already inactive, it can be reactivated directly from the row action. Active system roles and default roles are protected from direct deactivation.

### Delete

Delete removes the role after confirmation. This is intended for cleanup when a role should no longer exist at all rather than just being made inactive.

## Create Or Edit Role

The **Create Role** button opens the main role form. The same form is reused for editing.

![Create Role Form](/img/v1.0/usermanagement-images/createrole.png)

![Edit Role Form](/img/v1.0/usermanagement-images/editrole.png)

The form captures the structural parts of a role:

- **Role Name** and **Code** as the core identifiers
- **Description** for context
- **Role Level** to position the role in the access hierarchy
- **Data Access Level** when data scope matters
- **Parent Role** for hierarchical relationships
- **Max Users** when the role should be limited
- **Set as Default** for default assignment behavior
- **Tags** for categorisation or internal organisation

When editing an existing role, the code stays read-only so the role’s identity remains stable.

## Validation And Errors

The form validates the required pieces of the role definition before save:

- role name is required
- role code is required
- the selected parent role must exist
- max users must be greater than 0 when provided

If the backend returns duplicate name or code errors, those are shown back in the form as field-level validation messages.

## Related Documentation

- [Access Control](/documentation/users/access-control)
- [Permissions](/documentation/users/permissions)
- [Assign Permissions](/documentation/users/assign-permissions)
- [Users List](/documentation/users/users-list)
