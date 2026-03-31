# Create Customer

## Overview

Add new customers to your system to build your customer database and enable targeted campaigns and communications. There are three ways to add customers depending on your volume and data source.

---

## Three Ways to Add Customers

### Method 1: Single Manual Entry (One at a Time)

**When to Use:**
- Adding one or two customers
- Testing the system
- Adding individual customer requests
- Quick manual additions

**Process:** Fill form with customer details → Click Save
**Time:** ~2 minutes per customer
**Best For:** Low volume, immediate needs

### Method 2: Bulk CSV Upload (Multiple Customers at Once)

**When to Use:**
- Importing 10+ customers
- Migrating from legacy system
- Regular scheduled imports
- Large dataset uploads

**Process:** Prepare CSV file → Upload → System validates → Confirm import
**Time:** ~5-10 minutes to upload 1,000 customers
**Best For:** High volume, batch imports

### Method 3: API/Integration Import (Automated Sync)

**When to Use:**
- Real-time customer data sync
- Continuous integration with external systems
- Automated data feeds
- Enterprise integration needs

**Process:** System automatically syncs customer data from connected sources
**Time:** Automated, runs on schedule or real-time
**Best For:** Ongoing automation, continuous data flow

---

## Method 1: Single Manual Entry

### Accessing Create Customer

**Navigation:** Dashboard → Customer 360 → Customers → Create Customer

**Also Accessible From:**
- Customers list page - Click **Create Customer** button
- Modal dialog or dedicated page

---

## Required Fields

These fields must be completed to create a customer:

### Phone Number (MSISDN)

- **Field Name:** MSISDN (Mobile Station Integrated Services Digital Network)
- **Format:** Country code + local number (e.g., +27712345678 or 0712345678)
- **Requirements:**
  - Must be a valid phone number
  - Format depends on your region/country
  - System will normalize the format
- **Example:** "+27712345678" or "0712345678" for South Africa

### First Name

- **Field Name:** First Name
- **Requirements:**
  - Cannot be empty
  - Max 255 characters
  - Supports letters, spaces, hyphens, apostrophes
- **Example:** "John"

### Last Name

- **Field Name:** Last Name
- **Requirements:**
  - Cannot be empty
  - Max 255 characters
  - Supports letters, spaces, hyphens, apostrophes
- **Example:** "Smith"

---

## Optional Fields

Additional information to enhance customer profiles:

### Contact Information

**Email Address**
- Primary email for communications
- Format: valid email address (example@domain.com)
- Used for email campaigns and notifications
- Optional but recommended

**Alternate Email**
- Secondary email address
- Useful for backup contact
- Optional

**Alternate Phone Numbers**
- Additional phone numbers for the customer
- Supports multiple entries
- Format same as primary MSISDN
- Optional

### Demographic Information

**Gender**
- Options: Male, Female, Other, Prefer Not to Say
- Used for personalization
- Optional

**Date of Birth**
- Format: YYYY-MM-DD
- Used to calculate age and for segmentation
- Optional

**Age**
- Numeric age value
- Used for demographic segmentation
- Auto-calculated if DOB provided
- Optional

### Geographic Information

**Physical Address**
- Street address, apartment number, etc.
- Max 500 characters
- Optional

**City**
- City/municipality name
- Optional

**Region/State/Province**
- Regional division
- Optional

**Postal/Zip Code**
- Postal or ZIP code
- Optional

**Country Code**
- ISO country code (e.g., US, ZA, GB)
- Used for localization and compliance
- Optional

### Account & Preferences

**Language Preference**
- Preferred language for communications
- Options: English, French, Spanish, German, Chinese, Japanese, Russian
- Used for message localization
- Default: English
- Optional

**Timezone**
- Customer's local timezone
- Used for scheduling communications
- Format: IANA timezone (e.g., America/New_York, Africa/Johannesburg)
- Optional

**Customer Tier**
- Classification for customer value: Platinum, Gold, Silver, Bronze, Standard
- Used for segmentation and targeting
- Optional

**Preferred Communication Channel**
- Primary channel for communications
- Options:
  - Normal SMS
  - Flash SMS
  - Email
  - WhatsApp
  - Push Notification
  - USSD
  - Interactive USSD
  - In-App
  - IVR
  - OBD
  - Short Code
