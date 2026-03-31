# Campaign Types

Campaign Types define the structure and execution model for your campaigns. When creating a campaign, you select a campaign type in **Step 2: Campaign Configuration** that determines how the campaign will run and which configuration options are available.


## Overview

Campaign types are configured at the system level by administrators, but this guide explains the five campaign types available and when to use each one.


## Campaign Type Options

When creating a campaign, you choose from the following campaign types:

### 1. Multiple Target Group

**Use this type when:** You want to send different offers to multiple distinct audience segments in a single campaign.

**How it works:**
- Define multiple segments (audience groups)
- Assign a different offer (or set of offers) to each segment
- Each segment receives its designated offer configuration
- All segments run simultaneously within the same campaign timeline

**Configuration:**
- Segments: Multiple segments required
- Offer Mapping: One or more offers per segment
- Execution: Parallel (all segments run at the same time)


### 2. Champion Challenger

**Use this type when:** You want to test a new offer strategy against your best performing current offer.

**How it works:**
- Designate one segment as the "Champion" (your current best offer)
- Create one or more "Challenger" segments (test new offers)
- Compare performance metrics between champion and challenger groups
- Determine if the challenger offer outperforms the champion

**Configuration:**
- Champion Segment: One segment receives the existing/control offer
- Challenger Segments: One or more segments receive new/test offers
- Metrics: Campaign tracks performance of champion vs. each challenger
- Execution: Parallel (all run simultaneously for fair comparison)


### 3. A/B Testing

**Use this type when:** You want to test two variant offers against each other to determine which performs better.

**How it works:**
- Split audience into exactly two variants (A and B)
- Each variant receives a different offer or offer configuration
- Campaign measures performance of both variants
- Results indicate which variant was more effective

**Configuration:**
- Variant A: One segment with offer A
- Variant B: One segment with offer B
- Requirements: Exactly 2 segments (one per variant)
- Metrics: Side-by-side comparison of variant performance


### 4. Round Robin

**Use this type when:** You want to cycle through a sequence of offers for the same audience over time.

**How it works:**
- Define a single segment (audience)
- Create a sequence of offers that are sent one after another
- Each offer is sent at its scheduled time to the same segment
- Useful for progressive engagement or multi-step campaigns

**Configuration:**
- Segment: One segment receives sequential offers
- Offer Sequence: Multiple offers in order
- Timing: Each offer is sent according to its schedule within the campaign timeline
- Use case: Progressive discounts, multi-step nurturing campaigns


### 5. Multiple Level

**Use this type when:** You want to send different offers based on customer response or tier progression through sequential offers.

**How it works:**
- Define a single segment (audience)
- Create a tiered or leveled offer sequence
- Offers are sent progressively, potentially based on customer engagement or tier
- Moves customers through defined offer levels

**Configuration:**
- Segment: One segment receives tiered/leveled offers
- Offer Sequence: Multiple offers in progression
- Levels: Customers progress through offer tiers
- Use case: Tiered loyalty programs, escalating engagement campaigns

<!-- ---

## Key Differences

| Aspect | Multiple Target Group | Champion Challenger | A/B Testing | Round Robin | Multiple Level |
|--------|----------------------|-------------------|------------|------------|----------------|
| **Segments** | Multiple | Multiple (1 champion + 1+ challengers) | Exactly 2 | 1 | 1 |
| **Offers** | One per segment | Different per segment | Two variants | Sequential | Sequential |
| **Execution** | Parallel | Parallel | Parallel | Sequential | Sequential |
| **Purpose** | Different offers to different groups | Test new vs. proven | Two variants head-to-head | Progressive offers | Tiered offers | -->
