# Assign Permissions

## Overview

Assign permissions to users and roles to control what users can do in the system. Permissions can be assigned directly to individual users or bundled into roles and roles assigned to users. This guide covers both approaches.

---

## Permission Assignment Methods

### Method 1: Role-Based Assignment (Recommended)

**How It Works:**
1\. Create role with specific permissions
2\. Assign role to users
3\. Users get all permissions from role
4\. Change role permissions affects all users

**Advantages:**
- Consistent access across users
- Easy to manage at scale
- Single source of truth
- Easier to audit
- Recommended approach

**When to Use:**
- Assigning permissions to multiple users
- Creating standard job functions
- Maintaining organizational consistency
- Most scenarios

### Method 2: Direct Permission Assignment

**How It Works:**
1\. Assign permissions directly to individual user
2\. User gets specific permissions
3\. Separate from role permissions
4\. Combined with role permissions

**Advantages:**
- Flexible for exceptions
- Individual customization
- Override role defaults

**Disadvantages:**
- Hard to track/audit
- Inconsistent across users
- Difficult to maintain

**When to Use:**
- Rare exceptions only
- Temporary special access
- Specific individual needs
- Not recommended for standard access

---

## Assigning Permissions via Roles

### Create Role with Permissions

**Step 1: Go to Role Management**
- Navigate to Dashboard → User Management → Access Control → Role Management
- Click **Create Role** button

**Step 2: Enter Role Details**
- **Name:** descriptive role name
- **Code:** system identifier
- **Description:** purpose explanation
- Click **Next** or expand permissions section

**Step 3: Select Permissions**

**Method A: Browse All Permissions**
1\. See full permission list
2\. Check desired permissions
3\. Organized by resource category
4\. Scroll through and select

**Method B: Search Permissions**
1\. Search box to find permissions
2\. Filter by resource (campaign, user, etc.)
3\. Filter by action (create, read, edit, delete)
4\. Select matching permissions

**Step 4: Review Selection**
1\. Review selected permissions
2\. Verify scope (all, own, department, etc.)
3\. Check for unnecessary permissions
4\. Ensure no critical missing permissions

**Step 5: Save Role**
1\. Click **Create Role**
2\. Role created with selected permissions
3\. Ready to assign to users

### Assign Role to User

**Single User Assignment:**

**In User List:**
1\. Find user in list
2\. Click **Change Role** or **Assign Role**
3\. Select role from dropdown
4\. Review permission summary
5\. Click **Confirm**
6\. Optional: Notify user
7\. User permissions updated immediately

**In User Details:**
1\. Open user profile
2\. Go to Roles section
3\. Click **Assign Role**
4\. Select role
5\. Confirm
6\. Permissions applied

### Add Secondary Role to User

**Process:**

1\. Open user details
2\. Go to Roles section
3\. See primary role
4\. Click **Add Role** button
5\. Select secondary role
6\. Review combined permissions
7\. Confirm selection
8\. User now has permissions from both roles

**Permission Combination:**
- All permissions from both roles are combined
- Most permissive (additive)
- No conflicts (system handles)
- User has union of all permissions

### Bulk Assign Role

**Assign Same Role to Multiple Users:**

**In User List:**
1\. Select multiple users (checkboxes)
2\. Click **Bulk Actions**
3\. Select **Assign Role**
4\. Choose role
5\. Review affected users
6\. Confirm action
7\. All users assigned

**Examples:**
- Assign all users in department to department manager role
- Add new role to entire team
- Promote multiple users to manager role

---

## Direct Permission Assignment

### Assign Permission Directly to User

**When Needed:**
- User needs specific permission outside their role
- Temporary exception to standard access
- Special project access
- Not recommended as standard practice

**Process:**

**In User Details:**
1\. Open user profile
2\. Go to Permissions section
3\. Click **Add Permission**
4\. Search for permission
5\. Select permission
6\. Confirm
7\. Permission added (in addition to role permissions)

**Scope Options:**
- All - Full access to resource
- Own - Only own resources
- Department - Department resources
- Custom - Organization-specific

**Examples:**
- campaign.create.all (directly grant)
- report.export (directly grant)
- user.delete (directly grant)

### Remove Direct Permission

**Process:**

1\. Find permission in Permissions list
2\. Click **Remove** button
3\. Confirm removal
4\. Permission revoked
5\. Role permissions still apply

---

## Permission Management Interface

### View All Permissions

**Access Permissions View:**
- Dashboard → User Management → Access Control → Permissions
- See full permission reference
- Organized by resource category
- Descriptions for each permission

**Information Displayed:**
- Permission code
- Description
- Resource type
- Action type
- Available scopes

### Check User Permissions

**View User's Permissions:**

1\. Open user profile
2\. Go to Permissions section
3\. See all permissions:
   - Permissions from roles
   - Direct permissions
   - Total permission count
4\. Sensitive permissions flagged
5\. Permission expiration dates (if applicable)

### View Role Permissions

**See Role's Permissions:**

1\. Go to Role Management
2\. Click role name
3\. See permission list
4\. Organized by category
5\. Can edit to add/remove
6\. Can see user count with role

---

## Permission Scopes

### Understanding Scopes

**Scope Determines Resource Limitation:**

