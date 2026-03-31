# View Customer Identity Field Details

## Overview

View detailed information about individual customer identity fields. Each field has specific properties, validation rules, operators, and UI configurations that define how it can be used for segmentation and targeting.

---

## Accessing Field Details

**Navigation:** Dashboard → Customer 360 → Customer Identity → [Click field row]

**Also From:**
- Search for field and click to view details
- Field list page - click on field name
- View all available field properties

---

## Field Properties Section

### Core Field Information

**Field Name**
- **System Identifier** - The internal/database name for the field
- **Used In** - APIs, automations, integrations
- **Format** - Usually lowercase with underscores (snake_case)
- **Example:** `customer_tier`, `date_of_birth`, `email_address`

**Field Value/Label**
- **Display Name** - Human-readable name shown in UI
- **Customer Facing** - How field is labeled to users
- **Example:** "Customer Tier", "Date of Birth", "Email Address"

**Description**
- **Field Purpose** - Explanation of what field represents
- **Use Cases** - When to use this field
- **Data Source** - Where data comes from
- **Example:** "Customer's age group classification for targeting and reporting"

**Field Type**
- **Data Type** - String, Integer, Date, Boolean, Decimal
- **Character Encoding** - For text fields
- **Format** - Specific format requirements
- **Example:** "String", "Integer", "Date (YYYY-MM-DD)"

**PostgreSQL Type**
- **Database Type** - Native PostgreSQL data type
- **Storage** - How data is stored in database
- **Example:** "character varying", "integer", "timestamp"

**Source Table**
- **Data Origin** - Which table/system provides data
- **Data Source** - Where field data comes from
- **Example:** "subscribers", "customer_attributes", "transaction_history"

### Data Constraints

**Field Type Precision**
- **Numeric Precision** - For decimal fields (total digits, decimal places)
- **String Length** - Max length for text fields
- **Date Format** - Format for date fields
- **Example:** "NUMERIC(10,2)", "VARCHAR(255)"

**Required Status**
- Whether field must have a value
- Validation enforced on data entry
- Affects segment filters

### Category Information

**Field Category**
- Which logical group field belongs to
- Helps organize fields in UI
- Examples: Personal Information, Contact, Behavior, Preferences
- Enables category-based filtering

---

## Validation Rules

### Validation Configuration

Each field has validation rules that define valid values:

**Strategy Type**
- **Enum** - Field must be one of predefined values
- **Range** - Field value must be between min/max
- **Pattern** - Field must match text pattern
- **Custom** - Custom validation logic
- **None** - No validation

### Validation Details

**For Enum Fields**
- **Distinct Values** - Number of valid options
- **Valid Values** - List of acceptable values
- **Default** - Default value if not specified
- **Example:** Customer Tier: [Platinum, Gold, Silver, Bronze, Standard]

**For Numeric Fields**
- **Range Min** - Minimum allowed value
- **Range Max** - Maximum allowed value
- **Precision** - Number of decimal places allowed
- **Example:** Age (Range 0-150), Income (Range 0-99999999)

**For Text Fields**
- **Value Length** - Max character length
- **Pattern** - Regex or text format required
- **Encoding** - Character encoding (UTF-8, ASCII, etc.)
- **Example:** Email (format: user@domain.com), Phone (10-15 digits)

**For Date Fields**
- **Date Format** - Required date format
- **Min Date** - Earliest allowed date
- **Max Date** - Latest allowed date
- **Example:** Date of Birth (YYYY-MM-DD format, before today)

### Validation Rules Display

View validation constraints:
- What values are valid
- What values will be rejected
- Format requirements
- Min/max constraints
- Length limitations

---

## UI Configuration

### Component Type

**Input Component**
- **Text Input** - Free-text entry
- **Number Input** - Numeric value only
- **Date Picker** - Date selection widget
- **Dropdown/Select** - Choose from list
- **Checkbox** - Boolean yes/no
- **Radio Buttons** - Single selection from options
- **Textarea** - Multi-line text entry
- **Multi-select** - Choose multiple options

