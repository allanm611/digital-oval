# Permissions

## Overview

Permissions are granular access controls that define what users can do in the system. Permissions are bundled into roles, then roles are assigned to users. This reference guide documents all available permissions and their purposes.

---

## Permission Structure

### Permission Format

**Standard Permission Code Format:**
```
resource.action.scope
```

**Components:**

**Resource:**
- What is being accessed (campaign, offer, user, segment, etc.)

**Action:**
- What can be done (create, read, update, delete, execute, admin)

**Scope:**
- Limitation on the resource (optional)
- all - no scope limitation
- own - only own resources
- department - department resources
- team - team resources

**Examples:**
- `campaign.create` - Create campaigns
- `campaign.update.own` - Update own campaigns only
- `user.delete.all` - Delete any user
- `report.export` - Export reports

### Action Types

**Create**
- Create new resources
- Example: campaign.create

**Read (View)**
- View/read resources
- Example: campaign.read

**Update (Edit)**
- Modify existing resources
- Example: campaign.update

**Delete (Remove)**
- Delete/remove resources
- Example: campaign.delete

**Execute**
- Run/execute actions
- Example: campaign.execute (launch campaign)

**Admin**
- Full administrative control
- Example: user.admin (manage all users)

---

## Campaign Permissions

### Campaign Management

| Permission | Description | Use For |
|-----------|-------------|---------|
| campaign.create | Create new campaigns | Campaign managers |
| campaign.read | View campaigns | All users |
| campaign.update | Edit campaigns | Campaign managers |
| campaign.delete | Delete campaigns | Campaign managers (restricted) |
| campaign.execute | Launch/execute campaigns | Campaign managers |
| campaign.admin | Administer campaigns | Admins |

### Campaign Approval

| Permission | Description | Use For |
|-----------|-------------|---------|
| campaign.approve | Approve campaigns | Approvers |
| campaign.reject | Reject campaigns | Approvers |
| campaign.submit | Submit for approval | Campaign managers |

### Campaign Reporting

| Permission | Description | Use For |
|-----------|-------------|---------|
| campaign.report.view | View campaign reports | All users |
| campaign.report.export | Export campaign data | Analysts |

---

## Offer Permissions

### Offer Management

| Permission | Description | Use For |
|-----------|-------------|---------|
| offer.create | Create offers | Offer managers |
| offer.read | View offers | All users |
| offer.update | Edit offers | Offer managers |
| offer.delete | Delete offers | Offer managers (restricted) |
| offer.admin | Administer offers | Admins |

### Offer Actions

| Permission | Description | Use For |
|-----------|-------------|---------|
| offer.approve | Approve offers | Approvers |
| offer.activate | Activate/enable offers | Offer managers |
| offer.deactivate | Deactivate/disable offers | Offer managers |

---

## Segment Permissions

### Segment Management

| Permission | Description | Use For |
|-----------|-------------|---------|
| segment.create | Create segments | Segment managers |
| segment.read | View segments | All users |
| segment.update | Edit segments | Segment managers |
| segment.delete | Delete segments | Segment managers (restricted) |
| segment.admin | Administer segments | Admins |

### Segment Actions

| Permission | Description | Use For |
|-----------|-------------|---------|
| segment.execute | Execute/refresh segments | Segment managers |
| segment.export | Export segment members | Analysts |

---

## Product Permissions

### Product Management

| Permission | Description | Use For |
|-----------|-------------|---------|
| product.create | Create products | Product managers |
| product.read | View products | All users |
| product.update | Edit products | Product managers |
| product.delete | Delete products | Product managers (restricted) |
| product.admin | Administer products | Admins |

---

## User Management Permissions

### User Administration

| Permission | Description | Use For |
|-----------|-------------|---------|
| user.create | Create users | Admins |
| user.read | View users | All users |
| user.update | Edit user info | User/self or admins |
| user.delete | Delete users | Admins (restricted) |
| user.admin | Full user administration | Admins |

### User Actions

| Permission | Description | Use For |
|-----------|-------------|---------|
| user.activate | Activate users | Admins |
| user.deactivate | Deactivate users | Admins |
| user.suspend | Suspend users | Admins |
| user.unlock | Unlock locked accounts | Admins |
| user.reset.password | Reset user passwords | Admins |

### User Roles & Permissions

| Permission | Description | Use For |
|-----------|-------------|---------|
| user.role.assign | Assign roles to users | Admins |
| user.mfa.enable | Enable MFA for users | Admins |
| user.mfa.disable | Disable MFA for users | Admins |

---

## Role Management Permissions

### Role Administration

| Permission | Description | Use For |
|-----------|-------------|---------|
| role.create | Create new roles | Admins |
| role.read | View roles | All users |
| role.update | Edit roles | Admins |
| role.delete | Delete roles | Admins |
| role.admin | Full role administration | Admins |

---

## Reporting Permissions

### Report Access

| Permission | Description | Use For |
|-----------|-------------|---------|
| report.read | View reports | All users |
| report.create | Create custom reports | Analysts |
| report.export | Export report data | Analysts |
| report.schedule | Schedule reports | Analysts |
| report.admin | Administer reporting | Admins |

### Report Types

