# Control Groups

## Overview

Control groups are pre-configured customer segments used to measure and validate the effectiveness of your marketing campaigns. A control group is a baseline audience that receives no treatment (no offer, no message), allowing you to compare their behavior against the treatment group to determine the true impact of your campaign.

By implementing control groups, you establish statistical validity for your campaign results and can confidently measure whether observed changes are due to your campaign or other external factors.

## Purpose & Benefits

### Why Use Control Groups?

**Measure True Campaign Impact**
- Separate campaign effects from natural market fluctuations
- Identify baseline customer behavior without any treatment
- Quantify the actual incremental value of your campaign

**Statistical Validation**
- Enable A/B testing with proper control baselines
- Support champion-challenger campaign structures
- Conduct valid statistical analysis of results

**Campaign Optimization**
- Identify which campaigns drive real value
- Optimize offer allocation by understanding control behavior
- Make data-driven decisions about campaign scaling

**Risk Management**
- Reduce risk by testing on control group first
- Validate hypothesis before full campaign rollout
- Measure unintended consequences

### Key Benefits

- **Reliable Metrics:** Understand true campaign contribution vs. natural trends
- **Cost Savings:** Avoid scaling ineffective campaigns
- **Confidence:** Make statistically sound business decisions
- **Insights:** Learn which offers and segments respond best
- **Scalability:** Validate success before large-scale execution

---

## Control Group Structure

### Key Properties

**Identification**
- **Name:** Unique identifier for the control group
- **Status:** Active, Inactive, or Expired
- **ID:** System-generated unique identifier

**Customer Base Configuration**
- **Active Subscribers:** Control group from currently active customers
- **All Customers:** Control group from entire customer database
- **Saved Segments:** Control group from predefined customer segments

**Size Configuration**
- **Percentage:** 1-50% of audience assigned to control (percentage of applicable customer base)
- **Member Count:** Total number of customers in the group
- **Size Method:** Percentage-based, fixed value, or advanced parameters

**Statistical Parameters**
- **Outlier Removal:** Automatically exclude statistical outliers from group
- **Variance Calculation:** Calculate variance metrics for accuracy assessment
- **Confidence Level:** Statistical confidence threshold
- **Margin of Error:** Acceptable error margin for measurements

**Generation & Scheduling**
- **Generation Time:** When the control group is automatically selected
- **Recurrence:** One-time, daily, weekly, or monthly regeneration
- **Last Generated:** Timestamp of most recent control group generation
- **Next Generation:** Scheduled date for next regeneration

---

## Control Group Types

### Universal Control Groups

Pre-configured control groups that can be reused across multiple campaigns.

**Characteristics:**
- Defined once, used in multiple campaigns
- Centrally managed and scheduled
- Consistent baseline across campaigns
- Automatically regenerated on schedule

**Best For:**
- Standard customer populations
- Recurring campaign testing
- Consistent measurement baselines
- Organization-wide control group standards

### Campaign-Level Control Groups

Control groups defined specifically for individual campaigns.

**Characteristics:**
- Unique to each campaign
- Defined during campaign setup
- Flexible size and configuration
- Campaign-specific baseline

**Best For:**
- One-off campaigns with unique requirements
- Segment-specific testing
- Custom control group sizes
- Campaign-specific statistical parameters

---

## Comparison: Control vs Treatment Group

| Aspect | Control Group | Treatment Group |
|--------|---------------|-----------------|
| **Receives Offer** | No | Yes |
| **Receives Message** | No | Yes |
| **Purpose** | Baseline measurement | Campaign impact |
| **Size** | Typically 10-30% | 70-90% |
| **Behavior Tracked** | Natural behavior | Response to campaign |
| **Comparison** | Baseline metric | Change from baseline |

**Example:**
- Control Group (15%): 1,500 customers receive nothing
- Treatment Group (85%): 8,500 customers receive 20% discount offer
- Results: Treatment group conversion 5%, Control group conversion 2% = **3% true campaign lift**

---

## Setting Up Control Groups

### Customer Base Selection

**Choose your control group source:**

1. **Active Subscribers**
   - Use only currently active customers
   - Best for ongoing campaigns
   - Excludes inactive accounts

2. **All Customers**
   - Include all customers regardless of status
   - Best for comprehensive analysis
   - Larger population, more reliable statistics

3. **Saved Segments**
   - Use predefined customer segments
   - Best for segment-specific testing
   - Allows granular control group definition

### Size Configuration

**Percentage Method** (Most common)
- Set control group as percentage of audience (1-50%)
- Automatically adjusts as audience size changes
- Scales with campaign audience

**Fixed Value Method**
- Set exact number of customers in control group
- Size remains constant regardless of audience changes
- Use when specific sample size is required

**Advanced Parameters Method**
- Define statistical confidence level (e.g., 95%, 99%)
- Set margin of error tolerance
- Calculate required sample size automatically
- Recommended for rigorous statistical validation

### Generation Scheduling

**One-Time Generation**
- Control group created once, remains static
- Use for: Single campaigns, test phases

**Daily Regeneration**
- Control group refreshed every day
- Use for: Continuous campaigns, high-frequency testing

**Weekly Regeneration**
- Control group refreshed every 7 days
- Use for: Recurring weekly promotions

**Monthly Regeneration**
- Control group refreshed every 30 days
- Use for: Monthly campaigns, seasonal promotions