### UI Settings

**Display Settings**
- **Label** - What to call field in UI
- **Placeholder** - Hint text in input
- **Help Text** - Additional instructions
- **Tooltip** - Information icon explanation

**Input Behavior**
- **Required** - Must have value
- **Editable** - Can user change it
- **Disabled** - Field cannot be edited
- **Read-only** - View-only field

**Multi-Select Support**
- **Single Select** - Choose one value only
- **Multi-Select** - Can choose multiple values
- **Max Selections** - Maximum options allowed
- **Min Selections** - Minimum options required

### Options (for Dropdown/Select Fields)

For fields with predefined values:

**Option List**
- **Option Label** - Display text for option
- **Option Value** - Internal value
- **Display Order** - Which position in list
- **Default Selected** - Pre-selected option

**Example for Customer Tier:**
- Platinum (value: platinum, order: 1)
- Gold (value: gold, order: 2)
- Silver (value: silver, order: 3)
- Bronze (value: bronze, order: 4)
- Standard (value: standard, order: 5)

---

## Field Operators

### Available Operators

Each field supports specific operators for filtering:

**Text Field Operators**
- Equals - Exact match
- Not Equals - Anything except value
- Contains - Includes text
- Does Not Contain - Excludes text
- Starts With - Text begins with value
- Ends With - Text ends with value
- In List - Value in provided list
- Not In List - Value not in provided list
- Is Null - Field is empty
- Is Not Null - Field has value

**Numeric Field Operators**
- Equals - Exact match
- Not Equals - Different value
- Greater Than - Value &gt; specified
- Less Than - Value &lt; specified
- Greater or Equal - Value &gt;= specified
- Less or Equal - Value &lt;= specified
- Between - Value between two numbers
- In List - Value in provided list
- Is Null - Field is empty
- Is Not Null - Field has value

**Date Field Operators**
- Equals - Exact date match
- Not Equals - Different date
- Before - Earlier than specified date
- After - Later than specified date
- Between - Date range
- Is Null - No date value
- Is Not Null - Has date value
- Days Ago - Relative to today (e.g., 30 days ago)

**Boolean Field Operators**
- Equals - True or False
- Is Null - Field is empty
- Is Not Null - Field has value

**List Field Operators**
- Contains - List includes value
- Not Contains - List excludes value
- Is Empty - List has no items
- Is Not Empty - List has items

### Default Operator

**Pre-selected Operator**
- Most commonly used operator for field
- Auto-applied when field selected
- Can be changed to other operators
- Depends on field type

**Example Default Operators:**
- Text fields: Contains
- Numbers: Equals
- Dates: Before/After
- Boolean: Equals
- Status: Equals

---

## Field Usage Statistics

### Field Metadata

**Creation Info**
- **Created At** - Date field was added to system
- **Last Updated** - When field definition was last modified
- **Status** - Active, Deprecated, Archived

**Usage Information**
- **Used In Segments** - How many segments use this field
- **Used In Campaigns** - How many campaigns target with this field
- **Customer Coverage** - % of customers with value in field
- **Last Used** - Most recent use date

### Data Quality Metrics

**Data Completeness**
- **% with Value** - Percentage of customers with data in field
- **% Empty/Null** - Percentage of customers with no value
- **Sample Size** - Number of records analyzed

**Field Values Distribution**
- **Unique Values** - Number of different values in field
- **Most Common** - Most frequently occurring value
- **Value Distribution** - Breakdown of top values

---

## Using Field in Segmentation

### Creating Segment with Field

**Process:**

1\. **Select Field**
   - Go to Segments
   - Click Create Segment
   - Choose this field from field selector
   - Field details appear

2\. **Choose Operator**
   - Default operator pre-selected
   - Click to change if needed
   - See available operators
   - Select appropriate operator

3\. **Enter Value**
   - Format depends on field type
   - Text: Type value
   - Number: Enter number
   - Date: Select date
   - Dropdown: Choose from list
   - Multiple: Select multiple values

4\. **Preview Results**
   - System shows matching count
   - Shows customer preview
   - Verify segment is correct