**All Scope:**
- Access to all instances
- Most permissive
- Example: campaign.update (edit any campaign)

**Own Scope:**
- Own resources only
- Most restrictive
- Example: campaign.update.own (edit own campaigns)

**Department Scope:**
- Department resources
- Medium restriction
- Example: campaign.read.department (view dept campaigns)

**Team Scope:**
- Team resources
- Team-level access
- Example: user.read.team (view team members)

### Selecting Appropriate Scope

**Principle of Least Privilege:**
1\. Use most restrictive scope possible
2\. Only use broader scope if necessary
3\. Document justification for broad scopes
4\. Review periodically for tightening

**Scope Selection Guide:**


**New user, basic access** - own - Start restrictive


**Manager managing team** - team - Team-only access


**Department head** - department - Department-wide


**Analyst across org** - all - Need full view


**System admin** - all - Full administration


---

## Best Practices

### Assignment Practices

1\. **Use Roles First** - Assign via roles, not direct permissions
2\. **Document Exceptions** - Note any direct permissions
3\. **Principle of Least Privilege** - Minimum needed access
4\. **Review Regularly** - Quarterly permission audits
5\. **Approve Changes** - Permission requests require approval

### When Assigning Permissions

1\. **Verify Need** - Why does user need this?
2\. **Choose Scope** - Use most restrictive scope
3\. **Set Expiration** - For temporary access, set end date
4\. **Notify User** - Inform user of permissions
5\. **Document** - Record reason and date
6\. **Audit** - Monitor usage

### For Sensitive Permissions

1\. **Limit Broadly** - Few users, specific roles only
2\. **Require MFA** - Multi-factor auth for access
3\. **Enable Auditing** - Log all usage
4\. **Review Monthly** - More frequent than general
5\. **Document** - Record all grants and removals

---

## Temporary Permission Access

### Grant Temporary Access

**For Short-Term Needs:**

1\. Assign role or permission
2\. Note assignment date
3\. Set internal reminder for removal
4\. Monitor usage
5\. Remove on expiration date

**Better Approach: Use Temporary Roles**
1\. Create temporary role
2\. Assign to user
3\. Delete role when no longer needed
4\. Cleaner than tracking manual removals

**Options:**
- Assign secondary role temporarily
- Grant direct permission with end date
- Create project-specific role
- Add to special access group

### Remove Temporary Access

**Process:**

**Remove Role:**
1\. Open user details
2\. Find role in list
3\. Click **Remove**
4\. Confirm
5\. Role removed

**Remove Permission:**
1\. Open user details
2\. Find permission
3\. Click **Remove**
4\. Confirm
5\. Permission revoked

---

## Permission Approval Workflow

### Request & Approval Process

**Standard Workflow:**

1\. **User Requests Access**
   - Submits permission request
   - Specifies what access needed
   - Provides business justification
   - Suggests duration

2\. **Manager Approves**
   - Manager reviews request
   - Verifies business need
   - Approves or denies

3\. **Admin Grants Access**
   - Admin receives approval
   - Assigns permissions/role
   - Notifies user
   - Logs assignment

4\. **User Uses Access**
   - User has assigned permissions
   - Can now perform actions
   - Access is audited

5\. **Periodic Review**
   - Verify access still needed
   - Remove if no longer needed
   - Renew if continuing need

---

## Troubleshooting

### User Cannot Access Feature

**Issue:** User lacks expected permissions

**Checklist:**
1\. Does user have required role? ✓
2\. Does role have permission? ✓
3\. Is permission scope adequate (own/all)? ✓
4\. Is there a direct permission denying access? ✓
5\. Has user logged out/in since change? ✓

**Solutions:**
- Assign correct role
- Verify role has permissions
- Adjust scope if needed
- User must log out/in
- Check for denying permissions

### Too Many Permissions for User

**Issue:** User has excessive permissions

**Steps to Fix:**
1\. Review role assignment
2\. Check for direct permissions
3\. Identify unnecessary permissions
4\. Remove excess permissions
5\. Document changes

### Cannot Assign Permission

**Issue:** Permission not appearing in list or assignment fails

**Causes:**
- Permission doesn't exist
- Permission disabled
- Insufficient admin privileges
- System error

**Solutions:**
- Check permission exists in system
- Verify admin status
- Try again or refresh
- Contact system administrator

---

## Permission Compliance & Auditing

### Track Permission Changes

**Maintain Audit Trail:**
1\. Who assigned permission
2\. When assigned
3\. Why assigned (justification)
4\. Who removed it (if removed)
5\. When removed

**Use For:**
- Compliance documentation
- Security audits
- Access reviews
- Problem investigation

### Regular Permission Audits

**Quarterly Audits:**

1\. **Review User Permissions**
   - Do they match current role?
   - Are all permissions needed?
   - Are there excess permissions?

2\. **Review Role Permissions**
   - Are permissions still appropriate?
   - Should anything be added/removed?
   - Do roles match organizational needs?

3\. **Review Sensitive Access**
   - Who has access to sensitive data?
   - Is access justified?
   - Are usage patterns normal?

4\. **Document Findings**
   - Note any anomalies
   - Plan corrective actions
   - Implement changes

---

