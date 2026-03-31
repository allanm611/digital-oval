# Offer Tracking Sources

## Overview

Offer Tracking Sources define how offer performance is measured, tracked, and analyzed. They enable you to capture specific metrics related to customer interactions with your promotional offers, then use that data to understand effectiveness, measure ROI, and optimize future offers. Each tracking source captures different types of data and generates specific metrics for reporting and analytics.

## Purpose & Benefits

### Why Use Offer Tracking Sources?

**Measure Offer Effectiveness**
- Quantify how well offers perform
- Track customer responses and engagement
- Measure conversion and redemption rates
- Calculate ROI for promotional spend

**Understand Customer Behavior**
- Monitor engagement with offers
- Track usage patterns
- Identify redemption trends
- Detect churn prevention impact

**Data-Driven Decision Making**
- Use metrics to optimize offers
- Compare performance across offers
- Identify top performers
- Guide budget allocation

**Performance Analytics**
- Track multiple dimensions of performance
- Support A/B testing with metrics
- Generate actionable insights
- Build predictive models

### Key Benefits

- **Visibility:** See exactly how customers interact with offers
- **Metrics:** Capture relevant data for your business
- **Insights:** Understand what works and what doesn't
- **Optimization:** Use data to improve future offers
- **ROI:** Measure the financial impact of offers

---

## Tracking Source Types

Offer Tracking Sources come in six types, each designed to capture different aspects of offer performance:

### Recharge Tracking

**Description:** Tracks customer recharge activities and payment transactions

**Metrics Captured:**
- Transaction amount
- Transaction timestamp
- Payment method (credit card, mobile money, etc.)
- Recharge channel (web, app, USSD, etc.)
- Customer ID

**Metrics Displayed:**
- Conversions (number of recharges)
- Conversion rate (% of offer recipients who recharged)
- Average recharge amount
- Revenue generated from offer
- Revenue per customer

**Use Cases:**
- Track revenue impact of prepaid offers
- Measure recharge offer effectiveness
- Monitor payment method preferences
- Analyze recharge frequency by offer

**Examples:**
- "Track $5 recharge offer conversion"
- "Monitor recharge amount for voucher offers"
- "Measure revenue impact of bonus recharge offers"

---

### Usage Metric Tracking

**Description:** Tracks customer consumption and usage patterns

**Metrics Captured:**
- Data volume consumed (MB/GB)
- Voice minutes used
- SMS sent/received count
- Usage timestamp
- Service type (data, voice, SMS)
- Customer ID

**Metrics Displayed:**
- Active users (customers who used the service)
- Activation rate (% who activated the offer)
- Average usage (data GB, minutes, SMS count)
- Revenue from usage
- Customer lifetime value impact

**Use Cases:**
- Track data plan offer activation
- Monitor voice bundle usage
- Measure SMS package utilization
- Understand engagement with combo offers

**Examples:**
- "Track data consumption for 5GB offer"
- "Monitor voice minutes usage for calling plan"
- "Measure SMS utilization for unlimited SMS package"

---

### Engagement Tracking

**Description:** Tracks customer engagement with offer communications

**Metrics Captured:**
- Message delivery status
- Message open status
- Link click status
- Interaction timestamp
- Communication channel (email, SMS, app)
- Customer ID

**Metrics Displayed:**
- Delivery rate (% delivered)
- Open rate (% opened)
- Click-through rate (% clicked)
- Engagement score
- Click correlation to conversions

**Use Cases:**
- Measure email offer announcement effectiveness
- Track SMS offer engagement
- Monitor push notification response
- Analyze which channels drive engagement

**Examples:**
- "Track open rate of offer email campaigns"
- "Monitor SMS offer click-through rate"
- "Measure engagement with push notification offers"

---

### Redemption Tracking

**Description:** Tracks customer redemption and discount utilization

**Metrics Captured:**
- Redemption status (redeemed yes/no)
- Redemption date
- Discount amount or percentage used
- Redemption channel (online, in-store, mobile)
- Customer ID

**Metrics Displayed:**
- Redemption count (total redemptions)
- Redemption rate (% of offers redeemed)
- Average discount utilized
- Cost per redemption
- Total discount cost

**Use Cases:**
- Track discount voucher redemption
- Monitor coupon utilization
- Measure bundle offer adoption
- Analyze redemption channel preferences

