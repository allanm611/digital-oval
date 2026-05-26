---
title: Execution Monitoring
---

# Execution Monitoring

Monitor the real-time and historical execution status of campaigns, broadcasts, manual rewards, and scheduled jobs. The Execution Monitoring page provides detailed insights into how your executions are performing, including delivery metrics, success rates, and error tracking.

## Overview

The Execution Monitoring page displays comprehensive execution data, allowing you to:
- Monitor active executions in real-time
- Track execution history and completion status
- View detailed delivery breakdowns and success rates
- Identify and troubleshoot failed executions
- Export execution data for reporting

## Accessing Execution Monitoring

Navigate to **Administration → Execution Monitoring** to view the execution list and monitoring dashboard.

## Statistics Cards

At the top of the Execution Monitoring page, you'll see quick statistics showing:

- **Total Executions** - Total number of executions across all types
- **Running** - Number of executions currently in progress
- **Success** - Number of successfully completed executions (with success rate percentage)
- **Failed** - Number of executions that failed

These statistics update based on the current filters applied.

## Execution List

![Execution Monitoring List](/img/v1.2.4/executionmonitoringlist.png)

The main table displays all executions with their key information:

### Columns

- **Name** - Name of the execution (campaign, broadcast, reward, or job name)
- **Type** - Type of execution:
  - Campaign
  - Broadcast
  - Manual Reward
  - Scheduled Job
- **Recipients** - Total number of recipients targeted by this execution
- **Status** - Current status of the execution:
  - **Running** - Execution is currently in progress
  - **Success** - Execution completed successfully
  - **Failed** - Execution failed
  - **Pending** - Execution is queued and waiting to start
- **Success** - Number of recipients who successfully received the message/reward
- **Failed** - Number of recipients where delivery failed
- **Duration** - How long the execution took to complete (in seconds or minutes)
- **Actions** - Quick action buttons:
  - **View** (Eye icon) - Open detailed execution information
  - **Retry** (Rotate icon) - Retry a failed execution (only shown for failed executions)

## Search & Filter

### Search by Name or Trigger

Use the search bar to find executions by:
- Execution name
- User who triggered the execution

### Filter by Type

Click the **Type** dropdown to filter executions by:
- **All Types** - Show all execution types
- **Campaign** - Show only campaign executions
- **Broadcast** - Show only broadcast executions
- **Manual Reward** - Show only manual reward executions
- **Scheduled Job** - Show only scheduled job executions

### Filter by Status

Click the **Status** dropdown to filter executions by:
- **All Status** - Show all statuses
- **Running** - Show only executions currently in progress
- **Success** - Show only completed successful executions
- **Failed** - Show only failed executions
- **Pending** - Show only queued executions

## Download Executions

Click the **Download** button to export the current filtered execution list as a CSV file containing:
- Execution Name
- Type
- Recipients Count
- Status
- Success Count
- Failed Count
- Duration

The exported file is automatically named with a timestamp (e.g., `executions_1674528000000.csv`).

## Pagination

Navigate through execution records using the pagination controls at the bottom of the table. Default page size is 10 executions per page.

## Viewing Execution Details

Click the **View** (Eye icon) button on any execution row to open the Execution Details page.

### Execution Details Page

![Execution Details - Metrics](/img/v1.2.4/executionmonitoringdetailsimage1.png)

#### Performance Metrics

View key performance metrics for the execution:

- **Total Recipients** - Total number of customers/users targeted
- **Success** - Number of successful deliveries with success rate percentage
- **Failed** - Number of failed deliveries
- **Duration** - Total time taken to complete the execution

#### Execution Information

View core details about the execution:

- **Name** - Execution name
- **Type** - Execution type (Campaign, Broadcast, Manual Reward, or Scheduled Job)
- **Status** - Current status (Running, Success, Failed, or Pending)
- **Execution ID** - Unique identifier for this execution

#### Delivery Breakdown

Detailed breakdown of delivery results:

- **Total Recipients** - Number of recipients this execution was sent to
- **Delivered** - Number of successfully delivered messages/rewards
- **Failed** - Number of failed deliveries

#### Audit Trail

![Execution Details - Breakdown and Audit](/img/v1.2.4/executionmonitoringdetailsimage2.png)

Track execution timing and who triggered it:

- **Triggered By** - User or system that initiated this execution
- **Executed At** - Date and time when the execution started
- **Completed At** - Date and time when the execution finished (only shown if completed)
- **Duration** - Total execution time

#### Error Details

If an execution fails, the error details section displays:

- **Error Message** - Description of what went wrong
- Appears only for failed executions

This helps with troubleshooting and understanding why an execution didn't complete successfully.

#### Execution Log

Detailed log table showing individual execution events and stages:

- Progress through different execution stages
- Timestamps for each stage
- Any warnings or errors encountered during execution
- Performance metrics for each stage

## Execution Status Reference

### Running
- Execution is currently in progress
- Retry action is not available
- Execution may still be processing recipients

### Success
- Execution completed successfully
- All or most recipients were processed without errors
- Success rate indicates the percentage of successful deliveries

### Failed
- Execution encountered an error and did not complete
- Error details section displays the failure reason
- Retry button is available to attempt the execution again

### Pending
- Execution is queued and waiting to start
- Has not yet begun processing
- Will transition to Running when it starts

## Key Notes

- **Real-time Updates** - The execution list updates periodically to reflect current execution status
- **Success Rate Calculation** - Success rate is calculated as: (Success Count / Total Recipients) × 100
- **Export Data** - Downloaded CSV files can be imported into spreadsheet applications for further analysis
- **Execution Retry** - Retrying a failed execution will restart it from the beginning
- **Timezone Display** - All timestamps are displayed in your configured timezone
- **Permission Based** - Access to execution monitoring requires appropriate administrative permissions

## Common Use Cases

### Monitoring Campaign Delivery
1. Navigate to Execution Monitoring
2. Filter by Type: "Campaign"
3. View the list of recent campaign executions
4. Click View to see detailed delivery metrics
5. Check the Delivery Breakdown to verify success rates

### Troubleshooting Failed Executions
1. Filter by Status: "Failed"
2. Click View on the failed execution
3. Check the Error Details section for the failure reason
4. Review the Execution Log for additional context
5. Use the Retry button to attempt the execution again

### Exporting Execution Reports
1. Apply desired filters (Type, Status, Date Range)
2. Click the Download button
3. CSV file downloads automatically
4. Import into your reporting tool or spreadsheet

