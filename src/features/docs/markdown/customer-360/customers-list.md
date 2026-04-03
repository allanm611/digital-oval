# Customer List

## Overview

The Customer List provides a unified view of all customers in your system. Access comprehensive customer profiles, search and filter customers, manage customer data, and monitor customer engagement across all channels.

---

## Accessing the Customer List

**Navigation:** Dashboard → Customer 360 → Customers

The Customer List page displays all your customers with a table view showing key information and action buttons for managing individual customers.

---

## Customer List Interface

### Search & Filter

**Search Customers**

Use the search box to find customers by:
- **Name** - First name or last name
- **Phone Number (MSISDN)** - Mobile phone number in any format
- **Email** - Email address
- **Customer ID** - Unique identifier
- **Attributes** - Custom fields and data

**How It Works:**
1\. Type search term in the search box
2\. Results update as you type
3\. Shows matching customers only
4\. Clear search to see full list

**Search Examples:**
- "John" - Finds customers with first or last name John
- "0712345678" - Finds by phone number
- "john@email.com" - Finds by email
- "TIER_GOLD" - Finds by custom attribute

### Filter by Field Type

Use the dropdown filters to narrow results by customer attribute:

**Channel Filter**
- Filter customers by their preferred communication channel
- Options: All, Normal SMS, Flash SMS, Email, WhatsApp, Push, USSD, Interactive USSD, In-App, IVR, OBD, Short Code
- Combines with search for targeted results

**Customer Type Filter**
- Filter customers by subscriber type (prepaid, postpaid, etc.)
- Options: All types, or specific customer type
- Works alongside other search and filter criteria

Applying filters automatically updates the results to show only matching customers.

### Pagination

Navigate through customer records:
- **Page Size:** 20 customers per page (default)
- **Navigation:** Previous/Next buttons
- **Page Indicator:** Shows current page and total customers
- **Jump to Page:** Click page numbers to jump directly

---

## Statistics Cards

The page displays key metrics at the top:

**Unique Customers**
- Total number of unique customers in your system
- Shows total subscriptions as helper text

**Active Subscriptions**
- Number of currently active customer subscriptions
- Displays percentage of total subscriptions

**Pending Activations**
- Number of subscriptions awaiting activation
- Shows percentage of total

**Average Tenure**
- Average number of days customers have been active
- Calculated from activation date

---

## Customer List Columns

**Name** - Customer's first and last name

**Phone (MSISDN)** - Primary mobile phone number

**Email** - Primary email address

**Status** - Active, Inactive, Blocked, or other status

**Tier** - Customer tier/segment classification

**Preferred Channel** - SMS, Email, WhatsApp, Push, USSD, IVR, etc.

**Created** - Date customer record was created

**Last Updated** - Date of most recent profile update

---

## Action Buttons

### View Customer Details

Click the **View** (eye icon) button to open the customer's full profile.

**Shows:**
- Complete customer information
- Interaction history
- Campaigns participated in
- Communication preferences
- Segments and tags
- Recent activities

### Edit Customer

Click the **Edit** (pencil icon) button to update customer information.

**Editable Fields:**
- Name (first, last)
- Email addresses
- Phone numbers
- Demographics (gender, date of birth)
- Contact information (city, address, region, postal code)
- Customer tier
- Preferred communication channel
- Language preference
- Timezone

### Delete Customer

Click the **Delete** (trash icon) button to remove a customer from the system.

**Process:**
1. Click delete button on customer row
2. Confirm deletion in modal dialog
3. Customer is permanently removed from system

### Export Customer List

Click the **Download CSV** button (top right) to export the current customer list.

**Downloads:**
- Subscription ID
- Phone (MSISDN)
- Customer Name
- Customer Type
- Status
- Preferred Channel
- SIM Type
- Activation Date

---

## Creating New Customers

Click the **Create Customer** button (top right) to add new customers to your system.

**Three Methods Available:**
1. **Single Entry** - Add one customer at a time with full form
2. **Bulk CSV** - Paste CSV data to add multiple customers at once
3. **Import File** - Upload Excel/CSV file with auto-detection

See [Create Customer](/documentation/customer-360/create-customer) for detailed instructions.
- Phone numbers
- Customer tier
- Status
- Preferences
- Custom attributes

### Send Communication

Click the **Message** button to send direct communication to the customer.

**Channels Available:**
- Email
- SMS (Normal SMS, Flash SMS)
- WhatsApp
- Push Notification
- USSD
- IVR

### Delete Customer

Click the **Delete** (trash icon) button to remove the customer record.

**Warning:** This action is permanent and cannot be undone.

---

## Creating Customers

### Single Customer Creation

**Steps:**
1\. Click **Create Customer** button (top-right)
2\. Fill in required fields:
   - First Name
   - Last Name
   - Phone Number (MSISDN)
3\. Add optional information:
   - Email
   - Address, City, Region
   - Customer Tier
   - Preferred Channel
   - Other attributes
4\. Click **Save**

See [Create Customer](/documentation/customer-360/create-customer) for detailed guide.

### Bulk Upload

