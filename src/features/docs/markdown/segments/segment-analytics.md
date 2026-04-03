# Segment Analytics

## Overview

The Segment Analytics page provides comprehensive insights into your segment portfolio, including growth trends, distribution patterns, usage metrics, and segment health. This page helps you understand how segments are being used across your system and identify optimization opportunities.

## Summary Statistics Cards

At the top of the page, four key metric cards give you a quick health overview:

![Analytics Summary Statistics](/img/segments-img/segmentanalyticsstatcards.png)

### Total Segments
- **Metric:** Total number of segments in your system
- **Shows:** All segments regardless of status (active, inactive, stale, empty)
- **Use:** Track growth of your segment library over time

### Active Segments
- **Metric:** Number of segments that have been computed and have members
- **Shows:** Segments with non-zero membership that are being actively used
- **Excludes:** Empty segments, stale segments, segments not yet computed
- **Use:** Understand how many segments are actually in use for campaigns

### Recently Refreshed
- **Metric:** Number of segments computed within a recent time window
- **Shows:** Segments that have been recomputed in the last few days/weeks
- **Indicates:** Up-to-date segment data
- **Use:** Verify that dynamic segments are being refreshed as scheduled

### Stale Segments
- **Metric:** Number of segments that haven't been recomputed recently
- **Shows:** Segments older than a threshold (typically 7+ days)
- **Indicates:** Data that may be out of date
- **Action:** Consider recomputing these segments for accurate audience size

## Key Metrics Summary

### What These Numbers Tell You

**Good Health Indicators:**
- High "Active Segments" (most segments have members and are used)
- Low "Stale Segments" (segments are being refreshed regularly)
- High "Recently Refreshed" (recent computation activity)
- "Total Segments" aligned with your expected segment library size

**Warning Signs:**
- High "Stale Segments" (segments data may be outdated)
- Low "Recently Refreshed" (no recent computation activity)
- "Stale Segments" approaching "Total Segments" (most segments need refresh)

## Visualization Charts

### 1. Segment Type Distribution (Pie Chart)

**What It Shows:**
- Breakdown of your segments by type (Behavioral, Demographic, Dynamic, Geographic, Predictive, Static, Transactional)
- Each slice represents the count of segments of that type
- Percentages show proportion relative to total
<!-- 

**How to Interpret:**
- **Large Dynamic segment:** Most segments use rules that auto-recalculate (good for dynamic audience)
- **Large Static segment:** Many manually curated lists (good for VIP/priority audiences)
- **Few Predictive segments:** Limited use of ML-based scoring (opportunity for advanced segmentation)
- **Balanced distribution:** Good portfolio showing diverse segmentation approaches

**What to Look For:**
- Check if distribution matches your business needs
- Few predictive segments? Consider adding ML-driven segments for churn prediction
- Too many static segments? Opportunities to automate with dynamic rules
- All one type? Risk of limited flexibility in audience targeting -->

![Type Distribution & Category Distribution](/img/segments-img/segmentanalyticstypeandcategorydistribution.png)

### 2. Category Distribution (Bar Chart)

**What It Shows:**
- Count of segments in each category you've defined
- Categories are organizational containers for related segments
- Helps understand how segments are grouped

<!-- 
**How to Interpret:**
- **High count in one category:** That business area has extensive segmentation
- **Zero or low count:** Opportunity to add more targeted segments in that area
- **Even distribution:** Good balance across business functions
- **Sparse categories:** Underutilized organizational structure

**What to Look For:**
- Are your most important business areas well-represented?
- Do categories align with your organizational structure?
- Are there gaps in segmentation by category?
- Could you improve organization by consolidating or renaming categories?

--- -->

### 3. Creation Trend (Line Chart - Last 30 Days)

![Creation Trend Chart](/img/segments-img/segmentanalyticscreationtrend.png)

**What It Shows:**
- Trend of segment creation over the last 30 days
- Three lines track:
  - **Total Segments** (teal) - All segments created
  - **Static Segments** (blue) - Manually maintained lists
  - **Dynamic Segments** (green) - Rule-based auto-calculating

**How to Interpret:**
- **Upward trend:** Active segment development and expansion
- **Flat trend:** Stable, minimal segment changes
- **Spike patterns:** Often align with campaign planning cycles
- **Static vs Dynamic:** Ratio shows your team's preference (rules vs manual lists)

