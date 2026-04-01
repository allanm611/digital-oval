# Campaign Reports

> **Important:** The screenshots in this documentation display dummy/sample data for demonstration purposes. Each report includes a Data Mode toggle that allows you to switch between viewing dummy data and real production data. Use the toggle button at the top-right of the reports page to switch between modes. Real data will display your actual campaign metrics and performance information.

## Overview

Campaign Reports provide comprehensive performance analytics for all your campaigns. Track audience reach, delivery metrics, engagement, conversions, and revenue impact across all active and historical campaigns. Analyze performance by campaign type, objective, and time period.

## Accessing Campaign Reports

**Step 1: Navigate to Reports**
- Click **Reports** in the main navigation
- Select **Campaign Reports** option
- Reports page loads with campaign analytics

**Route:** `/dashboard/reports/campaigns`

---

## Key Metrics Overview

![Campaign Report Stats Cards](/img/reports/campaignreportstats.png)

Six key metrics provide quick insights into campaign performance:

### 1. Total Reach

**What it shows:**
- Total number of customers targeted across campaigns
- Example: "132,600"
- Trend comparison to previous period

**Why it matters:**
- Indicates total campaign volume
- Foundation for calculating rates
- Shows growth in campaign activity

---

### 2. Conversion Rate

**What it shows:**
- Percentage of reached customers who converted
- Example: "12.1%"
- Trend vs previous period

**Why it matters:**
- Primary measure of campaign effectiveness
- Directly impacts revenue
- Indicates audience alignment and offer appeal

**How to use:**
- Track trends to identify optimization opportunities
- Compare across campaign types to find best performers
- A/B test messaging to improve rates

---

### 3. Click-Through Rate (CTR)

**What it shows:**
- Percentage of reached customers who clicked
- Example: "6.4%"
- Engagement quality metric

**Why it matters:**
- Measures content relevance
- Early indicator of conversion potential
- Guides creative optimization

**How to use:**
- Low CTR = revisit messaging or targeting
- High CTR = message resonates, focus on conversion funnel
- Compare against industry benchmarks

---

### 4. Total Revenue Generated

**What it shows:**
- Total revenue from campaign conversions
- Example: "KSh 415,000"
- Revenue impact metric

**Why it matters:**
- Shows business impact
- ROI calculation basis
- Guides budget allocation

**How to use:**
- Compare against campaign spend for ROI
- Identify highest revenue-generating campaigns
- Track growth over time

---

### 5. ROAS (Return on Ad Spend)

**What it shows:**
- Ratio of revenue generated vs spend
- Example: "4.6x"
- Revenue multiplier metric

**Why it matters:**
- Key profitability metric
- Guides budget optimization
- Benchmarks campaign efficiency

**How to use:**
- ROAS > 3x = Profitable, scale up
- ROAS 2-3x = Good, monitor
- ROAS < 2x = Optimize or pause
- Compare against company target ROAS

---

### 6. Average Revenue Per Customer

**What it shows:**
- Average revenue per targeted customer
- Example: "KSh 90,000"
- Customer value metric

**Why it matters:**
- Shows customer monetization
- Helps with cost per acquisition decisions
- Indicates campaign quality

**How to use:**
- Higher = better quality audience targeting
- Lower = may need better segmentation
- Use to calculate payback periods

---

## Campaign Performance Table

![Campaign Performance Table](/img/reports/campaigntable.png)

Detailed view of individual campaign performance:

**Columns Displayed:**

- **CAMPAIGN NAME** - Name of the campaign
- **SEGMENT COUNT** - Number of customer segments targeted
- **OFFER COUNT** - Number of offers included in campaign
- **TARGET GROUP** - Number of customers in target audience
- **CONTROL GROUP** - Number of customers in control group (not targeted)
- **MESSAGES GENERATED** - Total messages created for campaign
- **SENT** - Messages successfully sent
- **DELIVERED** - Messages delivered to customers
- **CONVERSIONS** - Number of conversions from campaign
- **LAST RUN** - Date/time campaign last executed

**How to Use:**

**Search Campaigns:**
1. Use search box to find by campaign name
2. Results update in real-time
3. Results shown on paginated pages

**Sort and Filter:**
- Click column headers to sort ascending/descending
- Filter by campaign status, date range, performance
- Combine multiple filters for analysis

