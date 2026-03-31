# Create User

## Overview

Add new system users and grant them appropriate roles, permissions, and access levels. The user creation process guides you through entering required information, assigning roles, setting security preferences, and configuring data access levels.

---

## Accessing Create User

**Navigation:** Dashboard → User Management → Users → Create User

**Also Accessible From:**
- User List page - Click **Create User** button (top-right)
- Modal dialog or dedicated page

---

## Required Fields

These fields must be completed to create a user account:

### Username

- **Field Name:** Username
- **Format:** Alphanumeric characters, dots, hyphens, underscores
- **Requirements:**
  - Unique across entire system
  - Cannot contain spaces or special characters (except . - _)
  - Case-sensitive (JohnSmith ≠ johnsmith)
  - Minimum 3 characters, maximum 50 characters
- **System Uses:** Login credential, system identifier
- **Example:** "john.smith", "jsmith123"

### Email Address

- **Field Name:** Email Address
- **Format:** Valid email address (user@domain.extension)
- **Requirements:**
  - Must be valid email format
  - Unique across system
  - Used for password reset and notifications
  - Verification may be required
- **Examples:** "john.smith@example.com", "john@company.org"

### First Name

- **Field Name:** First Name
- **Requirements:**
  - Cannot be empty
  - Max 100 characters
  - Supports letters, spaces, hyphens, apostrophes
- **System Uses:** Display name, reports, communications
- **Example:** "John"

### Last Name

- **Field Name:** Last Name
- **Requirements:**
  - Cannot be empty
  - Max 100 characters
  - Supports letters, spaces, hyphens, apostrophes
- **System Uses:** Display name, reports, communications
- **Example:** "Smith"

### Password

- **Field Name:** Password (or auto-generate option)
- **Format:** Strong password required
- **Requirements:**
  - Minimum 12 characters
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*)
- **Options:**
  - Manually enter password
  - Auto-generate secure password (recommended)
  - User sets on first login (with temp password)
- **Security Note:** Never share password via email or chat

### Role Assignment

- **Field Name:** Primary Role
- **Format:** Select from available roles
- **Required:** Yes (at least one role)
- **Options:** Admin, Manager, User, Custom Roles
- **System Uses:** Determines initial permissions
- **Note:** Can assign additional roles after creation

---

## Optional Fields

Additional information to complete user profile:

### Middle Name

- **Field Name:** Middle Name
- **Requirements:**
  - Max 100 characters
  - Optional
- **Example:** "Michael"

### Preferred Name

- **Field Name:** Preferred Name
- **Purpose:** Alternative name to display instead of legal name
- **Example:** User "Jane Elizabeth Smith" prefers to be called "Beth"
- **Optional**

### Phone Number

- **Field Name:** Phone Number
- **Format:** International format or local format
- **Example:** "+1-555-123-4567" or "555-123-4567"
- **Optional:** Yes
- **Uses:** Contact, MFA setup, account recovery

### Employee ID

- **Field Name:** Employee ID
- **Format:** Company employee identifier
- **Example:** "EMP12345" or "E-2024-001"
- **Optional:** Yes
- **Uses:** HR tracking, reporting

### Department

- **Field Name:** Department
- **Format:** Select from predefined departments or enter custom
- **Example:** "Marketing", "Engineering", "Sales"
- **Optional:** Yes
- **Uses:** Organization, access control, reporting

### Job Title

- **Field Name:** Job Title
- **Format:** Text (position/role title)
- **Example:** "Senior Marketing Manager", "Software Engineer"
- **Optional:** Yes
- **Uses:** Organization, identifying user responsibilities

### Manager

- **Field Name:** Manager Assignment
- **Format:** Select existing user to be manager
- **Optional:** Yes
- **Uses:** Organizational hierarchy, approval workflows

### Timezone

- **Field Name:** Timezone
- **Format:** IANA timezone identifier
- **Example:** "America/New_York", "Africa/Johannesburg"
- **Optional:** Yes (defaults to system timezone)
- **Uses:** Email scheduling, report times

### Language Preference

- **Field Name:** Language Preference
- **Format:** Language code or select from dropdown
- **Options:** English, Spanish, French, German, etc.
- **Optional:** Yes (defaults to system language)
- **Uses:** Interface localization, email language

---

## Advanced Options

### Data Access Level

**Options:**
- **Public** - Access to public/general data only
- **Internal** - Access to internal organizational data
- **Confidential** - Access to sensitive/confidential data
- **Restricted** - Limited access, highest security level

**Default:** Public

**Impact:**
- Controls data access in reports, lists, and exports
- Filters data displayed based on classification
- Some operations may be restricted

