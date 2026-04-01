# Create Manual Reward

## Overview

This guide walks you through creating and applying a one-time reward to a specific customer segment. Choose from bundles, points, discounts, or cashback.

## How to Start

### Creating a New Reward
1. Navigate to **Manual Actions → Manual Rewards**
2. Click the **Create Reward** button
3. Follow the 4-step wizard

### Editing an Existing Reward
The editing flow is identical to creating - you'll follow the same 4 steps. The only difference is:
- **All fields are pre-filled** with current settings
- You modify only what you need to change
- Changes apply before execution time

**Note:** Only scheduled rewards that haven't started applying can be edited.

---

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
   - Email addresses: john@example.com
   - Phone numbers: +254712345678 (include country code)
3. System validates in real-time
4. Shows total valid recipients

### Validation & Next Steps
Before proceeding to Step 2:
- **Reward Name:** Must be filled in
- **Reward Type:** Must be selected
- **Input Method:** Must be selected (Upload File OR Manual Input)
- **Recipients:** At least one valid recipient required

---

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

### Communication Policy

Apply policies that control when and how customers are notified:
- Timing rules (don't send between 9 PM and 8 AM)
- Frequency limits
- DND (Do Not Disturb) compliance

For detailed policy options, see [Communication Policies](/documentation/configuration/communication-policies).

---

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

---

## Step 4: Apply Reward

![Step 4 - Apply Reward](/img/manual-actions/step4-reward.png)

Set when the reward will be applied and confirm.

### Execution Timing

**Option A: Apply Now**
- Reward applied immediately to all recipients
- Notifications sent right away (if enabled)
- Results available within minutes

**Option B: Schedule for Later**
- Select date and time for reward application
- Reward queued until scheduled time
- Auto-applies at specified time

### Final Review

Before confirming, review all settings:
- **Audience:** Number of recipients
- **Reward:** Type and value
- **Execution:** Time to apply
- **Notifications:** Policy and message

### Apply Reward

**For Immediate Application:**
1. Click **Apply Now**
2. Confirm in dialog
3. System shows reward ID and confirmation

**For Scheduled Application:**
1. Click **Schedule**
2. Confirm in dialog
3. System shows scheduled date/time and reward ID

---

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
