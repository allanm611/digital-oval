# Role Management

## Overview

Manage system roles and role-based access control (RBAC). Create roles with specific permission sets, assign roles to users, manage role hierarchy, and ensure consistent access control across the organization. Roles are the foundation of the access control system.

---

## Role Concept

### What is a Role?

**Definition:** A role is a named set of permissions that can be assigned to users. Instead of assigning permissions individually to each user, permissions are bundled into roles, then users are assigned to roles.

**Benefits:**
- **Consistency** - All users in same role have same permissions
- **Scalability** - Easy to manage many users
- **Maintainability** - Change permissions once affects all users with role
- **Auditability** - Clear access structure for compliance

### Role Hierarchy

**Typical Organizational Roles:**
- **Admin** - Full system access
- **Manager** - Department/team management
- **User** - Standard user access
- **Viewer** - Read-only access
- **Custom Roles** - Organization-specific roles

---

## Accessing Role Management

**Navigation:** Dashboard → User Management → Access Control → Role Management

The Role Management page displays all configured roles with their associated permissions and user counts.

---

## Role List Interface

### View All Roles

**Displays:**
- **Role Name** - Display name
- **Code** - System identifier
- **Description** - Purpose explanation
- **User Count** - How many users have role
- **Permission Count** - Number of permissions
- **Status** - Active/Inactive
- **Created Date** - When created
- **Actions** - Edit, Delete, View buttons

### Search & Filter

**Search Roles:**
- By role name
- By description
- By code
- By status

**Filter by:**
- Active/Inactive roles
- By permission count
- By user count
- By creation date

### Sort Options

- By name (A-Z or Z-A)
- By user count
- By permission count
- By creation date

---

## Core Role Types

### System Roles

**Admin**
- Full system access
- All permissions granted
- Can manage users and roles
- Can change system settings
- Highest privilege level

**Manager**
- Department/team management
- View team members
- Approve requests
- View team reports
- Limited system administration

**User**
- Standard user access
- View assigned data
- Create content in assigned areas
- No administrative access
- Standard privilege level

**Viewer**
- Read-only access
- View data only
- No modification capability
- Limited feature access
- Lowest privilege level

### Custom Roles

Organizations can create custom roles:
- Data Analyst
- Financial Reviewer
- Content Creator
- Support Agent
- Auditor

---

## Creating a Role

### Step-by-Step Guide

**Step 1: Access Create Role**
1\. Click **Create Role** button
2\. Form opens for new role

**Step 2: Enter Role Details**

**Role Name:**
- Display name for role
- Examples: "Campaign Manager", "Data Analyst"
- Max 100 characters
- Required

**Role Code:**
- System identifier
- Alphanumeric, snake_case format
- Example: "campaign_manager"
- Must be unique
- Required

**Description:**
- Purpose and use of role
- When to assign this role
- Responsibilities
- Optional but recommended

**Status:**
- Active - Role can be assigned
- Inactive - Role exists but cannot be assigned
- Default: Active

**Step 3: Assign Permissions**

1\. Click **Add Permission**
2\. Select permissions from list
3\. Or click to expand permission groups
4\. Check permissions to include
5\. Review selections

**Permission Examples:**
- campaign.create
- campaign.edit
- campaign.delete
- campaign.view
- offer.create
- user.create
- user.edit
- etc.

**Step 4: Review & Save**

1\. Review role name and permissions
2\. Verify all intended permissions included
3\. Click **Create Role**
4\. Confirmation appears
5\. Role created and ready to assign

---

## Managing Roles

### Edit Role

**Click "Edit" on role:**

**Editable Fields:**
- Role Name
- Description
- Status (Active/Inactive)
- Permissions (add/remove)

**Cannot Edit:**
- Role Code (immutable system identifier)
- Creation date
- Created by

**Steps:**
1\. Click **Edit** button
2\. Modify fields
3\. Click **Save**
4\. Changes apply immediately
5\. Users with role receive updated permissions

### View Role Details

**Click role name to view:**

**Information Displayed:**
- Role name and code
- Description
- Status
- Full permission list
- User count with role
- Created date/by
- Last modified date/by

**User List:**
- All users with this role
- Click to view user details
- Bulk actions on users

### Assign Permissions to Role

**Click "Edit Permissions":**

1\. See all available permissions
2\. Check permissions to include
3\. Uncheck to remove
4\. Organize by category
5\. Click **Save**

**Permission Organization:**
- Campaign Permissions
- Offer Permissions
- Segment Permissions
- User Management
- System Administration
- Reporting
- Custom Permissions

### Delete Role

**Click "Delete":**

**Confirmation Required:**
- Confirm role name
- Confirm deletion is permanent
- Cannot delete if users have role

**Before Deleting:**
1\. Reassign users to different role
2\. Verify no dependencies
3\. Document reason for deletion
4\. Archive if needed for audit trail

---

## Permission Management

### Permission Structure

**Permissions Organized By:**

**Resource Type:**
- Campaigns
- Offers
- Segments
- Products
- Users
- Reports
- System

**Action Type:**
- Create (new)
- Read (view)
- Update (edit)
- Delete (remove)
- Execute (run actions)
- Admin (administer)

**Example Permission Codes:**
- campaign.create - Create campaigns
- campaign.read - View campaigns
- campaign.update - Edit campaigns
- campaign.delete - Delete campaigns
- user.admin - Admin users

