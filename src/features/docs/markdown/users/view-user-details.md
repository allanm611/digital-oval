# View User Details

## Overview

View and manage individual user profiles with complete access to their information, roles, permissions, security settings, and activity history. This comprehensive interface allows you to modify user details, manage access, configure security, and monitor user behavior.

---

## Accessing User Details

**Navigation:** Dashboard → User Management → Users → [Click user name or View button]

**Also Accessible From:**
- User List page - Click user name or View button
- Search results - Click matching user
- Related user lookups

---

## User Profile Sections

### Personal Information

**Display Details:**
- **Name** - First name, last name, middle name
- **Preferred Name** - Alternative name display
- **Display Name** - How user appears in system
- **Photo** - User profile picture (if uploaded)
- **Gender/Pronouns** - For communication
- **Date of Birth** - Basic demographic

**Editable:** Click "Edit Profile" to change most fields

**Not Editable:** Username (system-assigned)

### Contact Information

**Email Address**
- Primary email for communications
- Used for password reset, notifications
- Click "Change Email" to update (requires verification)
- Alternative emails may be configured

**Phone Number**
- Primary contact phone
- Optional field
- May be used for MFA
- Click "Edit" to change

**Address (if configured)**
- Office location
- Mailing address
- Physical address

### Employment Information

**Organizational Details**
- **Employee ID** - Company identifier
- **Department** - Department assignment
- **Job Title** - Position/role title
- **Manager** - Assigned supervisor/manager
- **Cost Center** - For billing/tracking
- **Office Location** - Physical office

**Edit:** Click "Edit Employment" to modify

**Manager Assignment:**
- Click manager name to view their profile
- "Unassign Manager" button to remove
- "Assign Manager" to change

### Account Details

**System Information**
- **User ID** - System unique identifier
- **UUID** - Universal unique identifier
- **Username** - Login username
- **Status** - Active/Inactive/Suspended/Locked
- **Created Date** - Account creation date
- **Created By** - Who created account
- **Last Updated** - Most recent change
- **Updated By** - Who made change
- **Account Age** - Duration since creation

**Status Indicators**
- Green checkmark = Active
- Red X = Inactive
- Orange warning = Suspended
- Red lock = Locked

### Role & Permissions

**Primary Role**
- Main role assignment
- Determines base permissions
- Displayed prominently
- Click "Change Role" to modify

**Secondary Roles**
- Additional role assignments
- Combined permissions from all roles
- Each role adds/modifies permissions
- Click "Add Role" or "Remove Role"

**Total Permissions**
- Count of all permissions granted
- Includes direct + role-based
- Click "View All Permissions" to see list

**Direct Permissions**
- Permissions assigned directly to user
- In addition to role permissions
- Rare, for special cases
- Can be added/removed individually

### Data Access & Security

**Data Access Level**
- **Public** - Public data access
- **Internal** - Internal organizational data
- **Confidential** - Sensitive/confidential data
- **Restricted** - Limited access level
- Click "Change Access Level" to modify

**PII Access**
- Permission to view personal information
- Status: Enabled/Disabled
- Shows expiration if applicable
- Click "Grant PII Access" or "Revoke PII Access"

**IP Whitelist**
- Allowed IP addresses
- Empty = all IPs allowed
- Restricts login to specific IPs
- Click "Edit IP Whitelist" to modify
- Format: 192.168.1.100, 10.0.0.0/8

**Access Expiration**
- Date when account access expires
- Empty = no expiration
- Account auto-disabled on expiration
- Can extend by editing date

**Password Policy**
- **Last Password Change** - When changed
- **Password Expires** - When expires
- **Days Until Expiration** - Countdown
- **Must Change on Login** - If required
- Click "Reset Password" to force change

### MFA & Authentication

**Multi-Factor Authentication (MFA)**
- **Status** - Enabled/Disabled
- **Method** - TOTP/SMS/Email
- **Backup Codes** - If applicable
- **Registered Device** - Device used for MFA
- **Last Used** - When last authenticated

**MFA Options:**
- **Enable MFA** - Set up 2FA
- **Disable MFA** - Remove requirement
- **Reset MFA** - User reconfigures
- **Generate Backup Codes** - Emergency access

