# Email Delivery Reports

> **Important:** The screenshots in this documentation display dummy/sample data for demonstration purposes. Each report includes a Data Mode toggle that allows you to switch between viewing dummy data and real production data. Use the toggle button at the top-right of the reports page to switch between modes. Real data will display your actual email delivery metrics and performance information.

## Overview

Email Delivery Reports provide detailed analytics on email campaign performance, tracking message delivery, customer engagement, and conversion metrics. Monitor email success rates, identify delivery issues, and optimize messaging strategies based on performance data.

## Accessing Email Delivery Reports

**Step 1: Navigate to Reports**
- Click **Reports** in the main navigation
- Select **Email Delivery Reports** option
- Reports page loads with email analytics

**Route:** `/dashboard/reports/email-delivery`

---

## Key Metrics Overview

![Email Delivery & Stats](/img/reports/delivery&emailstats.png)

Eight key metrics provide quick insights into email performance:

### 1. Email Sent

**What it shows:**
- Total email messages sent
- Example: "255,000"
- Volume metric

**Why it matters:**
- Total email volume across campaigns
- Baseline for calculating rates
- Shows campaign activity level

---

### 2. Delivered

**What it shows:**
- Email messages successfully delivered to recipients
- Example: "234,500"
- Actual recipient reach

**Why it matters:**
- True reach metric (not all sent = delivered)
- Affected by invalid addresses, spam filters, bounces
- Key success indicator

---

### 3. Delivery Rate

**What it shows:**
- Percentage of sent emails that were delivered
- Example: "92.0%"
- Delivery success metric

**Why it matters:**
- Measures email gateway performance
- Industry standard: 95%+
- Low rates indicate data quality or deliverability issues

**How to use:**
- Below 90% = investigate customer data quality and sender reputation
- 90-95% = good but room for improvement
- Above 95% = excellent delivery performance

---

### 4. Open Rate

**What it shows:**
- Percentage of delivered emails opened/read
- Example: "5.6%"
- Message engagement metric

**Why it matters:**
- Shows how many customers saw the message
- Early indicator of subject line and timing relevance
- Varies by industry and message type

---

### 5. Click Rate

**What it shows:**
- Percentage of delivered emails with clicks
- Example: "48.2%"
- Link engagement metric

**Why it matters:**
- Measures message action appeal
- High = message resonates and drives action
- Low = message or timing issue

---

### 6. Conversion Rate

**What it shows:**
- Percentage converting to goal (purchase, signup, etc.)
- Example: "12.4%"
- Business result metric

**Why it matters:**
- Primary measure of email effectiveness
- Directly impacts ROI
- Guide for optimization efforts

---

### 7. Fulfillment Rate

**What it shows:**
- Percentage of conversions that completed fulfillment
- Example: "3.8%"
- Completion metric

**Why it matters:**
- Shows quality of conversions
- Indicates funnel completion
- Measures true business value

---

### 8. Cost Per Conversion

**What it shows:**
- Average cost to generate one conversion
- Example: "0.49"
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

## Email Delivery Funnel

![Email Delivery Funnel](/img/reports/emaildelieveryfunnel.png)

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
- Large gap between sent/delivered = delivery problem or high bounce rate
- Small converted count = low conversion rate
- Compare days to find best/worst performers

**Optimization Tips:**
- Identify highest conversion days
- Repeat messaging on those days
- Investigate low conversion days
- Test different send times

---

## Email Delivery Log

![Email Delivery Log](/img/reports/emailtable.png)

Detailed view of individual email campaign performance:

**Columns Displayed:**
- **Campaign ID** - Unique campaign identifier
- **Campaign Name** - Name of email campaign
- **Status** - Delivery status (Delivered, Pending, Failed, Bounced)
- **Sent** - Number of emails sent
- **Delivered** - Number successfully delivered
- **Conversions** - Number of conversions
- **Conversion Rate** - Percentage converting

**Status Types:**
- Delivered (green) - Successfully sent and received
- Pending (orange) - Still processing
- Failed (red) - Delivery failed
- Bounced (gray) - Bounced by recipient server

**How to Use:**

**Search Campaigns:**
1. Use search box to find by campaign name
2. Results update in real-time
3. Results shown on paginated pages

**Filter by Status:**
- Click "All Statuses" dropdown
- Filter by Delivered, Pending, Failed, or Bounced
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
- Below 85% = Problem (check data quality and sender reputation)

**Factors Affecting Delivery:**
- Customer data quality (valid/invalid addresses)
- Email gateway performance
- ISP filtering and spam detection
- Sender reputation and authentication (SPF, DKIM, DMARC)
- Timing and send rate limits

### Engagement Patterns

**Typical Open Rates:**
- 2-5% = Average
- 5-8% = Good
- 8%+ = Excellent
- Low = Consider subject line or timing

**Typical Click Rates:**
- 5-10% = Average
- 10-20% = Good
- 20%+ = Excellent
- Low = Consider link placement or message clarity

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

- Validate email addresses before send
- Test with small segment first
- Schedule around peak engagement times
- Limit daily sends to maintain sender reputation
- Use A/B testing for subject lines and content

### Optimization

- Monitor delivery rates daily
- Test different subject lines and preview text
- A/B test send times and days
- Track conversions by segment
- Monitor unsubscribe and complaint rates

### Data Quality

- Keep email addresses validated and current
- Remove hard bounces and inactive addresses
- Maintain consent records for compliance
- Regular data cleansing (quarterly minimum)
- Monitor sender reputation metrics

### Cost Management

- Monitor cost per conversion
- Allocate budget to highest-ROI segments
- Reduce sends to low-engagement groups
- Track total ROI including fulfillment costs
- Test frequency to balance engagement and cost

---

## Troubleshooting

### Low Delivery Rate

**Possible Causes:**
- Invalid or outdated email addresses
- Customer unsubscribed or marked spam
- ISP filtering or blocking
- Sender reputation issues
- Email authentication problems (SPF, DKIM, DMARC)

**Solutions:**
- Validate email addresses regularly
- Check suppression lists
- Monitor spam complaint rates
- Verify sender authentication records
- Test with different email providers

### Low Open Rate

**Possible Causes:**
- Poor subject line
- Wrong send time
- Email filtered to spam folder
- Sender name not recognized
- Irrelevant content

**Solutions:**
- Test different subject lines
- Try different send times
- Review sender reputation
- Use recognizable sender name
- Improve email personalization

### Low Click Rate

**Possible Causes:**
- Links not prominent
- Message not compelling
- Wrong audience targeting
- Too many links (diluted clicks)
- Poor mobile experience

**Solutions:**
- Improve link visibility
- Test different message copy
- Better segment targeting
- Limit to 1-2 primary calls to action
- Test mobile email rendering

### High Cost Per Conversion

**Possible Causes:**
- Low engagement rates
- Poor audience quality
- Inefficient send frequency
- Weak targeting
- High list cost

**Solutions:**
- Improve message content
- Better audience segmentation
- Optimize send frequency
- Higher value incentives
- Regular list hygiene

---

## Data Modes

### Dummy Data Mode

- Shows sample/demonstration data
- Useful for learning the interface
- Test without impacting real campaigns
- Safe for training and exploration

Enable:
- Toggle "Data Mode" button at top-right
- Select "Dummy Data" option

### Real Data Mode

- Shows actual email performance
- Real delivery metrics and conversions
- Production data from active campaigns
- Reflects current business performance

Enable:
- Toggle "Data Mode" button at top-right
- Select "Real Data" option

Important: Only real data mode shows actual customer information and conversion metrics. Always verify you are viewing the correct data mode when making business decisions.

---
