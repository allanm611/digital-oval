# Permissions

## Overview

The Permissions tab is where the individual access records are maintained. If roles describe broad responsibility, permissions describe the exact actions a role is allowed to perform. This tab is where those action records are created, reviewed, and updated.

![Permissions Management List](/img/usermanagement-images/permissionsmanagementlist.png)

## Permissions Table

The table is designed to make permission records easy to scan and compare. Each row shows:

- permission name
- code
- action
- whether the permission is marked as sensitive
- whether MFA is required
- active or inactive status
- row actions

That combination makes it possible to review both the functional meaning of a permission and its security expectations from one place.

## Search And Filtering

The toolbar supports two quick narrowing tools:

- **Search permissions...** for matching by permission name or code
- **All Actions** for filtering by action type such as create, read, update, delete, execute, or manage

This is especially useful once the permission catalogue grows and several permissions share a similar resource name.

## Row Actions

Each permission record can be managed directly from the table:

- **Edit** opens the permission form with the current values loaded
- **Deactivate** switches an active permission off
- **Reactivate** switches an inactive permission back on

The status toggle is useful when a permission should remain part of the catalogue but should not currently be used for assignment.

## Create Or Edit Permission

The **Create Permission** button opens the permission form, which is also reused for edit.

![Create Permission Form](/img/usermanagement-images/createpermission.png)

The form defines both the access meaning and the security expectations of the permission:

- **Permission Name** for the human-readable label
- **Code** for the system identifier
- **Description** for context
- **Action** for the operation type
- **Resource Type ID** when a specific resource type needs to be referenced
- **Mark as Sensitive** to flag high-risk access
- **Requires MFA Authentication** when stronger sign-in should be enforced
- **Requires Justification** when the action should require explanation

When editing an existing permission, the code remains read-only so the permission identifier is not changed after creation.

## Validation

Before save, the form validates the core rules of the permission model:

- permission name is required
- permission code is required
- code must use dot notation
- action must match a valid supported action

If duplicate names or codes already exist, the form shows those as field-level errors so the administrator can correct them immediately.

## Related Documentation

- [Access Control](/documentation/users/access-control)
- [Role Management](/documentation/users/role-management)
- [Assign Permissions](/documentation/users/assign-permissions)
- [View User Details](/documentation/users/view-user-details)
