# Customer Profile Reports

## Overview

Customer Profile Reports provide deep insights into your customer base, including segmentation, lifetime value analysis, engagement patterns, and lifecycle trends. Understand your customers to drive better targeting and personalization.

## Key Metrics

### Hero Metrics

**Key Performance Indicators** at a glance:

**Customer Base**
- **Active Customers:** Engaged customers currently active
- **Total Customers:** All customers in database
- **New Customers:** Acquired in selected period
- **Churn Rate:** Percentage of customers lost (%)

**Value Metrics**
- **Average Customer Lifetime Value (CLV):** Average value per customer
- **Average Order Value (AOV):** Average transaction value
- **Purchase Frequency:** Average purchases per customer per period
- **Revenue per Customer:** Average revenue/customer

**Engagement**
- **Engagement Score:** Overall engagement (0-100)
- **Customer Satisfaction:** Satisfaction rating if available
- **Email Engagement:** Email interaction rate (%)
- **SMS Engagement:** SMS interaction rate (%)

## Customer Analytics Charts

### Value Matrix (Scatter/Bubble Chart)

**Purpose:** Visualize customer segmentation by value and recency

**Axes:**
- **X-axis:** Recency (days since last purchase)
- **Y-axis:** Value Score (0-100)
- **Bubble Size:** Number of customers in segment

**Customer Segments (Quadrants):**

1\. **Champions** (High Value, Recent)
   - Best customers
   - High lifetime value
   - Recent purchases
   - Action: Reward and retain

2\. **Loyalists** (High Value, Moderate Recency)
   - Consistent buyers
   - Good lifetime value
   - Regular purchasers
   - Action: Engage and cross-sell

3\. **At-Risk** (Good Value, Low Recency)
   - Previously good customers
   - Haven't purchased recently
   - Risk of churn
   - Action: Win-back campaign

4\. **Dormant** (Lower Value, Low Recency)
   - Haven't interacted recently
   - Lower lifetime value
   - At high churn risk
   - Action: Reactivation or remove

**Click on Bubble:**
- See customer list in segment
- View segment details
- Access segment-specific report

### Lifecycle Distribution (Stacked Bar Chart)

**Purpose:** Track customer flow through lifecycle stages

**Lifecycle Stages:**
- **New:** Newly acquired customers
- **Active:** Engaged, regular purchasers
- **At-Risk:** Declining engagement, potential churn
- **Dormant:** Inactive for extended period
- **Churned:** Lost customers
- **Reactivated:** Returned customers

**Chart Features:**
- Timeline: Track changes over months
- Stacked bars show total customer count
- Color-coded by stage
- See movement between stages

**Insights:**
- Rate of customer progression
- Churn trends
- New customer quality
- Reactivation success

### CLV Distribution (Composed Chart)

**Purpose:** Analyze customer value ranges

**CLV Ranges:**
- &lt; $250
- $250-$500
- $500-$1,000
- $1,000-$5,000
- &gt; $5,000

**Chart Components:**
- **Bars:** Number of customers per range
- **Line:** Revenue contribution (%)

**Key Insights:**
- Distribution of customer values
- Revenue concentration
- High-value customer percentage
- Potential for upsell by segment

**Pareto Analysis:**
- What % of customers generate X% of revenue
- Typical: 20% of customers = 80% of revenue

### Cohort Retention (Multi-line Chart)

**Purpose:** Track customer retention over time

**What is a Cohort?**
- Group of customers acquired in same month
- Example: "Jan 2024", "Apr 2024"

**Chart Shows:**
- Retention rate over months
- Separate line per cohort
- Track longevity of different customer groups

**Metrics Tracked:**
- Month 0: 100% (initial cohort)
- Month 1-N: Retention % (remaining customers)

**Interpretation:**
- Steeper drop = Higher churn
- Flat line = Stable retention
- Rising line = Reactivation

**Improvement:**
- Compare cohorts to see trends
- Identify which cohorts retain best
- Optimize acquisition to match best cohorts

## Customer Table

### Customer List View

Detailed table of individual customers with key metrics:

**Columns Displayed:**
- Customer name
- Customer ID
- Email address
- Phone number
- Segment/Lifecycle stage
- Lifetime Value (CLV)
- Number of orders
- Average order value
- Last purchase date
- Last interaction date
- Engagement score (0-100)
- Churn risk (0-100)
- Preferred channel
- Location/region

### Sorting & Filtering

**Sort By:**
- Name (A-Z)
- Lifetime value (high to low)
- Engagement score
- Churn risk
- Last purchase date
- Most recent first/last

**Filters:**

**Segment Filters:**
- Champions
- Loyalists
- At-Risk
- Dormant
- Churned
- Reactivated

**Value Filters:**
- High value customers (CLV &gt; X)
- Medium value
- Low value
- Top 10% by value

**Engagement Filters:**
- High engagement (&gt;75)
- Medium (25-75)
- Low (&lt;25)

