# Create Manual Communication

## Overview

This guide walks you through creating and executing a one-time manual communication to a specific customer segment across Email, SMS, WhatsApp, or Push channels.

## How to Start

1. Navigate to **Manual Actions → Manual Communications**
2. Click the **Create Communication** button
3. Follow the 4-step wizard

## Step 1: Define Target Audience

### Choose Audience Source

**Option A: Upload Customer File**
1. Click **Upload File**
2. Select a CSV or text file with customer data
3. Confirm file details:
   - Column count
   - Row count
   - Available columns

4. **Select Subscription ID Column**
   - Choose which column contains unique customer identifier
   - This is used to match customer data with system records
   - Example: `subscription_id`, `customer_id`, `phone_number`

5. **Confirm Audience**
   - Review extracted columns
   - Verify row count (number of customers)
   - Check file preview for data quality

**Option B: Select from Quicklist**
1. Click **Select Quicklist**
2. Browse available quicklists
3. Select the quicklist to use
4. System loads member count

**Option C: Manual Entry**
1. Click **Enter Manually**
2. Enter recipient identifiers one per line
3. Add customer identifiers based on selected ID column

### Audience Summary
Before proceeding, you'll see:
- **Total Recipients:** Number of customers
- **Source:** File, Quicklist, or Manual
- **ID Type:** Subscription ID type being used
- **Edit Option:** Change audience if needed

## Step 2: Define Communication

### Channel Selection

Choose your communication method:

**Email**
- Send formatted email messages
- Supports HTML and plain text
- Good for detailed messages
- Higher delivery rates

**SMS**
- Short text messages (160 characters standard)
- Fast delivery
- Good for alerts and brief messages
- Limited character count

**WhatsApp**
- WhatsApp Business messages
- Rich media support
- Higher engagement rates
- Requires WhatsApp integration

**Push Notifications**
- Mobile app push notifications
- Immediate delivery
- Good for time-sensitive messages
- Requires app installation

### Message Composition

#### Title/Subject (Email and Push)
- **Field:** Message Title
- **Required:** Yes
- **Max Length:** 100 characters
- **Purpose:** Email subject line or push notification title

#### Message Body
- **Field:** Message Body
- **Required:** Yes
- **Max Length:** 5000 characters
- **Format Options:**
  - Plain Text (simple message)
  - Rich Text (formatting: bold, italic, colors, images, links)

#### Text Editor Features
- Bold, italic, underline formatting
- Text color and highlighting
- Links and image insertion
- Lists and tables
- HTML/markdown support

### Dynamic Variable Insertion

Insert customer-specific data to personalize messages:

#### How to Insert Variables

1. **Click Insert Variable** button
2. **Browse Variable Hierarchy:**
   - **Select Source:** Customer Identity, Subscription Details, Account Info, etc.
   - **Select Field:** Phone, Email, Name, Balance, Status, etc.
3. **Variable Added:** `{{field_name}}` appears in message
4. **Test:** Use test step to verify substitution

#### Available Variables by Source

**Customer Identity**
- Name (First, Last, Full)
- Email address
- Phone number
- Date of birth

**Subscription Details**
- Subscription ID
- Subscription status
- Plan name
- Activation date

**Account Information**
- Account balance
- Available credits
- Account status
- Loyalty points

**Dynamic Fields**
- Last purchase date
- Last interaction
- Customer segment
- Campaign history

#### Variable Formatting
- Variables use syntax: `{{variable_name}}`
- Replaced with actual data during sending
- If data missing, shows placeholder or skips field
- Test before full execution

### Communication Policy Selection

#### What is a Policy?
Communication policies control:
- When messages can be sent (time windows)
- How frequently customers can receive messages
- DND (Do Not Disturb) compliance
- Special rules for VIP customers

