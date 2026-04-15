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

## Segment Conditions

The **Segment Conditions Builder** is where you define the rules that determine which customers belong to your segment. This is the core logic that powers segment membership.

![Segment Conditions Builder](/img/v1.1/segments-img/createsegment-segmentcondiitonsimage1.png)

### Adding Your First Condition

When you create a segment, you start with one empty condition group. To add rules:

1. **Select a Condition Type** - Click the dropdown to choose what kind of condition you want to add
2. **Configure the Condition** - Fill in the specific criteria based on the type
3. **Add More Conditions** - Click **+ Add Condition** to add additional rules within the same group
4. **Add Condition Groups** - Click **+ Add Group** to create a new group with its own logic

**How to Select the Condition Type**

When you click the condition type dropdown, you'll see different options to choose from:

- **Customer 360** — Base customer information (this is what you'll use most often for profile-based rules)
- **Segments** — Reference another segment you've created to combine segment logic
- **QuickLists** — Use a pre-made customer list you've uploaded or created
- **System Event** — Track customer activity like purchases, logins, or form submissions

Select the one that matches the rule you want to create. Once you select a type, the fields below will show options specific to that type.

### Condition Types Explained

The builder supports 4 different condition types. Each type has its own configuration:

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

---

## Condition Groups and Logic

![Segment Conditions with Multiple Groups](/img/v1.1/segments-img/createsegment-segmentconditions2.png)

### Understanding Condition Groups

Conditions are organized into **groups**. Each group has its own logic operator (AND or OR) that determines how conditions within that group are combined:

**AND Logic (default):**

- ALL conditions in the group must be true
- Example: Age > 25 **AND** Total Spend > 5000 **AND** Last Active < 30 days
- Result: Only customers meeting ALL three criteria

**OR Logic:**

- ANY condition in the group can be true
- Example: Segment = "High-Value" **OR** VIP Status = true **OR** Total Spend > 20000
- Result: Customers meeting ANY one of these criteria

### Multiple Groups

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

### Managing Conditions

**Add Condition:** Within a group, click **+ Add** to add another condition. It will use the same operator (AND/OR) as the group.

**Remove Condition:** Click the trash icon next to any condition to remove it.

**Remove Group:** Click **Remove Group** to delete an entire group.

**Change Condition Logic (within a group):** Click the AND/OR toggle in the group header to switch between AND and OR logic for conditions **within that group**.

**Change Group Logic (between groups):** Click the AND/OR toggle **between two groups** to switch between AND and OR logic for combining those groups together.

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

## Preview & Segment Size

Before creating or saving your segment, you can preview how many customers match your criteria:

![Segment Preview Modal](/img/v1.1/segments-img/createsegment-preview%20segmentconditions.png)

### Preview Button

1. Click **Preview** to estimate segment size
2. The system generates a SQL query from your conditions
3. A loading spinner appears while calculating
<!-- 4. Results show approximately how many customers match -->

<!-- ### What to Do With Preview Results

**If the count looks good:** Click **Create Segment** or **Save Segment** to finalize

**If the count is too low:**
- Verify your conditions are correct
- Check that the operators match your intent
- Consider using OR logic instead of AND
- Remove overly restrictive conditions

**If the count is too high:**
- Add more conditions to narrow the audience
- Use AND logic to add additional filters
- Make conditions more specific

--- -->

## Create vs Edit Mode

### Create Mode

- All fields start empty
- Generate a segment from scratch
- After clicking **Create Segment**, the segment is immediately available
- Redirects to the Segment Details page after creation

### Edit Mode

- **All fields are pre-populated** with the current segment data
- Name, description, category, tags, and conditions are all loaded
- Change any field you want to modify
- Clicking **Save Segment** updates the segment with your changes

### Main Action Buttons

**Create Segment** (Create Mode)

- Saves the new segment with all your conditions
- Shows success message
- Redirects to Segment Details page

**Save Segment** (Edit Mode)

- Updates the existing segment with your changes
- Shows success message
- Stays on Segment Details page

**Cancel**

- Discards all changes
- Returns to previous page (Segment List or Segment Details)

## Next Steps

After creating a segment:

1. View it on the [Segment List](/documentation/segments/segments-list)
2. Access the [Segment Details](/documentation/segments/view-segment-details) page