<!-- **What to Look For:**
- Alignment with your campaign calendar (spikes during planning periods)
- Healthy mix of static and dynamic (not all one type)
- Sustainable creation rate (not depleting resources)
- Consistency or patterns that reveal team behavior

**Business Insights:**
- If mostly dynamic: Team relies on rules and automatic updates
- If mostly static: Team prefers manual curation and control
- If both equally: Balanced approach leveraging both methods

--- -->

### 4. Top 10 Largest Segments (Horizontal Bar Chart)

![Top Largest Segments](/img/segments-img/segmentanaltyicstoplargest.png)

**What It Shows:**
- The 10 segments with the most members
- Sorted by size (largest first)
- Y-axis shows segment name, X-axis shows member count

<!-- **How to Interpret:**
- **Very large segments:** Core audience segments used in most campaigns
- **Significantly smaller:** Niche segments for specialized targeting
- **Similar sizes:** Balanced audience portfolio
- **One dominant:** Risk of over-relying on single audience

**What to Look For:**
- Do the largest segments match your core business audiences?
- Are there big gaps in sizes? (sometimes good for targeting flexibility)
- Are the largest segments recent (created last 30 days) or established?
- Do names make sense for their size (e.g., "All Customers" should be largest)

**Business Context:**
- Largest segments are typically used in most campaigns
- These should be your most valuable audiences
- Watch out for segments growing unexpectedly large
- Monitor stale largest segments closely (outdated data affects many campaigns)

--- -->

### 5. Top Segments by Campaign Usage (Horizontal Bar Chart)

![Campaign Usage Chart](/img/segments-img/segmentanalyticscampaignusage.png)

**What It Shows:**
- The 10 segments used most frequently in campaigns
- Shows how many campaigns actively reference each segment
- Different from size—measures *usage*, not *member count*
<!-- 

**How to Interpret:**
- **High usage:** Critical segments used across many campaigns
- **Low usage:** Specialized segments for specific use cases
- **Most used segments:** Business critical—protect and monitor carefully
- **Unused segments:** Either very new or candidates for archival

**What to Look For:**
- Are your "most used" segments actually your largest? (Usually yes)
- High-usage segments should have recent computation (staying fresh)
- Do high-usage segments align with business priorities?
- Any large segments with low usage? May need better promotion or different naming

**Risk Assessment:**
- **Top 5 usage segments:** If these become stale, impacts many campaigns
- **Heavily dependent on 1-2 segments:** Risk concentration—consider diversifying
- **Well-distributed usage:** Healthy portfolio, not overly dependent on few segments

--- -->

## Stale Segments Table

![Stale Segments Table](/img/segments-img/segmentanalyticsstalesegments.png)

**What It Shows:**
- List of segments that haven't been recomputed recently
- "Stale" typically means no computation in 7+ days
- Shows how long since last computation

**Column: Days Since Last Computed**
- **Green (0-3 days):** Fresh data, recently computed
- **Yellow (4-7 days):** Getting older, consider recomputing soon
- **Red (8+ days):** Stale data, should be recomputed

<!-- ### Understanding Staleness

**Why Segments Become Stale:**
- Scheduled recalculation isn't running
- Segment recalculation is disabled
- Manual computation hasn't happened
- Dynamic data isn't being refreshed

**Impact of Stale Segments:**
- Member counts may be inaccurate (customers added/removed)
- Audience targeting becomes less precise
- Campaigns may reach wrong customers
- Analytics based on stale segments are misleading -->

<!-- ### Addressing Stale Segments

**Quick Actions:**
1. **Manual Recompute:** Go to Segment Details page and click "Recompute Members"
2. **Enable Scheduling:** Set a refresh frequency if the segment supports it
3. **Verify Configuration:** Check if segment rules are still valid
4. **Delete if Unused:** Archive segments you no longer need -->

<!-- **Best Practices:**
- Review stale segments weekly
- Set up automated recalculation for important segments
- Archive segments older than 30 days of staleness
- Document why segments need regular recomputation

**When It's OK to Be Stale:**
- Static segments don't need recomputation (manually curated)
- Segments created for historical analysis (not used in active campaigns)
- Archived segments you're keeping for reference only

--- -->

For detailed segment information:
- Go to [Segment List](/documentation/segments/segments-list) to view all segments
- Open [Segment Details](/documentation/segments/view-segment-details) page for individual segments
- Create new segments via [Create Segment](/documentation/segments/create-segment)
