# Create and Edit QuickList

## Overview

QuickLists are predefined customer lists that you upload or import into the system. They can be used in segments, and for sending targeted communications. You can create a QuickList by uploading a CSV, TXT, TSV, or XLSX file with customer data, or edit an existing QuickList's metadata (name and description).

![Create QuickList Form](/img/segments-img/createquicklistimage1.png)

## Create QuickList

#### Basic Information

**QuickList Name** (required)
- A descriptive name for your list
- Used to identify the QuickList in pickers and references
- Examples: "VIP Program Members", "Beta Testers", "Recent Purchasers", "Do Not Call List"
- Can be changed later when editing

**Description** (optional)
- Additional details about the purpose of this list
- Examples: "High-value customers enrolled in our loyalty program", "Customers who opted into beta features", "Customers from our Q4 campaign"
- Can be edited at any time

#### Upload Type

**Upload Type** (required)
- Specifies the format and structure of your data
- Different upload types have different expected columns and formats
- Available types are loaded from your system configuration
- Common types: "Generic", "Standard Import", "Custom Format"
- Selecting a type helps the system properly parse your file

**How Upload Type Works:**
1. Select an **Upload Type** dropdown
2. The system displays the expected columns for that type
3. You should ensure your file contains columns matching the expected format
4. If your file doesn't match, you may get validation errors during upload

### File Upload

![File Upload and Configuration](/img/segments-img/createquicklistimage2.png)

#### Uploading Your File

**Supported File Formats:**
- **.CSV** (Comma-Separated Values) - Most common
- **.TXT** (Tab-delimited or custom delimiter)
- **.TSV** (Tab-Separated Values)
- **.XLSX** (Excel workbook)

**File Upload Methods:**

1. **Drag and Drop**
   - Drag your file directly onto the upload area
   - The file will be automatically processed

2. **Click to Browse**
   - Click the upload area to open a file picker
   - Select your file from your computer
   - The file will be automatically processed

**After Upload:**
- File name and size are displayed
- A preview of the first few rows appears
- The system detects column headers automatically

#### File Configuration

**File Delimiter** (for CSV/TXT files)
- Specifies what character separates columns in your file
- Options: Comma (,), Tab, Semicolon (;), Pipe (|)
- Default: Comma (,)
<!-- - **Important:** Choose the correct delimiter or parsing will fail -->

**List Headers** (automatic detection)
- The system automatically reads the first row as column headers
- Displayed after file upload
- Shows all column names found in your file
- Headers are used to map to customer identity fields

#### Subscriber ID Configuration

**Subscriber ID Column Name** (required)
- The name of the column in your file that contains customer identifiers
- This column must uniquely identify each customer in your list
- Example values: "customer_id", "phone_number", "email", "subscription_id"
- The column name should exactly match a header in your file

**Subscriber ID Field Mapping** (required)
- Maps the column you selected to a customer identity field in your system
- The system needs to know which customer field to use (email, phone, ID, etc.)
- Options depend on your configured identity fields
- Common mappings:
  - "customer_id" → Customer ID field
  - "phone" → Phone Number field
  - "email" → Email field
  - "subscription_id" → Subscription ID field

**How It Works:**
1. Choose which column in your file has customer identifiers
2. Tell the system which customer field that column represents
3. The system matches your file data to existing customers using this mapping

**Example:**
- Your CSV has a "phone_number" column with mobile numbers
- You select "phone_number" as the Subscriber ID Column
- You map it to "Phone Number" field in your system
- Result: Customers are matched by their phone numbers

### Preview Before Saving

After uploading your file and configuring it:
- A preview table shows the first few rows of your data
- Column headers are displayed
- You can verify the data looks correct before saving
- Check that the delimiter is correct (data should be separated into proper columns)
- Check that the Subscriber ID column is properly identified

### Creating the QuickList

1. **Fill in all required fields:**
   - Name
   - Description (optional but recommended)
   - Upload Type
   - File (upload and configure)
   - Subscriber ID Column Name
   - Subscriber ID Field Mapping