- Optional

### Custom Attributes

- **Dynamic Fields:** Your organization may have custom fields
- **Flexible Storage:** Any key-value data
- **Examples:** LoyaltyProgram, CustomerSegment, BusinessUnit
- Optional

---

## Customer Creation Steps

### Step 1: Open Create Customer Form

1\. Navigate to Customer 360 → Customers
2\. Click **Create Customer** button (top-right)
3\. Form opens (modal or dedicated page)

### Step 2: Enter Required Information

Fill in the three mandatory fields:

1\. **Phone Number (MSISDN)**
   - Enter customer's mobile phone number
   - Format: with or without country code
   - System will validate and normalize

2\. **First Name**
   - Enter customer's first name
   - Supports letters, spaces, hyphens, apostrophes

3\. **Last Name**
   - Enter customer's surname/family name
   - Supports letters, spaces, hyphens, apostrophes

### Step 3: Add Optional Information (Recommended)

Enhance customer profile with additional data:

1\. **Email Address**
   - Primary email for email campaigns
   - Recommended for better reach

2\. **Contact Information**
   - Alternate emails
   - Additional phone numbers
   - Physical address details

3\. **Demographics**
   - Gender
   - Date of birth
   - Language preference

4\. **Geographic Details**
   - City, region, postal code
   - Country code
   - Timezone

5\. **Account Preferences**
   - Customer tier
   - Preferred channel
   - Custom attributes

### Step 4: Review & Validate

Before saving, review:
- All required fields are filled
- Phone number is in correct format
- Email addresses are valid (if provided)
- No obvious data entry errors

### Step 5: Save Customer

**Options:**

**Save**
- Creates customer
- Returns to customer list
- Shows success confirmation

**Save & Add Another**
- Creates customer
- Clears form for next entry
- Useful for bulk manual entry

**Cancel**
- Discards form
- Returns to customer list
- No customer created

---

## Bulk Customer Upload

### When to Use Bulk Upload

Use bulk upload when:
- Importing customers from external source
- Migrating data from legacy system
- Creating many customers at once (100+)
- Regular scheduled imports

### Bulk Upload Process

**Step 1: Prepare CSV File**
1\. Download template from system
2\. Fill in customer data
3\. Ensure correct format

**Step 2: Upload File**
1\. Click **Bulk Import** button
2\. Select CSV file from computer
3\. Click **Upload**

**Step 3: Review & Confirm**
1\. System validates file
2\. Shows preview of data
3\. Displays any errors
4\. Click **Confirm Import**

**Step 4: Monitor Progress**
1\. System processes file
2\. Shows progress indicator
3\. Reports success/failure count
4\. Provides error details

### Method 2: Bulk CSV Upload

## CSV Format & Field Mapping

The CSV file maps column names to customer attributes. Each column in your CSV becomes a customer field in the system.

### Required Columns (Must Be Present)

| CSV Column | Maps To | Format | Example | Notes |
|-----------|---------|--------|---------|-------|
| `msisdn` | Phone Number | Country code + number OR local number | `+27712345678` or `0712345678` | Unique identifier, required for every row |
| `first_name` | First Name | Text (letters, spaces, hyphens) | `John` | Max 255 characters |
| `last_name` | Last Name | Text (letters, spaces, hyphens) | `Smith` | Max 255 characters |

**Note:** If any of these three required columns are missing or empty in a row, that row will fail validation.

### Optional Columns (Recommended)

