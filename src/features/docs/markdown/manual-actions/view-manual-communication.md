# View Manual Communication Details

## Overview

The Manual Communication details page shows complete information about a communication, including message content, audience details, delivery metrics, and execution results.

## How to Access

**From Communications List**
1. Navigate to **Manual Actions → Manual Communications**
2. Click the communication name or **View** button
3. Details page loads

**From Search Results**
1. Search for communication
2. Click on matching result
3. Details page opens

## Details Page Sections

### Basic Information

**Communication ID**
- Unique identifier for this communication
- Reference number for tracking
- Used in reports and logs

**Status**
- **Completed:** Successfully executed
- **Scheduled:** Awaiting execution
- **Pending:** Currently sending
- **Failed:** Encountered errors

**Created Information**
- Date and time created
- User who created it
- Last modified date/time

**Execution Information**
- Execution ID (if executed)
- Execution start time
- Execution end time
- Total execution duration

### Audience Details

**Target Audience**
- Total number of recipients
- Audience source (File, Quicklist, Manual)
- Subscription ID column used
- Audience preview (first 10 rows)

**Audience Breakdown (if applicable)**
- By region
- By subscription type
- By customer segment
- By status

### Message Content

**Channel**
- Communication method used (Email, SMS, WhatsApp, Push)
- Channel-specific settings

**Message Title** (Email/Push)
- Subject line or notification title
- Exactly as sent to customers

**Message Body**
- Complete message text
- Formatting preserved
- Images and media displayed

**Variables Used**
- List of all variables inserted
- Example: `{{customer_name}}`, `{{phone_number}}`
- Shows variable values (anonymized samples)

### Communication Policy

**Applied Policies** (if any)
- Policy names applied
- Policy rules description
- Impact on audience size

**Impact Summary**
- Customers filtered by policy
- Reasons for filtering
- Percentage of audience affected

### Delivery Metrics

**Summary Statistics**
- **Total Sent:** Messages successfully delivered
- **Failed:** Failed delivery attempts
- **Total Recipients:** Target audience size
- **Success Rate:** Percentage delivered successfully
- **Delivery Time:** Duration to deliver all messages

**Per-Channel Breakdown** (if multi-channel)
- Channel name
- Sent count
- Failed count
- Success rate
- Channel-specific metrics

### Failed Recipients (if applicable)

**Failed List**
- Shows up to 100 failed contacts
- Reason for failure (invalid address, policy blocked, etc.)
- Customer identifier
- Timestamp of failure

**Failure Reasons**
- **Invalid Contact:** Email/phone format incorrect
- **Policy Blocked:** Communication policy prevented send
- **Delivery Failed:** Channel delivery failure
- **Contact Inactive:** Customer account inactive
- **Bounced:** Email bounced or SMS rejected
- **Other Error:** System or external error

**Export Failed List**
- Download as CSV
- Useful for follow-up or retry

### Execution Timeline

**Timeline View**
- Step-by-step execution log
- Timestamps for each phase:
  - Audience load
  - Message preparation
  - Sending started
  - Batch 1, 2, 3... completed
  - Final summary

**Performance Data**
- Messages per minute rate
- Peak sending rate
- Average delivery time per message

## Available Actions

### Edit Communication
Click **Edit** button to:
- Modify scheduled communication
- Update message content
- Change execution time
- Adjust audience
- Modify policy settings

**Availability:** Only for scheduled communications

See [Edit Manual Communication](/documentation/edit-manual-communication)

### Retry Failed Communication
For failed communications:
- Click **Retry Failed** button
- Only failed recipients are retried
- New execution ID created
- Results merged with original

**Note:** Only available for completed communications with failures

### Duplicate Communication
Create a copy of this communication:
- Same audience, message, and settings
- Allows quick creation of similar campaigns
- Can edit before execution

### Delete Communication
Permanently remove communication:
- **Confirmation required**
- Cannot delete if currently sending
- Can delete scheduled communications

### Download Report
Export detailed report:
- **Formats:** PDF, CSV, Excel
- **Includes:** All metrics, failed list, logs
- **Useful for:** Archives, audits, analysis

### View Audience File
For file-uploaded audiences:
- Download original file
- View column mappings
- Preview sample data

## Test Results (if applicable)

### Test Message Preview
If test messages were sent:
- **Test Recipients:** Who messages were sent to
- **Test Results:** Success/failure for each
- **Message Preview:** How message appeared
- **Variable Substitution:** Actual values used

### Test Failures
Review any test failures:
- Reason for failure
- Corrective action taken
- Message adjusted if needed

## Performance Analysis

### Delivery Performance
- Success rate comparison to channel average
- Failure rate analysis
- Performance metrics
- Trend data if available

### Time Analysis
- Time to send all messages
- Distribution of sends
- Peak delivery times
- Bottlenecks identified

### Quality Metrics
- Variable substitution accuracy
- Format/rendering issues
- Bounce rate (if applicable)
- Engagement metrics (if available)

## Related Communications

**Similar Communications**
- Other communications to same audience
- Other communications using same channel
- Other communications from same period

## Download & Export Options

### Export Formats
- **PDF:** Formatted report with charts
- **CSV:** Tabular data with failed list
- **Excel:** Multi-sheet workbook with metrics
- **JSON:** Raw data for analysis

### What's Included
- Basic information
- Audience details
- Metrics and statistics
- Failed recipients list
- Execution timeline

## Best Practices

### Review Quality
- Check delivery rate against expected
- Verify variable substitution worked correctly
- Review failed recipient reasons
- Identify patterns in failures

### Monitor Impact
- Track customer engagement post-send
- Monitor bounce rates
- Check for complaints or issues
- Gather feedback on message

### Documentation
- Download reports for records
- Archive successful communications
- Document lessons learned
- Plan improvements for future

### Troubleshooting
- Review failure reasons
- Check policy impact
- Verify audience quality
- Confirm channel settings

## Related Documentation

- [Manual Communications Overview](/documentation/manual-communications) - Feature overview
- [Communications List](/documentation/manual-communications-list) - View all communications
- [Create Communication](/documentation/create-manual-communication) - How to create
- [Edit Communication](/documentation/edit-manual-communication) - Edit guide
- [Communication Policies](./documentation/configuration/campaign-communication-policy-list) - Policy reference