---

## Using Control Groups in Campaigns

### Campaign Integration

When creating a campaign, you can optionally assign a control group:

**Campaign-Level Control Group**
- Single control group across all segments
- Shared baseline for the entire campaign
- Simpler analysis, consistent measurement

**Segment-Level Control Groups**
- Different control group per segment
- Segment-specific baseline measurement
- More granular but complex analysis

### Campaign Configuration

**Step 1: Enable Control Group**
- Decide whether campaign needs control group
- Balance between measurement rigor and reach

**Step 2: Select Control Type**
- Choose "Standard" for custom configuration
- Choose "Universal" to reuse pre-configured group

**Step 3: Configure Size & Frequency** (if Standard)
- Set control group percentage
- Define generation frequency
- Set exclusion criteria if needed

**Step 4: Review & Launch**
- Confirm control group assignment
- Verify audience allocation
- Review impact on total reach

---

## Analysis & Reporting

### Key Metrics

**Baseline Metrics** (from control group)
- Conversion rate without campaign
- Purchase frequency
- Average order value
- Engagement rate

**Campaign Metrics** (from treatment group)
- Conversion rate with campaign
- Purchase frequency
- Average order value
- Engagement rate

**Lift Calculation**
- Formula: (Treatment metric - Control metric) / Control metric × 100
- Example: (5% - 2%) / 2% × 100 = **150% lift**

### Performance Comparison

**Control vs Treatment Analysis:**
- Side-by-side metric comparison
- Statistical significance testing
- Confidence interval reporting
- Trend analysis over time

### Insights Extracted

- **Campaign Effectiveness:** True incremental impact
- **Segment Performance:** Which segments respond best
- **Offer Performance:** Which offers drive results
- **ROI Calculation:** True return on campaign investment
- **Scaling Decision:** Whether to expand successful campaigns

---

## Best Practices

### Control Group Selection

**Size Recommendations:**
- Minimum 10% for statistical validity
- 15-20% for most campaigns (balance between precision and reach)
- Up to 30% for low-conversion scenarios or high-variance populations
- Use statistical calculators for exact requirements

**Population Recommendations:**
- Use "All Customers" for more reliable baseline
- Use "Active Subscribers" for current customer focus
- Use segments for segment-specific testing

### Configuration Best Practices

**For Ongoing Campaigns:**
- Use universal control groups for consistency
- Set monthly regeneration for seasonal campaigns
- Document control group definition clearly

**For Testing Phases:**
- Use smaller control groups (10-15%) to maximize test reach
- Enable statistical outlier removal for cleaner data
- Use one-time generation for single tests

**For High-Value Campaigns:**
- Use larger control groups (25-30%) for accuracy
- Enable variance calculation
- Use advanced parameters for precise requirements

### Statistical Best Practices

**Sample Size:**
- Larger samples = more reliable results
- Minimum 500-1000 per group recommended
- Use statistical power calculators for accuracy

**Measurement Period:**
- Allow sufficient campaign duration (at least 1 month)
- Control for seasonality and external events
- Avoid measuring during holidays or major events

**Data Quality:**
- Enable outlier removal for skewed populations
- Track data quality metrics
- Validate measurement consistency

### Reporting Best Practices

**Document Clearly:**
- Record control group definition
- Note generation dates and frequencies
- Document any changes during campaign

**Statistical Disclosure:**
- Report confidence levels
- Include margin of error
- Note any limitations or caveats

**Actionable Insights:**
- Focus on business impact, not just percentages
- Compare similar control groups over time
- Use results to inform future campaigns

---

## Common Use Cases

### Use Case 1: New Offer Testing
- Create control group with 20% of audience
- Test new discount structure on 80% treatment group
- Measure conversion lift against control baseline
- Decide whether to scale offer to full customer base

### Use Case 2: Channel Effectiveness
- Test email campaign with control group
- Compare against treatment group receiving email
- Measure incremental channel impact
- Validate email ROI

### Use Case 3: Segment Optimization
- Test different offers per segment
- Use segment-specific control groups
- Identify best offer per segment
- Allocate budget to highest-performing segments

### Use Case 4: Seasonal Campaign Validation
- Run control group during holiday season
- Measure true campaign lift vs. seasonal uptick
- Isolate campaign effect from holiday trends
- Plan next year's campaign budget

### Use Case 5: Continuous Testing Program
- Maintain universal control groups
- Monthly campaign rotations
- Continuous measurement of campaign effectiveness
- Ongoing program optimization

---

## Troubleshooting

### Control Group Too Small
- **Issue:** Results not statistically significant
- **Solution:** Increase control group percentage or population size
- **Recommendation:** Aim for minimum 500-1000 customers per group

### Control Group Contamination
- **Issue:** Control group members received campaign message
- **Solution:** Review campaign targeting rules and segment definitions
- **Prevention:** Use built-in exclusion criteria to separate control and treatment

### Unexpected Results
- **Issue:** Control group performance higher than treatment
- **Solution:** Check offer structure, message quality, and targeting accuracy
- **Investigation:** Review campaign execution logs and customer feedback

### Generation Failures
- **Issue:** Control group fails to regenerate on schedule
- **Solution:** Check system logs and scheduling configuration
- **Prevention:** Monitor generation status and set alerts for failures

---