| CSV Column | Maps To | Format | Example | Notes |
|-----------|---------|--------|---------|-------|
| `email` | Email Address | Valid email format | `john@example.com` | Used for email campaigns |
| `alternate_email` | Alternate Email | Valid email format | `john.work@company.com` | Secondary email backup |
| `country_code` | Country | ISO 2-letter code | `ZA`, `US`, `GB` | Localization and compliance |
| `timezone` | Timezone | IANA format | `Africa/Johannesburg` | Used for message scheduling |
| `language_preference` | Language | Language code | `en`, `es`, `fr` | Message localization |
| `gender` | Gender | M/F/O/Unspecified | `M` | Demographic segmentation |
| `date_of_birth` | Date of Birth | YYYY-MM-DD | `1990-05-15` | Age calculation and targeting |
| `city` | City | Text | `Johannesburg` | Geographic targeting |
| `region` | Region/State/Province | Text | `Gauteng` | Geographic segmentation |
| `postal_code` | Postal Code | Text | `2000` | Location-based targeting |
| `physical_address` | Street Address | Text | `123 Main St` | Customer location |
| `customer_tier` | Customer Tier | Predefined value | `Gold`, `Silver`, `Bronze` | Value-based segmentation |
| `preferred_channel` | Preferred Channel | Channel code | `SMS`, `Email`, `WhatsApp` | Communication preference |

### Optional Columns (Custom/System-Specific)

Any additional columns in your CSV can be custom attributes:
- `loyalty_program_id` - Loyalty membership ID
- `acquisition_source` - How customer was acquired
- `vip_status` - VIP flag (yes/no)
- `account_manager` - Assigned account manager
- Any organization-specific fields

### CSV File Structure & Examples

**Basic Example (Minimum Required Fields):**
```
msisdn,first_name,last_name
+27712345678,John,Smith
+27712345679,Jane,Doe
+27712345680,Bob,Johnson
```

**Complete Example (All Common Fields):**
```
msisdn,first_name,last_name,email,country_code,timezone,language_preference,gender,date_of_birth,city,region,customer_tier,preferred_channel
+27712345678,John,Smith,john@example.com,ZA,Africa/Johannesburg,en,M,1990-05-15,Johannesburg,Gauteng,Gold,SMS
+27712345679,Jane,Doe,jane@example.com,ZA,Africa/Johannesburg,en,F,1985-03-22,Cape Town,Western Cape,Silver,Email
+27712345680,Bob,Johnson,bob@example.com,US,America/New_York,en,M,1992-07-10,New York,NY,Standard,Email
```

**With Custom Attributes:**
```
msisdn,first_name,last_name,email,customer_tier,loyalty_program_id,vip_status,acquisition_source
+27712345678,John,Smith,john@example.com,Gold,LP123456,yes,Referral
+27712345679,Jane,Doe,jane@example.com,Silver,LP123457,no,Organic
```

### Field Mapping Rules

**Phone Number (msisdn):**
- Can include country code: `+27712345678` (preferred)
- Can be local format: `0712345678`
- System auto-detects and normalizes format
- Must be 10-15 digits (excluding country code symbols)

**Names (first_name, last_name):**
- Supports: Letters (a-z, A-Z), spaces, hyphens, apostrophes
- No special characters or numbers
- Examples: O'Brien, Mary-Jane, José

**Email (email, alternate_email):**
- Format: user@domain.extension
- Example: john.smith@example.com
- System validates format before import
- Optional but recommended

**Date Fields (date_of_birth):**
- Format: YYYY-MM-DD (ISO format, required)
- Example: 1990-05-15 (May 15, 1990)
- Must be valid date (no Feb 30th)
- Must be before today's date

**Country Code:**
- Format: ISO 2-letter code
- Examples: ZA (South Africa), US (USA), GB (United Kingdom), CA (Canada)
- Used for localization and compliance
- Optional but recommended

**Timezone:**
- Format: IANA timezone identifier
- Examples: Africa/Johannesburg, America/New_York, Europe/London
- Used for scheduling messages at correct local time
- Optional but important

**Language Preference:**
- Format: 2-letter language code
- Examples: en (English), es (Spanish), fr (French), sw (Swahili)
- Used for message localization
- Optional

**Customer Tier:**
- Use predefined values: Platinum, Gold, Silver, Bronze, Standard
- System validates against configured tiers
- Used for VIP/value-based segmentation
- Optional but helps with targeting

**Preferred Channel:**
- Valid values: SMS, Email, WhatsApp, Push, USSD, IVR, InApp
- System uses this to route communications
- Respects customer preference for delivery
- Optional but improves engagement

**File Requirements:**
- Format: CSV (Comma-Separated Values)
- Encoding: UTF-8
- Max File Size: 100 MB
- Max Records: 1,000,000 per upload
- Headers: First row must contain column names

