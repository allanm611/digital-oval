# Delivery SMS Reports

## Overview

SMS Delivery Reports track the performance and health of your SMS messaging channel. Monitor delivery rates, bounce rates, and SMS-specific metrics to optimize text message campaigns.

## Key Metrics

### Hero Metrics

**SMS Performance Overview:**

**Delivery Statistics**
- **Total Messages:** SMS sent in period
- **Successfully Delivered:** Messages reaching recipient
- **Failed Delivery:** Bounce or failure
- **Delivery Rate:** % successfully delivered

**Engagement**
- **Replied:** Customers responding via SMS
- **Reply Rate:** % of delivered SMS getting reply
- **Clicked Links:** SMS with clicks
- **Click Rate:** % engagement rate

**Quality**
- **Bounce Rate:** % bouncing
- **Opt-out Rate:** % unsubscribing
- **Complaint Rate:** % marking as spam
- **Carrier Delay Rate:** % experiencing delays

### SMS Routes Performance

**Route Comparison:** Provider/gateway comparison

**Per Route:**
- Messages sent
- Delivery rate
- Success rate
- Average delivery time
- Cost per message
- Quality score

**Optimization:**
- Best performing route
- Failover routes
- Cost efficiency

## SMS Delivery Charts

### Delivery Status Breakdown

**Pie Chart:** Message status distribution

**Statuses:**
- Delivered (%)
- Bounced (%)
- Failed (%)
- Pending (%)
- Rejected (%)
- Expired (%)

**Click Status:**
- See list of messages
- View reasons
- Identify patterns

### Delivery Trend

**Line Chart:** Delivery performance over time

**Tracks:**
- Delivery rate trend
- Bounce rate trend
- Reply rate trend
- Quality score trend

**Period Options:**
- Daily (7 days)
- Weekly (30 days)
- Monthly (90 days)

### Carrier Breakdown

**Bar Chart:** Performance by carrier

**Carriers:**
- Carrier A (Safaricom, etc.)
- Carrier B
- Carrier C
- etc.

**Metrics:**
- Messages per carrier
- Delivery rate
- Bounce rate
- Avg delay

### Time Performance

**Heatmap:** Delivery by time of day

**Shows:**
- Delivery success by hour
- Best times to send
- Slowest periods
- Carrier patterns

## SMS Message Table

### Detailed Message Log

**Columns:**
- Message ID
- Recipient phone
- Route/Provider
- Content preview
- Status
- Sent time
- Delivered time
- Delay (seconds)
- Bounce reason (if failed)
- Created date

### Filtering & Sorting

**Sort By:**
- Sent time (newest first)
- Delivery time
- Status
- Route

**Filters:**
- **Status:** Delivered, Bounced, Failed, Pending
- **Route:** By SMS provider
- **Date Range:** Sent dates
- **Reason:** Bounce/failure reason

### Search

**Find Messages:**
- By phone number
- By message ID
- By content keywords
- By date range

## Bounce & Failure Analysis

### Bounce Types

**Reasons for Bounce:**
- **Invalid Number:** Bad phone format
- **Number Not in Service:** Disconnected
- **Carrier Rejection:** Provider blocked
- **Short Code Issue:** Invalid short code
- **Timeout:** Message expired
- **Other:** Various reasons

**Actions:**
- List all bounced numbers
- Export for cleanup
- Identify patterns
- Reduce bounce rate

### Quality Issues

**Common Problems:**
- High bounce rate
- Slow delivery
- Carrier blocking
- DLR (Delivery Receipt) issues

**Solutions:**
- Verify phone numbers
- Change SMS route
- Adjust timing
- Review content for compliance

## Route Management

### Route Performance

**Per SMS Route:**
- Total messages
- Delivery rate (%)
- Bounce rate (%)
- Cost per message
- Avg delivery time
- Reliability score

### Route Comparison

**Compare Routes:**
- Which route performs best
- Cost analysis
- Reliability ranking
- Load distribution

**Recommendations:**
- Primary route
- Backup route
- Failover settings

## Date Range & Filtering

### Time Period

**Quick Options:**
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

### Segment Filters

**Filter By:**
- SMS route/provider
- Message status
- Bounce reason
- Carrier
- Time range

## Download & Export

### Report Formats
- PDF report
- CSV message log
- Excel analysis
- PNG charts

### Scheduled Reports
- Weekly delivery summary
- Daily issue alerts
- Monthly performance review

## KPIs & Metrics Explained

**Delivery Rate** - % of messages reaching recipient
- Formula: Delivered / Sent × 100
- Target: &gt;95%
- Benchmark: 98-99.5%

**Bounce Rate** - % of messages bouncing
- Formula: Bounced / Sent × 100
- Target: &lt;5%
- Benchmark: 0.5-2%

**Reply Rate** - % of recipients replying
- Formula: Replies / Delivered × 100
- Target: Varies by message type
- Benchmark: 5-15%

## Best Practices

### Campaign Optimization
- Monitor delivery rates
- Maintain clean phone list
- Validate numbers before send
- Review bounce reasons

### Route Management
- Use reliable primary route
- Configure failover route
- Load balance traffic
- Monitor route health

### Quality Assurance
- Keep bounce rate &lt;5%
- Monitor delivery time
- Track carrier issues
- Maintain compliance

### Monitoring
- Daily delivery checks
- Weekly performance review
- Track trend changes
- Alert on issues

## Troubleshooting

### High Bounce Rate
- **Cause:** Invalid numbers, service changes
- **Solution:** Clean phone list, validate numbers
- **Prevention:** Validation at import

### Slow Delivery
- **Cause:** Route congestion, carrier delay
- **Solution:** Change route, off-peak sending
- **Prevention:** Monitor and adjust

### Delivery Failures
- **Cause:** Various (see bounce reasons)
- **Solution:** Depends on reason
- **Prevention:** Address root cause

