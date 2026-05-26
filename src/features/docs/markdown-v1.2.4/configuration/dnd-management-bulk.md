---
title: DND Management Bulk
---

# DND Management Bulk

Manage DND subscriptions across all communication channels at once. Bulk Management provides advanced filtering, search, and batch operations to efficiently handle multiple DND entries.

## Accessing Bulk Management

Navigate to **Configuration → DND Management** and click the **Bulk Management** card.

## Key Features

### Search and Filter

**Search:**
- Search by customer name, email, or phone number
- Real-time search as you type

**Filters:**
1. **DND Type Filter** - Filter subscriptions by message type:
   - Promotional
   - Transactional
   - Marketing
   - Service
   - Other
2. **Channel Filter** - Filter subscriptions by communication channel:
   - SMS
   - Email
   - USSD
   - Push

Filters can be combined to narrow results. For example, filter for "Promotional" type on "SMS" channel.

### Viewing DND Subscriptions

![DND Bulk Management List](/img/v1.2.4/dndbulkmanagementlistpage.png)

The table displays all DND subscriptions matching your filters:

**Columns:**
- **Customer Name** - Name of the opted-out customer
- **Contact Info** - Email or phone number
- **DND Type** - Message type they opted out of
- **Channel** - Communication channel
- **Status** - Active or Removed
- **Added Date** - When they were added to DND
- **Added By** - User who added them

## Adding Customers in Bulk

Click the **Add Customers** button to add multiple customers to DND across one or more channels.

**Required Fields:**
1. **DND Type** - Select which message type to opt customers out of:
   - Promotional
   - Transactional
   - Marketing
   - Service
   - Other
2. **Select Channels** - Choose which channels to apply DND to:
   - SMS
   - Email
   - USSD
   - Push
3. **Select Customers** - Search and select multiple customers from the list

**Optional Field:**
4. **Duration** - Set when the DND subscriptions expire:
   - **Never expires** - Customers remain in DND indefinitely
   - **7 days** - DND expires in 7 days
   - **30 days** - DND expires in 30 days
   - **90 days** - DND expires in 90 days
   - **180 days** - DND expires in 180 days
   - **1 year** - DND expires in 1 year
   - **Custom date** - Select a specific expiry date

**How to Add in Bulk:**

![Add Members DND Bulk Management](/img/v1.2.4/addmembersdndbulkmanagement.png)

1. Click **Add Customers** button
2. Select the DND type
3. Select the channels to apply DND to
4. Search for and select multiple customers (checkboxes)
5. (Optional) Select a duration for the DND
6. Click **Add**

The system will:
- Add all selected customers to the selected DND type across all selected channels
- Set status to Active
- Record the current date and time
- Record the user who added them
- Set the same expiry date for all customers (if duration is selected)

**Example:** Add 5 customers to "Promotional" DND for both SMS and Email channels with 30-day expiry.

## Removing Customers in Bulk

### Single Removal

Click the **Remove** button on any DND entry to remove that customer from the DND list.

### Batch Removal

Remove multiple customers at once:

1. Click **Select Customers** button to enter selection mode
2. Click checkboxes to select individual customers, or click the header checkbox to select all visible customers
3. Click **Remove Selected** button in the batch actions toolbar
4. Confirm the removal

**Batch Actions Toolbar** (appears when customers are selected):
- Shows count of selected customers (e.g., "5 customer(s) selected")
- **Remove Selected** button to remove all selected at once
- **Clear Selection** button to deselect all

**What Happens After Removal:**
- Status changes from Active to Removed
- Removal date and time is recorded
- User who removed them is recorded
- Historical records are maintained for audit purposes

## Selection Mode

**Enable Selection Mode:**
- Click **Select Customers** button to enable selection
- Checkboxes appear next to each entry
- Click header checkbox to select/deselect all visible customers

**Disable Selection Mode:**
- Click **Select Customers** button again to exit selection mode
- All selections are cleared

**Batch Actions** only appear when in selection mode with selected customers.

## Tips for Efficient Bulk Management

- **Use Filters First** - Filter by DND type and channel before applying batch operations
- **Search Before Selecting** - Use search to find specific customers, then select them
- **Combine Channels** - When adding, select multiple channels to apply DND across the board
- **Review Before Batch Remove** - Always review selected customers before confirming batch removal

## For Channel-Specific Management

To manage DND for a single channel with a simpler interface, use [DND Management by Channel](/documentation/configuration/dnd-management-by-channel) instead.
