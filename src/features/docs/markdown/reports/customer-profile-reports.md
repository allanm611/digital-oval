# Customer Profile Reports

> **Important:** The screenshots in this documentation display dummy/sample data for demonstration purposes. Each report includes a Data Mode toggle that allows you to switch between viewing dummy data and real production data. Use the toggle button at the top-right of the reports page to switch between modes. Real data will display your actual customer metrics and segmentation information.

## Overview

Customer Profile Reports provide deep insights into your customer base, including segmentation, lifetime value, engagement metrics, and lifecycle trends. Analyze customer behavior patterns, identify high-value segments, and understand churn and retention dynamics.

## Accessing Customer Profile Reports

**Step 1: Navigate to Reports**
- Click **Reports** in the main navigation
- Select **Customer Profile Reports** option
- Reports page loads with customer analytics

**Route:** `/dashboard/reports/customer-profile`

---

## Key Metrics Overview

![Customer Profile Stat Cards](/img/reports/customerprofilestatcards.png)

Six key metrics provide a quick snapshot of your customer health:

### 1. Active Customers

**What it shows:**
- Total number of active customers in your base
- Example: "1,284,200"
- Trend comparison to previous period

**Why it matters:**
- Overall customer base growth indicator
- Foundation metric for all other calculations
- Key business health indicator

---

### 2. Average Customer Lifetime Value (CLV)

**What it shows:**
- Average revenue expected from a customer over lifetime
- Example: "KSh 1,540"
- Trend vs previous quarter

**Why it matters:**
- Determines budget for customer acquisition
- Identifies most valuable customer segments
- Guides investment in retention

**How to use:**
- Higher CLV = worth investing more to acquire and retain
- Compare against customer acquisition cost
- Track trends to see if customers becoming more valuable

---

### 3. Average Transaction Value

**What it shows:**
- Average revenue per transaction/purchase
- Example: "KSh 128"
- Trend vs previous period

**Why it matters:**
- Indicates purchase behavior and spending patterns
- Helps with inventory and fulfillment planning
- Guides pricing strategy

**How to use:**
- Increasing = customers buying more expensive items
- Decreasing = shift to lower-price products
- Use for upsell/cross-sell targeting

---

### 4. Purchase Frequency

**What it shows:**
- How often customers buy on average (per year)
- Example: "3.4 / yr"
- Year-over-year trend

**Why it matters:**
- Shows customer loyalty and engagement
- Predicts revenue stability
- Identifies habits and cycles

**How to use:**
- Higher frequency = better retention
- Seasonal products = lower frequency expected
- Target low-frequency segments for engagement

---

### 5. Engagement Score

**What it shows:**
- Composite score (0-100) of customer engagement
- Example: "72 / 100"
- Trend vs last 30 days

**Why it matters:**
- Combines multiple engagement signals
- Predicts likelihood of future purchases
- Identifies at-risk vs high-engagement customers

**Score Interpretation:**
- 80-100 = Highly engaged, active customers
- 60-80 = Good engagement, stable base
- 40-60 = Declining engagement, at-risk
- 0-40 = Dormant, churn risk

---

### 6. Churn Rate

**What it shows:**
- Percentage of customers becoming inactive
- Example: "8.3%"
- Trend vs previous quarter

**Why it matters:**
- Critical retention metric
- Indicates customer satisfaction
- Drives acquisition need

**How to use:**
- Rising churn = investigate satisfaction issues
- Industry benchmark varies by sector (2-10% typical)
- Focus retention efforts on high-churn segments

---

## Customer Detail Table

![Customer Detail Table](/img/reports/customertable.png)

View and analyze individual customer records:

**Accessible from:**
- Customer Profile Reports page
- Detailed table with all customer data
- Searchable and filterable

**Columns Displayed:**

- **CUSTOMER_ID** - Unique customer identifier
- **SUBSCRIPTION** - Active subscription type/status
- **NAME** - Customer name (first + last)
- **REGION** - Geographic region/territory
- **LIFECYCLE_STAGE** - Current stage (New, Active, At-Risk, Churned, Reactivated)
- **EMAIL** - Contact email address
- **CITY** - City of residence
- **TOTAL_TRANSACTIONS** - Lifetime transaction count
- **TOTAL_SPENT** - Total lifetime revenue
- **ACTIONS** - Available actions (view, edit, etc.)

**How to Use:**

**Search Customers:**
1. Use search box to find by name, email, or ID
2. Results update in real-time
3. Results shown on paginated pages

**Filter and Sort:**
- Click column headers to sort A-Z or numerically
- Filter by lifecycle stage, region, subscription type
- Combine multiple filters for targeted analysis

**Export Data:**
- Download entire table or filtered results
- Export format: CSV
- Use for external analysis or CRM sync

---

## Customer Segmentation

