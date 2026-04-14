# View User Details

## Overview

The User Details page brings everything known about one account into a single view. It is the page you use when the list view is no longer enough and you need to understand the person’s profile, access footprint, and reporting relationships together.

The page is organised into three tabs:

- **Overview** for profile and account state
- **Permissions** for access visibility
- **Reports** for reporting lines and team structure

## Accessing User Details

Open the page from the users list by clicking the row’s **View** action.

At the top of the page, the back button returns you to the previous list context and a status badge keeps the account state visible while you move across tabs.

## Overview Tab

The **Overview** tab is the profile summary for the selected user. It is meant to answer the practical questions first: who the user is, where they sit in the organisation, and whether the account can currently be used.

![User Details Overview Tab](/img/usermanagement-images/userdetailsoverviewtab.png)

The content is arranged into information blocks that cover:

- personal identity details such as full name, username, email, and phone number when available
- work context such as department, role, job title, and data access level when available
- security and access indicators such as current status, MFA state, login eligibility, and PII access when present
- activity timing such as created date, updated date, and last login

This tab is the fastest place to validate whether the account is configured correctly before making a deeper access decision.

## Permissions Tab

The **Permissions** tab explains what the user can do in the system and how that access is structured.

![User Details Permissions Tab](/img/usermanagement-images/userdetailspermissionstabimage1.png)

![User Permissions Summary And Categories](/img/usermanagement-images/userdetailspermissionstabimage2.png)

![User Assigned Roles](/img/usermanagement-images/userdetailspermissionstabimage3.png)

When permission data is available, the page combines a summary layer with a detailed layer:

- summary cards show the overall permission footprint, including total permissions, sensitive permissions, MFA-required permissions, and role count
- grouped categories make it easier to understand which parts of the platform the user can access
- the full permission list shows the permission name, code, description, and status
- assigned role chips show the role context behind the user’s access

This tab is useful when you are validating why a user has access, preparing a role cleanup, or confirming the result of a role change.

## Reports Tab

The **Reports** tab focuses on organisational relationships. It shows who reports to the selected user and where the user sits in the wider reporting chain.

![User Details Reports Tab](/img/usermanagement-images/userdetailsreportstab.png)

The page can show:

- **Direct Reports** for immediate team members
- **All Reports** for the wider reporting tree beneath the user
- **Manager Chain** for the managers above the user

Each related person is navigable, so the reports view also acts as a quick route into another user’s details page.

## Related Documentation

- [Users List](/documentation/users/users-list)
- [Create User](/documentation/users/create-user)
- [Access Control](/documentation/users/access-control)
