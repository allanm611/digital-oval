# Create Manual Reward

## Overview

This guide walks you through creating and applying a one-time reward to a specific customer segment. Rewards can be applied immediately or scheduled for future execution.

## How to Start

1. Navigate to **Manual Actions → Manual Rewards**
2. Click the **Create Reward** button
3. Follow the 4-step wizard

## Step 1: Select Customers

### Choose Customer Source

**Option A: Upload Customer File**
1. Click **Upload File**
2. Select a CSV or text file with customer data
3. Confirm file details:
   - Column count
   - Row count (number of customers)
   - Available columns

4. **Review Audience**
   - Extracted columns shown
   - Row count verified
   - Preview available

**Option B: Select from Quicklist**
1. Click **Select Quicklist**
2. Browse available quicklists
3. Select the quicklist to use
4. System loads member count

**Option C: Manual Entry**
1. Click **Enter Manually**
2. Enter customer identifiers one per line
3. Identifiers matched to system records

### Audience Summary
Before proceeding, you'll see:
- **Total Customers:** Number of recipients
- **Source:** File, Quicklist, or Manual
- **Segment:** Customer segment details (if available)
- **Edit Option:** Change audience if needed

## Step 2: Define Reward

### Select Reward Type

Choose the type of reward to apply:

#### Bundle Reward
**What:** Pre-configured service bundles
**Examples:** Data packages, SMS bundles, minutes

**Steps:**
1. Click **Select Reward Type → Bundle**
2. **Select Bundle Track:**
   - Data packages (MB/GB quantities)
   - SMS bundles (quantity of messages)
   - Minutes bundles (talk time)
   - Other bundled services
3. **Review Bundle Details:**
   - Bundle name
   - Quantity/value
   - Validity period
   - Benefits

#### Points Reward
**What:** Loyalty or promotion points

**Steps:**
1. Click **Select Reward Type → Points**
2. **Enter Points Amount:**
   - Number of points to award
   - Example: 1000 points
3. **Select Point Type:** (if applicable)
   - Loyalty points
   - Bonus points
   - Promotional points
4. **Validity:**
   - Expiry date (if applicable)
   - Point terms and conditions

#### Discount Reward
**What:** Percentage or fixed amount discount

**Steps:**
1. Click **Select Reward Type → Discount**
2. **Select Discount Type:**
   - **Percentage:** Enter % (e.g., 25%)
   - **Fixed Amount:** Enter amount (e.g., KES 100)
3. **Applicable Products:**
   - Select which products discount applies to
   - All products or specific categories
4. **Validity:**
   - Start date (usually today)
   - Expiry date/validity period
   - Usage limits (if any)

#### Cashback Reward
**What:** Direct monetary returns to customer

**Steps:**
1. Click **Select Reward Type → Cashback**
2. **Enter Cashback Amount:**
   - Monetary value
   - Currency (KES, USD, etc.)
   - Example: KES 500
3. **Delivery Method:**
   - Account credit
   - Mobile wallet
   - Bank transfer
   - Check method available
4. **Validity:**
   - When available for use
   - Expiry date

### Reward Configuration

**Reward Name/Description**
- Internal identifier for the reward
- Clear description of what's being awarded
- Example: "VIP Customer Bonus Q4"

**Reward Value Details**
- Specific quantity/amount
- Bundle parameters
- Point count or discount percentage
- Cashback amount

**Terms & Conditions** (Optional)
- Validity period
- Usage restrictions
- Applicable products/services
- Special conditions

### Communication Policy

**What is a Policy?**
- Controls when customers are notified
- Respects DND settings
- Manages notification frequency
- Special rules for VIP customers

