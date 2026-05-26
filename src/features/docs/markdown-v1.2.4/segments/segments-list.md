# Segment List

## Overview

The Segment List page displays all segments in the system with summary statistics, search capabilities, filtering options, and management tools for each segment.

![Segment List Page](/img/v1.1/segments-img/segmentslist.png)

## Summary Statistics

The Segment List page displays key metrics at the top in four stat cards:

- **Total Segments** - Total number of segments in the system (includes "+X this week" count)
- **Active Segments** - Number of currently active segments
- **Stale Segments** - Number of segments that need refresh
- **Top Segment** - Name of the largest segment with member count

## Search and Filtering

### Search

Use the **Search** field to find segments by:

- Segment name

### Advanced Filters

![Segment Filters](/img/v1.1/segments-img/segmentslistfilter.png)

Click the **Filters** button to access filtering options:

**Filter Tabs:**

- All - Show all segments
- Active - Show only active segments
- Empty - Show segments with no members
- Needs Refresh - Show stale segments
- Parents - Show parent segments
- Most Used - Show most frequently used segments

**Type Filter:**

- Static
- Dynamic
- Predictive
- Behavioral
- Demographic
- Geographic
- Transactional

**Visibility Filter:**

- All
- Public
- Private

## Segments Table

The segments are displayed in a table with the following information:

- **Segment Name** - Name of the segment
- **Type** - Segment type (Static, Dynamic, Predictive, etc.)
- **Size Estimate** - Estimated number of members
- **Status** - Active or Inactive
- **Last Refresh** - When the segment was last refreshed
- **Created** - Date the segment was created
- **Actions** - Available management actions

## Action Buttons

Each segment row has action buttons with the following options:

**View** - Opens the [Segment Details](/documentation/segments/view-segment-details) page

**Edit** - Allows you to modify segment criteria and configuration

**Delete** - Permanently remove the segment

### Compute Segment

**Compute** - Calculate or refresh segment membership for a segment

![Compute Segments Modal](/img/v1.1/segments-img/computesegmentsmodal.png)

When you click **Compute**, a modal appears asking how you'd like to track the computation. Choose one of the following options:

**Compute** (Primary button)

- Computes the segment size while keeping the modal open
- Shows a loading spinner and progress message: "Computing segment size..."
- The modal closes automatically once computation completes
- Use this when you want to wait and see the result immediately
- Good for small to medium segments

**Compute & Close** (Secondary button)

- Starts the computation in the background
- Closes the modal immediately without waiting
- Computation continues while you work on other tasks
- Use this for large segments or when you don't need to wait
- Recommended when computing multiple segments

**What Computation Does:**

- Evaluates all segment conditions to determine which customers qualify
- Updates the total member count to reflect current data
- Processes the segment query against the latest customer database
- May take several seconds for large segments (100K+ members)

**When to Compute:**

- After creating a new segment to calculate initial member count
- After modifying segment criteria to see updated results
- After importing new customer data to refresh segment membership
- Periodically for dynamic segments to ensure membership is current

**Duplicate** - Create a copy of the segment with all conditions and settings

**Refresh** - Update segment member list

## Bulk Actions

### Selection Mode

Click **Select Segments** to enter bulk selection mode. In this mode, you can:

- Select individual segments using checkboxes
- Select all visible segments using the header checkbox
- Clear all selections

### Bulk Operations

![Batch Refresh Segments](/img/v1.1/segments-img/segmentslistbatchrefresh.png)

When segments are selected, the following bulk actions become available:

**Refresh All**

- Refresh member lists for all selected segments
<!-- 
**Batch Compute** (2+ segments selected)
- Calculate membership for multiple segments at once

**Compare** (exactly 2 segments selected)

- Compare overlap between two segments to see how many customers appear in both
  -->