**Examples:**
- "Track redemption rate of 20% discount coupon"
- "Monitor which customers redeemed bonus offers"
- "Measure cost of discount redemptions"

---

### Churn Prevention Tracking

**Description:** Tracks impact of offers on customer retention

**Metrics Captured:**
- Last activity date
- Days inactive (inactivity period)
- Subscriber status (active, inactive, at-risk)
- Retention period (time customer was retained)
- Customer ID

**Metrics Displayed:**
- Customers retained (count)
- Retention rate (% prevented from churning)
- Churn prevention score
- Lifetime value impact
- Cost per retained customer

**Use Cases:**
- Measure win-back offer effectiveness
- Track retention offer impact
- Monitor at-risk customer engagement
- Calculate lifetime value preservation

**Examples:**
- "Track retention impact of 50% discount win-back offer"
- "Monitor how many at-risk customers returned with bonus offer"
- "Measure lifetime value increase from retention offers"

---

### Custom Tracking

**Description:** User-defined tracking for specific business needs

**Metrics Captured:**
- User-defined parameters
- Custom data fields
- Custom calculations
- Business-specific metrics

**Metrics Displayed:**
- Custom metrics as defined
- Custom dimensions
- Custom calculations
- Business KPIs

**Use Cases:**
- Track business-specific metrics
- Monitor unique success criteria
- Implement custom calculation logic
- Capture proprietary data

**Examples:**
- "Track cross-sell rate of product bundle offers"
- "Monitor new customer acquisition via offer"
- "Measure brand lift from promotional campaign"

---

## Tracking Rules

Tracking sources can have multiple **Tracking Rules** that define specific conditions for data capture:

### Rule Components

**Rule Name**
- Descriptive identifier for the rule
- Example: "High-Value Recharge"

**Priority**
- Execution order (lower number = higher priority)
- Determines which rule evaluates first
- All enabled rules are evaluated

**Parameter**
- Data field to evaluate
- Examples: "Amount", "Data_Volume", "Time_Period"
- Must match captured data fields

**Condition**
- Operator to apply to parameter
- Options: equals, greater_than, less_than, contains, is_any_of
- Defines the matching logic

**Value**
- Value to compare against parameter
- Examples: "1000", "500MB", "7 days"
- Type depends on parameter

**Enabled**
- Whether rule is active
- Can toggle individual rules on/off
- Disabled rules don't capture data

### Rule Examples

**Example 1: High-Value Recharge**
- Parameter: Amount
- Condition: greater_than
- Value: 1000
- Captures: All recharges > 1000

**Example 2: Data Heavy User**
- Parameter: Data_Volume
- Condition: greater_than
- Value: 500
- Captures: Customers using > 500MB

**Example 3: Early Activators**
- Parameter: Time_Period
- Condition: less_than
- Value: 7
- Captures: Customers activating within 7 days

### Adding Tracking Rules

**Step 1: Open Rule Creation**
- In offer tracking step, click "Add Rule"
- Rule creation modal opens

**Step 2: Configure Rule**
- Enter rule name (e.g., "High-Value Conversion")
- Set priority (numeric value)
- Select parameter from dropdown
- Select condition (equals, greater_than, etc.)
- Enter value to compare against

**Step 3: Save Rule**
- Click "Save Rule"
- Rule is added to tracking source
- Toggle enabled/disabled as needed
- Can edit or delete later

---

## Using Tracking Sources in Offers

### Attaching Tracking Sources to Offers

When creating or editing an offer, the **Offer Tracking Step** allows you to:

**1. Select Tracking Sources**
- Choose from pre-configured tracking sources
- Create new custom tracking sources
- Select multiple sources per offer
- Mark one as default (optional)

**2. Add Tracking Rules**
- Define conditions for data capture
- Add multiple rules to same source
- Set priority for rule evaluation
- Enable/disable individual rules

**3. Configure Metrics**
- System shows available metrics per source
- Metrics appear in offer analytics
- Choose which metrics to report
- Organize metrics for dashboard display

### Offer Tracking in Campaign Creation

When using offers in campaigns:

**1. Offer Selection**
- Choose offer with configured tracking
- Tracking sources automatically apply
- Rules activate when offer is live

