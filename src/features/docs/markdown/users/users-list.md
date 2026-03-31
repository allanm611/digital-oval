# User List

## Overview

The User List provides a comprehensive view of all system users, their roles, status, and access levels. Manage user accounts, search for users, perform bulk operations, and monitor user activity from this centralized interface.

---

## Accessing User List

**Navigation:** Dashboard → User Management → Users → User List

The User List page displays all system users in a searchable, filterable table with action buttons for managing individual users.

---

## User List Interface

### Search & Filter

**Search Users**

Use the search box to find users by:
- **Name** - First name or last name
- **Email** - Email address
- **Username** - System login username
- **Employee ID** - Company employee identifier
- **Department** - Department name

**How It Works:**
1\. Type search term in search box
2\. Results update as you type
3\. Shows matching users only
4\. Clear search to see full list

**Search Examples:**
- "John" - Finds users with first or last name John
- "john@example.com" - Finds by email address
- "john.smith" - Finds by username
- "EMP123" - Finds by employee ID
- "Marketing" - Finds all users in Marketing department

### Filter by Attribute

**By Status**
- Active - Users who can access system
- Inactive - Deactivated users
- Suspended - Temporarily blocked users
- Locked - Locked due to failed login attempts
- All - Show all statuses

**By Role**
- Select specific role (Admin, Manager, User, etc.)
- Show users with that role assignment
- Can filter multiple roles

**By Department**
- Filter by department assignment
- See all users in specific department
- Empty shows users with no department

**By MFA Status**
- MFA Enabled - Multi-factor authentication active
- MFA Disabled - Single factor authentication
- All - Show all users

**By Data Access**
- Public - Standard data access
- Internal - Restricted to internal data
- Confidential - Limited confidential data access
- Restricted - Highest restriction level

**By Last Login**
- Last 7 Days
- Last 30 Days
- Last 90 Days
- Never Logged In
- Custom Date Range

### Pagination

Navigate through user records:
- **Page Size:** 20 users per page (default, configurable)
- **Navigation:** Previous/Next buttons
- **Page Indicator:** Shows current page and total users
- **Jump to Page:** Click page numbers directly

---

## User List Columns

| Column | Description |
|--------|-------------|
| **Name** | First and last name of user |
| **Username** | System login username |
| **Email** | Email address |
| **Role** | Primary assigned role |
| **Department** | Department assignment |
| **Status** | Active, Inactive, Suspended, Locked |
| **MFA** | Multi-factor authentication enabled? |
| **Created** | Date user account was created |
| **Last Login** | Most recent login date/time |
| **Actions** | View, Edit, Disable, Delete buttons |

---

## User Status Definitions

**Active**
- User can log in and access system
- Has current permissions and roles
- Fully functional account
- Default status for new users

**Inactive**
- User cannot log in
- Access is disabled
- Data preserved for audit purposes
- Can be reactivated

**Suspended**
- Temporarily blocked
- Cannot access system
- Often due to security concerns or policy violation
- Can be unsuspended

**Locked**
- Automatically locked after too many failed login attempts
- Requires admin unlock
- Security measure
- Automatic unlock available after timeout period

---

## Action Buttons

### View User

Click **View** (eye icon) to open user profile.

**Shows:**
- Complete user information
- Account details and settings
- Roles and permissions
- Access levels and restrictions
- Login activity and sessions
- Account history

### Edit User

Click **Edit** (pencil icon) to modify user information.

**Editable Fields:**
- First name, last name
- Phone number
- Department
- Job title
- Manager assignment
- Timezone
- Language preference
- Custom preferences

**Not Editable:**
- Username (system-assigned)
- Email (requires separate process)
- Password (separate change process)
- Role (use Assign Role function)

### Change Status

Click **Status** button to change user account status.

**Options:**
- **Activate** - Enable user access (from Inactive)
- **Deactivate** - Disable user access
- **Suspend** - Temporarily block access
- **Unsuspend** - Restore from suspension
- **Unlock** - Unlock if locked out

**Confirmation Required:** Must confirm status change, optionally provide reason

### Reset Password

Click **Reset Password** to force password change.

**Process:**
1\. System generates temporary password
2\. Sends to user via email
3\. User required to change on next login
4\. Optional: Notify user of reset

### Enable/Disable MFA

Click **MFA** button to manage multi-factor authentication.

**Options:**
- **Enable MFA** - Require 2FA on next login
- **Disable MFA** - Remove 2FA requirement
- **Reset MFA** - User must reconfigure

### Assign Role

Click **Assign Role** to change user's primary role.

**Process:**
1\. Select new role from dropdown
2\. Review permissions change
3\. Click confirm
4\. Optional: Notify user of change

### Delete User

Click **Delete** (trash icon) to remove user account.

**Warning:** Permanent action, cannot be undone

**Before Deleting:**
- Ensure all user data is transferred
- Reassign user's responsibilities
- Archive user's work
- Notify user of deletion

### More Actions (...)

Additional actions may include:
- **View Permissions** - See detailed permissions
- **View Sessions** - Active login sessions
- **Export Data** - Download user data
- **Activity Log** - View user's actions

---

## Bulk Operations

### Select Multiple Users

**Select Users:**
1\. Click checkbox next to user name
2\. Or click "Select All" checkbox in header
3\. Or use shift+click to select range

**Actions on Selected:**
- **Bulk Deactivate** - Disable multiple users at once
- **Bulk Update Department** - Change department for multiple users
- **Bulk Assign Role** - Assign same role to multiple users
- **Bulk Enable MFA** - Require 2FA for multiple users
- **Bulk Delete** - Remove multiple accounts

