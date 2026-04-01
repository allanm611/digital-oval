# Offer Reports

> **Important:** The screenshots in this documentation display dummy/sample data for demonstration purposes. Each report includes a Data Mode toggle that allows you to switch between viewing dummy data and real production data. Use the toggle button at the top-right of the reports page to switch between modes. Real data will display your actual offer metrics and performance information.

## Overview

Offer Reports provide comprehensive analytics on offer performance, redemption rates, customer engagement, and revenue impact. Analyze offer effectiveness across types, track redemption patterns, and optimize offer strategy based on performance data.

## Accessing Offer Reports

**Step 1: Navigate to Reports**
- Click **Reports** in the main navigation
- Select **Offer Reports** option
- Reports page loads with offer analytics

**Route:** `/dashboard/reports/offers`

---

## Key Metrics Overview

![Offer Reports Stats](/img/reports/offerreportststats.png)

Six key metrics provide quick insights into offer performance:

### 1. Total Offers

**What it shows:**
- Total number of active offers
- Example: "24,200"
- Portfolio size metric

**Why it matters:**
- Shows offer catalog breadth
- Indicates portfolio complexity
- Baseline for performance analysis

---

### 2. Redemption Rate

**What it shows:**
- Percentage of exposed customers who redeemed
- Example: "3.8%"
- Engagement metric

**Why it matters:**
- Primary measure of offer appeal
- Affects profitability
- Guides offer optimization

**How to use:**
- Higher rate = offer is attractive
- Lower rate = improve offer or targeting
- Compare across offer types

---

### 3. Total Revenue Generated

**What it shows:**
- Total revenue from offer redemptions
- Example: "KSh 1,420,000"
- Business impact metric

**Why it matters:**
- Shows offer contribution to revenue
- ROI calculation basis
- Guides budget allocation

---

### 4. Budget Used

**What it shows:**
- Total offer cost (discounts, incentives)
- Example: "KSh 385,000"
- Cost metric

**Why it matters:**
- Shows investment in offers
- Used to calculate ROI
- Budget tracking metric

---

### 5. Cost Per Redemption

**What it shows:**
- Average cost to achieve one redemption
- Example: "KSh 160,000"
- Efficiency metric

**Why it matters:**
- Shows offer profitability
- Compares offer efficiency
- Guides budget allocation

**How to use:**
- Lower is more efficient
- Should be less than profit per transaction
- Use to compare offers

---

### 6. ROI (Return on Investment)

**What it shows:**
- Revenue generated divided by cost
- Example: "2.3x"
- Profitability multiplier

**Why it matters:**
- Primary profitability metric
- 2x = break even + profit
- Guides offer decisions

**How to use:**
- ROI > 2x = Good profitability
- ROI 1-2x = Marginal profitability
- ROI < 1x = Losing money

---

## Offer Performance Stages & Redemption Timeline

![Offer Performance & Redemption](/img/reports/offerperformance&redemption.png)

Two complementary views of offer performance:

**Left: Offer Performance Stages (Funnel)**
- Exposed (largest) - Customers who saw the offer
- Viewed (medium) - Customers who viewed details
- Engaged (small) - Customers who interacted
- Redeemed (smallest) - Customers who redeemed

**What to Look For:**
- Large drop from Exposed to Viewed = marketing/presentation issue
- Large drop from Viewed to Engaged = offer not compelling
- Large drop from Engaged to Redeemed = friction in redemption process

**Right: Redemption Timeline (Trend)**
- Cumulative (gray line) - Total redemptions over time
- Daily Redemptions (cyan line) - Daily redemption volume
- Trend shows acceleration or decline

**How to Analyze:**
- Rising cumulative = offer gaining traction
- Flat cumulative = declining interest over time
- Peak daily redemptions = best engagement period

---

## Offer Performance Table

![Offer Performance Table](/img/reports/offerperformancetable.png)

Detailed view of individual offer performance:

**Columns Displayed:**
- **Offer Name** - Name of the offer
- **Status** - Current status (Active, Paused, Expired)
- **Target Audience** - Number of customers targeted
- **Redeemed Count** - Number of redemptions
- **Spend** - Total offer cost
- **Redeems** - Number of redemptions (alt display)
- **Conversions** - Related sales/conversions
- **Last Updated** - Most recent update time

**How to Use:**

**Search Offers:**
1. Use search box to find by offer name
2. Results update in real-time
3. Results shown on paginated pages

**Sort and Filter:**
- Click column headers to sort
- Filter by status (Active/Paused/Expired)
- Combine filters for detailed analysis

**Export Data:**
- Click "Download CSV" button
- Export all or filtered offers
- Use for external analysis or reporting