### PII Access

**Purpose:** Grant access to Personally Identifiable Information

**Field:** Can Access PII (checkbox)

**What is PII:**
- Customer phone numbers
- Customer email addresses
- Customer home addresses
- Customer financial information
- Other sensitive personal data

**When to Enable:**
- Customer service representatives
- Data managers
- Analysts working with customer data
- Marketing team members

**When NOT to Enable:**
- Executive management (usually)
- Audit/compliance roles (usually restricted)
- Temporary/contractor accounts

**Impact:**
- Controls visibility of customer personal data
- Logs access to PII for audit trail
- Some reports require PII access to view

### Additional Roles

**Assign Secondary Roles:**
1\. After creating user with primary role
2\. Click "Add Role" button
3\. Select additional role(s)
4\. Confirm changes
5\. User now has permissions from all roles

**Why Multiple Roles:**
- User has responsibilities in multiple areas
- Temporary additional permissions
- Matrix organizational structure
- Special project assignments

### Custom Attributes

Add organization-specific fields:
- Cost Center - For billing/tracking
- Office Location - Physical office location
- Custom Field 1 - Configurable
- Custom Field 2 - Configurable
- Metadata - Free-form JSON

---

## Creating a User: Step-by-Step

### Step 1: Access Create User Form

1\. Navigate to User Management → Users
2\. Click **Create User** button (top-right)
3\. Form opens (modal or dedicated page)

### Step 2: Enter Required Information

**Basic Details:**
1\. **Username** - Enter unique username (will be login)
2\. **Email** - Enter user's email address
3\. **First Name** - Enter user's first name
4\. **Last Name** - Enter user's last name

**Password:**
1\. Choose password method:
   - **Auto-Generate** - System creates secure password (recommended)
   - **Manual Entry** - You enter password
   - **User Sets Later** - Temporary password, user sets on first login
2\. If manual, verify password meets requirements

**Role:**
1\. Select primary role from dropdown
2\. Role determines initial permissions
3\. Can add more roles later

### Step 3: Add Optional Information (Recommended)

**Employment Information:**
1\. Employee ID - Company employee number
2\. Department - Department assignment
3\. Job Title - Position/role
4\. Manager - Select manager from user list

**Contact Information:**
1\. Phone Number - Contact number
2\. Timezone - User's local timezone
3\. Language Preference - Preferred interface language

**Security:**
1\. Data Access Level - Set data classification access
2\. PII Access - Grant access to personal information if needed

### Step 4: Review & Validate

Before creating account, verify:
- Username is unique and proper format
- Email is correct and valid
- First and last names are present
- Password (if manual) meets requirements
- Role is appropriate
- Required fields are complete

### Step 5: Save User

**Options:**

**Create**
- Creates user account
- Returns to user list
- Shows success confirmation
- Displays login credentials (if applicable)

**Create & Add Another**
- Creates user account
- Clears form for next user
- Useful for bulk manual creation

**Cancel**
- Discards form
- Returns to previous page
- No user created

---

## Password Management

### Password Generation Options

**Auto-Generated Password**
- System creates 16-character secure password
- Contains uppercase, lowercase, numbers, special characters
- Highly secure
- Display once (cannot retrieve later)
- User must change on first login

**Manual Password Entry**
- You enter password directly
- Must meet complexity requirements
- You responsible for security
- Can be shared via secure channel

**User Sets on First Login**
- Temporary password provided
- User sets own password at first login
- User never knows temporary password (if auto-generated)
- Most secure option
- Recommended approach

### Password Requirements

**Complexity:**
- Minimum 12 characters (recommended)
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Policy:**
- Cannot reuse last 5 passwords
- Cannot match username
- Cannot contain personal information
- Expires every 90 days (configurable)

### Sharing Password Securely

**Never:**
- Send password in email
- Share in chat or messaging
- Write in plain text documents
- Store in unencrypted files

**Instead:**
- Use secure password delivery method
- Print on paper at creation
- Deliver in person
- Use password manager integration
- Use temporary password with first-login change

---

## Account Request vs. Direct Creation

### Direct Creation (Admin)

**When to Use:**
- Admin creating account for new employee
- Immediate account needed
- Known verified information

**Process:**
- Admin completes create user form
- Account created immediately
- Credentials provided to user
- User can login right away

**Security:** Medium (admin may not verify identity)

### Account Request (User-Initiated)

**When to Use:**
- User requests account through portal
- Formal approval process needed
- Requires business justification

**Process:**
1\. User submits account request
2\. Manager approves
3\. Admin reviews
4\. Account created after approval
5\. User notified