5\. **Save Segment**
   - Name segment
   - Add description
   - Save segment
   - Segment ready to use

### Segment Example with This Field

**Example: Customer Tier Field**

```
Field: Customer Tier
Operator: Equals
Value: Gold
Result: All customers with tier = Gold
Count: 15,234 customers
```

---

## Validation Rules Reference

### Common Field Validations

**Customer Tier Field**
- Type: String (Enum)
- Valid Values: Platinum, Gold, Silver, Bronze, Standard
- Required: Yes
- Format: Single value only

**Date of Birth Field**
- Type: Date
- Format: YYYY-MM-DD
- Min Date: 1900-01-01
- Max Date: Today
- Required: No

**Email Address Field**
- Type: String
- Format: user@domain.extension
- Max Length: 255 characters
- Required: No
- Validation: Must match email pattern

**Age Field**
- Type: Integer
- Min Value: 0
- Max Value: 150
- Required: No
- Validation: Must be numeric

**Phone Number (MSISDN) Field**
- Type: String
- Format: +CC + local number or 0 + local number
- Length: 10-15 digits
- Required: Yes
- Validation: Must be valid phone number

---

## Field Comparison

### Compare with Similar Fields

If multiple similar fields exist:

**Compare Fields:**
- View related fields
- See differences in validation
- See differences in operators
- Understand when to use which

**Example:**
- Email vs. Alternate Email - Primary vs. secondary
- Phone vs. Alternate Phone - Primary vs. secondary
- First Name vs. Last Name - Different purposes
- Customer ID vs. Subscriber ID - Different systems

---

## Best Practices

### Using Fields Effectively

1\. **Understand Field Meaning** - Know what data field contains
2\. **Verify Data Quality** - Check % of customers have value
3\. **Use Correct Operator** - Match operator to filtering need
4\. **Validate Values** - Ensure values you filter by are valid
5\. **Test Segments** - Verify segment results are expected

### Field Selection

1\. **Choose Relevant Fields** - Select fields matching segment purpose
2\. **Combine Strategically** - Use multiple fields for specificity
3\. **Balance Specificity** - Not too broad, not too narrow
4\. **Monitor Results** - Check segment size is appropriate
5\. **Document Criteria** - Explain why field was chosen

### Data Quality

1\. **Check Coverage** - % of customers with data
2\. **Review Values** - Understand range of values
3\. **Identify Issues** - Note missing or invalid data
4\. **Report Problems** - Flag data quality issues
5\. **Request Updates** - Ask for missing/incorrect data

---

## Troubleshooting

### Field Has No Data

**Issue:** Field showing 0% customer coverage

- **Cause:** Field not populated in system
- **Solution 1:** Data may not be loaded yet
- **Solution 2:** Field may be new
- **Solution 3:** Data import may have failed
- **Solution 4:** Contact administrator

### Unexpected Validation Error

**Issue:** Value rejected as invalid

- **Cause:** Value doesn't match validation rules
- **Solution 1:** Check value format
- **Solution 2:** Check min/max constraints
- **Solution 3:** Verify against valid value list
- **Solution 4:** Try different operator

### Cannot Use Field in Segment

**Issue:** Field not selectable for segmentation

- **Cause:** Field may be read-only or disabled
- **Solution 1:** Check field status (Active?)
- **Solution 2:** Verify you have permission
- **Solution 3:** Check field has data
- **Solution 4:** Contact administrator

### Segment Results Unexpected

**Issue:** Segment size or members not expected

- **Cause:** Field data different than expected
- **Solution 1:** Verify field values are current
- **Solution 2:** Check data in source system
- **Solution 3:** Try different operator
- **Solution 4:** Review segment criteria

---

## Related Documentation

- [Customer Identity](/documentation/customer-identity) - Overview of all fields
- [Create Customer](/documentation/create-customer) - Add customer data
- [Segments](./documentation/segments/segments-list) - Use fields in segments
- [Customer Reports](/documentation/customer-reports) - Analyze customer data
