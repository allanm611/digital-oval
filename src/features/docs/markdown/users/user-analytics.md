# User Analytics

## Overview

User Analytics provides summary cards, distribution charts, and focused user tables.

## Accessing User Analytics

Navigation:

1. Open Dashboard.
2. Go to User Management.
3. Open the Analytics view.

## Summary Cards

The page shows top summary cards for:

- Total Users
- Active Users
- Pending Activation
- Locked Users

## Security And Activity Cards

The page also shows counts for:

- MFA Enabled
- MFA Disabled
- Expiring Passwords
- Expired Access
- Recent Users
- Inactive Users

## Distribution Charts

The page includes these pie charts:

- Users by Status
- Users by Department
- Users by Role

Status chart includes categories returned by backend counts (for example active, inactive, pending activation, suspended).

Charts are rendered from backend aggregate endpoints and sorted by highest count.

## User Tables

When data exists, the page shows focused user tables for:

- MFA Disabled Users
- Users With Expiring Passwords
- Users With Expired Access
- Recent Users
- Inactive Users

These tables include role resolution and a row action to open user details.

## Data Source Behavior

Analytics data is loaded from user and role services, including:

- User list and summary totals
- Status, department, and role count endpoints
- Role lookup for role names
- Security/activity reporting endpoints used by the tables

## Related Documentation

- [Users List](/documentation/users/users-list)
- [Create User](/documentation/users/create-user)
- [View User Details](/documentation/users/view-user-details)
- [Access Control](/documentation/users/access-control)