**Export Data:**
- Click "Download CSV" button
- Export all or filtered campaigns
- Use for external analysis or reporting

---

## Campaign Types Performance

Campaigns are categorized by type:

**Standard Campaigns**
- Single audience, single offer
- Typically highest response rates
- Used for broad promotions

**Segmented Campaigns**
- Multiple audience segments
- Different messaging per segment
- Higher personalization, better results

**Multi-Wave Campaigns**
- Multiple sends over time
- Sequences and automation
- Higher overall conversions

**Test Campaigns**
- A/B testing different approaches
- Control group comparison
- Data-driven optimization

---

## Campaign Objectives

Campaigns are aligned with business objectives:

**Acquisition**
- Metrics: Reach, Cost Per Acquisition (CPA)
- Goal: Attract new customers
- Focus: Scale and efficiency

**Retention**
- Metrics: Repeat Purchase Rate, Churn Prevention
- Goal: Keep customers buying
- Focus: Loyalty and engagement

**Engagement**
- Metrics: Click-Through Rate, Open Rate
- Goal: Build brand affinity
- Focus: Content and timing

**Revenue**
- Metrics: Revenue, ROAS, Average Order Value
- Goal: Maximize profit
- Focus: High-value customers

**Reactivation**
- Metrics: Win-back Rate, Reactivation Cost
- Goal: Re-engage lapsed customers
- Focus: Incentives and relevance

---

## Time Period Analysis

**Available Time Ranges:**
- Last 7 days (daily breakdown)
- Last 30 days (weekly breakdown)
- Last 90 days (monthly breakdown)
- Custom date range (up to 2 years)

**How to Analyze:**

**Daily View:**
- Spot-check performance after send
- Identify delivery issues quickly
- Real-time optimization

**Weekly View:**
- Aggregate performance trends
- Compare week-over-week
- Mid-term performance assessment

**Monthly View:**
- Long-term trend analysis
- Seasonal pattern identification
- Year-over-year comparison

---

## Performance Benchmarks

**Good Performance Targets:**

**Delivery Rate**
- Good: 95%+
- Excellent: 98%+

**Click-Through Rate**
- Good: 5-8%
- Excellent: 10%+

**Conversion Rate**
- Good: 5-7%
- Excellent: 10%+

**ROAS (Return on Ad Spend)**
- Good: 3-4x
- Excellent: 5x+

**Unsubscribe Rate**
- Good: <0.5%
- Excellent: <0.2%

**Note:** Benchmarks vary by industry, customer type, and offer. Compare against your historical performance and company goals.

---

## Best Practices

### Campaign Planning

- Define clear objective before launch
- Set target metrics and success criteria
- Test before full-scale deployment
- Plan multi-wave sequences for better results

### Optimization

- Monitor daily metrics for first week
- A/B test messaging, timing, and offers
- Segment audiences for personalization
- Use best performers as templates

### Audience Management

- Keep segments fresh (update weekly)
- Respect preference centers and unsubscribes
- Include control groups for testing
- Exclude recent converters to avoid waste

### Data Analysis

- Review performance weekly
- Compare against similar past campaigns
- Analyze successful vs failed campaigns
- Document learnings for future campaigns

---

## Troubleshooting

### Low Delivery Rate

**Possible Causes:**
- Invalid customer contacts (bad email/phone)
- Recipient preference violations
- ISP filtering or blacklisting
- Technical delivery issues

**Solutions:**
- Clean customer data regularly
- Verify email addresses and phone numbers
- Review seed list performance
- Check SMS gateway status

### Low Click-Through Rate

**Possible Causes:**
- Irrelevant messaging
- Poor subject line
- Timing (wrong time of day/week)
- Audience mismatch

**Solutions:**
- Test different subject lines
- Improve personalization
- Try different send times
- Better audience segmentation

### Low Conversion Rate

**Possible Causes:**
- Weak offer or incentive
- Poor landing page experience
- Technical issues
- Audience quality

**Solutions:**
- Test higher-value offers
- Optimize landing page
- Improve mobile experience
- Better audience targeting

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

- Shows actual campaign performance
- Real customer metrics and conversions
- Production data from active campaigns
- Reflects current business performance

Enable:
- Toggle "Data Mode" button at top-right
- Select "Real Data" option

Important: Only real data mode shows actual customer information and conversion metrics. Always verify you're viewing the correct data mode when making business decisions.

---

