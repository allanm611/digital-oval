# Manual Communications List

## Overview

The Manual Communications list displays all communications you've created and executed. This page provides a centralized view of your one-time messaging campaigns with execution status and delivery metrics.

## Accessing the List

1. Navigate to **Manual Actions** from the main menu
2. Select **Manual Communications**
3. The system displays all communications in a paginated list

## List View Features

### Summary Statistics

At the top of the page, you'll see key metrics:
- **Total Communications:** All communications created
- **Completed:** Successfully executed
- **Scheduled:** Pending execution
- **Failed:** Encountered delivery issues

### Communication Details

Each communication in the list shows:

| Column | Description |
|--------|-------------|
| **Name/ID** | Communication identifier or execution ID |
| **Channel** | Communication method (Email, SMS, WhatsApp, Push) |
| **Recipients** | Total number of target customers |
| **Sent** | Number of successfully delivered messages |
| **Failed** | Number of failed deliveries |
| **Status** | completed, pending, or scheduled |
| **Created** | Date and time communication was created |
| **Created By** | User who created the communication |
| **Actions** | View, Edit, or Delete options |

### Status Indicators

**Completed** - Communication was successfully executed
- All messages processed
- Delivery completed
- Results available

**Scheduled** - Communication awaiting execution
- Execution time not yet reached
- Can be edited or cancelled
- Will execute at scheduled time

**Pending** - Communication is being sent
- Currently in progress
- Messages are being delivered
- Cannot be modified during execution

**Failed** - Communication encountered errors
- Some or all messages failed
- Review failure details
- May retry or delete

## Searching and Filtering

### Search
Use the search box to find communications by:
- Communication name or ID
- Execution ID
- Recipient identifier

**Search is real-time** - Results update as you type

### Filters

**Channel Filter**
- Show all channels or specific channel (Email, SMS, WhatsApp, Push)
- Helpful for reviewing channel-specific campaigns

**Status Filter**
- All Statuses
- Completed
- Scheduled
- Pending
- Failed

**Date Range Filter**
- Filter by creation date
- Useful for finding recent communications

## Actions

### View Details
Click the **View** button or communication name to:
- See full message content
- Review audience details
- View delivery statistics
- Check variable substitution
- See execution summary

See [View Manual Communication](./view-manual-communication)

### Edit Communication
Click the **Edit** button to:
- Modify audience (for scheduled communications)
- Update message content
- Change communication policy
- Adjust execution time
- Update channel settings

**Note:** Can only edit scheduled communications that haven't executed

See [Edit Manual Communication](./edit-manual-communication)

### Delete Communication
Click the **Delete** button to:
- Remove communication permanently
- Free up system resources

**Confirmation required** - You'll be asked to confirm deletion

**Note:** Cannot delete executed communications

### Retry Failed Communication
For failed communications:
- Click **Retry** to attempt delivery again
- Failed recipient contacts are retried
- Successfully sent contacts are skipped
- New delivery report generated

## Pagination

The list is paginated for performance:
- **Rows per page:** Select from dropdown (15, 25, 50, 100)
- **Page navigation:** First, Previous, Next, Last buttons
- **Total count:** Shows total communications matching filters

## Export & Reporting

### Export Data
Export communication list with filters applied:
- **Format options:** CSV, Excel, PDF
- **Includes:** All visible columns
- **Export what's visible:** Respects current filters and search

### Delivery Reports
For each communication, access detailed reports:
- Per-channel delivery breakdown
- Failed recipient list with error details
- Variable substitution results
- Timing and performance metrics

## Best Practices

### Organization
- Use descriptive communication names
- Include date in name for easy identification
- Add purpose in description

### Monitoring
- Regularly check scheduled communications
- Review failed communications promptly
- Monitor delivery rates for channels
- Track customer engagement

### Cleanup
- Delete old completed communications
- Archive important execution results
- Remove failed attempts after review
- Maintain a clean list for performance

### Quality Control
- Review sample of sent messages
- Verify recipient count before execution
- Check variable substitution quality
- Validate channel performance

## Related Documentation

- [Manual Communications Overview](./manual-communications) - Feature overview
- [Create Manual Communication](./create-manual-communication) - How to create
- [View Communication Details](./view-manual-communication) - View details
- [Edit Communication](./edit-manual-communication) - Edit guide
- [Manual Rewards](./manual-rewards) - Apply rewards to customers