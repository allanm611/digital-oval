# Customer Identity

## Overview

Customer Identity management defines and configures the customer data fields available for segmentation and targeting. It enables you to use customer attributes (demographics, behavior, preferences, etc.) to build powerful customer segments.

---

## What is Customer Identity?

Customer Identity is the framework that defines which customer attributes (fields) can be used for:
- **Segmentation** - Creating customer segments based on data
- **Targeting** - Building audience criteria for campaigns
- **Filtering** - Filtering customers by attribute values
- **Personalization** - Using customer data in messages
- **Analytics** - Analyzing customer data patterns

### Key Concepts

**Fields** - Individual customer data attributes
- Examples: First Name, Age, Purchase History, Engagement Score
- Each field has a name, type, validation rules, and operators
- Fields come from customer profiles and external data

**Categories** - Groups of related fields
- Examples: Personal Info, Contact, Behavior, Preferences
- Help organize fields for easy discovery
- Fields within categories are logically related

**Field Types** - Data type classification
- Text fields (names, emails, locations)
- Numeric fields (age, income, count)
- Date fields (birthdate, purchase date)
- Boolean fields (VIP status, verified flag)
- List fields (multi-select options)

**Operators** - How to filter by field values
- Equals / Not Equals
- Greater Than / Less Than
- Contains / Does Not Contain
- In List / Not In List
- Ranges

---

## Accessing Customer Identity

**Navigation:** Dashboard → Customer 360 → Customer Identity

The Customer Identity page displays all available customer fields organized by category.

---

## Customer Identity Interface

### Field List Display

The interface shows all available customer identity fields:

**Information Displayed:**
- **Field Name** - System identifier for the field
- **Field Value** - Display name/label
- **Description** - What the field represents
- **Field Type** - Data type (Text, Numeric, Date, Boolean, etc.)
- **Category** - Which category the field belongs to
- **Data Source** - Where field data comes from

### Search & Filter

**Search Fields**
- Type field name to search
- Type field value/label to find
- Type description keyword
- Real-time results as you type

**Filter by Type**
- All Fields - Show all available fields
- Text Fields - Text-based attributes
- Numeric Fields - Number-based attributes
- Date Fields - Date/datetime attributes
- Boolean Fields - Yes/No flags
- List Fields - Multi-value fields

**Filter by Category**
- Personal Information - Names, demographics
- Contact Information - Email, phone, address
- Behavioral Data - Purchase, engagement history
- Preferences - Communication, channel choices
- Account Data - Status, tier, account info
- Custom Attributes - Organization-specific fields

### Field Categories

Fields are organized into logical categories:

**Personal Information**
- First Name
- Last Name
- Gender
- Date of Birth
- Age
- Language Preference

**Contact Information**
- Email Address
- Alternate Email
- Phone Number (MSISDN)
- Alternate Phone Numbers
- Physical Address
- City, Region, Postal Code
- Country Code
- Timezone

**Account Status**
- Account Status (Active, Inactive, Blocked)
- Customer ID
- Subscriber ID
- Account Created Date
- Last Updated Date
- Account Age

**Customer Value**
- Customer Tier (Gold, Silver, Bronze, Standard)
- VIP Status
- Premium User Status
- Lifetime Value (if available)
- Purchase History

**Preferences**
- Preferred Communication Channel
- Language Preference
- Timezone (for message timing)
- DND Settings
- Opt-in Status

**Behavioral**
- Campaign Participation Count
- Last Campaign Date
- Email Open Rate
- Link Click Rate
- Conversion Count
- Engagement Score

**Compliance & Verification**
- KYC Verified Status
- Fraud Flag
- Test Account Flag
- Phone Verified
- Email Verified

**Subscriptions & Engagement**
- Active Subscriber Status
- Subscription Date
- Last Activity Date
- Total Messages Received
- Total Messages Opened
- Total Conversions

---

## Field Properties & Details

### Viewing Field Details

Click on a field to see complete information:

**Core Properties**
- **Field Name** - System/database identifier
- **Field Value** - Display name/label shown in UI
- **Description** - Explanation of what field represents
- **Field Type** - Data type (String, Integer, Date, Boolean, etc.)
- **PostgreSQL Type** - Database column type
- **Source Table** - Where data originates

**Validation Rules**
- **Strategy** - Validation approach (enum, range, pattern)
- **Distinct Values** - Number of unique values possible
- **Range Min/Max** - For numeric fields
- **Value Length** - Max length for text fields

**UI Configuration**
- **Component Type** - How field displays (text input, dropdown, date picker, etc.)
- **Multi-select** - Whether field allows multiple selections
- **Required** - Whether field is mandatory
- **Options** - Available values (for dropdowns)

### Field Operators

Each field supports operators for filtering:

