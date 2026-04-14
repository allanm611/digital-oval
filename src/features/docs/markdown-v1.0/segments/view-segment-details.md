# View Segment Details

## Overview

The Segment Details page displays complete information about a specific segment including its configuration, criteria, members, hierarchy, analytics, and campaigns that use it. This page provides a comprehensive view of segment data and allows you to manage segment members, update advanced settings, and send communications to the segment.

![Segment Details Page Overview](/img/v1.0/segments-img/segmentdetailstatcards.png)


## Page Header and Actions

The top of the page includes navigation and action buttons:

**Back Button**
- Returns you to the Segment List or previous location
- Shows breadcrumb navigation

**Edit Segment**
- Opens the segment editor to modify segment properties (name, description, type, catalog, etc.)
- Requires "segments.update" permission

**Send Communication**
- Opens a modal to send SMS, email, or other communications to all members of this segment
- Allows you to select communication type and template
- Useful for targeted messaging to specific customer groups

![Send Communication Feature](/img/v1.0/segments-img/segmentdetailssendcommunicaiton.png)

**More Menu** (⋯)
- Additional actions including:
  - **Recompute Members** - Recalculates segment membership based on current criteria (for dynamic segments)
  - **Compute Size** - Calculates the total number of members in the segment
  - **Validate Query** - Validates the segment's SQL query syntax
  - **Delete Segment** - Permanently removes the segment from the system (requires "segments.delete" permission)

![Compute Segments Modal](/img/v1.0/segments-img/computesegmentsmodal.png)


## Statistics Cards

The page displays four key metric cards at the top:

**Target**
- Shows the total number of members in the segment
- Displays a loading spinner while computing
- Click "Compute Size" in the More menu to update this value

**Segment Type**
- Displays the segment's classification (Behavioral, Demographic, Dynamic, Geographic, Predictive, Static, Transactional)
- Shown as a colored badge

**Visibility**
- Shows the segment's visibility level: Public or Private
- Public segments can be seen by other users
- Private segments are only accessible to you

---

## Basic Information Section

Contains core segment details organized in a grid:

![Basic Information Section](/img/v1.0/segments-img/segmentdetailbasicinformation.png)

**Segment Name**
- The name you gave this segment
- Used for identification in lists and campaigns

**Description**
- Summary of the segment's purpose and use case

**Type** (as badge)
- The classification that determines how the segment is built and updated
- Different types support different criteria (e.g., Static segments are manually curated, Dynamic segments auto-recalculate)

**Segment Catalog**
- The catalog/category this segment belongs to
- Helps organize segments by business area or purpose


## Metadata Section

Additional timestamp and versioning information:

**Created**
- Date and time when the segment was first created
- Formatted with full date and time

**Last Updated**
- Date and time of the most recent modification
- Helps track when segment criteria or membership was last changed


## Tags Section

Manage labels and tags for organizing segments:

**Existing Tags**
- Displays all tags assigned to this segment as colored badges
- Click the X icon on any tag to remove it

**Add Tag Button**
- Opens an input field to add new tags
- Type the tag name and press Enter or click "Add"
- Useful for categorizing segments (e.g., "High-Value", "At-Risk", "Seasonal")

## Segment Criteria Section

Displays the rules and conditions that define segment membership:

![Segment Criteria Display](/img/v1.0/segments-img/segmentdetailssegmentcriteria.png)

**Condition Display**
- Each condition shows:
  - **Field Name** - The customer attribute being evaluated (e.g., "Purchase Frequency", "Age")
  - **Operator** - The comparison operator (equals, is greater than, contains, etc.)
  - **Value** - The value being compared against
- Conditions are numbered and separated by AND logic operators
<!-- 
**When to Use**
- Review criteria to understand what qualifies a customer for this segment
- Use as reference when troubleshooting segment membership issues
- Helps identify gaps in your segmentation strategy

--- -->

## Segment Members Section

Manage and view the members of this segment:

![Segment Members Display](/img/v1.0/segments-img/segmentdetailssegmentmembers.png)

**Total Members Count**
- Shows the number of customers currently in this segment
- Updated after running "Compute Size" or "Recompute Members"

**View Members Button**
- Opens a modal displaying all members in the segment
- Shows customer details such as name, phone, email, status
- Allows searching and filtering members
- Useful for verifying segment membership

**Add Members Button** (for Static Segments)
- Opens a modal to manually add individual customers to a static segment
- Search for customers by name or phone
- Select multiple customers to add at once
- Only available for static segments (dynamic segments are auto-calculated)

![Add Members Modal](/img/v1.0/segments-img/segmentdetailsaddmembertosegment.png)

**Note**
- For **Static Segments**: Members are manually maintained. You can add or remove members directly.
- For **Dynamic Segments**: Members are automatically calculated based on segment rules. Membership updates when segment criteria are recomputed.


## Segment Hierarchy Section

Shows relationships between segments (appears only if hierarchy exists):

![Segment Hierarchy Display](/img/v1.0/segments-img/segmentdetailssegmenthiercachy.png)

**Parent Segment**
- If this segment is a child segment, displays the parent segment name/ID
- Parent-child relationships allow organizing segments into logical groups

**Child Segments**
- Lists any segments that have this segment as their parent
- Useful for understanding segment dependencies
- Shows count of child segments

**Use Cases**
- Create a parent "High-Value Customers" segment with child segments for different regions
- Build a hierarchy of behavioral segments (e.g., parent "Engaged Customers" with children "Mobile Engaged", "Web Engaged")


## Advanced Settings Section

For technical segment configuration (requires "segments.update" permission):

![Advanced Settings Section](/img/v1.0/segments-img/segmentdetailsadvancedsettings.png)

### Segment Query (SQL)
- The raw SQL query that defines segment membership
- Shows the database query executed to calculate segment membership
- Click **Edit** to modify the query directly
- **Update Query** - Saves changes to the segment's query logic
- Use with caution - incorrect SQL can break the segment

### Parent Segment
- Dropdown to assign or change the parent segment
- Set to "No parent segment" to remove hierarchy relationship
- **Update Parent** - Saves changes to parent assignment

**When to Use Advanced Settings**
- When you need to make complex changes to segment logic
- For technical users who understand SQL queries
- To reorganize segment hierarchies
- For troubleshooting query-related issues

<!-- ## Analytics Section

Performance and growth metrics for the segment (if data is available):

**Member Growth Trend**
- Line chart showing how segment membership has changed over time
- Helps identify if segment is growing, shrinking, or stable
- Useful for tracking seasonal patterns or campaign effectiveness

**Performance Metrics Cards**

- **Conversion Rate** - Percentage of segment members who converted (took desired action)
- **Campaigns Used In** - Number of active or recent campaigns targeting this segment
- **Avg. Engagement** - Average engagement percentage across campaigns using this segment

**Interpreting Analytics**
- Growth trends help validate segment definition effectiveness
- Low conversion rates may indicate segment definition needs adjustment
- High usage across campaigns indicates this is a valuable segment

--- -->

## Used in Campaigns Section

Shows all campaigns that currently have mappings with this segment:

![Used in Campaigns](/img/v1.0/segments-img/segmentdetailsusedincampaigns.png)

**Campaign Table Columns**
- **Campaign Name** - Name of the campaign using this segment
- **Campaign Type** - Type of campaign type 
- **Last Modified** - When the campaign was last updated
