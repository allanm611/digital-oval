# VIP List Management

## Overview

VIP Lists allow you to create and manage special customer groups with priority treatment in campaigns. VIP customers receive preferential messaging, exclusive offers, and enhanced communication strategies.

![VIP Lists Overview](/img/v1.1/configuration/viplistsoverview.png)

## What are VIP Lists?

VIP Lists enable you to:

- **Prioritize High-Value Customers** - Segment customers with high lifetime value or strategic importance
- **Create Tiered Communication** - Apply different messaging strategies based on customer tier
- **Manage Exclusions** - Exclude VIP segments from standard campaigns and apply special rules
- **Track VIP Metrics** - Monitor VIP customer behavior and engagement separately

## Managing VIP Lists

Navigate to **Configuration → VIP Lists** to manage all VIP customer groups.

### View VIP Lists

The VIP lists view displays all configured VIP groups with:

- **Name** - VIP group identifier
- **Description** - Purpose of the VIP group
- **Member Count** - Number of customers in the VIP group
- **Status** - Active or Inactive
- **Created Date** - When the VIP group was created
- **Last Updated** - When the VIP group was last modified

You can:

- **Search** - Find VIP lists by name
- **Filter by Status** - Show all, active, or inactive VIP groups

### Create VIP List

Click the **Create VIP List** button to add a new VIP customer group.

**Steps:**

1. Enter the VIP list name
2. Enter a description of the VIP group's purpose
3. Define member selection criteria:
   - Manual selection - Manually add customers to the VIP list
   - Segment-based - Automatically include customers from a segment
   - Criteria-based - Define conditions (e.g., customers with LTV > $X)
4. Configure VIP treatment rules (optional):
   - Communication frequency preferences
   - Exclusive offer eligibility
   - Message personalization settings
5. Review and save

### Edit VIP List

Click **Edit** on any VIP list to update:

- Name
- Description
- Member selection criteria
- VIP treatment rules
- Status

Click **Save** to apply changes.

### Delete VIP List

Click **Delete** to remove a VIP list. The list will be permanently removed, but customer data is preserved.

## VIP Status

VIP lists can have the following statuses:

- **Active** - VIP list is currently in use
- **Inactive** - VIP list exists but is not being applied to campaigns

## Tips

- Define clear criteria for VIP status to ensure consistency
- Review VIP lists periodically to update membership based on customer behavior
- Use VIP lists to prevent communication fatigue with high-value customers
- Create multiple VIP tiers if you have different customer value segments
- Test campaign messaging on a subset of VIP customers before full deployment

## Related Pages

- [Configuration Overview](/documentation/configuration/overview)
- [Segments](/documentation/segments/segments-list)
