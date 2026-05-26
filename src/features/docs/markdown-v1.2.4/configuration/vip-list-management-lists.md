# Manage VIP Lists

## Overview

The VIP Lists tab allows you to create, view, and manage VIP list definitions. VIP lists organize your high-value customers into separate tiers for targeted campaigns and special handling.

## Accessing VIP Lists

1. Go to **Configuration → VIP List Management**
2. Click the **VIP Lists** tab to view all VIP lists

The VIP Lists tab displays all VIP lists in your system with the following information:

**List Name** - Name of the VIP list or tier (e.g., "Premium VIP", "Gold VIP")

**Description** - Optional description of the VIP list's purpose

**Customers** - Number of customers in this VIP list (clickable to view members)

**Rows Imported** - Number of customer records successfully imported or added to this list

**Rows Failed** - Number of customer records that failed to import or could not be added

**Status** - Processing status of import operations:
- **Pending** - Import operation is waiting to be processed
- **Processing** - Import operation is currently running
- **Completed** - Import operation finished successfully
- **Failed** - Import operation encountered errors

**Actions** - Delete button to remove the VIP list

## Search and Filtering

### Search

Use the search box to find VIP lists by name or description. The search is performed as you type.

### Filters

Currently, filtering is available on the Customers tab. On the Lists tab, you can only search by name or description.

## Creating a VIP List

Click the **Create List** button in the top right:

1. A modal opens with form fields
2. Enter the **List Name** (required, max 255 characters)
3. Enter an optional **Description** (max 1000 characters)
4. Click **Create** to add the VIP list

The new VIP list will appear in the table and be ready to receive members.

## Viewing List Members

Click on the **customer count** for any VIP list to open a modal displaying all members in that list:

1. The modal shows a table of all customers in the selected VIP list
2. View customer details including name, email, phone, and status
3. Click **Remove** on any customer to remove them from the VIP list
4. Close the modal to return to the VIP lists view

## Deleting a VIP List

To remove a VIP list:

1. Click the **Delete** button (trash icon) on the VIP list row
2. Confirm the deletion when prompted
3. The VIP list will be removed from the system

**Note**: Deletion cannot be undone. Ensure the list is no longer needed before deleting.

## Understanding Import Statistics

**Rows Imported** - Counts customer records that were successfully added to the VIP list through:
- Manual addition via the Add Members feature
- Bulk import operations

**Rows Failed** - Counts records that encountered issues during import, such as:
- Duplicate customer IDs
- Invalid customer data
- System errors during processing

**Processing Status** - Indicates the current state of any import operations:
- **Pending** - Operation is queued and waiting to start
- **Processing** - Operation is currently running
- **Completed** - Operation finished successfully
- **Failed** - Operation encountered errors; check Rows Failed count

## Tips

- Use descriptive names for VIP lists to indicate their tier or purpose
- Keep descriptions updated to explain the criteria for membership
- Monitor customer counts to understand VIP segment sizes
- Check import statistics to verify data quality when importing members

## Related Pages

- [VIP List Management Overview](/documentation/configuration/vip-list-management-overview)
- [View VIP Customers](/documentation/configuration/vip-list-management-customers)