| Permission | Description | Use For |
|-----------|-------------|---------|
| report.campaign | Access campaign reports | Marketing |
| report.customer | Access customer reports | Analytics |
| report.user | Access user reports | HR/Admins |
| report.system | Access system reports | Admins |

---

## Customer Data Permissions

### Customer Data Access

| Permission | Description | Use For |
|-----------|-------------|---------|
| customer.read | View customer data | Authorized users |
| customer.create | Create customer records | Customer team |
| customer.update | Edit customer data | Customer team |
| customer.delete | Delete customer records | Admins (restricted) |

### Sensitive Data

| Permission | Description | Use For |
|-----------|-------------|---------|
| data.pii.access | Access PII (personal data) | Authorized users |
| data.pii.export | Export personal data | Analysts (restricted) |
| data.confidential | Access confidential data | Management |

---

## System Administration Permissions

### System Management

| Permission | Description | Use For |
|-----------|-------------|---------|
| system.config | Modify system configuration | Admins |
| system.admin | Full system administration | Admins |
| system.logs | View system logs | Admins |
| system.backup | Manage backups | Admins |

### Audit & Compliance

| Permission | Description | Use For |
|-----------|-------------|---------|
| audit.read | View audit logs | Admins/Compliance |
| audit.export | Export audit data | Compliance |
| compliance.review | Review compliance | Compliance officers |

---

## Permission Scopes

### Scope Levels

**Global Scope (all)**
- Access to all resources system-wide
- Example: campaign.update (update any campaign)

**Own Scope (own)**
- Access only to own resources
- Example: campaign.update.own (update only own campaigns)

**Department Scope (department)**
- Access within department
- Example: campaign.read.department (view department campaigns)

**Team Scope (team)**
- Access within team
- Example: user.read.team (view team members)

**Custom Scopes**
- Organization-specific scopes
- Example: campaign.read.region (view region campaigns)

---

## Permission Combinations

### Example Role: Campaign Manager

**Permissions:**
- campaign.create - Create campaigns
- campaign.read - View campaigns
- campaign.update - Edit campaigns
- campaign.execute - Launch campaigns
- campaign.approve (if approver)
- offer.read - View offers
- segment.read - View segments
- report.campaign - View campaign reports

### Example Role: Analyst

**Permissions:**
- campaign.read - View campaigns
- offer.read - View offers
- report.read - View all reports
- report.export - Export report data
- customer.read - View customer data
- data.pii.access (if approved)

### Example Role: Admin

**Permissions:**
- All permissions (*.admin covers all)
- OR explicit permissions as listed

---

## Sensitive Permissions

### Require Extra Care

**Critical Permissions:**
- user.admin - Full user management
- role.admin - Manage all roles
- permission.admin - Change system permissions
- system.admin - Full system access
- system.config - Modify system config
- audit.read - View audit logs
- data.pii.access - Access personal data

**Controls for Sensitive Permissions:**
1\. Limit who has access (fewest necessary)
2\. Require MFA for users with access
3\. Audit all usage (log all actions)
4\. Regular review (quarterly)
5\. Document justification (why assigned)

---

## Permission Hierarchy

### Scope Hierarchy

**Most Restrictive (Least Access):**
1\. own - Only own resources
2\. team - Team resources
3\. department - Department resources
4\. all - All resources (most access)

**Permission Inheritance:**
- More specific permissions don't automatically include broader permissions
- campaign.update.own ≠ campaign.update
- Must grant separately if broader access needed

---

## Best Practices

### Permission Assignment

1\. **Least Privilege** - Only needed permissions
2\. **Clear Purpose** - Document why permission assigned
3\. **Regular Review** - Quarterly permission audits
4\. **Sensitive Monitoring** - Extra audit for sensitive perms
5\. **Scope Appropriately** - Use most restrictive scope

### Documentation

1\. **Permission List** - Maintain documented list
2\. **Role Templates** - Document standard roles
3\. **Update Process** - How to request permissions
4\. **Approval** - Who can approve permission grants
5\. **Audit Trail** - Keep change history

---

## Common Questions

### Q: What permissions does a new user need?

**A:** Depends on role. Standard User role usually has:
- Read permissions for relevant modules
- Create/update for own content
- No admin permissions
- Specific scopes (own, department)

### Q: Can a user have different permissions without role?

**A:** Yes, but not recommended. Direct permissions can be assigned but:
- Use roles for consistency
- Direct permissions for exceptions only
- Still subject to role permissions
- Create custom role for consistent needs

### Q: What if user needs temporary extra access?

**A:** Options:
1\. Assign temporary role (better)
2\. Grant direct permission
3\. Create temporary role
4\. Set expiration date
5\. Audit and remove later

### Q: How do I know what permissions a user has?

**A:** Check user details:
1\. View User → Permissions section
2\. Shows direct permissions
3\. Shows all role permissions
4\. Total combined permissions
5\. Sensitive permissions highlighted

---

## Related Documentation

- [Role Management](/documentation/role-management) - Create and manage roles
- [Assign Permissions](/documentation/assign-permissions) - Assign to users/roles
- [User Management](./documentation/users-list) - Manage users
- [Unauthorized](/documentation/unauthorized) - Access denied errors
