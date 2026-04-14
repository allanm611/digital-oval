# Create Manual Communication

## Overview

This guide walks you through creating and executing a one-time manual communication to a specific customer segment across Email, SMS, WhatsApp, or Push channels.

## How to Start

### Creating a New Communication
1. Navigate to **Manual Actions → Manual Communications**
2. Click the **Create Communication** button
3. Follow the 3-step wizard

### Editing an Existing Communication
Editing a communication follows **the exact same 3-step process** as creating. The only difference is:
- **All fields are pre-filled** with your current settings
- You modify only what you need to change
- Changes take effect at the new execution time

<!-- **Note:** Only scheduled communications that haven't started sending can be edited.
- Cannot edit: Completed, Pending, or Failed communications
- Cannot edit if execution time has passed -->

## Step 1: Define Target Audience

![Step 1 - Define Target Audience](/img/v1.1/manual-actions/step1-communications.png)

Configure your communication audience using three fields:

### 1. Name
- **What is it:** The name/label for this communication broadcast
- **Required:** Yes
- **Example:** "Weekend Promotion Announcement", "Urgent Service Update"

### 2. List Type
- **What is it:** Categorize the audience by type/tier
- **Options:** Standard, Premium, or VIP
- **Purpose:** Organize and manage different customer tiers

### 3. Input Method
Choose ONE of two options:

#### Option A: Upload File (via Quicklist)
1. Click **Upload File** button
2. Select an existing quicklist OR create a new one by uploading a CSV file
3. System shows quicklist name and row count
4. Confirm selection

#### Option B: Manual Input
1. Click **Manual Input** option
2. Enter recipient identifiers (one per line):
   - Email addresses: mariam@example.com
   - Phone numbers: 254712345678 (include country code)
3. System validates in real-time
4. Shows total valid recipients

### Validation & Next Steps
Before proceeding to Step 2:
- **Name:** Must be filled in
- **List Type:** Must be selected
- **Input Method:** Must be selected (Upload File OR Manual Input)
- **Recipients:** At least one valid recipient required

## Step 2: Define Communication & Test

![Step 2 - Define Communication](/img/v1.1/manual-actions/step2-communications.png)

Configure your message, then test it before sending.

### Channel Selection

Choose your communication method:

**Email** - Detailed messages, formatted content, higher delivery rates

**SMS** - Alerts, brief messages (160 character limit), fast delivery

**WhatsApp** - Rich media support, higher engagement rates

**Push** - Mobile app notifications, time-sensitive messages

### Message Composition

#### Title/Subject (Email and Push only)
- **Max Length:** 100 characters
- **Required:** Yes

#### Message Body
- **Max Length:** 5,000 characters
- **Format:** Plain text or Rich text (bold, italic, colors, links, images)

### Dynamic Variables & Personalization

Make messages personal by inserting customer data like `{{first_name}}` or `{{account_balance}}`.

**How to Insert:**
1. Click **Insert Variable** button
2. Browse and select customer field
3. Variable is inserted as `{{field_name}}`

For detailed list of available variables, see [Variable Configuration](/documentation/configuration/dynamic-message-variables).

### [Communication Policies](/documentation/configuration/campaign-communication-policy-list)

Policies control when and how often messages are sent (timing rules, DND compliance, frequency limits).

**To Apply:**
1. Click **Select Policy** (optional)
2. Choose applicable policy
3. Note: Some customers may be filtered out based on policy rules

### [SMS Routes Configuration](/documentation/configuration/sms-routes) (SMS Channel Only)

Select which SMS gateway/provider to use. Different routes may have different delivery speeds and coverage.

**To Select:**
1. Click **Select SMS Route**
2. Choose from available providers
3. Confirm selection

### Test Your Message

Before sending to all customers, test with a few contacts from your seedlist:

#### Send Test Message
1. **Select Test Recipients:** Choose test contacts from your configured [Seed List](/documentation/configuration/seed-list-management)
2. **Click Send Test:** Messages sent immediately to test contacts
<!-- 3. **Review Results:** Check status, message preview, variable substitution, and any errors

#### What to Look For
- Message formatting appears correct
- Variables substituted with real data
- Links are clickable
- Delivery successful -->

#### If Issues Found
- Fix message content in this step
- Re-test before proceeding

Once satisfied with test results, click **Next** to proceed to Step 3.

## Step 3: Schedule & Execute

![Schedule Execution Part 1](/img/v1.1/manual-actions/manualcommunciationscheduleimage1.png)

![Schedule Execution Part 2](/img/v1.1/manual-actions/manualcommunciationscheduleimage2.png)

Configure detailed scheduling for your message execution.

### Broadcast Schedule Range

**Start Options:**
- **Start Date/Time:** Specify exact date and time for message delivery
- **Starts when previous broadcast is aborted:** Message begins when another broadcast is canceled

**End Options:**
- **Never:** Message continues indefinitely (default)
- **At:** Message stops at a specified date and time

**Time Zone:**
- Select your local time zone for all scheduling
- Options include Sudan (GMT+02:00), UTC, Eastern, Central, Paris, and more

### Recurrence Pattern and Delivery

**Recurrence Configuration:**
- **Pattern:** Choose Weeks, Days, or Months
- **Interval:** Set how often message repeats (every 1, 2, 3+ periods)
- **Days Selection:** Pick specific days of the week for delivery
- **Default Start Time:** Set the preferred time messages begin each period

**Additional Options:**
- **Set specific start time for days:** Override default time on specific days
- **Start delivery on completion:** Message begins after another broadcast finishes

### Target Render Time

Choose when the message content is generated:
- **Pre-Render:** Content generated before delivery starts (consistent message)
- **Real Time:** Content generated at delivery time (dynamic/personalized)
- **Broadcast Schedule:** Content rendered based on broadcast timing rules

### Final Review

Before confirming, review all settings:
- **Audience:** Number of recipients and source
- **Message:** Content, channel, variables
- **Settings:** Policy and SMS route (if applicable)
- **Schedule:** Start/end times, recurrence, time zone


## After Creation

### Monitoring Execution

1. Go to [Manual Communications List](/documentation/manual-actions/manual-communications-list)
2. Find your communication and track status:
   - **Pending** - Currently sending
   - **Completed** - Done sending
   - **Scheduled** - Waiting to send
3. Click **View** to see detailed results:

![View Communication Details](/img/v1.1/manual-actions/detailscommunicationpage.png)

You'll see:
   - Delivery metrics
   - Failed contacts
   - Channel breakdown
`