**How to Select Policy:**
1. **Optional** - Policies are optional
2. Click **Select Communication Policy** (optional dropdown)
3. **Choose policies** that apply:
   - Time Window Policy (notify during business hours)
   - Frequency Policy (respect message limits)
   - DND Policy (don't disturb settings)
   - VIP Policy (special handling)

4. **Impact:**
   - Some customers may not be notified
   - Reward still applied, notification may be delayed
   - Policy restrictions shown

## Step 3: Preview Reward

### Why Preview?
- Verify reward configuration before applying
- Check impact on customers
- Review notification message
- Validate business logic

### Preview Content

**Reward Summary**
- Reward type and value
- Number of customers affected
- Total reward cost/value
- Validity information

**Impact Analysis**
- Total customers receiving reward
- Estimated system impact
- Resource requirements
- Processing time estimate

**Customer Impact**
- Sample of affected customers
- How reward appears to them
- Notification message
- Available actions for customer

**Financial Impact**
- Total reward cost
- Average cost per customer
- Budget impact
- Cost breakdown by reward type

### Make Changes
If something needs adjustment:
1. Click **Back to Step 2**
2. Modify reward configuration
3. Return to preview
4. Changes reflected immediately

### Validation Checks
System verifies:
- Budget availability for cashback/discounts
- Customer eligibility
- Reward configuration validity
- Policy compatibility

## Step 4: Apply Reward

### Execution Timing

**Option A: Apply Now**
- Reward applied immediately
- Customers notified (based on policy)
- Application begins within 1-2 minutes
- All customers processed in batch

**Option B: Schedule for Later**
- **Select Date:** Pick application date
- **Select Time:** Choose application time
- **Timezone:** Shown and can be changed
- **Note:** Uses server timezone if not specified

### Final Confirmation

Before applying, review:

**Customers**
- Number of recipients
- Source (file, quicklist, manual)
- Segment details

**Reward**
- Reward type and value
- Total cost
- Validity terms

**Policy**
- Communication policy applied
- Notification timing
- Special rules

**Timing**
- Immediate or scheduled date/time
- Processing duration

### Apply Reward

**For Immediate Application:**
1. Click **Apply Now** button
2. Confirmation dialog appears
3. Shows summary of action
4. Click **Confirm** to apply
5. System shows confirmation with reward ID

**For Scheduled Application:**
1. Click **Schedule** button
2. Confirmation dialog appears
3. Shows scheduled date/time
4. Click **Confirm to Schedule**
5. System shows confirmation with reward ID

## After Creation

### What Happens Next?

**Immediate Application**
- Begins processing within 1-2 minutes
- View progress in list page
- Completion notification when done
- Customers notified per policy

**Scheduled Application**
- Appears in "Scheduled" status
- Can still edit before application time
- Auto-applies at scheduled time
- Notification sent when complete

### Monitoring

1. Go to **Manual Rewards List**
2. Find your reward
3. Track status:
   - **Pending** - Currently applying
   - **Applied** - Done
   - **Scheduled** - Waiting to apply

4. Click **View** to see detailed results:
   - Per-customer status
   - Failure reasons (if any)
   - Notification delivery
   - Redemption status (if available)

## Best Practices

### Audience Selection
- Start with small test segment
- Verify customer data quality
- Check file format and completeness
- Review audience size before application
- Ensure customer identifiers are unique

### Reward Configuration
- Set appropriate reward values
- Consider customer segment value
- Define clear validity terms
- Align with business objectives
- Calculate total cost

### Communication
- Notify customers promptly about reward
- Use clear, positive messaging
- Include reward terms and conditions
- Explain how to use/redeem
- Provide support information

### Budgeting
- Ensure budget available
- Track total reward cost
- Consider volume discounts
- Plan for future campaigns
- Monitor ROI and impact

### Monitoring
- Track application success rates
- Monitor failed applications
- Review customer response
- Analyze reward impact
- Adjust future strategy

## Troubleshooting

### File Upload Issues
- **"Invalid file format"** - Use CSV or text format
- **"No headers detected"** - Ensure first row contains column names
- **"Empty file"** - Check file contains customer data

### Reward Configuration Issues
- **"Reward type not available"** - Verify selected type is configured
- **"Invalid reward value"** - Check format and constraints
- **"Quota exceeded"** - Verify account balance for monetary rewards

### Policy Issues
- **"Policy filters all customers"** - Modify or remove policy
- **"Policy conflict"** - Check policy rules compatibility
- **"Notification error"** - Verify communication settings

### Application Issues
- **"Customer not found"** - Verify customer identifiers
- **"Budget exceeded"** - Check account balance
- **"System error"** - Contact support with reward ID

## Related Documentation

- [Manual Rewards Overview](/documentation/manual-rewards) - Feature overview
- [Rewards List](/documentation/manual-rewards-list) - View all rewards
- [View Reward Details](/documentation/view-manual-reward) - View results
- [Edit Reward](/documentation/edit-manual-reward) - Modify scheduled rewards
- [Manual Communications](/documentation/manual-communications) - Send messages to customers