#### How to Select Policy
1. **Optional Step** - Policies are optional
2. **Click Select Policy** dropdown
3. **Choose applicable policies:**
   - Time Window Policy (e.g., "Business hours only")
   - Frequency Policy (e.g., "Max 2 per week")
   - DND Policy (e.g., "Respect DND settings")
   - VIP Policy (e.g., "VIP bypass rules")

4. **Impact:**
   - Some customers may be filtered out
   - Audience size may decrease
   - Reasons shown if applicable

#### No Policy
- Send without restrictions
- Respects only mandatory regulations
- Fastest delivery

### SMS Route (SMS Channel Only)

**What is SMS Route?**
- SMS gateway/provider to use
- Different routes may have different:
  - Delivery speeds
  - Rates/costs
  - Coverage areas

**How to Select:**
1. Click **Select SMS Route**
2. Choose from available providers
3. View route details:
   - Provider name
   - Delivery speed
   - Coverage
   - Rate information
4. Confirm selection

## Step 3: Test Communication

### Why Test?
- Verify message formatting
- Check variable substitution
- Confirm delivery works
- Review final output

### Send Test Messages

1. **Add Test Recipients**
   - Enter test phone numbers or email addresses
   - Add multiple test contacts
   - Use different formats to test

2. **Send Test**
   - Click **Send Test** button
   - Messages sent to test recipients immediately
   - Results shown in real-time

### Review Test Results

For each test contact, you'll see:
- **Status:** Sent, Failed, or Pending
- **Message Preview:** How message appears to recipient
- **Variables:** Actual values substituted
- **Error Details:** If failed, reason for failure

### Common Test Issues

**Variable Not Substituted**
- Verify variable syntax is correct
- Check test contact has data for field
- Some fields may be optional

**Formatting Issues**
- Preview message as recipient sees it
- Check special characters display correctly
- Verify links are clickable

**Delivery Failed**
- Check phone/email format
- Verify contact is valid
- Check policy restrictions don't apply

## Step 4: Schedule Execution

### Execution Timing

**Option A: Send Now**
- Message sent immediately
- Execution begins within 1-2 minutes
- All recipients sent in batch
- Results available in minutes

**Option B: Schedule for Later**
- **Select Date:** Pick execution date
- **Select Time:** Choose execution time
- **Timezone:** Shown and can be changed
- **Note:** Uses server timezone if not specified

### Final Review

Before confirming, review all settings:

**Audience**
- Number of recipients
- Source (file, quicklist, manual)
- Filters applied (if any)

**Message**
- Channel (Email, SMS, WhatsApp, Push)
- Full message content
- Variables being used

**Settings**
- Communication policy (if any)
- SMS route (if applicable)
- Execution time

### Execute Communication

**For Immediate Send:**
1. Click **Send Now** button
2. Confirmation dialog appears
3. Click **Confirm** to execute
4. System shows confirmation with execution ID

**For Scheduled Send:**
1. Click **Schedule** button
2. Confirmation dialog appears
3. Shows scheduled date/time
4. Click **Confirm to Schedule**
5. System shows confirmation with execution ID

## After Creation

### What Happens Next?

**Immediate Execution**
- Begins sending within 1-2 minutes
- View progress in list page
- Completion notification when done

**Scheduled Execution**
- Appears in "Scheduled" status
- Can still edit before execution time
- Auto-executes at scheduled time
- Notification when complete

### Monitoring

1. Go to **Manual Communications List**
2. Find your communication
3. Track status:
   - **Pending** - Currently sending
   - **Completed** - Done
   - **Scheduled** - Waiting to send

4. Click **View** to see detailed results:
   - Delivery metrics
   - Failed contacts
   - Variable substitution
   - Channel breakdown

## Related Documentation

- [Manual Communications Overview](/documentation/manual-communications) - Feature overview
- [Communications List](/documentation/manual-communications-list) - View all communications
- [View Communication Details](/documentation/view-manual-communication) - View results
- [Edit Communication](/documentation/edit-manual-communication) - Modify scheduled communications
- [Communication Policies](./documentation/configuration/campaign-communication-policy-list) - Policy reference