### Permission Levels

**Granularity Levels:**

**Course Grained:**
- module.admin - Full module access
- Simple to manage
- Less specific

**Fine Grained:**
- resource.action.scope
- Very specific control
- More complex management
- More secure

**Hybrid Approach:**
- Mix of coarse and fine
- Balance security and usability
- Most common

### Sensitive Permissions

**Require Extra Caution:**
- user.admin - Manage all users
- role.admin - Manage roles
- permission.admin - Change permissions
- system.config - System configuration
- report.admin - All reports

**Controls:**
- Limit who has access
- Require MFA
- Audit all usage
- Regular reviews

---

## Role Assignment

### Assigning Roles to Users

**In User Details:**
1\. Click **Assign Role** or **Change Role**
2\. Select new role from dropdown
3\. Review permission changes
4\. Confirm action
5\. Optional: Notify user
6\. Permissions updated immediately

**Bulk Assignment:**
1\. Select multiple users
2\. Click **Bulk Assign Role**
3\. Select role
4\. Confirm action
5\. All users assigned

### Multiple Roles per User

**Assign Secondary Roles:**
1\. User has primary role
2\. Click **Add Role**
3\. Select additional role
4\. Confirm
5\. Permissions from both roles combined

**Use Cases:**
- User with both Manager and Analyst roles
- Temporary additional responsibilities
- Matrix organizational structures
- Special project assignments

**Permission Combination:**
- All permissions from all roles
- Additive (more permissive)
- No conflicts (system handles)

---

## Role Templates

### Pre-Built Role Templates

**Available Templates:**

**Admin**
- All system access
- Full permissions
- System management
- User administration

**Manager**
- Team management
- Content approval
- Report viewing
- Limited administration

**Editor**
- Content creation/editing
- View campaigns
- Create offers
- No administration

**Viewer**
- Read-only access
- View reports
- View campaigns
- No modifications

**Analyst**
- Data analysis
- Report creation
- Data export
- View all data

**Creating from Template:**
1\. Click "Create from Template"
2\. Select template
3\. Customize name/permissions
4\. Save

---

## Best Practices

### Role Design

1\. **Clear Purpose** - Each role has specific purpose
2\. **Minimal Permissions** - Only needed permissions
3\. **Consistent Names** - Clear, descriptive names
4\. **Document Roles** - Purpose and usage
5\. **Regular Review** - Keep roles current

### Role Hierarchy

1\. **Logical Structure** - Clear role relationships
2\. **Avoid Duplication** - No redundant roles
3\. **Inheritance** - Child roles inherit parent permissions
4\. **Granularity** - Balance specificity and usability
5\. **Scalability** - Design for growth

### Security

1\. **Least Privilege** - Minimum needed permissions
2\. **Segregation** - Separate sensitive permissions
3\. **Admin Roles** - Restricted admin role access
4\. **Regular Audit** - Review role permissions
5\. **Change Control** - Track permission changes

### Maintenance

1\. **Regular Reviews** - Quarterly role reviews
2\. **Update Documentation** - Keep descriptions current
3\. **Monitor Usage** - Track role assignments
4\. **Clean Up** - Remove unused roles
5\. **Version Control** - Track role history

---

## Common Scenarios

### Scenario 1: New Role for Campaign Team

**Goal:** Create role for campaign specialists

**Steps:**
1\. Click Create Role
2\. Name: "Campaign Specialist"
3\. Code: "campaign_specialist"
4\. Assign permissions:
   - campaign.create
   - campaign.read
   - campaign.update
   - offer.read
   - segment.read
   - report.read
5\. Save
6\. Assign to campaign team members

**Result:** Campaign team has appropriate access

### Scenario 2: Temporary Manager Access

**Goal:** Give user manager privileges temporarily

**Steps:**
1\. Go to user details
2\. Click "Add Role"
3\. Select "Manager" role
4\. Confirm
5\. Set expiration date (manual note)
6\. Later: Remove role when period ends

**Result:** User has manager permissions temporarily

### Scenario 3: Least Privilege Analyst

**Goal:** Create restrictive analyst role

**Steps:**
1\. Create new role "Data Analyst - Limited"
2\. Include permissions:
   - report.read
   - data.export (limited)
   - campaign.read (no edit)
   - offer.read (no edit)
   - No user management
   - No system access
3\. Assign to new analyst
4\. Gradually expand as needed

**Result:** Analyst has view-only access

---

## Troubleshooting

### Cannot Delete Role

**Issue:** Delete button disabled or fails

- **Cause:** Users still have role
- **Solution:** Reassign all users to different role first
- **Steps:**
  1\. View user list for role
  2\. Select all users
  3\. Bulk reassign to new role
  4\. Then delete old role

### Permission Changes Not Reflected

**Issue:** User permissions not updated after role change

- **Cause:** Permissions cached
- **Solution:** User must log out and log in
- **Or:** Clear browser cache
- **Or:** Permissions may be cached session-side

### Cannot Add Permission to Role

**Issue:** Permission not available in list

- **Cause:** Permission disabled or not configured
- **Solution:** Check if permission exists in system
- **Or:** Verify user has permission admin role

### Role Name Conflicts

**Issue:** Cannot use desired role name

- **Cause:** Role with name already exists
- **Solution:** Use different name
- **Or:** Delete/rename existing role

---

