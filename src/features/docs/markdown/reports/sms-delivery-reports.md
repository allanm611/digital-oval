# SMS Delivery Reports

> **Important:** The screenshots in this documentation display dummy/sample data for demonstration purposes. Each report includes a Data Mode toggle that allows you to switch between viewing dummy data and real production data. Use the toggle button at the top-right of the reports page to switch between modes. Real data will display your actual SMS delivery metrics and performance information.

## Overview

SMS Delivery Reports provide detailed analytics on SMS campaign performance, tracking message delivery, customer engagement, and conversion metrics. Monitor SMS success rates, identify delivery issues, and optimize messaging strategies based on performance data.

## Accessing SMS Delivery Reports

**Step 1: Navigate to Reports**
- Click **Reports** in the main navigation
- Select **SMS Delivery Reports** option
- Reports page loads with SMS analytics

**Route:** `/dashboard/reports/sms-delivery`

---

## Key Metrics Overview

![SMS Delivery & Stats](/img/reports/delievrery&smsstats.png)

Eight key metrics provide quick insights into SMS performance:

### 1. SMS Sent

**What it shows:**
- Total SMS messages sent
- Example: "87,500"
- Volume metric

**Why it matters:**
- Total SMS volume across campaigns
- Baseline for calculating rates
- Shows campaign activity level

---

### 2. Delivered

**What it shows:**
- SMS messages successfully delivered to recipients
- Example: "82,000"
- Actual recipient reach

**Why it matters:**
- True reach metric (not all sent = delivered)
- Affected by invalid numbers, network issues
- Key success indicator

---

### 3. Delivery Rate

**What it shows:**
- Percentage of sent SMS that were delivered
- Example: "93.7%"
- Delivery success metric

**Why it matters:**
- Measures SMS gateway performance
- Industry standard: 95%+
- Low rates indicate data quality or provider issues

**How to use:**
- Below 90% = investigate customer data quality
- 90-95% = good but room for improvement
- Above 95% = excellent delivery performance

---

### 4. Open Rate

**What it shows:**
- Percentage of delivered SMS opened/read
- Example: "4.5%"
- Message engagement metric

**Why it matters:**
- Shows how many customers saw the message
- Early indicator of message relevance
- Varies by message type and time

---

### 5. Click Rate

**What it shows:**
- Percentage of delivered SMS with clicks
- Example: "43.3%"
- Link engagement metric

**Why it matters:**
- Measures message action appeal
- High = message resonates
- Low = message or timing issue

---

### 6. Conversion Rate

**What it shows:**
- Percentage converting to goal (purchase, signup, etc.)
- Example: "3.1%"
- Business result metric

**Why it matters:**
- Primary measure of SMS effectiveness
- Directly impacts ROI
- Guide for optimization efforts

---

### 7. Fulfillment Rate

**What it shows:**
- Percentage of conversions that completed fulfillment
- Example: "7.5%"
- Completion metric

**Why it matters:**
- Shows quality of conversions
- Indicates funnel completion
- Measures true business value

---

### 8. Cost Per Conversion

**What it shows:**
- Average cost to generate one conversion
- Example: "0.6"
- Efficiency metric

**Why it matters:**
- Shows campaign profitability
- Guides budget allocation
- Compare against customer lifetime value

**How to use:**
- Divide total spend by conversions
- Lower is better
- Compare against industry benchmarks

---

## SMS Delivery Funnel

![SMS Delivery Funnel](/img/reports/smsdeliveryfunnel.png)

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

---

## Message Delivery Log

![Message Delivery Log](/img/reports/smstable.png)

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

---

## Performance Analysis

### Delivery Success

**Good Delivery Rate Benchmarks:**
- 95%+ = Excellent
- 90-95% = Good
- 85-90% = Acceptable (investigate)
- Below 85% = Problem (check data quality)

**Factors Affecting Delivery:**
- Customer data quality (valid/invalid numbers)
- SMS gateway performance
- Carrier network issues
- Timing and send rate limits

### Engagement Patterns

**Typical Click Rates:**
- 5-10% = Average
- 10-20% = Good
- 20%+ = Excellent
- Low = Consider message content or timing

**Conversion Expectations:**
- 2-5% = Good performance
- 5-10% = Excellent
- 10%+ = Outstanding
- Below 2% = Review targeting and offer

### Cost Efficiency

**Cost Per Conversion:**
- Compare against product margin
- Should be well below customer lifetime value
- Higher for awareness campaigns
- Lower for conversion-focused campaigns

---

## Best Practices

### Campaign Planning

- Validate customer phone numbers before send
- Test with small segment first
- Schedule around peak engagement times
- Limit daily sends to avoid carrier throttling

### Optimization

- Monitor delivery rates daily
- Test different message content
- A/B test send times and days
- Track conversions by segment

### Data Quality

- Keep phone numbers validated and current
- Remove inactive or bounced numbers
- Maintain consent records for compliance
- Regular data cleansing (quarterly minimum)

### Cost Management

- Monitor cost per conversion
- Allocate budget to highest-ROI segments
- Reduce sends to low-conversion groups
- Track total ROI including fulfillment costs

---

## Troubleshooting

### Low Delivery Rate

**Possible Causes:**
- Invalid or outdated phone numbers
- Customer opted out
- Carrier filtering or blocking
- SMS gateway issues

**Solutions:**
- Validate phone numbers regularly
- Check opt-out lists
- Test with different SMS provider
- Review carrier relationships

### Low Conversion Rate

**Possible Causes:**
- Message not compelling
- Poor timing or frequency
- Wrong audience targeting
- Weak offer or incentive

**Solutions:**
- Test different message copy
- Try different send times
- Better segment targeting
- Increase offer value

### High Cost Per Conversion

**Possible Causes:**
- Low engagement rates
- Poor audience quality
- Inefficient send frequency
- Weak targeting

**Solutions:**
- Improve message content
- Better audience segmentation
- Optimize send frequency
- Higher value incentives

---

## Data Modes

### Dummy Data Mode

- Shows sample/demonstration data
- Useful for learning the interface
- Test without impacting real customers
- Safe for training and exploration

Enable:
- Toggle "Data Mode" button at top-right
- Select "Dummy Data" option

### Real Data Mode

- Shows actual SMS performance
- Real delivery metrics and conversions
- Production data from active campaigns
- Reflects current business performance

Enable:
- Toggle "Data Mode" button at top-right
- Select "Real Data" option

Important: Only real data mode shows actual customer information and conversion metrics. Always verify you are viewing the correct data mode when making business decisions.

---

