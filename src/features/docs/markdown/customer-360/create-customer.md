# Create Customer

## Overview

Add new customers to your system. Choose the method that fits your workflow:
- **Single Entry** - Add one customer at a time
- **Bulk CSV** - Paste or upload multiple customers
- **File Import** - Upload Excel/CSV with automatic column detection

## Method 1: Single Manual Entry

### How to Start

Navigate to **Customer 360 → Customers → Create Customer**

![Single Entry Form Part 1](/img/customer360-images/addcustomermanuallyimage1.png)

![Single Entry Form Part 2](/img/customer360-images/addcustomermanuallyimage2.png)

### Required Fields

**Phone Number (MSISDN)**
- Format: +27712345678 or 0712345678
- System normalizes automatically
- Must be unique

**First Name**
- Max 255 characters
- Letters, spaces, hyphens, apostrophes

**Last Name**
- Max 255 characters
- Letters, spaces, hyphens, apostrophes

### Optional Fields

**Contact Information**
- Email, alternate email, alternate phone numbers

**Demographics**
- Gender, date of birth, language preference

**Geographic**
- Address, city, region, postal code, country code

**Account Settings**
- Customer tier, preferred communication channel, timezone

### Save Options

**Save** - Creates customer and returns to list

**Cancel** - Discards without saving

## Method 2: Bulk CSV Entry

Paste comma-separated customer data to import multiple customers.

![Bulk CSV Entry](/img/customer360-images/addcustomerbulkimage.png)

### Steps

1. Click **Create Customer** → **Bulk** tab
2. Paste CSV data into text area
3. System validates automatically
4. Click **Import** to add all valid customers

### CSV Format

```
first_name,last_name,msisdn,email,country_code,timezone
John,Smith,+254712345678,john@example.com,KE,Africa/Nairobi
Jane,Doe,+254712345679,jane@example.com,KE,Africa/Nairobi
```

**Required columns:** first_name, last_name, msisdn

**Optional columns:** email, country_code, timezone, language_preference, gender, date_of_birth, city, region, postal_code, customer_tier, preferred_channel


## Method 3: File Import

Upload Excel or CSV files with automatic column detection.

### Steps

1. Click **Create Customer** → **Import** tab
2. Click **Choose File** and select your file
3. Map your file columns to the three required fields displayed: first name, last name, and phone number

![Column Mapping](/img/customer360-images/addcustomerimportimage1.png)

If mapping is incorrect, you'll see an error and have an option to go back and fix it :

![Column Mapping Error](/img/customer360-images/addcustomerimportinvalidmappingimageerror.png)

4. Review preview of data to import

![File Import Preview](/img/customer360-images/addcustomerimportvalidmappingimage.png)

![File Import Valid Preview](/img/customer360-images/addcustomerimportvalidmappingimage.png)

5. Click **Confirm Import** to add customers

## Next Steps

After creating customers:
- [View Customer Details](/documentation/customer-360/view-customer-details) — Access full customer profiles
- [Customer Identity](/documentation/customer-360/customer-identity) — View unique identity fields
- Create Segments — Organize customers for campaigns
- Launch Campaigns — Send targeted communications
