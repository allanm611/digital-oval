# VIP Customers

## Overview

The VIP Customers tab displays all customers assigned to VIP lists across your system. You can search, filter, and manage individual customer memberships from this view.

## Accessing VIP Customers

1. Go to **Configuration → VIP List Management**
2. Click the **VIP Customers** tab to view all VIP customers

The VIP Customers tab displays a list of all customers added to VIP lists with the following information:

**Name** - Customer name or identifier

**Email** - Customer email address

**VIP List** - Which VIP list the customer belongs to

**Status** - Current membership status:
- **Active** - Customer is currently in the VIP list
- **Inactive** - Customer was previously in the VIP list but has been removed

**Added Date** - When the customer was added to the VIP list

## Search and Filtering

### Search

Use the search box to find customers by name, email, or phone number. The search is performed as you type.

### Filters

Click the filter dropdowns to filter customers by:

- **VIP List** - Filter by which VIP list they belong to
- **Status** - Filter by membership status:
  - All Status - Show all customers
  - Pending - Customers waiting to be added (import status)
  - Processing - Customers currently being added (import status)
  - Completed - Customers successfully added
  - Failed - Customers that failed to be added

## Adding Customers to VIP Lists

Click the **Add Members** button in the top right to add customers to VIP lists:

1. A modal opens showing available customers
2. Select the VIP list to add them to
3. Search and select the customers you want to add
4. Click **Add** to add them to the VIP list

**Note**: Customers already in the VIP list cannot be selected again to prevent duplicates.

## Removing Customers from VIP Lists

To remove a customer from a VIP list:

1. Find the customer in the customers table
2. Click the **Remove** button (trash icon) on their row
3. Confirm the removal when prompted
4. The customer's status will change from Active to Inactive
5. Historical records are kept for audit purposes

## Customer Status

- **Active** - Customer is currently in the VIP list. They are treated as VIP in campaigns and policies.
- **Inactive** - Customer was previously in the VIP list but has been removed. They will no longer be treated as VIP.

## Tips

- Use search to quickly find specific customers
- Use status filter to focus on active VIP customers
- Use VIP List filter to view customers in specific tiers
- Monitor the customer list to keep your VIP segments accurate

## Related Pages

- [VIP List Management Overview](/documentation/configuration/vip-list-management-overview)
- [Manage VIP Lists](/documentation/configuration/vip-list-management-lists)
- [Add VIP Customers](/documentation/configuration/add-vip-customers)
