# Campaign Types

## Overview

Campaign types define the structural framework and logic for how your campaigns distribute offers to audience segments. Each campaign type determines how offers are allocated, tested, and rotated across your customer segments.

## Campaign Types

### Multiple Target Group

**Description:** Target multiple segments with different offers for each segment

This campaign type allows you to simultaneously reach different customer segments within a single campaign, assigning tailored offers to each segment. It's ideal for running coordinated multi-segment campaigns where different customer groups receive optimized messaging and offers based on their segment characteristics.

**Key Features:**
- Target multiple segments in one campaign
- Assign unique offers to each segment
- Execute coordinated multi-segment strategy
- Monitor segment-specific performance

**Best For:**
- Large-scale promotional campaigns targeting diverse audiences
- Personalized campaigns where different segments need different offers
- Campaigns requiring segment-specific messaging
- Multi-tier customer targeting (VIP, regular, at-risk, etc.)

**Example:**
- Target "Champions" segment with premium offer
- Target "Loyalists" segment with standard offer
- Target "At-Risk" segment with win-back offer
- All within one campaign execution

---

### Champion-Challenger

**Description:** Test challenger strategies against a champion segment

This campaign type implements an experimentation framework where you maintain a proven "champion" strategy while testing new "challenger" strategies. The champion audience receives the established best-performing offer, while challenger audiences receive alternative offers to test their effectiveness.

**Key Features:**
- Designate a champion segment (control group)
- Test multiple challenger strategies
- Compare performance against proven baseline
- Structured A/B testing framework

**Best For:**
- Testing new offers against proven winners
- Innovation while maintaining revenue from champion segment
- Controlled experimentation with clear baselines
- Gradual strategy improvement
- Identifying incremental improvements over best-in-class offers

**Example:**
- Champion segment receives proven 20% discount (control)
- Challenger segment A receives 15% discount + free shipping
- Challenger segment B receives $10 off + loyalty points
- Compare challenger performance against champion baseline

---

### A/B Test

**Description:** Compare two variants (A and B) with equal distribution

This campaign type implements a classic A/B test where you split your audience equally between two variants. Both variants target the same audience with different offers, providing statistical comparison of performance with equal exposure.

**Key Features:**
- Split audience equally (50/50)
- Test two variants simultaneously
- Balanced statistical comparison
- Direct performance comparison

**Best For:**
- Simple variant testing
- Offer comparison (discount level, type, messaging)
- Identifying winning variants for scale
- Quick experimentation cycles
- Statistically valid comparisons with minimal setup

**Example:**
- 50% of audience receives 15% discount
- 50% of audience receives $10 fixed discount
- Compare which variant generates better conversion
- Scale winner across broader audience

---

### Round Robin

**Description:** Sequential offer rotation based on time intervals

This campaign type implements time-based offer rotation where different offers are rotated sequentially at defined intervals. Customers or segments receive different offers based on when they engage with the campaign during the rotation cycle.

**Key Features:**
- Rotate offers sequentially
- Time-interval based distribution
- Cyclical offer presentation
- Controlled offer rotation schedule

**Best For:**
- Frequent offer updates and rotations
- Seasonal or periodic promotions
- Creating urgency through rotating offers
- Testing multiple offers in sequence
- Campaigns requiring changing messaging over time

**Example:**
- Week 1: Offer 20% discount
- Week 2: Offer free shipping
- Week 3: Offer loyalty points
- Week 4: Offer bundle deal
- Cycle repeats or ends based on campaign duration

---

### Multiple Level

**Description:** Conditional offer mapping with behavioral triggers

This campaign type implements conditional logic where offers are determined by customer behaviors, attributes, or lifecycle stage. Customers receive different offers based on rule-based conditions and triggers rather than simple segment assignment.

**Key Features:**
- Rule-based conditional logic
- Behavioral trigger integration
- Attribute-based offer assignment
- Dynamic offer determination
- Complex decision trees

**Best For:**
- Dynamic campaigns based on customer behavior
- Lifecycle-stage-specific offers
- Attribute-based personalization
- Rule-engine driven campaigns
- Campaigns with complex conditional logic

**Example:**
- IF customer_value &gt; $1000 AND purchase_frequency &gt; monthly THEN offer premium service
- IF customer_age &lt; 30 AND first_time_buyer THEN offer starter discount
- IF churn_risk &gt; 75 AND high_value THEN offer special retention offer
- IF engagement_score &lt; 25 THEN offer re-engagement incentive

---

## Comparison Matrix


****Complexity**** - Medium - Medium - Low - Low - High


****Segment Count**** - Multiple - 2 (Champion + Challenger) - 2 - 1+ - Multiple


****Distribution**** - Custom per segment - Custom split - 50/50 equal - Time-based - Condition-based


****Use Case**** - Multi-segment campaigns - Controlled testing - Variant comparison - Offer rotation - Dynamic logic


****Setup Time**** - Medium - Medium - Low - Low - High


****Analysis Depth**** - Segment level - Baseline comparison - Variant comparison - Time-based trends - Condition tracking


---

## Selection Guide

**Choose Multiple Target Group when:**
- You need to target different segments in one campaign
- Each segment requires a tailored offer
- You want segment-specific performance tracking
- Running coordinated multi-tier promotions

**Choose Champion-Challenger when:**
- You have a proven winning strategy (champion)
- You want to test new approaches against it
- You need clear baseline for comparison
- Risk management is important (champion keeps revenue)

**Choose A/B Test when:**
- You want simple, direct variant comparison
- You need equal audience split (50/50)
- You're testing offer variations
- Statistical validity is important with minimal complexity

**Choose Round Robin when:**
- You want to rotate different offers over time
- Each time period needs different messaging
- You're creating rotating promotions
- Sequential offer exposure is a requirement

**Choose Multiple Level when:**
- You have complex business rules
- Offers depend on multiple conditions
- Customer attributes drive offer logic
- You need behavioral trigger integration

---

## Best Practices

### Campaign Type Selection
- Match campaign goals with campaign type structure
- Consider audience complexity and segment needs
- Factor in testing vs. production requirements
- Plan for measurement and analysis needs

### Execution
- Test campaign types in controlled environments first
- Document business rules and conditions (for Multiple Level)
- Plan offer rotation cycles (for Round Robin)
- Define success metrics before launch

### Analysis
- Track performance by campaign type consistently
- Compare results within same campaign type
- Learn from patterns across campaigns
- Use insights to refine future campaigns

### Optimization
- Identify your most effective campaign type for each use case
- Scale campaigns using proven campaign types
- Incrementally test new types in controlled conditions
- Document learnings specific to each campaign type