### Login Activity

**Recent Login Information**
- **Last Login** - Most recent login date/time
- **Last Login IP** - IP address used
- **Last Login Device** - Device/browser type
- **Failed Attempts** - Recent failed logins
- **Account Locked** - If currently locked

**Active Sessions**
- **Current Sessions** - Active login sessions
- **Session Count** - Total active sessions
- Each session shows:
  - Login date/time
  - IP address
  - Device/browser
  - Last activity
  - "Sign Out" button

### Account Activity

**Recent Actions**
- **Last Action** - Most recent user action
- **Last Action Date** - When action occurred
- **Action Type** - What user did
- **Resource** - What was accessed/modified

**Activity Summary**
- **Actions (30 days)** - Actions this month
- **Logins (30 days)** - Login count
- **Failed Attempts (30 days)** - Failed login attempts
- **Resources Accessed** - Most used features

**Activity Timeline** (if available)
- Chronological list of recent actions
- Timestamps and descriptions
- Click to view details

---

## Edit User Information

### Edit Profile

**Click "Edit Profile" to modify:**

**Editable Fields:**
- First Name - Legal first name
- Last Name - Legal surname
- Middle Name - Middle name/initial
- Preferred Name - Alternative name
- Phone Number - Contact phone
- Timezone - Local timezone
- Language Preference - UI language
- Photo - Profile picture upload

**Steps:**
1\. Click **Edit Profile** button
2\. Modify desired fields
3\. Click **Save Changes**
4\. Confirmation appears
5\. Changes apply immediately

### Edit Employment

**Click "Edit Employment" to modify:**

**Editable Fields:**
- Department - Department assignment
- Job Title - Position/role
- Manager - Assigned manager
- Employee ID - Company ID
- Cost Center - Billing code

**Steps:**
1\. Click **Edit Employment**
2\. Modify employment information
3\. Click **Save**
4\. Changes apply

### Change Email

**Click "Change Email" to update:**

**Process:**
1\. Click **Change Email**
2\. Enter new email address
3\. System validates format
4\. Click **Send Verification**
5\. User receives verification email
6\. User clicks link to verify
7\. Email address updated
8\. Can now use for login/reset

### Change Password

**Click "Reset Password" to force change:**

**Process:**
1\. Click **Reset Password**
2\. Choose password method:
   - Auto-generate new password
   - Manual entry
   - User sets on next login
3\. Confirm action
4\. If auto-generated, display temporary password
5\. User notified of reset
6\. User must change on next login

### Change Role

**Click "Change Role" to modify:**

**Process:**
1\. Click **Change Role**
2\. Select new primary role from dropdown
3\. Review permission changes
4\. Confirm action
5\. Optional: Notify user of change
6\. Permissions updated immediately

### Manage Roles

**Add Secondary Role:**
1\. Click **Add Role** button
2\. Select role from list
3\. Confirm
4\. User now has permissions from both roles

**Remove Secondary Role:**
1\. Find role in list
2\. Click **Remove** button
3\. Confirm removal
4\. User permissions updated

---

## Account Management

### Change Account Status

**Click "Status" button to modify:**

**Options:**

**Activate**
- Enable user access
- User can log in
- Permissions restored
- Used when reactivating

**Deactivate**
- Disable user access
- User cannot log in
- Data preserved
- User still in system

**Suspend**
- Temporarily block access
- Usually for policy violations
- Can be unsuspended
- Shorter-term than deactivate

**Unsuspend**
- Restore from suspension
- User access re-enabled
- Permissions restored

**Unlock**
- Unlock if account locked
- Unlock due to failed login attempts
- User can log in again

**Process:**
1\. Click **Status** button
2\. Select desired status
3\. Optional: Enter reason
4\. Optional: Notify user
5\. Confirm action
6\. Status changes immediately

### Data Access Level

**Click "Change Access Level":**

**Options:**
- **Public** - Public data
- **Internal** - Internal data
- **Confidential** - Sensitive data
- **Restricted** - Highly restricted

