# Manual Communications

## Overview

Manual Communications allow you to send one-time messages to specific customer segments using various communication channels (Email, SMS, WhatsApp, Push Notifications). Unlike campaign-based communications, manual communications are created and executed on-demand without the need for campaign setup.

**Use Cases:**
- Send urgent notifications or announcements
- Communicate with specific customer segments
- Test message content and delivery
- Handle ad-hoc customer communications
- Execute targeted promotional messages

## Key Features

- **Multi-Channel Support:** Email, SMS, WhatsApp, Push Notifications
- **Flexible Audience:** Upload customer files or select from existing quicklists
- **Message Templates:** Create rich text or plain text messages with dynamic variables
- **Variable Insertion:** Insert customer data fields directly into messages for personalization
- **Test Capability:** Send test messages before executing the full broadcast
- **Scheduled Execution:** Send immediately or schedule for a specific date/time
- **Communication Policies:** Apply policies for timing, frequency, and DND management
- **Execution Tracking:** Monitor delivery status and performance metrics

## How to Access

1. Navigate to **Manual Actions** from the main menu
2. Select **Manual Communications**
3. View all previously created communications or create a new one

## Creating a Manual Communication

### Step 1: Define Target Audience

#### Option A: Upload Customer File
1. Click **Upload File**
2. Select a CSV or text file containing customer data
3. The system extracts column headers
4. **Select Subscription ID Column:** Choose which column contains the unique customer identifier
5. Confirm the file details (row count, columns)

#### Option B: Select from Quicklist
1. Click **Select Quicklist**
2. Choose an existing quicklist
3. System loads the quicklist members as target audience

### Step 2: Define Communication

#### Channel Selection
Choose your communication channel:
- **Email:** Send formatted email messages
- **SMS:** Send short text messages (character limit applies)
- **WhatsApp:** Send WhatsApp messages (requires WhatsApp integration)
- **Push:** Send mobile push notifications

#### Message Composition
1. **Message Title:** (Required for Email and Push)
   - Max 100 characters
   - Clear, actionable subject line

2. **Message Body:** (Required)
   - Plain text or rich text (formatting available)
   - Max 5000 characters
   - Support for dynamic variables

#### Dynamic Variables
Insert customer-specific data into your message:

1. **Available Variables:**
   - Click the **Insert Variable** button
   - Browse hierarchical profile sources:
     - Customer Identity (phone, email, name, etc.)
     - Subscription Details (subscription ID, status, plan, etc.)
     - Account Information (account balance, credits, etc.)

2. **Inserting Variables:**
   - Select source category → Select field
   - Variable is inserted as `{{variable_name}}`
   - Variables are replaced with actual customer data during execution

#### Communication Policy
1. **Select Policy:** (Optional)
   - Choose communication policies that apply
   - Policies control timing, frequency, DND rules
   - Example: "Don't send between 9 PM and 8 AM"

#### SMS Route (SMS Only)
- Select the SMS gateway/provider to use
- Different routes may have different rates and delivery speeds

### Step 3: Test Communication

Before executing the full broadcast:

1. **Test Recipients:**
   - Enter test phone numbers or email addresses
   - Use at least one test contact

2. **Send Test:**
   - Messages are sent to test recipients
   - Review message formatting and variable substitution
   - Confirm delivery success

3. **Results:**
   - View test send status
   - Check for any errors or formatting issues

### Step 4: Schedule Execution

#### Execution Timing
**Option A: Send Now**
- Message is sent immediately to all recipients
- Execution begins within 1-2 minutes

**Option B: Schedule for Later**
- Select date and time for execution
- System will execute at specified time
- Current timezone is displayed

#### Review & Confirm
1. Review all settings:
   - Audience size
   - Message content
   - Channel and policy settings
   - Execution timing

2. Click **Execute Communication** or **Schedule Communication**

## Managing Communications

### Viewing Communication List

The Manual Communications list displays:
- **Name/ID:** Communication identifier
- **Channel:** Email, SMS, WhatsApp, or Push
- **Recipients:** Total number of target customers
- **Sent:** Number of successfully sent messages
- **Failed:** Number of failed deliveries
- **Status:** completed, pending, or scheduled
- **Created:** Date and time created
- **Created By:** User who created it

### Filtering & Searching
- **Search:** Find communications by name or ID
- **Channel Filter:** Show only specific channels
- **Status Filter:** View by status (completed, pending, scheduled)

### Editing a Communication
1. Click the **Edit** button on a communication
2. Modify audience, message, policy, or scheduling
3. Click **Update Communication**

**Note:** Can only edit scheduled communications that haven't executed yet

### Viewing Details
1. Click the communication name
2. View full details:
   - Audience breakdown
   - Message content
   - Delivery statistics
   - Execution summary

### Deleting a Communication
1. Click the **Delete** button
2. Confirm deletion in modal
3. Communication is permanently removed

**Note:** Cannot delete executed communications

## Execution Status & Metrics

### Status Types
- **Pending:** Waiting for execution (scheduled for future)
- **In Progress:** Currently being sent
- **Completed:** Execution finished
- **Failed:** Execution encountered errors

### Metrics
- **Total Recipients:** Audience size
- **Messages Sent:** Successfully delivered
- **Messages Failed:** Delivery failures
- **Delivery Rate:** Percentage of successful sends
- **Execution Time:** Duration of send operation

## Best Practices

### Audience Selection
- Test with a small segment first
- Verify file format and column headers
- Ensure subscription ID column is correctly identified
- Review audience size before execution

### Message Content
- Keep messages concise and clear
- Use variables for personalization
- Test formatting before full send
- Follow brand guidelines and tone
- Avoid spam-like language

### Variable Usage
- Use customer-relevant variables (name, account details, etc.)
- Test variable substitution with test recipients
- Ensure variables exist for all recipients
- Handle missing data gracefully

### Scheduling
- Avoid sending during late night hours
- Consider recipient timezones if applicable
- Schedule during peak engagement times
- Leave buffer time for approval

### Communication Policies
- Apply appropriate DND policies
- Respect frequency limits per customer
- Consider time-window policies
- Review policy impact on audience size

## Troubleshooting

### File Upload Issues
- **"Invalid file format"** - Ensure CSV or text format
- **"No columns detected"** - Check file has headers in first row
- **"No subscription ID column"** - Select the correct ID column

### Message Send Failures
- **Incorrect recipient format** - Verify phone/email format
- **Policy restrictions** - Check communication policy rules
- **Channel issues** - Verify channel configuration
- **Quota exceeded** - Check account sending limits

### Variable Issues
- **Variables not replaced** - Ensure customer has the field data
- **Syntax errors** - Verify variable format `{{field_name}}`
- **Missing fields** - Some customers may lack certain fields

