# Customer Profile Reports

## Overview

Customer Profile Reports provide deep insights into your customer base, including segmentation, lifetime value, engagement metrics, and lifecycle trends. Analyze customer behavior patterns, identify high-value segments, and understand churn and retention dynamics.

## Data Mode

**Toggle Data Mode:**
- Switch between live data and sample/test data
- "Data Mode" toggle in top-right corner

## Accessing Customer Profile Reports

**Step 1: Navigate to Reports**
- Click **Reports** in the main navigation
- Select **Customer Profile Reports** option
- Reports page loads with customer analytics

## Key Metrics Overview

![Customer Profile Stat Cards](/img/v1.1/reports/customerprofilestatcards.png)

Six key metrics provide a quick snapshot of your customer health:

### 1. Active Customers

**What it shows:**
- Total number of active customers in your base
- Trend comparison to previous period

**Why it matters:**
- Overall customer base growth indicator
- Foundation metric for all other calculations
- Key business health indicator

### 2. Average Customer Lifetime Value (CLV)

**What it shows:**
- Average revenue expected from a customer over lifetime
- Trend vs previous quarter

**Why it matters:**
- Determines budget for customer acquisition
- Identifies most valuable customer segments
- Guides investment in retention

**How to use:**
- Higher CLV = worth investing more to acquire and retain
- Compare against customer acquisition cost
- Track trends to see if customers becoming more valuable

### 3. Average Transaction Value

**What it shows:**
- Average revenue per transaction/purchase
- Trend vs previous period

**Why it matters:**
- Indicates purchase behavior and spending patterns
- Helps with inventory and fulfillment planning
- Guides pricing strategy

### 4. Purchase Frequency

**What it shows:**
- How often customers buy on average (per year)
- Year-over-year trend

**Why it matters:**
- Shows customer loyalty and engagement
- Predicts revenue stability
- Identifies habits and cycles

### 5. Engagement Score

**What it shows:**
- Composite score (0-100) of customer engagement
- Trend vs last 30 days

**Why it matters:**
- Combines multiple engagement signals
- Predicts likelihood of future purchases
- Identifies at-risk vs high-engagement customers

### 6. Churn Rate

**What it shows:**
- Percentage of customers becoming inactive
- Trend vs previous quarter

**Why it matters:**
- Critical retention metric
- Indicates customer satisfaction
- Drives acquisition need

## Customer Detail Table

![Customer Detail Table](/img/v1.1/reports/customertable.png)

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

## Customer Segmentation

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

## Time Range Selection

**Quick Range Options:**
- **Daily** - Last 7 days
- **Weekly** - Last 30 days
- **Monthly** - Last 90 days

**Custom Range:**
- Set specific start and end dates
- Supports up to 2 years of historical data
- Click "Run" to apply

## Analysis Charts

### Customer Value Matrix & CLV Distribution

![Customer Value Matrix & Customer Lifetime Value Distribution](/img/v1.1/reports/matrix&lifetimedistribution.png)

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

### Lifecycle Distribution

![Lifecycle Distribution Chart](/img/v1.1/reports/lifecycledistribution.png)

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

