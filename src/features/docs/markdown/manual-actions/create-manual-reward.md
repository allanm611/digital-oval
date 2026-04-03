# Create Manual Reward

## Overview

This guide walks you through creating and applying a one-time reward to a specific customer segment. Choose from bundles, points, discounts, or cashback.

## How to Start

### Creating a New Reward
1. Navigate to **Manual Actions → Manual Rewards**
2. Click the **Create Reward** button
3. Follow the 4-step wizard

### Editing an Existing Reward
Editing a reward follows **the exact same 4-step process** as creating. The only difference is:
- **All fields are pre-filled** with your current settings
- You modify only what you need to change
- Changes take effect at the new application time

**Note:** Only scheduled rewards that haven't started applying can be edited. Applied, pending, and failed rewards cannot be modified.

## Step 1: Select Customers

![Step 1 - Select Customers](/img/manual-actions/step1-rewards.png)

Define which customers will receive this reward using three fields:

### 1. Reward Name
- **What is it:** The name/label for this reward
- **Required:** Yes
- **Example:** "VIP Loyalty Bonus", "Win-back Campaign Reward"

### 2. Reward Type
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
- **Reward Name:** Must be filled in
- **Reward Type:** Must be selected
- **Input Method:** Must be selected (Upload File OR Manual Input)
- **Recipients:** At least one valid recipient required

## Step 2: Define Reward

![Step 2 - Define Reward](/img/manual-actions/step2-reward.png)

Configure the reward type, value, and notification settings.

### Reward Type Selection

Choose which type of reward to apply:

**Bundle**
- Select from available data, minutes, SMS bundles, etc.
- Customer receives bundle access immediately
- Example: "500 MB Internet Bundle"

**Points**
- Enter number of points to award
- Points added to customer's account instantly
- Example: "1000 Loyalty Points"

**Discount**
- **Type:** Percentage or Fixed Amount
  - Percentage: "25%"
  - Fixed: "KES 100"
- Specify which products the discount applies to
- Define validity period

**Cashback**
- Enter monetary amount
- Specify currency (KES, USD, etc.)
- Example: "KES 500 Cashback"

### Reward Configuration

**Reward Description** (Optional)
- Additional details about the reward
- Notes for reference

### [Communication Policies](/documentation/configuration/campaign-communication-policy-list)

Apply policies that control when and how customers are notified:
- Timing rules (don't send between 9 PM and 8 AM)
- Frequency limits
- DND (Do Not Disturb) compliance

## Step 3: Preview Reward

![Step 3 - Preview Reward](/img/manual-actions/step3-reward.png)

Review all settings before applying the reward.

### What to Review

**Audience Summary**
- Total number of recipients
- Source of audience (file, quicklist, manual)

**Reward Details**
- Reward type and value
- Any applicable restrictions
- Total cost if applicable

**Impact**
- How many customers will receive this reward
- Any policy filtering that applies

### Proceed or Go Back

- **If everything looks good:** Click **Next** to proceed to Step 4
- **If changes needed:** Go back to Step 2 to modify settings

## Step 4: Apply Reward

![Apply Reward Schedule Part 1](/img/manual-actions/manualrewardsscheduleimage1.png)

![Apply Reward Schedule Part 2](/img/manual-actions/manualrewardsscheduleimage2.png)

Configure detailed scheduling for when your reward will be applied.

### Broadcast Schedule Range

**Start Options:**
- **Start Date/Time:** Specify exact date and time for reward application
- **Starts when previous broadcast is aborted:** Reward begins when another broadcast is canceled

**End Options:**
- **Never:** Reward continues indefinitely (default)
- **At:** Reward stops at a specified date and time

**Time Zone:**
- Select your local time zone for all scheduling
- Options include Sudan (GMT+02:00), UTC, Eastern, Central, Paris, and more

### Recurrence Pattern and Delivery

**Recurrence Configuration:**
- **Pattern:** Choose Weeks, Days, or Months
- **Interval:** Set how often reward is applied (every 1, 2, 3+ periods)
- **Days Selection:** Pick specific days of the week for reward application
- **Default Start Time:** Set the preferred time rewards begin each period

**Additional Options:**
- **Set specific start time for days:** Override default time on specific days
- **Start delivery on completion:** Reward begins after another broadcast finishes

### Target Render Time

Choose when the reward is generated:
- **Pre-Render:** Reward generated before application starts
- **Real Time:** Reward generated at application time (personalized rewards)
- **Broadcast Schedule:** Reward rendered based on broadcast timing rules

### Summary Section

Review your complete reward configuration:
- **Audience:** Number of recipients
- **Reward:** Type and value
- **Schedule:** Start/end times, recurrence, time zone

The summary displays all key details before final submission.

### Apply the Reward

1. Configure your scheduling preferences (date, time, recurrence, timezone)
2. Review the summary section with all reward details
3. Click **Submit** to apply the reward
4. System shows reward ID and confirmation message

## After Creation

### Monitoring Application

1. Go to [Manual Rewards List](/documentation/manual-actions/manual-rewards-list)
2. Find your reward and track status:
   - **Pending** - Currently being applied
   - **Applied** - Successfully awarded
   - **Scheduled** - Waiting to apply
3. Click **View** to see detailed results:
   - Application metrics
   - Failed recipients
   - Notification status
