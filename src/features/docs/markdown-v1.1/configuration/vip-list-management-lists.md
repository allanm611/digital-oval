# Manage VIP Lists

## Overview

The VIP Lists tab allows you to create, view, and manage VIP list definitions. VIP lists organize your high-value customers into separate tiers for targeted campaigns and special handling.

## Accessing VIP Lists

1. Go to **Configuration → VIP List Management**
2. Click the **VIP Lists** tab to view all VIP lists

## VIP Lists Overview

The VIP Lists tab displays all VIP lists in your system with the following information:

**List Name** - Name of the VIP list or tier (e.g., "Premium VIP", "Gold VIP")

**Description** - Optional description of the VIP list's purpose

**Customers** - Number of customers in this VIP list (clickable to view members)

**Rows Imported** - Number of rows successfully imported (for batch operations)

**Rows Failed** - Number of rows that failed during import (for batch operations)

**Status** - Current status (Active or Inactive)

**Actions** - Delete button to remove the VIP list

## Search and Filtering

### Search
Use the search box to find VIP lists by name or description. The search is performed as you type.

### Filters
Click the status filter dropdown to filter by:
- **All Status** - Show all VIP lists
- **Active** - Show only active VIP lists
- **Inactive** - Show only inactive VIP lists

## Creating a VIP List

Click the **Create List** button in the top right:

1. A modal opens with form fields
2. Enter the **List Name** (required)
3. Enter an optional **Description**
4. Click **Create** to add the VIP list

## Viewing List Members

Click on the customer count for any VIP list to view all members in that list:

1. A modal opens showing members of the selected list
2. View detailed member information
3. Close the modal to return to the VIP lists view

## Editing a VIP List

To modify a VIP list's details:

1. Click the VIP list in the table
2. The edit form opens with current settings
3. Modify the list name or description
4. Click **Save** to update the VIP list

## Deleting a VIP List

To remove a VIP list:

1. Click the **Delete** button (trash icon) on the VIP list row
2. Confirm the deletion when prompted
3. The VIP list will be removed from the system

**Warning**: Deletion cannot be undone. Ensure no campaigns or policies depend on this VIP list before deleting.

## VIP List Status

- **Active** - The VIP list is enabled and can be used in campaigns and policies
- **Inactive** - The VIP list is disabled and cannot be used

## Tips

- Use descriptive names for VIP lists to indicate their tier or purpose
- Keep descriptions updated to explain the criteria for membership
- Monitor customer counts to understand VIP segment sizes
- Use status filters to focus on active lists
- Check import statistics to verify data quality when importing members

## Related Pages

- [VIP List Management Overview](/documentation/configuration/vip-list-management-overview)
- [View VIP Customers](/documentation/configuration/vip-list-management-customers)
- [Add VIP Customers](/documentation/configuration/add-vip-customers)
