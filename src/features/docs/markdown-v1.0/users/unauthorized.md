# Unauthorized Access

## Overview

The Unauthorized Access page appears when a logged-in user opens a route or feature that is blocked by permission rules. It is a guard page, meaning the system has identified the request but the current account does not have the required access scope for that operation.

![Unauthorized Access](/img/v1.0/usermanagement-images/unauthorizedaccessimage.png)

## What The Message Means

**Message:** "You don't have the permissions to view this page"

In practice, this usually means one of the following:

- the current role does not include the required permission code
- the user is signed in with a different account than expected
- the role assignment was recently changed and the session needs to be refreshed

## Resolving Unauthorized Access

If access is expected, use this sequence:

1. Confirm you are signed in with the intended account.
2. Retry after signing out and signing back in.
3. If access is still blocked, ask an administrator to review your role and permission assignment.

## Navigation

Use **Back to Dashboard** to return to pages that are currently allowed for your account.

## Role And Permission Context

Access in this platform is role-based. Roles are assigned to users, and each role carries a defined set of permission codes. If you should be able to open a page but receive this screen, an administrator should verify:

- your current primary role
- whether the required permission is attached to that role
- whether recent role-permission changes have been applied to your session

## Related Documentation

- [Access Control](/documentation/users/access-control)
- [Role Management](/documentation/users/role-management)
- [Assign Permissions](/documentation/users/assign-permissions)
