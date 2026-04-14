# DND Management Overview

DND (Do Not Disturb) Management allows you to manage customer opt-outs across multiple communication channels. You can add customers to DND lists for specific message types to exclude them from receiving those messages.

![DND Management Channels](/img/v1.0/configuration/dndmanagementpage.png)

## What is DND Management?

DND Management allows you to:

- **Manage Opt-Outs** - Add customers to Do Not Disturb lists
- **Track Preferences** - Monitor which customers have opted out
- **Support Multiple Channels** - Manage DND across SMS, Email, USSD, and Push Notifications
- **Track by Message Type** - Exclude customers from specific message categories

## Managing DND Lists

Navigate to **Configuration → DND Management** to manage all Do Not Disturb lists.

### View DND Management

The DND Management page displays four communication channels as interactive cards:

- **SMS** - Text message opt-outs
- **Email** - Email communication opt-outs
- **USSD** - Interactive messaging opt-outs
- **Push** - Mobile app notification opt-outs

Click any channel card to manage the DND list for that specific channel.

## Managing DND by Channel

When you click on a channel, you can manage customers for that channel with the following message types:

**DND Message Types:**

- **Promotional** - Special offers, discounts, promotional campaigns
- **Transactional** - Order confirmations, receipts, transaction-related communications
- **Marketing** - Marketing campaigns and brand communications
- **Service** - Service updates, maintenance notifications, account information
- **Other** - Miscellaneous communications that don't fit other categories

### Viewing DND List for a Channel

The DND list displays:

- **Customer Name** - Name of the customer
- **Contact Info** - Email (for Email channel) or Phone (for SMS/USSD/Push)
- **DND Type** - Message type they opted out of (Promotional, Transactional, Marketing, Service, Other)
- **Status** - Active (currently in DND) or Removed (previously removed from DND)
- **Added Date** - When they were added to DND
- **Added By** - User who added them

You can:

- **Search** - Find customers by name, email, or phone
- **Filter by Type** - Filter by DND message type (Promotional, Transactional, etc.)
- **Filter by Status** - Show active, removed, or all DND entries

![SMS DND List](/img/v1.0/configuration/smsdndmanagentlist.png)

![Email DND List](/img/v1.0/configuration/emaildndmanagenetlist.png)

![USSD DND List](/img/v1.0/configuration/dndlistpageussd.png)

![App Notification DND List](/img/v1.0/configuration/dndlistpageappnotficaiton.png)

### Adding Customer to DND

Click the **Add Customer** button to add a customer to DND.

![Add Member To SMS DND](/img/v1.0/configuration/addmembertosmsdndimage1.png)

![Add Member To SMS DND Modal](/img/v1.0/configuration/addmemberstosmsdndmodal.png)

**Required Fields:**

- **Customer** - Search and select a customer by name, email, or phone
- **DND Type** - Select which message type to opt them out of:
  - Promotional
  - Transactional
  - Marketing
  - Service
  - Other

Click **Add** to add the customer to DND. The system automatically:

- Sets status to Active
- Records the current date and time
- Records the user who added them

### Removing Customer from DND

Click **Remove** on any DND entry to remove a customer from that DND list.

The system will:

- Change status from Active to Removed
- Record the removal date and time
- Record the user who removed them
- Keep the historical record for audit purposes

## DND Status Tracking

**Active Status** - Customer is currently in the DND list for this message type on this channel. They will not receive messages of this type.

**Removed Status** - Customer was previously in DND but has been removed. They are no longer in the DND list. Historical records are kept for compliance purposes.