**Impact:**
- Data filtering in reports
- Export restrictions
- Feature visibility
- Audit logging

### PII Access

**Grant PII Access:**
1\. Click **Grant PII Access**
2\. Optional: Set expiration date
3\. Confirm action
4\. User can now view PII

**Revoke PII Access:**
1\. Click **Revoke PII Access**
2\. Confirm action
3\. User can no longer view PII

### IP Whitelist

**Click "Edit IP Whitelist":**

**Add IPs:**
1\. Click **Add IP**
2\. Enter IP address or range
3\. Example: 192.168.1.100 or 10.0.0.0/8
4\. Click **Save**

**Remove IPs:**
1\. Find IP in list
2\. Click **Remove**
3\. Confirm
4\. IP no longer whitelisted

---

## Security Management

### Enable/Disable MFA

**Enable MFA:**
1\. Click **Enable MFA**
2\. Select method:
   - TOTP (Authenticator app)
   - SMS (Text message)
   - Email (Email code)
3\. User configures on next login
4\. MFA required for future logins

**Disable MFA:**
1\. Click **Disable MFA**
2\. Confirm action
3\. MFA no longer required
4\. User login uses single factor

**Reset MFA:**
1\. Click **Reset MFA**
2\. User must reconfigure on next login
3\. Useful if user lost device

### View Sessions

**Active Sessions List:**

**Information per session:**
- Login date/time
- IP address
- Device/browser
- Last activity
- **Sign Out** button

**Sign Out Session:**
1\. Find session in list
2\. Click **Sign Out**
3\. User logged out from that session
4\. User can log back in

**Sign Out All:**
1\. Click **Sign Out All Sessions**
2\. Confirm action
3\. User logged out everywhere
4\. User must log in again

---

## Audit & Activity

### View Activity Log

**Recent Actions List:**

**Information displayed:**
- Action type (create, edit, delete, etc.)
- Resource affected (what was changed)
- Date/time of action
- IP address source
- Full details available

**Filters:**
- By date range
- By action type
- By resource

### View Login History

**Login Records:**

**Information:**
- Login date/time
- IP address
- Device type
- Location (if available)
- Success/failure status
- Failure reason (if failed)

**Filters:**
- By date range
- By status (success/failed)
- By IP address

---

## Delete User

### Deactivate vs. Delete

**Deactivate (Recommended):**
- Preserves all user data
- Audit trail maintained
- Can reactivate if needed
- User can still be referenced
- Most organizations do this

**Delete (Permanent):**
- Removes user completely
- Cannot be undone
- May break historical references
- Use only after deactivation period

### How to Delete

**Steps:**
1\. Click **Delete User** button
2\. Confirm user identification
3\. Acknowledge permanent deletion
4\. Click **Confirm Delete**
5\. User completely removed

**Before Deleting:**
- Transfer user's responsibilities
- Archive user's work/data
- Update any references
- Notify affected parties
- Ensure compliance with retention policies

---

## Best Practices

### User Management

1\. **Regular Reviews** - Check user status periodically
2\. **Update Information** - Keep employee details current
3\. **Review Permissions** - Ensure appropriate access
4\. **Monitor Activity** - Watch for unusual behavior
5\. **Deactivate Departures** - Immediately disable departing users

### Security

1\. **Enable MFA** - For sensitive roles
2\. **Review Sessions** - Monitor active logins
3\. **Change Passwords** - Periodically
4\. **Restrict IPs** - Use whitelist for sensitive accounts
5\. **Monitor Access** - Watch PII access

### Compliance

1\. **Maintain Audit Trail** - Preserve activity logs
2\. **Document Changes** - Record reasons for modifications
3\. **Retain Data** - Follow retention policies
4\. **Verify Access** - Confirm appropriate access levels
5\. **Track Changes** - Know who modified what/when

---

## Related Documentation

- [User List](/documentation/users-list) - Manage all users
- [Create User](/documentation/create-user) - Add new users
- [Role Management](/documentation/role-management) - Manage roles
- [Permissions](/documentation/permissions) - Permission reference
- [Assign Permissions](/documentation/assign-permissions) - Assign permissions
