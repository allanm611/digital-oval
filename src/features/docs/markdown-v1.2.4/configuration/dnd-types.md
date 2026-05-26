---
title: DND Types Management
---

# DND Types Management

Configure the different types of Do Not Disturb (DND) message categories used throughout the DND Management system. DND Types determine what categories of messages customers can opt out of.

## Overview

DND Types Management allows administrators to:
- View all available DND message types
- Create new DND types for custom message categories
- Edit existing DND types
- Manage DND type descriptions and codes

The DND types are used when adding customers to DND lists - customers can opt out of specific message types rather than entire channels.

## Accessing DND Types

Navigate to **Configuration → DND Management → DND Types**.

## DND Types List

![DND Types Management](/img/v1.2.4/dndtypesmanagementpage.png)

The DND Types list displays all configured message types:

**Columns:**
- **Type Name** - Display name of the DND type (e.g., "Promotional")
- **Type Code** - Unique identifier for the type (e.g., "promotional")
- **Description** - Explanation of what messages this type covers
- **Status** - Active or Inactive
- **Created Date** - When the type was created
- **Actions** - Edit or Delete buttons

### Default DND Types

The system includes these default DND types:

- **Promotional** - Special offers, discounts, promotional campaigns, and sales notifications
- **Transactional** - Order confirmations, receipts, transaction-related communications, and invoices
- **Marketing** - Marketing campaigns, brand communications, and newsletters
- **Service** - Service updates, maintenance notifications, account information, and support communications
- **Other** - Miscellaneous communications that don't fit other categories

## Creating a New DND Type

Click the **Create** button to add a new DND message type.

![Create DND Type Modal](/img/v1.2.4/createdndtypemodal.png)

**Required Fields:**

1. **Type Name** - Display name for the DND type
   - Example: "Loyalty Rewards"
   - Used in the UI when customers opt out
   - Should be clear and concise

2. **Type Code** - Unique identifier/code for the type
   - Example: "loyalty_rewards"
   - Must be unique across all DND types
   - Use lowercase with underscores (no spaces)
   - This is the internal reference used in the system

3. **Description** - Detailed explanation of what messages this type covers
   - Example: "Communications related to loyalty program rewards, points, and exclusive member benefits"
   - Helps administrators understand what customers are opting out of

**How to Create:**
1. Click **Create** button
2. Enter the Type Name
3. Enter the Type Code (unique identifier)
4. Enter a Description
5. Click **Save**

The new DND type will be immediately available for use when adding customers to DND lists.

## Editing a DND Type

Click the **Edit** button on any DND type to modify its details.

**Editable Fields:**
- Type Name - Update the display name
- Description - Update the explanation
- Status - Activate or deactivate the type (if applicable)

**Note:** The Type Code cannot be changed after creation to maintain consistency with existing DND records.

**How to Edit:**
1. Click **Edit** on the DND type
2. Update the desired fields
3. Click **Save** to apply changes

## Deleting a DND Type

Click the **Delete** button on any DND type to remove it.

**Before Deleting:**
- Ensure the type is not currently in use by active DND subscriptions
- If the type has existing DND entries, consider deactivating instead of deleting
- Deletion cannot be undone

**Note:** Deleting a DND type removes it from future DND operations but maintains historical records for audit purposes.

## DND Type Status

**Active Status** - The DND type is available for use. Customers can opt out of this message type when added to DND lists.

**Inactive Status** - The DND type is not available for new DND subscriptions. Existing subscriptions to this type are maintained for historical purposes.

## Best Practices

1. **Clear Naming** - Use clear, descriptive names that customers and staff can easily understand
2. **Consistent Codes** - Use lowercase with underscores for type codes
3. **Detailed Descriptions** - Provide clear descriptions of what messages belong to each type
4. **Default Types** - Review the default types before creating custom ones
5. **Deactivate Before Deleting** - Deactivate types instead of deleting them to maintain audit trails

## Using DND Types

Once DND types are configured, they are used in:
- [DND Management by Channel](/documentation/configuration/dnd-management-by-channel) - When adding customers to channel-specific DND lists
- [DND Management Bulk](/documentation/configuration/dnd-management-bulk) - When bulk adding customers to DND
- Customer preferences - When customers opt out of message types

