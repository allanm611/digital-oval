# Create and Edit Segment

## Overview

Create and edit custom customer segments based on various criteria to build targeted audiences for campaigns and communications. The Create and Edit forms use the same interface the difference is that Edit mode pre-populates all fields with the segment's current data.

![Create Segment Form](/img/v1.1/segments-img/createsegmentimage1.png)

## Form Fields

### Basic Information

**Segment Name** (required)

- A descriptive name for your segment
- Used to identify the segment in lists and campaigns
- Examples: "Active Last 30 Days", "High-Value Customers", "At-Risk Users"
- Can be edited in both Create and Edit modes

**Description** (required)

- Additional details about the segment's purpose and use case
- Examples: "Customers who made purchases in the last 30 days", "Users spending more than KES 10,000 annually"
- Can be edited at any time

**Catalog** (optional)

- Assign the segment to a catalog for organization
- Catalogs help group related segments together
- Can select from predefined segment catalogs
- Useful for organizing segments by business area or purpose (e.g., "VIP", "At-Risk", "New Users")

## Query Type

Before building your segment, you must choose how to define the customers that belong to it. There are two query type options:

**Query Type * (required)**

- **Rule** - Use the visual rule builder to create conditions through a user-friendly interface (recommended for most users)
- **SQL** - Write custom SQL queries directly for advanced filtering and complex logic

This choice determines which interface you'll use to define your segment membership rules. You can switch between them while building your segment.

## Segment Queries

The **Segment Builder** is where you define the rules or queries that determine which customers belong to your segment. This is the core logic that powers segment membership. Your approach depends on the Query Type you selected.

### Rule Builder (Query Type: Rule)

Use the visual rule builder to create segment membership criteria through an interactive interface.

#### Adding Your First Rule

When you create a segment with Rule type, you start with one empty rule group. To add rules:

1. **Select a Condition Type** - Click the dropdown to choose what kind of condition you want to add
2. **Configure the Condition** - Fill in the specific criteria based on the type
3. **Add More Conditions** - Click **+ Add Condition** to add additional rules within the same group
4. **Add Rule Groups** - Click **+ Add Group** to create a new group with its own logic

**How to Select the Condition Type**

![Segment Empty Conditions](/img/v1.2.4/segmentemptyconditionschoosing.png)

When you click the condition type dropdown, you'll see different options to choose from:

