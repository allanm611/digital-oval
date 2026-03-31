# Segment List

## Overview

The Segment List page displays all segments in your system with summary statistics, search capabilities, filtering options, and management tools for each segment.

**[Insert screenshot of segment list page]**


## Summary Statistics

The Segment List page displays key metrics at the top in four stat cards:

- **Total Segments** - Total number of segments in your system (includes "+X this week" count)
- **Active Segments** - Number of currently active segments
- **Stale Segments** - Number of segments that need refresh
- **Top Segment** - Name of the largest segment with member count


## Search and Filtering

### Search

Use the **Search** field to find segments by:
- Segment name

### Advanced Filters

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

**View** - Opens the [Segment Details](/documentation/view-segment-details) page

**Edit** - Allows you to modify segment criteria and configuration

**Delete** - Permanently remove the segment

**Compute** - Calculate or refresh segment membership

**Duplicate** - Create a copy of the segment

**Refresh** - Update segment member list


## Bulk Actions

### Selection Mode

Click **Select Segments** to enter bulk selection mode. In this mode, you can:

- Select individual segments using checkboxes
- Select all visible segments using the header checkbox
- Clear all selections

### Bulk Operations

When segments are selected, the following bulk actions become available:

**Refresh All**
- Refresh member lists for all selected segments

**Batch Compute** (2+ segments selected)
- Calculate membership for multiple segments at once

**Compare** (exactly 2 segments selected)
- Compare overlap between two segments to see how many customers appear in both


## Pagination

Use the pagination controls at the bottom to navigate through segments if there are more than the displayed page size.