**2. Tracking Data Collection**
- System captures data per defined sources
- Rules are evaluated against incoming data
- Metrics are aggregated per lookback period
- Data feeds into analytics and reporting

**3. Performance Monitoring**
- View metrics in offer analytics
- Compare performance across offers
- Measure conversion by tracking source
- Optimize based on data insights

---

## Lookback Periods

Tracking sources support different time windows for data aggregation:

### Available Lookback Periods

**24 Hours**
- Last 24 hours of data
- Real-time or near-real-time metrics
- Suitable for rapid optimization
- Short-term trend analysis

**7 Days**
- Last 7 days of data
- Weekly performance snapshots
- Account for weekly variations
- Short-term campaign evaluation

**30 Days**
- Last 30 days of data
- Monthly performance review
- Account for seasonal variations
- Standard reporting period

**90 Days**
- Last 90 days of data
- Quarterly analysis
- Long-term trend identification
- Comprehensive performance view

**Custom Date**
- User-specified date range
- Specific period analysis
- Campaign-specific lookback
- Custom reporting needs

### Choosing Lookback Period

- **Fast Optimization:** Use 24h for rapid testing
- **Weekly Reports:** Use 7d for regular reviews
- **Standard Analysis:** Use 30d for typical reports
- **Strategic Planning:** Use 90d for long-term planning
- **Specific Needs:** Use custom for unique requirements

---

## Analytics & Reporting

### Available Metrics by Type

**Recharge Tracking Metrics:**
- Conversions: Number of recharges
- Conversion Rate: % of offer recipients who recharged
- Average Recharge Amount: Mean recharge value
- Revenue Generated: Total revenue from recharges
- Revenue per Customer: Avg revenue per person

**Usage Metric Tracking Metrics:**
- Active Users: Count of customers who used service
- Activation Rate: % of offer recipients who activated
- Average Usage: Mean consumption (GB, minutes, SMS)
- Revenue from Usage: Revenue generated from usage
- Customer Lifetime Value Impact: Change in CLV

**Engagement Tracking Metrics:**
- Delivery Rate: % of offers delivered
- Open Rate: % of customers who opened
- Click-through Rate: % of customers who clicked
- Engagement Score: Composite engagement metric
- Conversion Correlation: Link between engagement and conversion

**Redemption Tracking Metrics:**
- Redemption Count: Total number of redemptions
- Redemption Rate: % of offers redeemed
- Average Discount Utilized: Mean discount value
- Cost per Redemption: Avg cost per redeemed offer
- Total Discount Cost: Total cost of redemptions

**Churn Prevention Tracking Metrics:**
- Customers Retained: Count of retained customers
- Retention Rate: % prevented from churning
- Churn Prevention Score: Composite retention metric
- Lifetime Value Impact: Change in CLV from retention
- Cost per Retained Customer: Avg cost per retention

### Viewing Metrics

Metrics are available in:
- **Offer Analytics Dashboard:** Real-time performance view
- **Offer Reports:** Comprehensive analysis documents
- **Campaign Reports:** Campaign-specific performance
- **Custom Reports:** User-defined metric reports
- **Export:** Metrics available for export to Excel/CSV

---

## Best Practices

### Tracking Source Selection

**Match Type to Offer**
- Data offers → Usage Metric tracking
- Recharge-based → Recharge tracking
- Discount offers → Redemption tracking
- Win-back campaigns → Churn Prevention tracking

**Multiple Sources**
- Use multiple tracking sources per offer
- Capture different performance dimensions
- Enable comprehensive analysis
- Don't over-complicate with too many sources

**Default Tracking**
- Mark primary tracking source as default
- Use for main reporting metric
- Other sources provide supplementary data
- Keep focused on primary KPI

### Rule Configuration

**Clear Rule Names**
- Use descriptive rule names
- Document rule intent
- Make rules easy to understand
- Enable better tracking organization

**Prioritize Rules**
- Set appropriate priority numbers
- Lower = higher priority
- Critical rules first
- Secondary analysis rules later

**Enable/Disable Smartly**
- Keep all relevant rules enabled
- Disable obsolete rules
- Use enabled/disabled toggles for testing
- Document why rules are disabled

### Lookback Period Selection

**Optimize for Frequency**
- Daily campaigns → 24h lookback
- Weekly promotions → 7d lookback
- Monthly campaigns → 30d lookback
- Quarterly analysis → 90d lookback

