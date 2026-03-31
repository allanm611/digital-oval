# My Profile

## Overview

My Profile is your personal account management page where you can view and update your profile information, manage your account credentials, and configure your personal preferences within the system.

## Accessing My Profile

**Step 1: Open User Menu**
- Click your **profile icon** in the top-right corner of the navigation bar
- A dropdown menu appears

**Step 2: Navigate to My Profile**
- Click on **"My Profile"** option
- Your profile page loads

**Route:** `/dashboard/user-settings/my-profile`

---

## Profile Information

### Personal Details

The My Profile page displays your personal account information:

**Display Name**
- Your name as displayed in the system
- Visible to other users when they see your actions or messages
- Used for activity logs and audit trails

**Email Address**
- Your primary email address
- Used for password reset and email notifications
- Verify email changes before confirming

**Role**
- Your assigned role in the system (Admin, Manager, User, etc.)
- Determines your permissions and access level
- Contact administrator to change roles

**Department**
- Your department or team
- Used for filtering and reporting
- Helps organize multi-department access

**Status**
- Your account status (Active, Inactive, Suspended)
- Active accounts can access the system normally
- Contact administrator if status needs changing

---

## Updating Profile Information

### Edit Profile Details

**Step 1: Click Edit Profile**
- Located on the My Profile page
- Opens edit form with current information

**Step 2: Update Information**

You can update the following fields:

1. **Display Name** (Editable)
   - Your visible name in the system
   - Used in activity logs
   - Example: "John Smith" or "John S."

2. **Email Address** (Editable)
   - Your contact email
   - Used for notifications and password reset
   - Verification required for new email

3. **Phone Number** (Optional, Editable)
   - Your contact phone number
   - May be used for two-factor authentication
   - Optional field

4. **Time Zone** (Editable)
   - Your local time zone
   - Used for displaying timestamps
   - Affects scheduled task times

5. **Language Preference** (Editable)
   - Preferred language for the interface
   - Options: English, French, Spanish, German, etc.
   - Changes apply on next login

**Step 3: Save Changes**
- Click "Save Profile" button
- Changes applied immediately
- Confirmation message appears
- Some changes may require verification

### Email Verification

**If Changing Email:**

1. Enter new email address
2. Click "Verify New Email"
3. Check new email inbox for verification link
4. Click link to confirm ownership
5. Email address updated in system

---

## Account Credentials

### Password Management

**Change Your Password**

1. Click "Change Password" on My Profile page
2. Enter your current password (for verification)
3. Enter new password (must meet requirements)
4. Confirm new password by re-entering
5. Click "Update Password"

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

**Password Best Practices:**
- Use unique passwords not used elsewhere
- Change password regularly (every 90 days recommended)
- Avoid using personal information
- Don't share password with anyone
- Use password manager for security

### Two-Factor Authentication (2FA)

**Enable Two-Factor Authentication**

1. Go to My Profile settings
2. Locate "Two-Factor Authentication" section
3. Click "Enable 2FA"
4. Choose authentication method:
   - **Authenticator App** (e.g., Google Authenticator, Authy)
   - **SMS Text Message**
   - **Email Code**
5. Follow setup instructions for chosen method
6. Verify with test code
7. 2FA enabled for next login

**Using 2FA:**
- After entering password, receive code via chosen method
- Enter code in the verification prompt
- Login completes after correct code
- Codes typically valid for 30 seconds

**Disable 2FA:**
- Go to "Two-Factor Authentication" section
- Click "Disable 2FA"
- Confirm disabling
- 2FA no longer required for login

---

## Account Activity

### Recent Login Activity

Your My Profile page shows:

**Last Login**
- Date and time of most recent login
- IP address used
- Device/browser information

**Recent Activity**
- Recent actions you performed
- Items you created or modified
- Campaigns you launched
- Changes you made to system

**Active Sessions**
- Currently active login sessions
- Device and location information
- Last activity time
- Option to sign out from specific sessions

### Audit Trail

View your account audit trail to see:

- **Action Type:** What you did (create, edit, delete, approve)
- **Resource:** What you affected (campaign, offer, segment, etc.)
- **Date/Time:** When the action occurred
- **Details:** Specific changes made
- **IP Address:** Where action was performed from

---

## Connected Accounts &amp; Integrations

### Third-Party Integrations

If your system supports third-party integrations:

**Connected Services**
- List of services connected to your account
- When connection was established
- Last sync/activity date
- Option to disconnect

**OAuth Connections**
- Apps authorized to access your data
- Permissions granted
- Option to revoke access

---

## Preferences &amp; Settings

### Display Preferences

**Theme Selection**
- Light mode (default)
- Dark mode (easier on eyes)
- System preference (follows device setting)

**Default View**
- Preferred layout for lists (Grid, List, Table)
- Default page size (10, 25, 50 items per page)
- Default sorting (recent, alphabetical, etc.)

**Dashboard Layout**
- Customize which cards appear on dashboard
- Reorder dashboard sections
- Save dashboard configuration

### Notification Preferences

For detailed notification settings, see [Notifications](/documentation/notifications)

Quick settings available on My Profile:
- Enable/disable email notifications
- Enable/disable in-platform notifications
- Set notification frequency

---

## Account Security

### Security Recommendations

**Regular Reviews**
- Review login activity monthly
- Check connected applications
- Verify active sessions
- Update password quarterly

**Privacy Settings**
- Control profile visibility to other users
- Manage what information others can see
- Set preferences for sharing data
- Manage contact preferences

### Suspicious Activity

**If You Spot Suspicious Activity:**

1. Change your password immediately
2. Review recent login activity
3. Check for unauthorized sessions
4. Report to system administrator
5. Enable 2FA if not already active

---

## Profile Deletion

### Deactivate Account

**Important:** Deactivating your account is different from deleting it.

**What Happens:**
- Your account becomes inactive
- You cannot log in
- Your data is preserved for audit purposes
- Administrators can reactivate if needed

**To Deactivate:**
1. Go to My Profile
2. Scroll to "Account Management"
3. Click "Deactivate Account"
4. Confirm deactivation
5. Provide reason for deactivation (optional)
6. Account deactivated

### Delete Account

**Warning:** Account deletion is permanent and cannot be undone.

**Before Deleting:**
- Ensure your work is complete
- Transfer responsibilities to others
- Backup any personal data
- Notify administrator

**To Delete:**
1. Go to My Profile
2. Scroll to "Account Management"
3. Click "Delete Account Permanently"
4. Enter password to confirm
5. Acknowledge permanent deletion warning
6. Account and all associated data deleted

---

## Troubleshooting

### Cannot Change Email

**Issue:** Email verification link expired
- Solution: Request new verification link
- New link sent to email address

**Issue:** Email already in use
- Solution: Use unique email address
- Contact administrator if locked out

### Forgotten Password

**Issue:** Cannot remember current password
- Solution: Use "Forgot Password" link on login page
- Follow password reset instructions
- New temporary password sent to email

### Account Locked

**Issue:** Account locked after failed login attempts
- Solution: Wait 30 minutes and try again
- OR contact administrator
- OR use password reset option

### Cannot Enable 2FA

**Issue:** Authenticator app not syncing
- Solution: Check device time synchronization
- Verify app is legitimate and up-to-date
- Try different 2FA method (SMS or email)

**Issue:** Lost access to 2FA device
- Solution: Use backup codes (if saved)
- Contact administrator for assistance
- May require identity verification

---

