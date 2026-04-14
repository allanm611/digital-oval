# Create and Edit Segment

## Overview

Create and edit custom customer segments based on various criteria to build targeted audiences for campaigns and communications. The Create and Edit forms use the same interface the difference is that Edit mode pre-populates all fields with the segment's current data.

![Create Segment Form](/img/v1.0/segments-img/createsegmentimage1.png)

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

![Segment Conditions Builder](/img/v1.0/segments-img/createsegment-segmentcondiitonsimage1.png)

### Adding Your First Condition

When you create a segment, you start with one empty condition group. To add rules:

1. **Select a Condition Type** - Click the dropdown to choose what kind of condition you want to add
2. **Configure the Condition** - Fill in the specific criteria based on the type
3. **Add More Conditions** - Click **+ Add Condition** to add additional rules within the same group
4. **Add Condition Groups** - Click **+ Add Group** to create a new group with its own logic

### Condition Types Explained

The builder supports 5 different condition types. Each type has its own configuration:

#### 1. **360 Profile Conditions** (Customer Attributes)

Build rules based on customer profile attributes like demographics, behavior, transaction history, etc.

**How It Works:**

- Select a **Category** first (e.g., "Personal Info", "Transaction History", "Engagement")
- Then select a **Field** from that category (e.g., "Age", "Last Purchase Date", "Total Spend")
- Choose an **Operator** to specify the comparison (equals, greater than, contains, etc.)
- Enter a **Value** to compare against

![Field Selection Modal](/img/v1.0/segments-img/createsegmentimagefieldselectionmodal.png)

**Example:**

- Category: Transaction History
- Field: Total Spend
- Operator: is greater than
- Value: 10000
- **Result:** Customers with total spend greater than KES 10,000

**Common Fields by Category:**

- **Personal Info**: Name, Age, Gender, Location
- **Contact Info**: Email, Phone, Address
- **Transaction History**: Total Spend, Purchase Frequency, Average Order Value, Last Purchase Date
- **Engagement**: Last Active Date, Email Opens, SMS Clicks, Channel Preference
- **Status**: Account Status, Subscription Status, VIP Status

**Operators Available** (varies by field type):

- **Text fields**: Equals, Contains, Starts With, Ends With, Does Not Contain
- **Numeric fields**: Equals, Greater Than, Less Than, Greater Than or Equal, Less Than or Equal, Between
- **Date fields**: Equals, After, Before, Between, In Last (days/weeks/months)
- **Boolean fields**: Is True, Is False

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

#### 5. **KPI Conditions** (Key Performance Indicators)

Build rules based on custom KPIs (Key Performance Indicators) that have been configured in the system.

**How It Works:**

- Click **Select KPI** to open a picker
- Choose from predefined KPIs (Revenue Metrics, Usage Metrics, etc.)
- Configure the comparison operator and value
- The condition evaluates based on the KPI calculation

**Example:**

- KPI: Churn Risk Score
- Operator: Greater Than
- Value: 0.7
- **Result:** Customers with a churn risk score above 0.7

**KPI Types:**

- **Revenue Metrics**: Total Revenue, Monthly Recurring Revenue, Customer Lifetime Value
- **Usage Metrics**: API Calls, Data Transferred, Feature Usage Count
- **Custom KPIs**: Any KPIs you've configured in the system

---

## Condition Groups and Logic

![Segment Conditions with Multiple Groups](/img/v1.0/segments-img/createsegment-segmentconditions2.png)

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

![Multiple Conditions Example](/img/v1.0/segments-img/createsegment-segmentconditions4.png)

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

![Segment Preview Modal](/img/v1.0/segments-img/createsegment-preview%20segmentconditions.png)

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