**Balance Detail vs Trend**
- Shorter periods: More detail, less trend
- Longer periods: Less detail, more trend
- Consider business cycle
- Align with decision frequency

---

## Common Use Cases

### Use Case 1: Recharge Offer Optimization

**Scenario:** Telecom company testing recharge incentives

**Tracking Strategy:**
- Use Recharge tracking source
- Add rule: Amount > 1000
- Rule: Conversion within 24h
- Lookback: 7 days

**Metrics Monitored:**
- Conversion rate (% who recharged)
- Average recharge amount
- Revenue generated per offer
- Cost per recharge

**Optimization:**
- Compare conversion rates across offer amounts
- Identify optimal recharge threshold
- Scale best performing offer
- Eliminate underperformers

---

### Use Case 2: Data Plan Engagement

**Scenario:** Monitor engagement with data plan offers

**Tracking Strategy:**
- Use Usage Metric tracking
- Add rule: Data Volume > 500MB
- Rule: Activated within 7 days
- Lookback: 30 days

**Metrics Monitored:**
- Activation rate (% who used data)
- Average usage volume
- Activation within timeframe
- Revenue from usage

**Optimization:**
- Identify high-engagement segments
- Focus offers on likely activators
- Adjust data quotas based on usage
- Improve plan matching

---

### Use Case 3: Churn Prevention Campaign

**Scenario:** Win-back campaign to prevent customer churn

**Tracking Strategy:**
- Use Churn Prevention tracking
- Add rule: Days Inactive > 60
- Rule: Reactivation within 30 days
- Lookback: 90 days

**Metrics Monitored:**
- Retention rate (% brought back)
- Cost per retained customer
- Lifetime value impact
- Retention period achieved

**Optimization:**
- Measure win-back offer effectiveness
- Identify most effective retention offers
- Calculate true ROI of retention
- Refine targeting of at-risk customers

---

### Use Case 4: Multi-Source Offer Analysis

**Scenario:** Complex offer with multiple performance dimensions

**Tracking Strategy:**
- Recharge Tracking (primary KPI)
- Usage Metric Tracking (secondary)
- Engagement Tracking (diagnostic)
- Redemption Tracking (if applicable)

**Metrics Monitored:**
- Conversion (recharge)
- Activation (usage)
- Engagement (opens/clicks)
- Redemption (if applicable)

**Optimization:**
- Holistic offer assessment
- Understand full customer journey
- Identify conversion bottlenecks
- Optimize multi-step performance

---

## Troubleshooting

### No Data Being Captured

**Issue:** Tracking rules not capturing any data
- **Cause:** Rules may be too restrictive, data source not active, timing issue
- **Solution:** Review rule conditions and values
- **Check:** Verify data source is enabled and receiving data
- **Alternative:** Loosen rule conditions temporarily to test
- **Adjust:** Refine rules after confirming data flow

### Metrics Not Displaying

**Issue:** Tracked data exists but metrics don't show in reports
- **Cause:** Metrics not enabled, lookback period has no data, display configuration issue
- **Solution:** Verify metric selection is enabled
- **Check:** Confirm lookback period overlaps with data collection
- **Verify:** Confirm at least one rule has evaluated true
- **Alternative:** Try different lookback period to test

### Unexpected Metric Values

**Issue:** Metrics seem incorrect or unusual
- **Cause:** Rule logic error, data quality issue, misconfigured condition
- **Solution:** Review rule parameters and conditions
- **Check:** Verify value format matches parameter type
- **Validate:** Spot-check raw data against metric
- **Audit:** Review rule priority and enablement status

### Rule Not Evaluating

**Issue:** Rule doesn't capture expected data
- **Cause:** Rule disabled, priority causes skipping, condition never matches data
- **Solution:** Verify rule is enabled
- **Check:** Test rule condition against actual data values
- **Adjust:** Modify condition or value to match data
- **Priority:** Verify rule priority allows evaluation

---

## Related Documentation

- [Offer Management](./documentation/offers/offer-list) - Creating offers with tracking
- [Offer Reports](./documentation/analytics/offer-reports) - Viewing tracked metrics
- [Campaign Performance](./documentation/analytics/campaign-reports) - Campaign-level tracking
- [Offer Types](/documentation/offer-types) - Offer categorization and classification
