# Additional Features

## User Management - Access Control & Role Permissions

### What is it?
The system now has role-based access control. Each user is assigned a role, and each role has specific permissions. **System roles** (built-in roles) have restrictions on what can be modified.

### System Roles - What's Restricted?

**System Roles CANNOT:**
- ❌ Edit role details (name, description, hierarchy level)
- ❌ Delete the role
- ❌ Deactivate the role
- ✓ But CAN be cloned to create custom roles based on them

**Default Roles CANNOT:**
- ❌ Deactivate default roles (they're always active)

### User Management Features

**View User Information:**
- All users in the system with their details
- Each user's assigned role
- User's permission list (what they can access/do)
- User's data access level (public, internal, confidential, restricted)
- PII (Personal Identifiable Information) access status - whether they can see customer personal data

**Role & Permission Details:**
- See all roles (system and custom)
- See all permissions and what action they allow (create, read, update, delete, execute, manage)
- Understand permission categories (campaigns, communications, settings, etc.)

### How to Test It

1. **View User Roles:**
   - Go to dashboard/admin area
   - Find user management section
   - Click any user to see their assigned role

2. **Check User Permissions:**
   - Open user details
   - Look for the "Permissions" section
   - See list of all permissions assigned to that user
   - Count total permissions and roles

3. **Test System Role Restrictions:**
   - Go to Roles Management (usually under Settings)
   - Look for system roles (they're marked as "System")
   - Try to edit one - you'll see "Cannot modify system roles" message
   - Try to delete one - same restriction appears
   - Try to deactivate one - you'll see "Cannot deactivate system roles"

4. **Clone a System Role:**
   - Open any system role
   - Click Clone button
   - This creates a new custom role based on the system role
   - The new role CAN be edited/deleted

### Data Access Levels

Each role has a data access level:
- **Public** - Can access all public data
- **Internal** - Can access internal and public data
- **Confidential** - Can access confidential, internal, and public data
- **Restricted** - Can access all data including restricted information

### What's Working

- ✓ View all users and their roles
- ✓ See all permissions each user has
- ✓ View data access levels
- ✓ Check PII access status
- ✓ Identify system vs custom roles
- ✓ See permission categories
- ✓ Clone system roles to create custom ones
- ✓ Edit and delete custom roles
- ✓ Activate/deactivate custom and default roles

### Restrictions (By Design)

- System roles cannot be edited, deleted, or deactivated (protected)
- Default roles cannot be deactivated (always active)
- System roles can only be cloned, not modified

---