Import multiple customers at once:

**Process:**
1\. Click **Bulk Import** button
2\. Download CSV template
3\. Fill in customer data
4\. Upload completed CSV file
5\. Review and confirm
6\. Customers are imported

**CSV Format:**
- **Required Columns:** MSISDN, First Name, Last Name
- **Optional Columns:** Email, Country Code, Timezone, etc.
- **Max File Size:** 100 MB
- **Max Records:** 1,000,000 per upload

---

## Customer Notification Channels

The system supports multiple communication channels for each customer:

**Normal SMS** (SMS) - Standard text messages

**Flash SMS** (SMS) - High-priority alerts

**Email** (Email) - Detailed communications

**WhatsApp** (Messaging App) - Personal messages

**Push** (Push Notification) - Mobile app notifications

**USSD** (USSD) - Feature phone interactions

**Interactive USSD** (USSD) - Menu-based interactions

**In-App** (In-App Message) - In-application notifications

**IVR** (Voice) - Voice calls and menu systems

**OBD** (OBD) - Operator-specific delivery

**Short Code** (SMS) - Short code responses

---

## Customer Status & Attributes

### Customer Status

- **Active** - Customer can receive communications
- **Inactive** - Customer exists but is not receiving campaigns
- **Blocked** - Customer is blocked from receiving communications
- **Suspended** - Temporary suspension (reason-specific)

### Customer Attributes

Standard customer attributes include:

**Contact Information**
- First Name, Last Name
- Email, Alternate Email
- Phone (MSISDN), Alternate Phone Numbers
- Postal Address, City, Region, Country Code

**Demographics**
- Gender
- Date of Birth / Age
- Language Preference
- Timezone

**Account Details**
- Customer Tier (Gold, Silver, Bronze, etc.)
- Account Status
- Account Created Date
- Last Updated Date
- Account Age

**Preferences**
- Preferred Communication Channel
- Opt-in/Opt-out Status
- Do Not Disturb Hours
- Frequency Caps

**Flags & Classifications**
- VIP Status
- Test Account Flag
- Premium User
- KYC Verified
- Fraud Flag

**Device Information**
- Device Type
- Device ID

### Custom Attributes

You can add unlimited custom attributes to store additional customer data:
- Custom fields (defined by your organization)
- Integration data from external systems
- Business-specific attributes
- Any structured data

---

## Best Practices

### Data Management

1\. **Verify Phone Numbers** - Ensure MSISDN format is correct for your region
2\. **Update Regularly** - Keep customer information current
3\. **Use Consistent Naming** - Maintain consistent name formatting
4\. **Add Relevant Attributes** - Include data useful for segmentation and targeting
5\. **Clean Duplicates** - Identify and merge duplicate customer records

### Privacy & Compliance

1\. **Respect Opt-in Status** - Honor customer communication preferences
2\. **Secure Data** - Protect customer information
3\. **DND Settings** - Respect Do Not Disturb hours
4\. **Consent Management** - Verify customer consent before communications
5\. **Data Retention** - Follow compliance requirements

### Targeting & Segmentation

1\. **Use Segments** - Organize customers by criteria for targeted campaigns
2\. **Apply Tags** - Use tags for quick organization
3\. **Monitor Tiers** - Segment by customer value/tier
4\. **Track Lifecycle** - Monitor customer journey stage
5\. **Review Regularly** - Keep segment definitions current

---

## Common Tasks

### Find a Specific Customer

**By Phone Number:**
1\. Use search box
2\. Enter phone number (any format)
3\. Click matching customer

**By Email:**
1\. Use search box
2\. Enter email address
3\. Click matching customer

**By Name:**
1\. Use search box
2\. Enter first or last name
3\. Click matching customer

### Update Customer Information

1\. Find customer in list
2\. Click **Edit** button
3\. Update fields
4\. Click **Save Changes**
5\. Confirmation message appears

### Send Direct Message

1\. Find customer in list
2\. Click **Message** button
3\. Select channel (SMS, Email, etc.)
4\. Compose message
5\. Click **Send**

### Add Customer to Segment

1\. Find customer
2\. Click **View** to open profile
3\. Scroll to "Segments" section
4\. Click **Add to Segment**
5\. Select segment
6\. Click **Confirm**

---

## Troubleshooting

### Cannot Find Customer

**Issue:** Search not returning expected customer

- **Solution 1:** Try different search terms (phone, email, name)
- **Solution 2:** Check spelling and formatting
- **Solution 3:** Customer may not exist in system
- **Solution 4:** Use simpler search terms (first name only)

### Search Too Slow

**Issue:** Search takes long time with large dataset

- **Solution 1:** Use more specific search terms
- **Solution 2:** Use filters to narrow results
- **Solution 3:** Clear cache and refresh
- **Solution 4:** Try again after peak usage hours

### Bulk Import Failed

**Issue:** CSV upload rejected or incomplete

- **Solution 1:** Verify CSV format matches template
- **Solution 2:** Check for required columns
- **Solution 3:** Validate phone number format
- **Solution 4:** Check file size (max 100 MB)

