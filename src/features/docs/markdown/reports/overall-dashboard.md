# Overall Dashboard

> **Important:** The screenshots in this documentation display dummy/sample data for demonstration purposes. Each report includes a Data Mode toggle that allows you to switch between viewing dummy data and real production data. Use the toggle button at the top-right of the dashboard to switch between modes. Real data will display your actual campaign metrics and customer information.

## Overview

The Overall Dashboard provides a comprehensive view of all communication performance across your entire platform. View key metrics, channel performance, delivery rates, and trends across all campaigns, offers, and customer communications in one centralized location.

## Accessing the Overall Dashboard

**Step 1: Navigate to Reports**
- Click **Reports** in the main navigation
- Select **Overall Dashboard** option
- Dashboard loads with performance metrics

**Route:** `/dashboard/overall-performance`

---

## Dashboard Sections

### Time Range Selection

At the top of the dashboard:

**Quick Range Options:**
- **Daily** - Last 7 days (shows daily breakdown)
- **Weekly** - Last 30 days (shows weekly breakdown)
- **Monthly** - Last 90 days (shows monthly breakdown)

**Custom Range:**
- Set custom start and end dates
- Click "Run" to apply custom date range
- Supports up to 2 years of historical data

---

## Channel Performance Snapshot

![Channel Performance Snapshot](/img/reports/channelperformnaceoverolldash.png)

Quick overview of your selected channel's key metrics:

**SMS or Email Tab:**
- Toggle between SMS and Email channels at the top
- Shows the most important metrics for that channel

**Key Metrics Displayed:**

- **[Channel] Sent** - Total messages sent through this channel
  - Example: "SMS Sent: 86,900"
  - Shows total message volume

- **Delivered** - Messages successfully delivered to recipients
  - Example: "82,000"
  - Indicates successful delivery count

- **Delivery Rate** - Percentage of sent messages delivered
  - Example: "94.4%"
  - Higher is better (aim for 90%+)

- **Fulfilled** - Messages that resulted in intended action
  - Example: "77,080"
  - Varies by campaign type

- **Converted** - Messages that led to conversions/sales
  - Example: "6,561"
  - Key success metric

- **Conversion Rate** - Percentage converting to desired action
  - Example: "8.5%"
  - Tracks campaign effectiveness

---

## Performance by Channel

![Performance by Channel](/img/reports/performancebychanneloverolldash.png)

Compare performance across SMS, Email, Push, and Social channels:

**Channel Tabs:**
- **All Channels** - Combined metrics (default)
- **SMS** - SMS channel only
- **Email** - Email channel only
- **Push** - Push notification metrics
- **Social** - Social media metrics

**Metrics Shown:**

- **CTR (%)** - Click-Through Rate (dark teal line)
  - Percentage of recipients who clicked
  - Tracks engagement quality

- **CVR (%)** - Conversion Rate (purple line)
  - Percentage converting to goal
  - Key business metric

- **Clicks** - Total number of clicks (cyan bars)
  - Raw click count
  - Volume metric

- **Conversions** - Total conversions/sales (gray bars)
  - Goal completions
  - Business impact metric

**How to Use:**
1. Select a channel from tabs
2. Review the combined metrics for that channel
3. Compare rates (lines) vs volume (bars)
4. Identify best-performing channels

---

## SMS Delivery Performance

![SMS Delivery Performance](/img/reports/smsdeliveryoverolldash.png)

Detailed tracking of SMS delivery metrics over time:

**Breakdown by Time Period:**
- Each day (7-day view)
- Each week (30-day view)
- Each month (90-day view)

**Metrics Tracked:**

- **Sent** - Total SMS messages sent (cyan bars)
  - Full volume of messages
  - Largest metric typically

- **Delivered** - Messages successfully delivered (gray bars)
  - Actual reach to customers
  - Usually 90%+ of sent

- **Converted** - Messages with conversions (dark blue line/bars)
  - Messages that led to action
  - Smallest metric

**What This Tells You:**
- Track SMS delivery consistency over time
- Identify days with higher/lower delivery rates
- Monitor conversion trends
- Spot delivery issues on specific days

---

## Performance Trends Over Time

![Performance Trends Over Time](/img/reports/trendsovertimeoveroll.png)

Track overall business metrics and trends across your selected time period:

**Metrics Displayed:**

- **Users** - Total customer reach (cyan bars)
  - Number of unique customers targeted
  - Daily/weekly/monthly totals

- **Clicks** - Total clicks across all channels (gray bars)
  - Engagement metric
  - Shows interaction volume

- **Conversions** - Total conversions achieved (dark blue bars)
  - Goal completions
  - Primary business metric

- **Revenue** - Total revenue generated (purple line)
  - In your configured currency
  - Tracks business impact

**How to Read:**
1. Bars show volume (users, clicks, conversions)
2. Purple line shows revenue trend
3. Look for patterns and peaks
4. Identify best-performing periods

**Using for Decision-Making:**
- Spot seasonal trends (high/low periods)
- Identify campaign impact on revenue
- Plan future campaigns based on historical data
- Track improvements over time

---

## Data Mode

**Toggle Data Mode:**
- Switch between live data and sample/test data
- "Data Mode" toggle in top-right corner
- Use sample data for testing and training

---

## Date Range Management

### Quick Ranges

- **Daily** - Shows 7 days of data
- **Weekly** - Shows 30 days of data grouped by week
- **Monthly** - Shows 90 days of data grouped by month

### Custom Dates

1. Click the date input fields
2. Select start date (minimum: 2 years ago)
3. Select end date (maximum: today)
4. Click **Run** to apply
5. Data recalculates for your custom range

**Date Constraints:**
- Maximum 2 years of historical data available
- End date cannot be in the future
- Custom dates override quick range selection

---

## Interpreting Dashboard Metrics

### Delivery Metrics

- **Delivery Rate** - Measure of successful message delivery
  - 95%+ = Excellent (very few failures)
  - 90-95% = Good
  - <90% = Investigate issues

### Engagement Metrics

- **Click-Through Rate (CTR)** - Quality of message content
  - 5-10% = Average
  - 10-15% = Good
  - 15%+ = Excellent

### Conversion Metrics

- **Conversion Rate (CVR)** - Effectiveness of campaign
  - 5-7% = Average
  - 7-10% = Good
  - 10%+ = Excellent

### Business Metrics

- **Revenue** - Direct business impact
  - Highest metric = Best ROI
  - Use to compare channels and campaigns
  - Track growth over time

---

## Best Practices

### Regular Monitoring

- Check dashboard daily for critical campaigns
- Review weekly trends for patterns
- Compare month-over-month performance
- Track seasonal variations

### Channel Optimization

- Compare channel performance regularly
- Identify top and bottom performers
- A/B test between channels
- Allocate budget to best channels

### Troubleshooting

- Sudden delivery drop? Check SMS routes and email configuration
- Low conversion rate? Review message content and audience targeting
- High cost per conversion? Adjust audience targeting or offer value

### Performance Goals

- Set target delivery rates (aim for 95%+)
- Define conversion targets based on industry
- Track revenue growth month-over-month
- Monitor CTR for content quality

---

## Limitations

- Data updates with a slight delay (typically 5-15 minutes)
- Historical data retained for 2 years
- Custom ranges work best with 7-90 days of data
- Sample data mode may not reflect real-time conditions

---

