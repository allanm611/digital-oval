# Access Control

## Overview

Access Control is the administrative workspace for defining how access is structured across the application. Instead of managing permissions user by user, this page works at the access-model level: create roles, define reusable permission records, and then attach those permissions to the right roles.

in the system, the page appears under **User Management → Access Control** and is organised into three tabs:

- **Roles Management**
- **Permissions**
- **Assign Permissions**

## How The Page Works

The page follows a simple access pattern:

- roles group together a set of responsibilities or access levels
- permissions describe individual actions such as create, read, update, delete, execute, or manage
- permissions are attached to roles rather than assigned directly here to individual users

That structure keeps access easier to reason about. Most administrative work follows a sequence: define a role, define or review the permissions available in the system, then assign the correct permissions to that role.

## Tab Structure

Each tab serves a different part of that workflow:

- **Roles Management** is where role records are created, edited, cloned, activated, deactivated, and deleted.
- **Permissions** is where permission records are maintained and their action/security settings are controlled.
- **Assign Permissions** is where a role is selected and its permission set is built or cleaned up.

Together, the three tabs form one workflow rather than three unrelated screens.

## When To Use This Page

Use Access Control when you need to introduce a new role, clean up old role definitions, add new permission records for new product capabilities, or adjust which permissions belong to a role. If the task is about one person’s account profile, the users pages are the better place to start. If the task is about how access is modeled across many users, this page is the right one.

## Related Documentation

- [Role Management](/documentation/users/role-management)
- [Permissions](/documentation/users/permissions)
- [Assign Permissions](/documentation/users/assign-permissions)
- [Users List](/documentation/users/users-list)
