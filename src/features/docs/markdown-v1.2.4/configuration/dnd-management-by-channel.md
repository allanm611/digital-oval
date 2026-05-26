---
title: DND Management by Channel
---

# DND Management by Channel

Manage customer Do Not Disturb lists for individual communication channels. Each channel maintains separate DND lists for different message types.

## Accessing Channel DND Management

Navigate to **Configuration → DND Management** and click on any channel card:

- **SMS** - Text message opt-outs
- **Email** - Email communication opt-outs
- **USSD** - Interactive messaging opt-outs
- **Push** - Mobile app notification opt-outs

## Viewing DND List for a Channel

The DND list displays all customers opted out for that channel:

**Columns:**
- **Customer Name** - Name of the opted-out customer
- **Contact Info** - Email (for Email channel) or Phone (for SMS/USSD/Push)
- **DND Type** - Message type they opted out of (Promotional, Transactional, Marketing, Service, Other)
- **Status** - Active (currently in DND) or Removed (previously removed from DND)
- **Added Date** - When they were added to DND
- **Added By** - User who added them

**Filtering and Search:**
- **Search** - Find customers by name, email, or phone
- **Filter by Type** - Filter by DND message type
- **Filter by Status** - Show active, removed, or all DND entries

## Adding Customer to DND

Click the **Add Customer** button to add a single customer to DND for this channel.

**Required Fields:**
1. **Customer** - Search and select a customer by name, email, or phone
2. **DND Type** - Select which message type to opt them out of:
   - Promotional
   - Transactional
   - Marketing
   - Service
   - Other

**Optional Field:**
3. **Duration** - Set when the DND subscription expires:
   - **Never expires** - Customer remains in DND indefinitely
   - **7 days** - DND expires in 7 days
   - **30 days** - DND expires in 30 days
   - **90 days** - DND expires in 90 days
   - **180 days** - DND expires in 180 days
   - **1 year** - DND expires in 1 year
   - **Custom date** - Select a specific expiry date

**How to Add:**
1. Click **Add Customer** button
2. Search for and select the customer
3. Select the DND type
4. (Optional) Select a duration for the DND
5. Click **Add**

The system will automatically:
- Set status to Active
- Record the current date and time
- Record the user who added them
- Set the expiry date based on selected duration (if chosen)

## Removing Customer from DND

Click the **Remove** button on any DND entry to remove a customer from that DND list.

**What Happens:**
- Status changes from Active to Removed
- Removal date and time is recorded
- User who removed them is recorded
- Historical record is maintained for audit purposes

**Note:** Removed customers are no longer in the DND list and will receive messages of all types on this channel.

## DND Status

**Active Status** - Customer is currently in the DND list for this message type on this channel. They will not receive messages of this type.

**Removed Status** - Customer was previously in DND but has been removed. They are no longer in the DND list. Historical records are kept for compliance purposes.

## For Bulk Operations

To add or remove multiple customers across channels at once, use [DND Management Bulk](/documentation/configuration/dnd-management-bulk) instead.