2. **Review the preview** to ensure your file is parsed correctly

3. **Click "Create QuickList"** to save and import

**Processing:**
- The system imports your file into the database
- Customers are matched to your system using the ID mapping
- Processing may take a few seconds for large files
- You'll see a success message once complete
- The QuickList becomes available immediately for use

**After Creation:**
- The QuickList appears in the QuickList List
- You can now reference it in segments using QuickList conditions
<!-- - You can use it in campaigns for targeting -->
- You can send communications to the list
<!-- - You can view member details on the QuickList Details page -->

## Edit QuickList

When editing an existing QuickList, you can change the **metadata** (name and description).

![Edit QuickList Modal](/img/segments-img/editquicklist.png)

### Editable Fields

**QuickList Name**
- Change the name of your QuickList

**Description**
- Update the description to reflect new purposes or usage


<!-- ## Common QuickList Use Cases

### 1. VIP or High-Value Customer List
- **Source:** Exported from your CRM or database
- **Content:** Premium customers, loyalty program members
- **Usage:** Send exclusive offers, segment for targeted campaigns
- **Update Frequency:** Monthly or quarterly

### 2. Do Not Call or Do Not Contact List
- **Source:** Compliance database or customer requests
- **Content:** Customers who opted out or requested no contact
- **Usage:** Exclude from campaigns, compliance checking
- **Update Frequency:** Weekly or whenever changes occur

### 3. Beta Tester or Early Adopter List
- **Source:** Sign-up forms or manual selection
- **Content:** Customers testing new features
- **Usage:** Feature announcements, user research, feedback collection
- **Update Frequency:** As new testers are added

### 4. Geographic or Regional List
- **Source:** Customer database filtered by location
- **Content:** Customers from specific cities, regions, or countries
- **Usage:** Location-specific campaigns, regional promotions
- **Update Frequency:** Quarterly or as needed

### 5. Imported Seed List
- **Source:** Partner, agency, or external vendor
- **Content:** Prospect list or lookalike audience
- **Usage:** New customer acquisition campaigns
- **Update Frequency:** One-time or periodic refreshes

### 6. Recent Event Attendees
- **Source:** Event registration system
- **Content:** Customers who attended webinars, conferences, or events
- **Usage:** Follow-up communications, event-related offers
- **Update Frequency:** After each event

--- -->

<!-- ## File Format Best Practices

### CSV File Requirements
- **Encoding:** UTF-8 (recommended for special characters)
- **Headers:** First row should be column names
- **Data:** Each row is one customer
- **Delimiter:** Choose comma, tab, semicolon, or pipe consistently
- **Example:**
  ```
  customer_id,phone,email,created_date
  C001,+254701234567,john@example.com,2024-01-15
  C002,+254702345678,jane@example.com,2024-02-20
  ```

### Column Recommendations
- **Customer Identifier** (Required): customer_id, phone, email, or subscription_id
- **Optional Fields:** Any additional customer data (email, phone, name, etc.)
- **Empty Values:** Mark empty cells as blank or use consistent null indicator
- **Maximum Size:** Most systems handle files up to 100MB

### Data Quality
- **Unique IDs:** Each row should have a unique identifier
- **Valid Values:** Phone numbers in proper format, valid emails, proper dates
- **Consistency:** Use same format throughout (e.g., all dates as YYYY-MM-DD)
- **No Duplicates:** Remove duplicate customer IDs before uploading
- **Encoding:** Ensure special characters are properly encoded -->

## Next Steps

After creating a QuickList:
1. View it on the [QuickList List](/documentation/segments/quicklists-list)
2. Access the [QuickList Details](/documentation/segments/view-quicklist) page to:
   - View member data
   - Check import logs
   - Send communications to the list
   - Delete if no longer needed

Using a QuickList:
1. Add it as a condition in segment rules
3. Export member data for external use
4. Send bulk communications to all members
