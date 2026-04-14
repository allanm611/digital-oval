# SMS Delivery Reports

## Overview

SMS Delivery Reports provide detailed analytics on SMS campaign performance, tracking message delivery, customer engagement, and conversion metrics. Monitor SMS success rates, identify delivery issues, and optimize messaging strategies based on performance data.

## Data Mode

**Toggle Data Mode:**
- Switch between live data and sample/test data
- "Data Mode" toggle in top-right corner

## Accessing SMS Delivery Reports

**Step 1: Navigate to Reports**
- Click **Reports** in the main navigation
- Select **SMS Delivery Reports** option
- Reports page loads with SMS analytics

## Key Metrics Overview

![SMS Delivery & Stats](/img/v1.1/reports/delievrery&smsstats.png)

Eight key metrics provide quick insights into SMS performance:

### 1. SMS Sent

**What it shows:**
- Total SMS messages sent
- Volume metric

**Why it matters:**
- Total SMS volume across campaigns
- Baseline for calculating rates
- Shows campaign activity level

### 2. Delivered

**What it shows:**
- SMS messages successfully delivered to recipients
- Actual recipient reach

**Why it matters:**
- True reach metric (not all sent = delivered)
- Affected by invalid numbers, network issues
- Key success indicator

### 3. Delivery Rate

**What it shows:**
- Percentage of sent SMS that were delivered
- Delivery success metric

**Why it matters:**
- Measures SMS gateway performance
<!-- - Industry standard: 95%+
- Low rates indicate data quality or provider issues -->

<!-- **How to use:**
- Below 90% = investigate customer data quality
- 90-95% = good but room for improvement
- Above 95% = excellent delivery performance

--- -->

### 4. Open Rate

**What it shows:**
- Percentage of delivered SMS opened/read
- Message engagement metric

**Why it matters:**
- Shows how many customers saw the message
<!-- - Early indicator of message relevance
- Varies by message type and time -->

### 5. Click Rate

**What it shows:**
- Percentage of delivered SMS with clicks
- Link engagement metric

**Why it matters:**
- Measures message action appeal
- High = message resonates
- Low = message or timing issue

### 6. Conversion Rate

**What it shows:**
- Percentage converting to goal (purchase, signup, etc.)
- Business result metric

**Why it matters:**
- Primary measure of SMS effectiveness
- Directly impacts ROI
- Guide for optimization efforts

### 7. Fulfillment Rate

**What it shows:**
- Percentage of conversions that completed fulfillment
- Completion metric

**Why it matters:**
- Shows quality of conversions
- Indicates funnel completion
- Measures true business value

### 8. Cost Per Conversion

**What it shows:**
- Average cost to generate one conversion
- Efficiency metric

**Why it matters:**
- Shows campaign profitability
- Guides budget allocation
- Compare against customer lifetime value

**How to use:**
- Divide total spend by conversions
<!-- - Lower is better
- Compare against industry benchmarks -->

## SMS Delivery Funnel

![SMS Delivery Funnel](/img/v1.1/reports/smsdeliveryfunnel.png)

Track message journey from send to conversion across time periods:

**Funnel Stages:**
- **Sent** (Cyan bars) - Messages successfully sent
- **Delivered** (Gray bars) - Messages reaching customers
- **Converted** (Dark blue bars) - Messages resulting in conversions

**Daily Breakdown:**
- Each day shows the three metrics
- Identify patterns by day of week
- Spot delivery issues quickly

**How to Analyze:**
- Large gap between sent/delivered = delivery problem
- Small converted count = low conversion rate
- Compare days to find best/worst performers

**Optimization Tips:**
- Identify highest conversion days
- Repeat messaging on those days
- Investigate low conversion days
- Test different send times

## Message Delivery Log

![Message Delivery Log](/img/v1.1/reports/smstable.png)

Detailed view of individual SMS campaign performance:

**Columns Displayed:**
- **Campaign ID** - Unique campaign identifier
- **Campaign Name** - Name of SMS campaign
- **Status** - Delivery status (Delivered, Pending, Failed, Rejected)
- **Sent** - Number of SMS sent
- **Delivered** - Number successfully delivered
- **Conversions** - Number of conversions
- **Conversion Rate** - Percentage converting

**Status Types:**
- Delivered (green) - Successfully sent and received
- Pending (orange) - Still processing
- Failed (red) - Delivery failed
- Rejected (gray) - Rejected by carrier

**How to Use:**

**Search Campaigns:**
1. Use search box to find by campaign name
2. Results update in real-time
3. Results shown on paginated pages

**Filter by Status:**
- Click "All Statuses" dropdown
- Filter by Delivered, Pending, Failed, or Rejected
- Analyze different outcome types

**Export Data:**
- Click "Download CSV" button
- Export all or filtered results
- Use for external analysis or reporting