**Common Operators**
- **Equals (=)** - Exact match
- **Not Equals (!=)** - Everything except value
- **Greater Than (&gt;)** - Numeric comparison
- **Less Than (&lt;)** - Numeric comparison
- **Greater or Equal (&gt;=)** - Numeric comparison
- **Less or Equal (&lt;=)** - Numeric comparison
- **Contains** - Substring match (text)
- **Does Not Contain** - Excludes substring
- **Starts With** - Text begins with value
- **Ends With** - Text ends with value
- **In List** - Value in provided list
- **Not In List** - Value not in provided list
- **Between** - Range between two values
- **Is Null** - Field has no value
- **Is Not Null** - Field has a value

**Default Operator**
- Most common operator suggested for field
- Can change to different operator when filtering

---

## Using Fields in Segments

### Selecting Fields for Segments

When creating customer segments:

**Step 1: Choose Field**
- Click field selector
- Search for field by name or label
- Browse categories
- Click field to select

**Step 2: Choose Operator**
- Default operator auto-selected
- Can change to other applicable operators
- Field shows available operators

**Step 3: Enter Value**
- Type or select value to filter by
- Format depends on field type:
  - Text: Type any text
  - Number: Enter numeric value
  - Date: Select date from picker
  - Boolean: Select Yes/No
  - List: Select from dropdown

**Step 4: Build Filter**
- AND - All conditions must be true
- OR - Any condition can be true
- Combine multiple conditions

### Field Usage Examples

**Example 1: Age-Based Segment**
- Field: Age
- Operator: Greater Than
- Value: 25
- Result: All customers over 25 years old

**Example 2: Purchase Behavior**
- Field: Purchase History
- Operator: Greater Than
- Value: 5
- Result: Customers who made 5+ purchases

**Example 3: Engagement Segment**
- Field: Email Open Rate
- Operator: Greater Than
- Value: 30
- Result: Customers with 30%+ email open rate

**Example 4: Location-Based**
- Field: City
- Operator: In List
- Value: [New York, Boston, Philadelphia]
- Result: Customers in those cities

**Example 5: VIP Customers**
- Field: Customer Tier
- Operator: Equals
- Value: Gold
- Result: All Gold tier customers

---

## Field Categories Structure

### Personal Information Category

**Fields:**
- First Name - Customer's given name
- Last Name - Customer's family name
- Gender - Male, Female, Other, Prefer Not to Say
- Date of Birth - Customer's birth date
- Age - Current age (calculated)
- Language Preference - Preferred language

**Use Cases:**
- Segmentation by demographic
- Personalization with names
- Age-specific campaigns
- Language-specific targeting

### Contact Information Category

**Fields:**
- Email Address - Primary email
- Alternate Email - Secondary email
- Phone Number - Primary MSISDN
- Alternate Phone Numbers - Additional phones
- Physical Address - Street address
- City - City/municipality
- Region/State - Geographic region
- Postal Code - ZIP/postal code
- Country Code - ISO country code
- Timezone - Local timezone

**Use Cases:**
- Geographic targeting
- Multi-channel targeting
- Location-based campaigns
- Timezone-specific scheduling

### Behavior Category

**Fields:**
- Campaign Participation Count - Total campaigns
- Last Campaign Date - Most recent campaign
- Email Open Rate - Percentage of emails opened
- Link Click Rate - Percentage of links clicked
- Conversion Count - Number of conversions
- Engagement Score - Calculated engagement metric
- Purchase History - Number of purchases
- Last Purchase Date - Most recent purchase
- Total Messages - Count of all messages sent
- Total Messages Opened - Count of opens

**Use Cases:**
- Engagement-based segmentation
- Win-back campaigns for inactive customers
- High-engagement targeting
- Purchase frequency analysis
- Personalization based on behavior

### Preferences Category

**Fields:**
- Preferred Communication Channel - Primary channel
- Language Preference - Preferred language
- Timezone - Local timezone
- DND Settings - Do Not Disturb preference
- Opt-in Status - Communication consent
- Email Opt-in - Email consent
- SMS Opt-in - SMS consent
- Push Opt-in - Push consent

**Use Cases:**
- Respect customer preferences
- Channel-specific campaigns
- Opt-in targeting
- Timezone-aware scheduling
- Localized messaging

### Account Status Category

**Fields:**
- Account Status - Active, Inactive, Blocked
- Customer ID - Unique identifier
- Subscriber ID - Subscription identifier
- Account Created Date - Registration date
- Last Updated Date - Last modification
- Account Age - Duration as customer
- VIP Status - VIP classification
- Premium User - Premium status

**Use Cases:**
- Status-based targeting
- New customer campaigns
- Long-term customer rewards
- VIP segmentation

---

## Best Practices for Customer Identity

### Field Management

1\. **Keep Fields Current** - Regularly update field definitions
2\. **Document Fields** - Add clear descriptions for each field
3\. **Remove Unused Fields** - Clean up fields no longer used
4\. **Standardize Names** - Use consistent naming conventions
5\. **Group Logically** - Organize fields into meaningful categories

