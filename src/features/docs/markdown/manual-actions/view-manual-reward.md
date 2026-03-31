# View Manual Reward Details

## Overview

The Manual Reward details page shows complete information about a reward, including reward configuration, audience details, application status, and per-customer results.

## How to Access

**From Rewards List**
1. Navigate to **Manual Actions → Manual Rewards**
2. Click the reward name or **View** button
3. Details page loads

**From Search Results**
1. Search for reward
2. Click on matching result
3. Details page opens

## Details Page Sections

### Basic Information

**Reward ID**
- Unique identifier for this reward
- Reference number for tracking
- Used in reports and logs

**Status**
- **Applied:** Successfully awarded to customers
- **Scheduled:** Awaiting application
- **Pending:** Currently applying
- **Failed:** Encountered errors

**Created Information**
- Date and time created
- User who created it
- Last modified date/time

**Application Information**
- Application date/time
- Duration to apply to all customers
- Total processing time

### Reward Details

**Reward Type**
- Bundle, Points, Discount, or Cashback
- Specific type applied

**Bundle Details** (if Bundle Reward)
- Bundle name and track
- Quantity (MB, SMS count, minutes, etc.)
- Validity period
- Bundle benefits

**Points Details** (if Points Reward)
- Points amount awarded
- Point type/category
- Expiry date (if applicable)
- Point terms

**Discount Details** (if Discount Reward)
- Discount type (percentage or fixed)
- Discount amount/percentage
- Applicable products
- Validity period

**Cashback Details** (if Cashback Reward)
- Cashback amount and currency
- Delivery method
- Availability date
- Expiry date

### Audience Details

**Target Audience**
- Total number of customers
- Audience source (File, Quicklist, Manual)
- Segment details (if applicable)
- Customer preview (first 10 rows)

**Audience Breakdown** (if applicable)
- By subscription type
- By location/region
- By customer segment
- By status/tenure

### Communication Policy

**Applied Policies** (if any)
- Policy names applied
- Policy rules description
- Impact on notifications
- Special conditions

**Notification Details**
- Notification message
- Delivery timing
- Channel used
- Delivery status

### Application Metrics

**Summary Statistics**
- **Total Recipients:** Target audience size
- **Applied:** Successfully awarded
- **Failed:** Failed applications
- **Pending:** Awaiting processing
- **Success Rate:** Percentage successful

**Status Breakdown**
- Applied: X customers
- Failed: Y customers
- Pending: Z customers
- Notified: N customers

**Timing Metrics**
- Total application time
- Average time per customer
- Processing rate
- Peak application time

### Failed Applications (if applicable)

**Failed List**
- Shows up to 100 failed records
- Reason for failure
- Customer identifier
- Timestamp of failure

**Failure Reasons**
- **Customer Not Found:** ID not in system
- **Budget Exceeded:** Insufficient funds for cashback
- **Policy Blocked:** Communication policy prevented notification
- **System Error:** Technical issue occurred
- **Invalid Customer:** Account inactive or invalid
- **Duplicate:** Already awarded

**Export Failed List**
- Download as CSV
- Useful for follow-up or manual processing

### Per-Customer Results

**Results Table**
- Customer identifier
- Application status (Applied, Failed, Pending)
- Reward received (Y/N)
- Application date/time
- Notification status
- Notes/error details

**Filtering Results**
- Filter by status (Applied, Failed, Pending)
- Search by customer ID
- Sort by date, status, or customer
- View details for individual customer

**Export Results**
- Download complete results
- Format: CSV or Excel
- Includes all columns
- Useful for reconciliation

## Timeline & History

### Application Timeline

**Timeline View**
- Step-by-step application log
- Timestamps for each phase:
  - Audience load
  - Validation check
  - Application started
  - Batch 1, 2, 3... completed
  - Notification sent
  - Final summary

**Performance Data**
- Records per minute rate
- Peak processing rate
- Average time per record
- Bottleneck identification

### Change History
- Modifications made to reward (if any)
- When changes were made
- Who made changes
- Previous vs. current values

## Notification Status

**Sent Notifications**
- Number of customers notified
- Notification method
- Delivery timestamp
- Delivery status per customer

**Undelivered Notifications**
- Number not notified
- Reasons (policy, invalid contact, system error)
- Retry available or not

**Notification Content**
- Message sent to customers
- Variables substituted
- Formatting as delivered

## Available Actions

### Edit Reward
Click **Edit** button to:
- Modify scheduled reward settings
- Update reward configuration
- Change execution time
- Adjust audience

**Availability:** Only for scheduled rewards

See [Edit Manual Reward](/documentation/edit-manual-reward)

### Retry Failed Reward
For failed rewards:
- Click **Retry Failed** button
- Only failed customers are retried
- Successfully applied customers are skipped
- New application summary generated

**Note:** Only available if failures occurred

### Duplicate Reward
Create a copy of this reward:
- Same configuration and settings
- New audience can be selected
- Quick creation for similar campaigns

### Delete Reward
Permanently remove reward:
- **Confirmation required**
- Cannot delete if currently applying
- Can delete scheduled rewards

### Download Report
Export detailed report:
- **Formats:** PDF, CSV, Excel
- **Includes:** All metrics, failed list, timeline
- **Useful for:** Archives, audits, analysis

### View Audience File
For file-uploaded audiences:
- Download original file
- View column mappings
- Preview sample data

## Analysis & Insights

### Application Quality
- Success rate vs. average
- Failure rate analysis
- Performance metrics
- Trend data if available

### Customer Impact
- Customer satisfaction feedback (if available)
- Redemption rate (if tracked)
- Usage statistics
- ROI analysis

### Operational Insights
- Application speed
- System performance
- Bottleneck identification
- Resource usage

## Comparison & Benchmarking

**Similar Rewards**
- Other rewards to same segment
- Other rewards of same type
- Other rewards from same period
- Success rate comparison

**Performance Comparison**
- Against reward type average
- Against organization average
- Trends over time
- Seasonal patterns

## Related Rewards

**Connected Rewards**
- Follow-up rewards
- Related campaigns
- Customer touchpoints
- Complementary actions

## Download & Export Options

### Export Formats
- **PDF:** Formatted report with charts and metrics
- **CSV:** Tabular data with per-customer results
- **Excel:** Multi-sheet workbook with summaries and details
- **JSON:** Raw data for further analysis

### What's Included
- Reward details and configuration
- Audience information
- Application metrics
- Failed customer list
- Timeline and logs
- Notification status

## Best Practices

### Review Quality
- Check application success rate
- Review failure reasons
- Identify improvement areas
- Verify customer count matches expectations

### Monitor Impact
- Track customer feedback
- Monitor redemption rates
- Check for complaints
- Analyze business impact

### Documentation
- Download reports for records
- Archive successful rewards
- Document lessons learned
- Plan improvements

### Follow-up
- Contact failed customers
- Gather feedback from recipients
- Plan follow-up communications
- Analyze long-term impact

## Related Documentation

- [Manual Rewards Overview](/documentation/manual-rewards) - Feature overview
- [Rewards List](/documentation/manual-rewards-list) - View all rewards
- [Create Reward](/documentation/create-manual-reward) - How to create
- [Edit Reward](/documentation/edit-manual-reward) - Edit guide
- [Manual Communications](/documentation/manual-communications) - Send messages to customers