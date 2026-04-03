# View User Details

## Overview

User Details shows one user record with three tabs:

- Overview
- Permissions
- Reports

## Accessing User Details

From Users List:

1. Go to User Management → Users
2. Click **View** button (eye icon) next to user name
3. User details page opens with tabs

## Header Area

At the top of the page:

- A back button returns to the users list (or previous list context)
- A status chip shows the current account status

## Tab 1: Overview

Overview contains two columns of information blocks.

Personal Information includes:

- Full Name
- Username
- Email
- Phone Number (when available)

Work Information includes:

- Department (when available)
- Role
- Job Title (shown when different from role name)
- Data Access Level (when available)

Security & Access includes:

- Status
- MFA Enabled/Disabled
- Can Login (when response is available)
- PII Access (when available)

Activity Timeline includes:

- Created date
- Updated date
- Last Login (when available)

## Tab 2: Permissions

Permissions tab loads user permissions, permission summary, and assigned roles.

When data exists, it shows:

- Summary cards
  - Total Permissions
  - Sensitive Permissions
  - MFA Required
  - Total Roles
- Permissions by Category (derived from permission code prefix)
- All Permissions list
  - Permission name
  - Code
  - Description
  - Status indicator
- Assigned Roles chips

If permission data is missing, the tab shows an empty-state message.

## Tab 3: Reports

Reports tab shows reporting relationships for the selected user.

Sections shown when data exists:

- Direct Reports
- All Reports (includes direct and indirect)
- Manager Chain

Each row/card is clickable and opens that related user's details page.

If there are no direct reports and no manager chain, an empty-state message is shown.

