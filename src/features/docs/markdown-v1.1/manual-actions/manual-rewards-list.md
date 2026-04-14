# Manual Rewards List

## Overview

The Manual Rewards list displays all rewards you've created and applied to customers. This page provides a centralized view of reward campaigns with application status and customer impact metrics.

## Accessing the List

1. Navigate to **Manual Actions** from the main menu
2. Select **Manual Rewards**
3. The system displays all rewards in a paginated list

![Manual Rewards List](/img/v1.1/manual-actions/manualrewardslist.png)

## List View Features

### Summary Statistics

At the top of the page, you'll see key metrics:
- **Total Rewards:** All rewards created
- **Applied:** Successfully awarded to customers
- **Scheduled:** Pending application
- **Recipients:** Total customers receiving rewards

### Reward Details

Each reward in the list shows:

**Name** - Reward identifier/description

**Type** - Bundle, Points, Discount, or Cashback

**Value** - Reward amount or quantity

**Recipients** - Total number of customers

**Applied** - Number successfully applied

**Failed** - Number of failed applications

**Status** - applied, pending, scheduled, or failed

**Created** - Date and time created

**Created By** - User who created the reward

**Actions** - View, Edit, or Delete options

### Status Indicators

**Applied** - Reward successfully given to customers
- All or most customers received reward
- Application completed
- Results available

**Scheduled** - Reward awaiting application
- Application time not yet reached
- Can be edited or cancelled
- Will apply at scheduled time

**Pending** - Reward currently being applied
- In progress
- Customers being notified
- Cannot be modified during application

**Failed** - Reward encountered errors
- Some or all applications failed
- Review failure details
- May retry or delete

## Searching and Filtering

### Search
Use the search box to find rewards by:
- Reward name or description
- Reward ID
- Customer name or segment

**Search is real-time** - Results update as you type

### Filters

**Reward Type Filter**
- Bundle
- Points
- Discount
- Cashback
- All Types

**Status Filter**
- All Statuses
- Applied
- Scheduled
- Pending
- Failed

**Date Range Filter**
- Filter by creation date
- Useful for finding recent rewards

## Actions

### View Details
Click the **View** button or reward name to:
- See reward details and terms
- Review audience affected
- View application statistics
- Check per-customer results
- See notification history

See [View Manual Reward](/documentation/manual-actions/view-manual-reward)

### Edit Reward
Click the **Edit** button to modify a scheduled reward before it's applied:
- The edit form follows the same 4-step process as creating a new reward
- All fields are pre-filled with your current settings
- Change only what you need to update
- For detailed instructions, see [Create Manual Reward](/documentation/manual-actions/create-manual-reward)

**Note:** Can only edit scheduled rewards that haven't been applied

### Delete Reward
Click the **Delete** button to:
- Remove reward permanently
- Free up system resources

**Confirmation required** - You'll be asked to confirm deletion

**Note:** Cannot delete applied rewards

### Retry Failed Reward
For failed rewards:
- Click **Retry** to attempt application again
- Failed customer records are retried
- Successfully applied customers are skipped
- New application report generated

## Statistics Section

### Overview Metrics
- **Total Rewards Created:** All-time count
- **Total Recipients:** Cumulative customer count
- **Applied Rewards:** Successfully awarded
- **Success Rate:** Percentage of successful applications

### Breakdown by Type
- **Bundles:** Count and total value
- **Points:** Count and total points awarded
- **Discounts:** Count and total discount value
- **Cashback:** Count and total amount

### Timeline
- Rewards created over time (weekly/monthly)
- Applications completed over time
- Success rate trend
- Peak reward periods

## Export & Reporting

### Export Data
Export reward list with filters applied:
- **Format options:** CSV, Excel, PDF
- **Includes:** All visible columns
- **Export what's visible:** Respects current filters and search