**Confirmation:** Required for all bulk operations, with count of affected users

---

## User Information Display

### Account Details

**Personal Information**
- First Name, Last Name
- Middle Name (if provided)
- Preferred Name (if different from legal name)
- Gender/Pronouns (if configured)
- Photo (if uploaded)

**Contact Information**
- Email Address - Primary email
- Phone Number - Contact phone
- Alternate Phone - Secondary phone (if provided)

**Employment Information**
- Username - System login name
- Employee ID - Company employee number
- Department - Department assignment
- Job Title - Position/role
- Manager - Assigned manager
- Cost Center - For billing/tracking

**System Information**
- User ID - System unique identifier
- UUID - Universal unique identifier
- Status - Current account status
- Created Date - Account creation date
- Created By - Who created account
- Last Updated - Most recent change
- Updated By - Who made change

### Access Information

**Role & Permissions**
- Primary Role - Main role assignment
- Secondary Roles - Additional roles
- Direct Permissions - Individual permissions
- Permission Count - Total permissions

**Data Access**
- Data Access Level - public/internal/confidential/restricted
- PII Access - Can access Personally Identifiable Information
- Access Expiration - When access expires
- IP Whitelist - Allowed IP addresses

**MFA & Security**
- MFA Enabled - Multi-factor auth status
- MFA Method - TOTP/SMS/Email
- Password Expires - When password must change
- Last Password Change - When last changed
- Failed Login Count - Failed attempts
- Account Locked - If currently locked

### Activity Information

**Login Activity**
- Last Login - Most recent login date/time
- Last Login IP - IP address of last login
- Last Login Device - Device type used
- Concurrent Sessions - Active session count
- Total Logins - Lifetime login count

**Recent Activity**
- Last Action - Most recent action
- Last Action Date - When action occurred
- Action Count (30 days) - Actions this month
- Last Resource Accessed - Last system access

---

## Best Practices

### User Management

1\. **Regular Reviews** - Periodically review user list for stale accounts
2\. **Deactivate Inactive Users** - Remove access for users no longer needed
3\. **Verify Permissions** - Ensure users have appropriate roles
4\. **Monitor Status** - Watch for locked/suspended accounts
5\. **Update Information** - Keep employee info current

### Security

1\. **Require MFA** - Enable for all users or sensitive roles
2\. **Regular Audits** - Review permissions and roles
3\. **Deactivate on Departure** - Immediately disable departing users
4\. **Monitor Logins** - Watch for unusual access patterns
5\. **Reset Passwords** - Periodically require password changes

### Access Control

1\. **Principle of Least Privilege** - Give minimum needed permissions
2\. **Role-Based Access** - Use roles for consistency
3\. **Regular Reviews** - Audit permissions regularly
4\. **Document Permissions** - Maintain records of who has what access
5\. **Restrict Sensitive Access** - Extra controls for PII/confidential

---

## Common Tasks

### Find a Specific User

**By Name:**
1\. Use search box
2\. Enter first or last name
3\. Click matching user

**By Email:**
1\. Use search box
2\. Enter email address
3\. Click matching user

**By Department:**
1\. Use department filter
2\. Select department
3\. View all users in department

### Deactivate User

1\. Find user in list
2\. Click **Status** button
3\. Select **Deactivate**
4\. Optionally provide reason
5\. Click confirm
6\. User now cannot access system

### Enable MFA for User

1\. Find user in list
2\. Click **MFA** button
3\. Select **Enable MFA**
4\. Choose method (TOTP/SMS/Email)
5\. Click confirm
6\. User prompted to configure on next login

### Change User's Department

1\. Find user in list
2\. Click **Edit**
3\. Change department field
4\. Click **Save**
5\. Changes applied immediately

### Reset User Password

1\. Find user in list
2\. Click **Reset Password**
3\. Confirm action
4\. Temporary password sent to user
5\. User must change on next login

### Bulk Deactivate Department

1\. Use department filter
2\. Select all users (checkbox in header)
3\. Click **Bulk Deactivate**
4\. Review count of users
5\. Confirm action
6\. All selected users deactivated

---

## Troubleshooting

### Cannot Find User

**Issue:** Search not returning expected user

- **Solution 1:** Try different search terms (email, username)
- **Solution 2:** Check spelling and formatting
- **Solution 3:** User may be deleted
- **Solution 4:** Filter may be hiding user (check status)

### User Shows Wrong Status

**Issue:** User status doesn't match expectation

- **Cause:** Status may have been changed recently
- **Solution:** Refresh page to see current status
- **Check:** Review who changed status and when

### Cannot Edit User Field

**Issue:** Some fields appear read-only

- **Cause:** Username, email, password cannot be edited directly
- **Solution:** Use specific functions (Change Email, Reset Password)
- **Note:** Admin may restrict certain field editing

### Search Too Slow

**Issue:** Search takes long time with large user base

- **Solution 1:** Use more specific search terms
- **Solution 2:** Use filters to narrow results
- **Solution 3:** Try again during off-peak hours
- **Solution 4:** Consider pagination instead of scrolling

---

## Related Documentation

- [Create User](./create-user) - Add new users to system
- [View User Details](./view-user-details) - Manage individual user profiles
- [Role Management](./role-management) - Manage user roles
- [Permissions](./permissions) - Configure permissions system
- [Assign Permissions](./assign-permissions) - Assign permissions to users