### Segmentation with Fields

1\. **Use Relevant Fields** - Select fields appropriate for segment purpose
2\. **Validate Data** - Ensure field data is accurate and current
3\. **Test Segments** - Verify segment criteria work as expected
4\. **Monitor Accuracy** - Check segment membership is correct
5\. **Review Regularly** - Update segments as business needs change

### Data Quality

1\. **Complete Fields** - Collect data for important fields
2\. **Validate on Entry** - Ensure correct format on data entry
3\. **Regular Audits** - Check data accuracy periodically
4\. **Clean Duplicates** - Remove or merge duplicate records
5\. **Update Regularly** - Keep customer data current

### Compliance & Privacy

1\. **Privacy-Friendly Fields** - Don't collect unnecessary personal data
2\. **Data Security** - Protect sensitive fields
3\. **Consent-Based** - Only use fields with customer consent
4\. **GDPR Compliance** - Follow data protection regulations
5\. **Access Control** - Restrict access to sensitive fields

---

## Common Uses Cases

### Use Case 1: Age-Based Targeting

**Goal:** Send age-appropriate campaigns

**Fields Used:**
- Age (or Date of Birth)

**Segment Creation:**
- Field: Age
- Operator: Between
- Values: 18-35
- Result: Young adult segment

**Application:**
- Product recommendations
- Age-specific offers
- Relevant messaging

### Use Case 2: VIP Customer Loyalty

**Goal:** Reward best customers

**Fields Used:**
- Customer Tier
- Purchase History
- Engagement Score

**Segment Creation:**
- Field: Customer Tier
- Operator: Equals
- Value: Gold/Premium
- AND Field: Purchase History
- Operator: Greater Than
- Value: 10
- Result: High-value, loyal customers

**Application:**
- Exclusive offers
- Early access
- Loyalty rewards

### Use Case 3: Win-Back Campaigns

**Goal:** Re-engage inactive customers

**Fields Used:**
- Last Campaign Date
- Campaign Participation Count

**Segment Creation:**
- Field: Last Campaign Date
- Operator: Less Than
- Value: 90 days ago
- AND Field: Campaign Participation Count
- Operator: Greater Than
- Value: 1 (was previously engaged)
- Result: Inactive but previously engaged customers

**Application:**
- Re-engagement campaigns
- Special win-back offers
- Survey to understand inactivity

### Use Case 4: Geographic Targeting

**Goal:** Location-based campaigns

**Fields Used:**
- Country Code
- City
- Region
- Timezone

**Segment Creation:**
- Field: Country Code
- Operator: Equals
- Value: US
- AND Field: City
- Operator: In List
- Value: [NYC, LA, Chicago]
- Result: Customers in major US cities

**Application:**
- Regional promotions
- Store locations
- Local events
- Timezone-aware timing

### Use Case 5: Channel Preference Targeting

**Goal:** Respect communication preferences

**Fields Used:**
- Preferred Communication Channel
- Email Opt-in
- SMS Opt-in
- Opt-in Status

**Segment Creation:**
- Field: Email Opt-in
- Operator: Equals
- Value: Yes
- Result: Customers who opted in to email

**Application:**
- Email campaign targeting
- SMS campaign targeting
- Multi-channel campaigns
- Privacy-compliant communications

---

## Troubleshooting

### Cannot Find Field

**Issue:** Expected field not showing in list

- **Solution 1:** Search by different term (field name vs. display value)
- **Solution 2:** Check field category
- **Solution 3:** Field may not be configured in system
- **Solution 4:** Contact administrator to add field

### Field Not Available for Segmentation

**Issue:** Field shows in list but can't select for segment

- **Cause:** Field may be disabled or restricted
- **Solution 1:** Check field is enabled
- **Solution 2:** Verify you have permission to use field
- **Solution 3:** Field may have no data
- **Solution 4:** Contact administrator

### Unexpected Field Values

**Issue:** Field showing unexpected data in segmentation

- **Cause:** Field data may not be current
- **Solution 1:** Check last update date for customer data
- **Solution 2:** Run data sync/refresh
- **Solution 3:** Verify data in source system
- **Solution 4:** Check for data transformation rules

### Cannot Create Segment with Field

**Issue:** Segment creation fails when using specific field

- **Cause:** Field may have incompatible operator
- **Solution 1:** Try different operator
- **Solution 2:** Check value format is correct
- **Solution 3:** Field may require specific data type
- **Solution 4:** Check field validation rules

---

## Related Documentation

- [Customer List](/documentation/customers-list) - Browse all customers
- [Create Customer](/documentation/create-customer) - Add customers
- [View Customer Details](/documentation/view-customer-details) - Manage profiles
- [Segments](./documentation/segments/segments-list) - Create customer segments
