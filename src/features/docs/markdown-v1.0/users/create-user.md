# Create User Or Edit User

## Overview

User creation and user editing both happen in the same modal workflow. The form is designed for quick account administration: create a new user from the users page, assign the user to a role, optionally place them in a department, and save without leaving the list view.

## Create User

Open the user form from **User Management → Users → Add User**. The page opens a modal rather than navigating away, which makes it easy to create an account and then return straight to the list.

![Add User Form](/img/v1.0/usermanagement-images/adduserimage.png)

For a new user, the modal collects the account identity first and then the access assignment.

### Core Identity Fields

- **First Name** and **Last Name** are required.
- **Email** is required and becomes the permanent email address for the account.
- **Username** is optional in the form. If it is left empty, the system derives it from the email address before creating the user.
- **Password** is required when creating a user and must be at least 8 characters long.

### Access And Organisation Fields

- **Role** is required. This is the primary access assignment for the user and is selected from the available roles loaded into the dropdown.
- **Department** is optional and is used for organisation and filtering.

When the form is submitted, the password is hashed before the create request is sent, then the account is created and the list refreshes.

## Edit User

Editing uses the same modal, but it opens with the existing values already filled in.

![Edit User Form](/img/v1.0/usermanagement-images/edituserimage.png)

The edit flow is intentionally narrower than the create flow. It is meant for maintaining account details and role placement without recreating the whole account record.

### What You Can Update

- First name
- Last name
- Role
- Department

### What Stays Fixed

- **Email** remains read-only after creation.
- **Username** is not edited in the update flow.
- **Password** is not changed from this modal.

If the selected role changes during edit, the user record is updated first and the new primary role is then assigned as part of the same save flow.

## When To Use This Page

Use the create flow when a staff member, admin, or operator needs a brand-new account. Use the edit flow when the person already exists and you only need to correct profile details or move them to a different role or department.

## Related Documentation

- [Users List](/documentation/users/users-list)
- [View User Details](/documentation/users/view-user-details)
- [Access Control](/documentation/users/access-control)