### Bulk Upload Validation

The system validates:

**Phone Numbers**
- Format and validity
- Duplicates within file
- Duplicates in system

**Email Addresses**
- Format validation
- Optional but checked if provided

**Required Fields**
- MSISDN present
- First and last names present

**Data Types**
- Dates in correct format (YYYY-MM-DD)
- Numbers are numeric
- Timezone values are valid

### Bulk Upload Error Handling

**File Errors:**
- Invalid CSV format
- Missing required columns
- Unsupported encoding

**Row Errors:**
- Invalid phone number
- Missing required field
- Duplicate MSISDN in file

**System Errors:**
- Duplicate phone in system
- System capacity issues
- Permission errors

**Recovery:**
1\. Review error report
2\. Fix data in CSV
3\. Re-upload corrected file
4\. System skips already-imported records

---

## Data Validation

### Phone Number (MSISDN)

- Must be a valid phone number
- Format normalized automatically
- Supports multiple formats:
  - International: +27712345678
  - Local: 0712345678
  - With spaces: +27 71 234 5678
- System verifies against known formats

### Email Address

- Must be valid email format
- Checks: user@domain.extension
- Optional but validated if provided
- Used for email campaigns

### Date of Birth

- Format: YYYY-MM-DD (ISO format)
- Example: 1990-05-15
- System validates date is valid and reasonable

### Timezone

- IANA timezone format
- Examples: America/New_York, Africa/Johannesburg, Europe/London
- Used for scheduling communications

---

## Best Practices

### Data Quality

1\. **Phone Number Format** - Use consistent format for your region
2\. **Name Capitalization** - Use proper capitalization (John Smith, not JOHN SMITH or john smith)
3\. **Email Validation** - Verify email addresses are correct
4\. **Complete Profiles** - Add optional fields for better targeting
5\. **Avoid Duplicates** - Check system before creating customer

### Privacy & Compliance

1\. **Get Consent** - Ensure customer opted-in
2\. **Privacy Policy** - Follow data protection regulations
3\. **DND Hours** - Respect Do Not Disturb settings
4\. **Secure Data** - Use secure upload for sensitive information
5\. **Verify Identity** - Confirm customer identity before storing data

### Segmentation & Targeting

1\. **Set Tier Appropriately** - Use correct customer classification
2\. **Add Demographic Data** - Helps with personalization
3\. **Timezone Matters** - Ensures communications at right time
4\. **Language Preference** - Enables localized messages
5\. **Preferred Channel** - Respects customer communication choice

---

## Common Errors & Solutions

### Error: "Invalid phone number format"

**Cause:** Phone number doesn't match expected format

**Solution:**
- Check country code is included
- Remove any non-numeric characters (except +)
- Use format: +CC_NUMBER (e.g., +27712345678)
- Or local format: 0XXXXXXXXX

### Error: "Customer already exists"

**Cause:** Phone number already in system

**Solution:**
- Verify MSISDN is unique
- Check existing customer records
- Update existing customer instead of creating new
- Check for formatting differences (spaces, hyphens)

### Error: "Invalid email format"

**Cause:** Email address doesn't meet validation rules

**Solution:**
- Correct email spelling
- Ensure format: user@domain.com
- Leave blank if email unavailable
- Check for spaces or special characters

### Error: "Invalid date format"

**Cause:** Date of birth in wrong format

**Solution:**
- Use format: YYYY-MM-DD
- Example: 1990-05-15
- Verify date is valid and reasonable
- Leave blank if unsure

---

## Next Steps

After creating customers:
- [View Customer Details](/documentation/view-customer-details) - View and manage profiles
- [Customer Reports](/documentation/customer-reports) - Track customer metrics
- Create Segments - Organize customers for campaigns
- Launch Campaigns - Send targeted communications

---

## Related Documentation

- [Customer List](/documentation/customers-list) - Browse and search customers
- [View Customer Details](/documentation/view-customer-details) - Manage individual profiles
- [Customer Reports](/documentation/customer-reports) - Analytics and insights
- [Customer Identity](/documentation/customer-identity) - Manage segmentation fields