Customers are automatically segmented based on:

**RFM Analysis (Recency, Frequency, Monetary):**

- **Champions** - Recent, frequent, high-value (best customers)
- **Loyalists** - Active, high lifetime value
- **Potential Loyalists** - New customers showing promise
- **At-Risk** - Declining activity, may churn soon
- **Churned** - Inactive, no recent transactions
- **Reactivated** - Recently returned customers

**Lifecycle Stages:**

- **New** - Customer acquired in recent period
- **Active** - Regular purchasing, engaged
- **At-Risk** - Declining activity, engagement dropping
- **Dormant** - No activity for extended period
- **Churned** - Inactive, likely lost
- **Reactivated** - Returned after dormancy/churn

---

## Time Range Selection

**Quick Range Options:**
- **Daily** - Last 7 days
- **Weekly** - Last 30 days
- **Monthly** - Last 90 days

**Custom Range:**
- Set specific start and end dates
- Supports up to 2 years of historical data
- Click "Run" to apply

---

## Analysis Charts

### Customer Value Matrix & CLV Distribution

![Customer Value Matrix & Customer Lifetime Value Distribution](/img/reports/matrix&lifetimedistribution.png)

Two complementary charts for understanding customer value:

**Left: Customer Value Matrix**
- Distribution of customers by value score
- Bar chart showing customer segments
- Identify where most value is concentrated
- Helps with targeting and resource allocation

**Right: Customer Lifetime Value Distribution**
- Curve showing CLV distribution across customer base
- Line chart showing concentration pattern
- Identify if value is concentrated or spread
- Plan pricing and retention strategies accordingly

**How to Use:**
- If value concentrated in few customers: focus on retention of top tier
- If value spread across many: maintain broad customer base
- Compare month-over-month to see if distribution changing

---

### Lifecycle Distribution

![Lifecycle Distribution Chart](/img/reports/lifecycledistribution.png)

Track how customers move through different lifecycle stages over time:

**Stages Shown:**
- **New** (cyan) - Recently acquired customers
- **Active** (purple) - Engaged, regularly purchasing
- **At-Risk** (blue) - Declining activity, may churn
- **Dormant** (gray) - No recent activity
- **Churned** (orange) - Inactive, likely lost
- **Reactivated** (yellow) - Returned after dormancy

**What to Look For:**
- Rising Active = healthy customer base
- Rising At-Risk = engagement declining, intervention needed
- Rising Churned = retention problem
- Rising Reactivated = successful win-back campaigns

**How to Use:**
- Monitor month-over-month movement
- Identify which stages growing/shrinking
- Set goals for lifecycle stage distribution
- Plan interventions for at-risk and dormant customers

---

### Cohort Retention

**Cohort Analysis Shows:**
- Customer retention by acquisition cohort
- Which acquisition periods have best retention
- Lifetime value growth by cohort
- Effectiveness of customer onboarding

**Use For:**
- Identify best-performing acquisition periods
- Measure impact of onboarding improvements
- Compare retention across seasons
- Forecast long-term customer value

---

## Best Practices

### Regular Analysis

- Review weekly for trends
- Compare month-over-month performance
- Track segmentation changes over quarters
- Monitor churn indicators early

### Customer Targeting

- Use CLV to prioritize customer retention spend
- Target at-risk customers with special offers
- Invest more in champions and loyalists
- Create win-back campaigns for churned customers

### Optimization

- Test engagement strategies on potential loyalists
- A/B test offers for different lifecycle stages
- Monitor frequency as sign of satisfaction
- Use churn predictors to intervene early

### Data Quality

- Verify customer data accuracy regularly
- Ensure transactions properly recorded
- Check for duplicate records
- Validate email/contact information

---

## Interpreting Trends

### Positive Signals

- Rising active customer count
- Increasing CLV (customers spending more)
- Higher purchase frequency
- Increasing engagement scores
- Falling churn rate

### Warning Signs

- Falling active customer count
- Declining CLV (customers spending less)
- Lower purchase frequency
- Falling engagement scores
- Rising churn rate
- Increasing at-risk segment

---

## Common Questions

**Q: Why did my CLV increase but customer count decreased?**
A: Likely lost lower-value customers while retaining higher-value ones. This can be positive (better customer quality) or negative (losing volume). Investigate churn reasons.

**Q: How should I interpret engagement score?**
A: Combines email opens, clicks, purchases, and channel engagement. Score 70+ is healthy. Below 60 warrants re-engagement campaigns.

**Q: What's a good churn rate?**
A: Varies by industry (2-5% for SaaS, 10-15% for e-commerce typical). Compare against your industry and track trends over time.

**Q: Should I focus on acquiring new customers or retaining existing?**
A: Retention usually 5-7x cheaper. Focus on retaining at-risk customers first, then acquire new high-fit customers.

---

