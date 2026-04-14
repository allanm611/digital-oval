# User Analytics

## Overview

User Analytics is the reporting view for the user-management module. Instead of focusing on one account at a time, it shows the overall shape of the user base, highlights security and lifecycle issues, and surfaces the groups that usually need follow-up.

## Accessing User Analytics

Open the page from **User Management → Analytics** or by clicking the **Analytics** action in the user-management header.

## Summary And Monitoring Cards

The page starts with summary cards that show the headline user counts used most often in operations:

- Total Users
- Active Users
- Pending Activation
- Locked Users

It then expands into security and activity monitoring cards for:

- MFA Enabled
- MFA Disabled
- Expiring Passwords
- Expired Access
- Recent Users
- Inactive Users

These cards help you spot operational pressure points quickly, such as a buildup of pending requests, a spike in locked accounts, or a cluster of users who still do not have MFA enabled.

![User Analytics Stat Cards](/img/usermanagement-images/useranalyticsstatcards.png)

## Distribution Charts

The middle section turns the aggregate counts into charts so it is easier to see how users are distributed across the organisation.

The charts cover:

- users by status
- users by department
- users by role

The status chart shows how the overall user population is split across states such as active, inactive, pending activation, or suspended. The department and role charts make it easier to see where the user base is concentrated and whether access assignment is balanced as expected.

![Users by Status Pie Chart](/img/usermanagement-images/useranalyticsusersbysttauspiechart.png)

![Users by Department and by Role](/img/usermanagement-images/useranalyticsuserbydepartment&usersbyroleimage.png)

## Focus Tables

Below the charts, the page provides investigation tables for the user groups that usually require action. Depending on the returned data, this section can include:

- MFA disabled users
- users with expiring passwords
- users with expired access
- recent users
- inactive users

Each table resolves role information and includes a row action that opens the selected user’s details page, which makes the analytics page a practical starting point for follow-up work rather than just a passive dashboard.

![MFA Disabled Users Table](/img/usermanagement-images/useranalyticsmfadisbaledusers.png)

![Inactive Users Table](/img/usermanagement-images/useranalyticsinactiveusers.png)

## Data Sources

The analytics page is built from the user and role reporting services. It combines overall user counts, status counts, department counts, role counts, onboarding-request totals, and the security-oriented user lists used by the tables.

## Related Documentation

- [Users List](/documentation/users/users-list)
- [Create User](/documentation/users/create-user)
- [View User Details](/documentation/users/view-user-details)
- [Access Control](/documentation/users/access-control)
