# Users List

## Overview

The Users page is the operational view for day-to-day account administration. It combines headline user statistics, a tabbed workspace for active users and onboarding requests, and the actions needed to create accounts, review pending requests, open analytics, and make updates in bulk.

![Users Management List](/img/v1.0/usermanagement-images/usermanagementlistimage.png)

## Page Layout

At the top of the page, four summary cards show the current state of the user base: total users, active users, pending activation requests, and locked users. These numbers give a quick health check before you move into the table below.

Below the summary cards, the page is split into three navigation tabs:

- **Users** for the main account table
- **Pending Requests** for onboarding requests that still need processing
- **Analytics** for the reporting view

The main actions in the header are:

- **Select Users** to enter multi-select mode on the users table
- **Analytics** to open the reporting page
- **Add User** to open the create-user modal

## Users Tab

The **Users** tab shows the main account table. Each row represents one user account and includes the user name, email, department, resolved role name, current status, creation date, and row-level actions.

Use this tab when you need to inspect the current user base, narrow the list, export the current result set, or take action on one or more accounts.

### Search And Filters

The search field matches the visible user list by first name, last name, or email. The toolbar also includes:

- A **Status** dropdown for filtering the table by account state
- A **CSV export** action for downloading the current filtered result
- A **Filters** button that opens the additional filter options, including department and role

Filtering updates the visible table and resets pagination to the first page so the filtered result is shown immediately.

### User Statuses

The status column is used to understand whether an account is currently usable or needs attention:

- **Active** means the user can sign in and operate normally.
- **Pending Activation** means the account exists but is still awaiting completion or approval in the onboarding flow.
- **Suspended** means access has been paused.
- **Locked** means the account is blocked until it is unlocked.
- **Deactivated** means the account is present but login is disabled.
- **Deleted** means the record has been removed from normal use.

### Row Actions

Each user row exposes the actions needed for direct account handling:

- **View** opens the user details page, where profile information, permissions, and reporting relationships are shown together.
- **Status toggle** activates or deactivates the account from the list view.
- **Delete** removes the user after confirmation.

These actions are intended for individual account maintenance when you are working one record at a time.

## Pending Requests Tab

The **Pending Requests** tab is the queue for account requests that are moving through onboarding. It brings submitted, under-review, and pending-approval requests into one working table so the reviewer can see who requested access, which role was requested, the current request status, and when the request was raised.

![Pending Users Tab](/img/v1.0/usermanagement-images/usermanagementpendingliststab.png)

The request table includes these columns:

- **User**
- **Email**
- **Requested Role**
- **Status**
- **Requested**
- **Actions**

The action buttons change with the request stage:

- Submitted requests can be moved into review.
- Requests under review can be forwarded for approval.
- Requests pending approval can be approved or rejected.
- Approved requests can be used to create the actual user account.

This keeps the onboarding flow in one place instead of splitting it across separate pages.

## Bulk Operations

When you click **Select Users**, the users table enters selection mode and checkboxes appear in the list. You can select individual rows or use the header checkbox to select all currently visible users.

Once one or more users are selected, the bulk action bar appears.

![Users List Bulk Operations](/img/v1.0/usermanagement-images/usermanagementlistbulkoperation.png)

From this bar you can:

- choose a department and apply **Update Department** to every selected user
- run **Deactivate** to disable all selected accounts in one operation
- clear the current selection without leaving the page

Bulk actions are useful when a team move, access cleanup, or temporary offboarding affects several accounts at once.

## Related Documentation

- [Create User](/documentation/users/create-user)
- [View User Details](/documentation/users/view-user-details)
- [User Analytics](/documentation/users/user-analytics)
- [Access Control](/documentation/users/access-control)