- **Customer 360** — Base customer information (this is what you'll use most often for profile-based rules)
- **Segments** — Reference another segment you've created to combine segment logic
- **QuickLists** — Use a pre-made customer list you've uploaded or created
- **System Event** — Track customer activity like purchases, logins, or form submissions

Select the one that matches the rule you want to create. Once you select a type, the fields below will show options specific to that type.

#### Rule Condition Types

The rule builder supports 6 different condition types. Each type has its own configuration:

#### 1. **Profile Conditions** (Customer Attributes from Customer 360)

Build rules based on customer profile data stored in your system. This is the most common way to create segments.

**How It Works:**

**Step 1: Select Customer 360 and Sub-Category**
- Click the dropdown to select "Customer 360"
- A second dropdown appears to let you choose a **sub-category** (e.g., "Personal Information", "Customer Identity")
- This organizes fields into easy-to-browse groups

![Customer 360 Sub-Category Dropdown](/img/v1.1/segments-img/customer360subcategorydrodpown.png)
_Select the sub-category from the dropdown_

**Step 2: Select a Field**
- Click "Select Field..." to open a modal
- The field picker shows all available fields for the sub-category you selected
- Choose the specific field you want (e.g., "Age", "Total Spent", "Last Purchase Date")

![Field Picker Modal](/img/v1.1/segments-img/fieldmodalpickerimage.png)
_Field picker modal showing available fields_

**Step 3: Choose How to Compare**
- Select an **Operator** — this is how you compare the field to a value
- Example operators: "equals", "greater than", "less than", "between", "contains", etc.

![Operator Selection](/img/v1.1/segments-img/mainoperatordropdown.png)
_Operators depend on the field type (text, number, date, etc.)_

**Step 4: Enter a Value**
- Type the value you want to compare against
- Example: if field is "Total Spent" and operator is "greater than", enter "10000"

**Complete Example:**
- Sub-Category: Transaction History
- Field: Total Spent
- Operator: is greater than
- Value: 10000
- **Result:** "Include customers who have spent more than KES 10,000"

**Available Operators** (depends on field type):

- **Text fields**: Equals, Not Equals, In List, Not In List, Is Empty, Is Not Empty
- **Number fields**: Equals, Not Equals, Greater Than, Less Than, Greater Than or Equal, Less Than or Equal, Between, In List, Not In List, Is Empty, Is Not Empty
- **Money fields**: All number operators PLUS special date filtering options
- **Date fields**: Equals, Greater Than, Less Than, Between, Date-Based Operators, Is Empty, Is Not Empty
- **True/False fields**: Equals, Not Equals, Is Empty, Is Not Empty

**Special: Money Fields with Date Filtering**

When you select a money, numeric,date field (like "Total Spent") and use a number operator (like "greater than"), you can optionally add a **date range** to limit the results to a specific time period:

1. **Enter the money amount** — e.g., "10000"
2. **Optional: Select a date filter** — Choose from these options:
   - **On** — Include data from only one specific date
   - **Between** — Include data within a date range
   - **Since** — Include data from a start date until today
   - **Until** — Include data from the beginning until an end date
3. **Pick the date(s)** — Use the date picker to select your date(s)

![Money Field Date Filtering](/img/v1.1/segments-img/fouroptionsoperations.png)
_Optional date filtering for money/spending fields_

**Example with Date Filtering:**
- Field: Total Spent
- Operator: greater than 10000
- Date Filter: Since January 1, 2024
- **Result:** "Customers who spent more than KES 10,000 starting from January 1, 2024 until today"

**Note:** The date filter is optional. If you don't need it, just skip this step.

#### 2. **Segment Conditions** (Reference Other Segments)

Build rules that reference other existing segments. Use this to create segment hierarchies or combine multiple segments.

**How It Works:**

- Click **Select Segment** to open a picker
- Choose an existing segment from the system
- The condition evaluates to: "Customers who are members of [Selected Segment]"

**Example:**

- Select: "High-Value Customers" segment
- Operator: Member of (implied)
- **Result:** All customers who match the High-Value Customers criteria

**Use Cases:**

- Create parent segments from multiple sub-segments
- Reference segments built by other teams
- Reuse complex logic by incorporating existing segments

#### 3. **QuickList Conditions** (Reference QuickLists)

Build rules that reference predefined customer lists (QuickLists). Use this to include specific customer groups.

**How It Works:**

- Click **Select QuickList** to open a picker
- Choose a QuickList you've previously created or imported
- The condition evaluates to: "Customers in [Selected QuickList]"

**Example:**

- Select: "VIP Program Members" quicklist
- **Result:** All customers in the VIP quicklist

**Use Cases:**

- Include manually curated lists
- Reference imported customer lists from external sources
- Combine uploaded CSV lists with rule-based conditions

#### 4. **System Event Conditions** (Event-Based Rules)

Build rules based on system events that have occurred. Track customer activity like purchases, logins, form submissions, etc.

**How It Works:**

- Click **Select Event** to choose from available system events
- Configure the time operator (e.g., "In the last 30 days", "Before a date")
- Optionally specify a count or additional criteria

**Example:**

- Event: Purchase Completed
- Time: In the last 30 days
- Count: At least 1
- **Result:** Customers who made a purchase in the last 30 days

**Available Events:**

- Purchase Completed
- Account Created
- Login Occurred
- Email Clicked
- SMS Delivered
- Form Submitted
- And many more...

#### 5. **Revenue Metric Conditions** (Revenue-Based Rules)

Build rules based on customer revenue metrics and spending patterns. Track how much customers have spent over specific time periods.

**How It Works:**

- Click **Select Field** to choose a revenue metric (e.g., "Total Revenue", "Monthly Revenue", "Annual Spending")
- Select an **Operator** — numeric comparisons like "greater than", "less than", "equals", "between"
- Enter a **Value** — the revenue threshold to compare against
- Select a **Time Window** — the period for which to measure revenue:
  - **Preset Options**: Last 7 Days, Last 30 Days, Last 90 Days, Last 6 Months, Last 12 Months
  - **Custom Date Range**: Choose specific start and end dates using date operators (On, Since, Until, Between)

**Example:**

- Field: Total Revenue
- Operator: Greater Than
- Value: 50000
- Time Window: Last 12 Months
- **Result:** "Customers who have spent more than KES 50,000 in the last 12 months"

**Operators Available:**

- **Equals** - Spend exactly this amount
- **Not Equals** - Spend anything except this amount
- **Greater Than** - Spend more than this amount
- **Less Than** - Spend less than this amount
- **Greater Than or Equal** - Spend at least this amount
- **Less Than or Equal** - Spend up to this amount
- **Between** - Spend within a range (requires two values)

**Time Window Options:**

When you select "Custom" as the time window, you can choose:
- **On Date** - Include revenue from only one specific date
- **Since Date** - Include revenue from a start date until today
- **Until Date** - Include revenue from the beginning until an end date
- **Between Dates** - Include revenue within a specific date range

**Example with Custom Time Window:**

- Field: Total Revenue
- Operator: Greater Than
- Value: 10000
- Time Window: Custom
- Date Operator: Since January 1, 2024
- **Result:** "Customers who spent more than KES 10,000 starting from January 1, 2024 until today"

#### 6. **Usage Metric Conditions** (Usage-Based Rules)

Build rules based on customer usage metrics like usage frequency, activity level, or engagement count. Track how customers interact with your services over time.

**How It Works:**

- Click **Select Field** to choose a usage metric (e.g., "Total SMS Sent", "Email Clicks", "API Calls")
- Select an **Operator** — numeric comparisons like "greater than", "less than", "equals", "between"
- Enter a **Value** — the usage threshold to compare against
- Select a **Time Window** — the period for which to measure usage:
  - **Preset Options**: Last 7 Days, Last 30 Days, Last 90 Days, Last 6 Months, Last 12 Months
  - **Custom Date Range**: Choose specific start and end dates using date operators (On, Since, Until, Between)

**Example:**

- Field: Email Clicks
- Operator: Greater Than
- Value: 5
- Time Window: Last 30 Days
- **Result:** "Customers who clicked email links more than 5 times in the last 30 days"

**Operators Available:**

- **Equals** - Usage equals this count
- **Not Equals** - Usage is anything except this count
- **Greater Than** - Usage more than this count
- **Less Than** - Usage less than this count
- **Greater Than or Equal** - Usage at least this count
- **Less Than or Equal** - Usage up to this count
- **Between** - Usage within a range (requires two values)

**Time Window Options:**

Same as Revenue Metrics:
- **Preset Options**: Last 7 Days, Last 30 Days, Last 90 Days, Last 6 Months, Last 12 Months
- **Custom Date Range**: On Date, Since Date, Until Date, Between Dates

**Example with Custom Time Window:**

- Field: SMS Delivered Count
- Operator: Less Than
- Value: 2
- Time Window: Custom
- Date Operator: Since January 1, 2024
- **Result:** "Customers who received fewer than 2 SMS messages starting from January 1, 2024 until today"

---

#### Rule Groups and Logic

![Segment Conditions with Multiple Groups](/img/v1.1/segments-img/createsegment-segmentconditions2.png)

##### Understanding Rule Groups

Conditions are organized into **groups**. Each group has its own logic operator (AND or OR) that determines how conditions within that group are combined:

**AND Logic (default):**

- ALL conditions in the group must be true
- Example: Age > 25 **AND** Total Spend > 5000 **AND** Last Active < 30 days
- Result: Only customers meeting ALL three criteria

**OR Logic:**

- ANY condition in the group can be true
- Example: Segment = "High-Value" **OR** VIP Status = true **OR** Total Spend > 20000
- Result: Customers meeting ANY one of these criteria

##### Multiple Rule Groups

![Multiple Conditions Example](/img/v1.1/segments-img/createsegment-segmentconditions4.png)

When you have more than one group, you can **choose how to combine them** using AND or OR logic between each group:

**Default Behavior (AND between groups):**

```
[Group 1: condition A OR condition B]
AND
[Group 2: condition C AND condition D]
AND
[Group 3: condition E]
```

All groups must be true.

**With OR between groups:**

```
[Group 1: condition A OR condition B]
OR
[Group 2: condition C AND condition D]
OR
[Group 3: condition E]
```

At least one group must be true.

**Toggle Group Logic:**

- Click the **AND/OR toggle** in the group header to switch between AND and OR logic for combining that group with the next one
- By default, groups are combined with AND
- You can mix AND and OR throughout your segment logic

**Example Segment:**

```
GROUP 1 (OR):
- Last Purchase > 90 days
- Account Status = Inactive

GROUP 2 (AND):
- Total Spend > 10000
- Email Engagement > 30%
```

Result: Customers who are either (inactive OR haven't purchased recently) AND have high spend AND engage with email.

##### Managing Rule Conditions

**Add Condition:** Within a group, click **+ Add** to add another condition. It will use the same operator (AND/OR) as the group.

**Remove Condition:** Click the trash icon next to any condition to remove it.

**Remove Group:** Click **Remove Group** to delete an entire group.

**Change Condition Logic (within a group):** Click the AND/OR toggle in the group header to switch between AND and OR logic for conditions **within that group**.

**Change Group Logic (between groups):** Click the AND/OR toggle **between two groups** to switch between AND and OR logic for combining those groups together.

### SQL Editor (Query Type: SQL)

![SQL Query Editor](/img/v1.2.4/segemntsqueryeditor.png)

For advanced users who prefer writing direct SQL queries, use the SQL Editor to define segment membership using custom SQL code.

#### SQL Query Editor

The SQL Editor provides a full-featured code environment for writing SQL queries:

**Editor Features:**

- **Schema Browser** (left panel) - Shows available database tables and columns:
  - `subscribers` - Main customer table (id, name, email, phone_number, customer_number, created_at, updated_at)
  - `subscriber_daily_portfolio` - Daily customer metrics (subscriber_id, portfolio_date, revenue, purchases, order_count)
  - `subscriber_monthly_portfolio` - Monthly customer metrics (subscriber_id, portfolio_month, total_revenue, total_purchases, order_count)
- **Click-to-Copy Columns** - Click any column name in the schema browser to copy it to your query
- **SQL Syntax Highlighting** - Formatted code with proper syntax highlighting for SQL
- **Autocomplete** - Code suggestions while typing
- **Line Numbers** - For easy reference and debugging

#### Writing SQL Queries

**Query Requirements:**

Your SQL query must:
1. Select from the `subscribers` table or use JOINs with related tables
2. Return customer IDs or identifiers that match your criteria
3. Be valid PostgreSQL syntax

**Example Queries:**

*Basic example - Customers who spent over 10,000:*
```sql
SELECT id FROM subscribers 
WHERE name LIKE '%valuable%'
```

*Join example - Customers with recent high purchases:*
```sql
SELECT s.id FROM subscribers s
JOIN subscriber_daily_portfolio dp ON s.id = dp.subscriber_id
WHERE dp.revenue > 10000 
AND dp.portfolio_date >= '2024-01-01'
```

*Complex example - High-value customers with recent activity:*
```sql
SELECT s.id FROM subscribers s
LEFT JOIN subscriber_monthly_portfolio mp ON s.id = mp.subscriber_id
WHERE mp.total_revenue > 50000
AND mp.portfolio_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
```

#### Validating SQL Queries

**Validate Query Button:**

1. Enter your SQL query in the editor
2. Click the **Validate Query** button to check if the query is valid
3. The system will:
   - Check SQL syntax
   - Verify table and column names exist
   - Test query execution
4. Validation results show:
   - **Success** - Query is valid and ready to use
   - **Error** - Details about what's wrong with the query
   - **Execution Time** - How long the query takes to run

If validation fails, review the error message and correct your query.

#### SQL Best Practices

- **Prefer WHERE conditions** to filter early and improve performance
- **Use JOINs** instead of subqueries when possible
- **Limit results** by filtering by date ranges for time-sensitive data
- **Test incrementally** - build your query step by step and validate frequently
- **Use aliases** for table names in complex queries (e.g., `s` for `subscribers`)
- **Comment your code** for clarity (-- for single-line comments)

## Tags

Organize and categorize your segment with tags:

**Adding Tags:**

- Type a tag name in the **Tags** input field
- Press **Enter** to add the tag
- Tags appear as colored badges below the input
- Tags are lowercase and separated for easy filtering

**Managing Tags:**

- Click the **X** on any tag badge to remove it
- Tags are optional but helpful for organization
- Example tags: "vip", "at-risk", "seasonal", "test", "paused"

**Using Tags Later:**

- Filter segments by tags on the Segment List page
- Tags help organize segments by status or business function

## Preview & Validation

Before creating or saving your segment, you can preview or validate your segment query to ensure it's working correctly.

![Segment Preview Modal](/img/v1.1/segments-img/createsegment-preview%20segmentconditions.png)

### Rule Builder Preview

**For Query Type: Rule**

1. Set the preview **Limit** (10, 50, 100, 500, 1000, or 5000 customers)
2. Click the **Preview** button to see matching customers
3. The system generates SQL from your conditions and calculates results
4. Review the preview to:
   - See how many customers match your rules
   - Adjust rules if the count is too high or too low
   - Check that the logic is correct

### SQL Query Validation

**For Query Type: SQL**

1. Write your SQL query in the editor
2. Click the **Validate Query** button
3. The system will:
   - Check SQL syntax
   - Execute the query
   - Return validation results and execution time
4. Use validation results to:
   - Confirm the query is valid before saving
   - Check query performance
   - Verify your query returns the expected results

**Troubleshooting Invalid Queries:**

- **Syntax Error** - Check SQL grammar and spelling
- **Table/Column Not Found** - Verify table and column names exist in the schema browser
- **Performance** - If validation is slow, simplify your query or add WHERE conditions to filter early

## Create vs Edit Mode

### Create Mode

- All fields start empty
- Choose your Query Type (Rule or SQL) at the beginning
- Generate a segment from scratch using your selected approach
- After clicking **Create Segment**, the segment is immediately available
- Redirects to the Segment Details page after creation

### Edit Mode

- **All fields are pre-populated** with the current segment data
- Name, description, category, tags, Query Type, and rules/queries are all loaded
- The Query Type cannot be changed after creation - you edit using the same type as when created
- Change any field you want to modify
- Clicking **Save Segment** updates the segment with your changes

### Main Action Buttons

**Create Segment** (Create Mode)

- Saves the new segment with all your rules or SQL query
- Shows success message
- Redirects to Segment Details page

**Save Segment** (Edit Mode)

- Updates the existing segment with your changes
- Shows success message
- Stays on Segment Details page

**Cancel**

- Discards all changes
- Returns to previous page (Segment List or Segment Details)

## Switching Between Query Types

You can switch between Rule and SQL query types **while building** your segment:

1. Find the **Query Type** selector at the top of the Segment Builder
2. Select either "Rule" or "SQL"
3. The interface will switch to the selected type
4. **Note:** Once you create/save the segment, the Query Type is locked and cannot be changed in Edit mode

## Next Steps

After creating a segment:

1. View it on the [Segment List](/documentation/segments/segments-list)
2. Access the [Segment Details](/documentation/segments/view-segment-details) page
