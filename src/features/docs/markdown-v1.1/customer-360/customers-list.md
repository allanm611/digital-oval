# Customer List

## Overview

View all customers in the system in a unified table. Search, filter, and manage customer data with action buttons for viewing, editing, and deleting customer records.

## Customer List View

![Customer List](/img/v1.1/customer360-images/customer360list.png)

The page displays all customers in a table with columns for key information and action buttons.

## Search & Filter

### Search Customers

Use the search box to find customers by name, phone, email, customer ID, or custom attributes.

1. Type search term in the search box
2. Results update as you type
3. Matching customers displayed
4. Clear search to see full list

### Filter by Field Type

![Filter by Field Type](/img/v1.1/customer360-images/customer360typefilter.png)

Narrow results by customer classification or custom field values.

### Filter by Channel

![Filter by Channel](/img/v1.1/customer360-images/customer360channelsfilter.png)

Filter to show only customers with specific communication channel preferences.

## Table Columns

The customer list table shows:

- **Name** - First and last name
- **Phone (MSISDN)** - Primary mobile phone number
- **Email** - Primary email address
- **Status** - Active, Inactive, Blocked, or Suspended
- **Tier** - Customer value classification
- **Preferred Channel** - SMS, Email, WhatsApp, Push, etc.
- **Created** - Account creation date
- **Last Updated** - Most recent profile update

## Action Buttons

### [View Customer Details](/documentation/customer-360/view-customer-details)

Click the **View** (eye icon) to open the customer's complete profile.

**Includes:**

- Customer information (name, contact, address, account details)
- [Events tab](/documentation/customer-360/view-customer-details) - Communication history
- Subscribed Lists tab - List subscriptions
- Analytics tab - Engagement metrics
- Segments & Offers tab - Memberships and offers

### Edit Customer

Click the **Edit** (pencil icon) to update customer information.

![Edit Customer Form Part 1](/img/v1.1/customer360-images/editcustomerimage1.png)

![Edit Customer Form Part 2](/img/v1.1/customer360-images/editcustomerimage2.png)

**Editable Fields:**

- First name, last name
- Email and alternate email
- Phone numbers
- Customer tier
- Account status
- Language preference
- Timezone
- Preferred communication channel
- Custom attributes

**Steps:**

1. Click **Edit** button
2. Update desired fields
3. Click **Save**
4. Changes applied immediately

### Delete Customer

Click the **Delete** (trash icon) to permanently remove the customer record.

**Warning:** This action is irreversible and will delete all customer data including:

- Profile information
- Segment memberships
- Communication history
- Custom attributes

Confirmation is required before deletion.

### Send Communication

Click the **Send Communication** button (envelope icon) to send a message directly to the customer from the list view.

![Send Communication Modal](/img/v1.1/customer360-images/sendcommunciaitonmodalcustomer.png)

**Use Cases:**
- Send urgent notifications to individual customers
- Send test messages before campaign deployment
- Send personalized follow-up messages
- Reach out with special offers or important updates

**Steps:**
1. Click **Send Communication** button next to customer
2. Select the communication channel (SMS, Email, Push, etc.)
3. Compose or select a message template
4. Configure delivery options
5. Click **Send** to execute

## Creating Customers

To add new customers, see [Create Customer](/documentation/customer-360/create-customer) guide which covers:

- Single manual entry
- Bulk CSV import
- File upload with column mapping
