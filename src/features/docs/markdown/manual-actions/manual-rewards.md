# Manual Rewards

## Overview

Manual Rewards allow you to apply one-time rewards to specific customer segments without creating a full campaign. Rewards are executed directly and can be applied immediately or scheduled for future execution.

**Reward Types:**
- **Bundle:** Data, minutes, SMS bundles
- **Points:** Loyalty or promotion points
- **Discount:** Percentage or fixed amount discounts
- **Cashback:** Direct monetary returns

**Use Cases:**
- Compensate for service issues
- Reward loyal customers
- Promotional incentives
- Win-back campaigns
- Customer appreciation programs

## Key Features

- **Multiple Reward Types:** Bundles, Points, Discounts, Cashback
- **Flexible Audience:** Upload customer files or select from quicklists
- **Communication Integration:** Notify customers about rewards
- **Preview Capability:** Review reward application before execution
- **Scheduled Execution:** Apply immediately or schedule for specific date/time
- **Policy Management:** Apply communication policies
- **Execution Tracking:** Monitor applied, failed, and pending rewards
- **Batch Processing:** Handle large customer segments efficiently

## How to Access

1. Navigate to **Manual Actions** from the main menu
2. Select **Manual Rewards**
3. View all previously applied rewards or create a new one

## Creating a Manual Reward

### Step 1: Select Customers

#### Option A: Upload Customer File
1. Click **Upload File**
2. Select a CSV or text file containing customer data
3. System extracts column headers
4. Confirm file details:
   - Number of rows (customers)
   - Available columns
   - File format

#### Option B: Select Quicklist
1. Click **Select Quicklist**
2. Choose an existing quicklist
3. System loads quicklist members as target audience

### Step 2: Define Reward

#### Reward Type Selection
Choose the type of reward to apply:

**Bundle**
- **Bundle Track:** Select the bundle to award (Data, Minutes, SMS, etc.)
- **Example:** "500 MB Internet Bundle"
- Configure bundle-specific parameters

**Points**
- **Points Amount:** Number of points to award
- **Example:** "1000 Loyalty Points"
- Specify point type or category if applicable

**Discount**
- **Discount Type:** Percentage or Fixed Amount
  - Percentage: e.g., "25%"
  - Fixed: e.g., "KES 100"
- **Applicable Products:** Which products the discount applies to
- **Validity:** How long the discount remains valid

**Cashback**
- **Cashback Amount:** Monetary value to return
- **Currency:** Currency of cashback (e.g., KES, USD)
- **Example:** "KES 500 Cashback"

#### Reward Configuration
1. **Reward Name/Description:**
   - Clear identifier for the reward
   - Internal reference (e.g., "VIP Customer Bonus Q4")

2. **Reward Value:**
   - Amount or quantity
   - Specific bundle or product details

3. **Validity Period (Optional):**
   - Start date (usually today)
   - Expiry date if applicable
   - Duration-based expiry (e.g., "30 days from date awarded")

#### Communication Policy
1. **Select Policy:** (Optional)
   - Choose communication policies
   - Controls when notification is sent
   - Respects DND and frequency limits
   - Example: "Don't notify between 9 PM and 8 AM"

2. **Notification Message:**
   - Customer receives notification about reward
   - Can customize message template
   - Includes reward details

### Step 3: Preview Reward

Before applying to all customers:

1. **Preview Data:**
   - See sample of how reward will be applied
   - Review customer records affected
   - Verify reward parameters

2. **Impact Summary:**
   - Total customers affected
   - Total value of rewards
   - Estimated system impact
   - Resource requirements

3. **Validation:**
   - Confirm all settings are correct
   - Check for any warnings or issues
   - Review customer segment details

### Step 4: Apply Reward

#### Execution Timing

**Option A: Apply Now**
- Reward is applied immediately
- Customers receive notification (based on policy)
- Execution begins within 1-2 minutes

**Option B: Schedule for Later**
- Select future date and time
- System will apply at specified time
- Timezone is displayed and can be changed

#### Final Confirmation
1. Review complete reward details:
   - Customer segment size
   - Reward type and value
   - Execution timing
   - Communication policy

2. Click **Apply Reward** or **Schedule Reward**

3. System shows:
   - Confirmation message
   - Execution ID
   - Expected completion time

## Managing Rewards

### Viewing Reward List

The Manual Rewards list displays:
- **Name:** Reward identifier/description
- **Type:** Bundle, Points, Discount, or Cashback
- **Value:** Reward amount or quantity
- **Recipients:** Total customers receiving reward
- **Applied:** Number successfully applied
- **Failed:** Number of failed applications
- **Status:** pending, applied, scheduled, or failed
- **Created:** Date and time created
- **Created By:** User who created it

### Filtering & Searching
- **Search:** Find rewards by name or ID
- **Type Filter:** Show specific reward types
- **Status Filter:** View by status (applied, pending, scheduled, failed)
- **Date Range:** Filter by creation date

### Viewing Details
1. Click the reward name
2. View complete information:
   - Audience breakdown
   - Reward details and terms
   - Application status
   - Per-customer results
   - Notification history

### Editing a Reward
1. Click the **Edit** button on a reward
2. Modify settings:
   - Audience (for scheduled rewards only)
   - Reward parameters
   - Communication policy
   - Execution time

3. Click **Update Reward**

**Note:** Can only edit scheduled rewards that haven't been applied yet

### Deleting a Reward
1. Click the **Delete** button
2. Confirm deletion
3. Reward is removed from system

**Note:** Cannot delete rewards that have already been applied

## Execution Status & Metrics

### Status Types
- **Pending:** Awaiting execution (scheduled for future)
- **Applied:** Successfully applied to customers
- **Scheduled:** Queued for future execution
- **Failed:** Encountered errors during application

### Metrics
- **Total Recipients:** Audience size
- **Applied Count:** Successfully applied customers
- **Failed Count:** Failed applications
- **Success Rate:** Percentage of successful applications
- **Execution Time:** When reward was/will be executed

## Best Practices

### Audience Selection
- Start with smaller test segment
- Verify customer data quality
- Check file format and completeness
- Review audience size before execution
- Ensure customer identifiers are unique

### Reward Configuration
- Set appropriate reward values
- Consider customer segment value
- Define clear expiry dates if needed
- Align with business objectives
- Budget for total reward cost

### Communication Strategy
- Notify customers about rewards
- Apply appropriate communication policies
- Respect DND and frequency limits
- Use clear, positive messaging
- Include reward terms and conditions

### Scheduling
- Schedule during business hours
- Allow time for system processing
- Consider customer engagement patterns
- Avoid peak system usage times
- Set reminders for important dates

### Monitoring
- Track application success rates
- Monitor failed applications
- Review customer feedback
- Analyze reward impact
- Adjust future reward strategies

## Troubleshooting

### File Upload Issues
- **"Invalid file format"** - Use CSV or text format
- **"No headers detected"** - Ensure first row contains column names
- **"Empty file"** - Check file contains customer data

### Reward Application Issues
- **"Reward type not available"** - Verify selected reward type is configured
- **"Customers not found"** - Check customer identifiers are correct
- **"Quota exceeded"** - Verify account balance for monetary rewards
- **"Policy restriction"** - Check communication policy doesn't block all contacts

### Notification Issues
- **"Notification not sent"** - Check communication policy
- **"Invalid contact"** - Verify customer has valid email/phone
- **"Policy blocked"** - DND or frequency limits may apply