**Security:** Higher (approval process provides verification)

---

## Best Practices

### User Creation

1\. **Verify Identity** - Confirm user information with HR/manager
2\. **Strong Passwords** - Use auto-generated or enforce complexity
3\. **Minimal Permissions** - Start with base role, add as needed
4\. **Complete Profile** - Fill optional fields for better organization
5\. **Document Justification** - Note why account created and role assigned

### Security

1\. **Require MFA** - Enable for sensitive roles
2\. **Verify Email** - Confirm email address validity
3\. **Secure Password Delivery** - Don't email passwords
4\. **Set Expiration** - For temporary accounts
5\. **Monitor Logins** - Watch for unusual access

### Account Setup

1\. **Clear Permissions** - Communicate what user can/cannot do
2\. **Orientation** - Provide system training
3\. **Documentation** - Send user guides/resources
4\. **Contact Info** - Provide support contact
5\. **Feedback** - Ask about setup experience

---

## Field Mapping Reference

| Field | Required | Type | Max Length | Validation |
|-------|----------|------|------------|-----------|
| Username | Yes | Text | 50 | Alphanumeric + . - _ |
| Email | Yes | Email | 255 | Valid email format |
| First Name | Yes | Text | 100 | Letters, spaces, -, ' |
| Last Name | Yes | Text | 100 | Letters, spaces, -, ' |
| Password | Yes | Password | N/A | Min 12 chars, complexity |
| Role | Yes | Select | N/A | Must select valid role |
| Middle Name | No | Text | 100 | Letters, spaces, -, ' |
| Preferred Name | No | Text | 100 | Any characters |
| Phone | No | Phone | 20 | International format |
| Employee ID | No | Text | 50 | Any characters |
| Department | No | Select/Text | 100 | Predefined or custom |
| Job Title | No | Text | 100 | Any characters |
| Manager | No | Select | N/A | Must select valid user |
| Timezone | No | Select | N/A | Valid IANA timezone |
| Language | No | Select | N/A | Valid language code |
| Data Access | No | Select | N/A | public/internal/conf/restricted |
| PII Access | No | Boolean | N/A | true/false |

---

## Common Scenarios

### Scenario 1: New Employee Starting Monday

**Steps:**
1\. Create user account Friday before start
2\. Set strong password with auto-generate
3\. Assign appropriate role for position
4\. Set department matching org structure
5\. Enable MFA for security
6\. Send welcome email with login info
7\. Employee logs in Monday morning
8\. Prompted to change password

### Scenario 2: Contractor for 3 Months

**Steps:**
1\. Create account with contractor role (restricted permissions)
2\. Set data access to public/internal (no confidential)
3\. Disable PII access
4\. Set access expiration date (3 months out)
5\. Assign to specific project
6\. Account auto-disables at expiration

### Scenario 3: Manager with Team Leadership

**Steps:**
1\. Create account with Manager role
2\. Assign to department
3\. Set as manager for team members
4\. Grant approval permissions
5\. Enable PII access if managing customer-facing team
6\. Add secondary "Approver" role if needed
7\. Configure team access controls

### Scenario 4: Bulk Create Multiple Users

**Steps:**
1\. Prepare list of user information
2\. Create first user via form
3\. Click "Create & Add Another"
4\. Fill next user's information
5\. Repeat for all users
6\. Export list of created users with credentials
7\. Deliver to users securely

---

## Troubleshooting

### Error: "Username Already Exists"

**Issue:** Username is already in use

- **Cause:** Username must be unique
- **Solution:** Choose different username
- **Example:** Use jsmith2 instead of jsmith

### Error: "Invalid Email Format"

**Issue:** Email address not valid

- **Cause:** Email must be valid format
- **Solution:** Check spelling: user@domain.extension
- **Example:** Not valid: "john@domain", valid: "john@domain.com"

### Error: "Password Does Not Meet Requirements"

**Issue:** Password not complex enough

- **Cause:** Password must meet complexity rules
- **Solution:** Ensure password includes:
  - At least 12 characters
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character
- **Tip:** Use auto-generate for secure password

### Error: "Role Selection Required"

**Issue:** No role selected

- **Cause:** User must have at least one role
- **Solution:** Select role from dropdown
- **Note:** Can add more roles after creation

### User Cannot Login After Creation

**Issue:** User reports login not working

**Checklist:**
- Username correct? (case-sensitive)
- Password correct?
- Account status is "Active"?
- Browser cache cleared?
- Too many failed attempts (locked)?
- Account expiration date passed?

**Solution:**
- Reset password
- Unlock account if locked
- Check account status
- Verify credentials

---