**Churn Risk:**
- High risk (&gt;75)
- Medium risk (25-75)
- Low risk (&lt;25)

**Channel Preference:**
- Email
- SMS
- Push
- Multi-channel

**Location:**
- By region/city
- By country

### Search

**Find Customers:**
- Customer name
- Email address
- Phone number
- Customer ID

**Real-time Results:**
- Instant filtering
- Dropdown suggestions

### Row Actions

**Click Customer Name:**
- View detailed customer profile
- See all segments
- View purchase history
- Review communications
- See engagement timeline

**More Actions Menu:**
- View details
- Send manual communication
- Create segment from customer
- Export customer data

## Segmentation Analysis

### Automatic Segments

**System-Generated Segments:**
- High-value customers
- At-risk customers
- Loyal customers
- Dormant customers
- New customers
- Churned customers

**View Segment:**
- Click segment name
- See customer list
- View segment metrics
- Create campaigns for segment

### Custom Segments

**Create Based on Filters:**
1\. Apply filters to customer table
2\. Click **Save as Segment**
3\. Name and save segment
4\. Use in campaigns or analysis

## Date Range & Filtering

### Time Period Selection

**Quick Options:**
- Last 30 days
- Last 90 days
- Last year
- All time
- Custom range

**Impact on Metrics:**
- Hero metrics update for period
- Charts show period data
- Trends calculated for period

### Segment by Dimension

**Available Dimensions:**
- Customer lifecycle stage
- Geographic location
- Customer value tier
- Engagement level
- Channel preference
- Acquisition source

**Multi-select Filters:**
- Combine multiple filters
- Refine customer segments
- Deep analysis

## Download & Export

### Report Formats

**PDF Report:**
- Comprehensive analysis
- All charts and visualizations
- Customer summary
- Professional formatting

**CSV Export:**
- Full customer list with metrics
- All columns
- Importable to tools
- Large datasets

**Excel:**
- Multiple sheets
- Pivot-ready
- Formulas included
- Charts

### Scheduled Reports

**Email Delivery:**
1\. Click **Schedule Report**
2\. Select frequency (Weekly, Monthly)
3\. Choose metrics
4\. Set send time
5\. Add recipients
6\. Save

**Benefits:**
- Regular monitoring
- Automated delivery
- Consistent insights

## Customer Search & Insights

### Search Individual Customer

1\. Use search box at top
2\. Enter name, email, or ID
3\. Click on result
4\. View detailed profile:
   - Basic information
   - Segment membership
   - Purchase history
   - Offers/rewards
   - Communication history
   - Engagement timeline
   - Interaction events

### Customer Journey

**Timeline View:**
- All interactions chronologically
- Emails received
- Clicks and opens
- Purchases
- Segment changes
- Engagement changes

## KPIs & Benchmarks

### Key Metrics Explained

**Lifetime Value (CLV)**
- Total value customer brings over lifetime
- Used for prioritization
- Helps ROI calculations
- Benchmark: Varies by industry

**Engagement Score**
- 0-100 scale
- Based on interactions
- Email opens, clicks
- Purchase frequency
- Recency

**Churn Risk**
- 0-100 probability of leaving
- Based on behavior patterns
- Declining engagement
- Lack of recent activity
- Competitor signals

**Purchase Frequency**
- Average purchases per time period
- Shows engagement level
- Higher = more loyal
- Used for segment definitions

## Best Practices

### Customer Analysis
- Monitor at-risk customers regularly
- Identify your most valuable segments
- Track segment changes over time
- Analyze retention cohorts

### Targeting Strategy
- Focus on Champions and Loyalists
- Create win-back campaigns for At-Risk
- Reactivate Dormant customers
- Reduce churn through early action

### Personalization
- Tailor messaging by segment
- Use CLV to prioritize efforts
- Match channel to preference
- Time messages by behavior

### Monitoring
- Track engagement trends
- Monitor churn rate
- Watch new cohort retention
- Check segment migration

## Troubleshooting

### Missing Customer Data
- **"Customer not found"** - Verify customer exists in system
- **"Empty customer list"** - Check filter combinations
- **"No engagement data"** - Customer may not have interactions

### Inaccurate Metrics
- **"CLV seems wrong"** - Verify revenue data
- **"Engagement score unclear"** - Check interaction history
- **"Churn risk high"** - Review customer activity

### Performance Issues
- **"Report loads slowly"** - Filter to smaller subset
- **"Charts not rendering"** - Try different date range
- **"Export times out"** - Export smaller date range first

## Related Documentation

- [Overall Dashboard](/documentation/overall-dashboard-performance) - Platform overview
- [Campaign Reports](/documentation/campaign-reports) - Campaign analytics
- [Offer Reports](/documentation/offer-reports) - Offer performance
- [Customer Management](./documentation/customer-360/customers-list) - Customer profiles