---

## Offer Type Comparison

![Offer Type Comparison](/img/reports/offertypecomparison.png)

Compare performance across different offer types:

**Offer Types Shown:**
- Data (bundle offer)
- Voice (call bundle)
- SMS (messaging bundle)
- Combo (multiple services)
- Voucher (discount code)
- Bundle (product bundle)
- Bonus (loyalty reward)

**Dual Metrics:**
- Redemption Rate % (Cyan bars) - Percentage redeeming offer
- Average Transaction Value (Gray bars) - Revenue per redemption

**How to Analyze:**

**Redemption Rate (Cyan bars):**
- Higher = more appealing offer
- Lowest performers = improve or retire
- Compare seasonal variations

**Transaction Value (Gray bars):**
- Higher = premium offer value
- Higher value = better ROI potential
- Guides pricing strategy

**Optimization Tips:**
- High redemption + high value = scale up
- High redemption + low value = increase price
- Low redemption + high value = improve positioning
- Low redemption + low value = retire offer

---

## Performance Analysis

### Redemption Rate Benchmarks

**Good Redemption Rates:**
- 2-3% = Acceptable
- 3-5% = Good
- 5-8% = Excellent
- 8%+ = Outstanding

**Factors Affecting Redemption:**
- Offer attractiveness
- Target audience relevance
- Visibility/marketing spend
- Redemption friction
- Timing and seasonality

### ROI Analysis

**ROI Calculation:**
- ROI = (Revenue - Cost) / Cost
- Example: (1,420,000 - 385,000) / 385,000 = 2.3x

**Profitability Tiers:**
- ROI > 3x = Highly profitable
- ROI 2-3x = Profitable
- ROI 1-2x = Marginally profitable
- ROI < 1x = Not profitable

### Cost Efficiency

**Cost Per Redemption:**
- Calculate: Total Spend / Total Redemptions
- Compare across offer types
- Lower = more efficient
- Higher = less efficient

**Customer Acquisition Cost (if applicable):**
- Compare offer cost vs lifetime value
- Premium offers can justify higher cost
- Core offers should have low cost

---

## Offer Lifecycle

**Typical Offer Stages:**
1. Launch - Ramp-up period, building awareness
2. Growth - Redemptions accelerating
3. Peak - Maximum redemption rate
4. Decline - Redemptions slowing
5. Expiration - Offer ends

**Optimization Actions:**
- Declining phase = promote more or retire
- Peak phase = maintain promotion level
- Early phase = invest in marketing

---

## Best Practices

### Offer Design

- Test offer value before full launch
- Ensure clear redemption instructions
- Match offer to target audience
- Consider seasonal demand

### Portfolio Management

- Balance high and low redemption offers
- Mix premium and core offers
- Regular performance reviews
- Retire underperforming offers

### Promotion Strategy

- Allocate budget to high-ROI offers
- Test different promotion channels
- Vary offer frequency to maintain appeal
- Monitor cannibalization between offers

### Performance Tracking

- Monitor redemption weekly
- Review ROI bi-weekly
- Track cost per redemption
- Compare against targets

---

## Troubleshooting

### Low Redemption Rate

**Possible Causes:**
- Offer not attractive
- Poor targeting
- Limited visibility/marketing
- Complex redemption process
- Wrong audience segment

**Solutions:**
- Increase offer value
- Better audience targeting
- More marketing spend
- Simplify redemption
- Test different offers with segment

### High Cost Per Redemption

**Possible Causes:**
- Too generous discount
- Low customer interest
- Poor targeting
- High marketing spend
- Small audience

**Solutions:**
- Reduce discount amount
- Test different offer type
- Better audience segmentation
- Reduce marketing spend
- Expand target audience

### Declining Redemption Rate

**Possible Causes:**
- Offer fatigue (customer seen it too much)
- Seasonal decline
- Expiring offer
- Better competing offers
- Changed customer preferences

**Solutions:**
- Retire and refresh offer
- Launch new variants
- Timing adjustments
- Marketing refresh
- Monitor competitor offers

---

## Data Modes

### Dummy Data Mode

- Shows sample/demonstration data
- Useful for learning the interface
- Test without impacting real offers
- Safe for training and exploration

Enable:
- Toggle "Data Mode" button at top-right
- Select "Dummy Data" option

### Real Data Mode

- Shows actual offer performance
- Real redemption metrics and revenue
- Production data from active offers
- Reflects current business performance

Enable:
- Toggle "Data Mode" button at top-right
- Select "Real Data" option

Important: Only real data mode shows actual customer information and redemption metrics. Always verify you are viewing the correct data mode when making business decisions.

---

