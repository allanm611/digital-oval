# Complete CVM Campaign System Explanation

## How Everything Connects - Reference Guide

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Customer 360 Profile](#customer-360-profile)
3. [Campaign Creation Flow](#campaign-creation-flow)
4. [How Segments Work](#how-segments-work)
5. [How Offers Connect](#how-offers-connect)
6. [How Creatives Work](#how-creatives-work)
7. [Variable Replacement System](#variable-replacement-system)
8. [Campaign Execution & Job Management](#campaign-execution--job-management)
9. [Job Management Infrastructure](#job-management-infrastructure)
10. [Complete Data Flow](#complete-data-flow)
11. [Real-World Example](#real-world-example)
12. [Manual Broadcasts](#manual-broadcasts)

---

## System Overview

### What is a CVM Platform?

**CVM (Customer Value Management)** is a system that sends personalized marketing messages to customers based on their behavior, preferences, and segment membership.

### Key Components:

```
┌─────────────────────────────────────────────────────────┐
│                    CVM PLATFORM                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. CAMPAIGNS                                            │
│     └─ Orchestrates everything                           │
│                                                           │
│  2. SEGMENTS                                             │
│     └─ Defines WHO to target (customer groups)          │
│                                                           │
│  3. OFFERS                                               │
│     └─ Defines WHAT to send (products, rewards)         │
│                                                           │
│  4. CREATIVES                                            │
│     └─ Defines HOW to say it (message content)          │
│                                                           │
│  5. PRODUCTS                                             │
│     └─ What customer receives                           │
│                                                           │
│  6. REWARDS                                              │
│     └─ Incentives for customers                          │
│                                                           │
│  7. TRACKING                                             │
│     └─ How to measure success                            │
│                                                           │
│  8. JOB MANAGEMENT                                       │
│     └─ Executes everything automatically                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Customer 360 Profile

### What is Customer 360?

**Customer 360** is a comprehensive, unified view of a customer that aggregates all available data about them from multiple sources into a single profile. In a CVM platform, it provides marketers with complete customer context to make informed decisions about campaigns, offers, and communications.

The "360" refers to a complete, all-around view of the customer - like seeing them from every angle (360 degrees).

### Why Customer 360 Matters in CVM:

Customer 360 data is the foundation for:

- **Personalization**: Tailor offers and messages to individual customer preferences
- **Segmentation**: Create targeted customer groups based on shared characteristics
- **Value Management**: Identify high-value customers and optimize their experience
- **Churn Prevention**: Spot at-risk customers early and take action
- **Cross-selling**: Recommend relevant products based on behavior and preferences
- **Channel Optimization**: Use preferred communication channels and optimal timing

### Core Components of Customer 360:

#### 1. **Identity & Demographics**

Basic customer information that identifies who they are:

```javascript
{
  // Primary Identifiers
  customer_id: 12345,
  msisdn: "+254712345678",  // Phone number
  email: "john.doe@example.com",
  account_number: "ACC-12345",

  // Personal Information
  name: "John Doe",
  first_name: "John",
  last_name: "Doe",
  age: 35,
  gender: "Male",
  date_of_birth: "1989-05-15",

  // Location
  country: "Kenya",
  city: "Nairobi",
  region: "Nairobi County",
  postal_code: "00100",
  timezone: "Africa/Nairobi",

  // Account Details
  account_status: "active",
  registration_date: "2020-03-15",
  customer_since: "2020-03-15",  // How long they've been a customer
}
```

**Use Cases:**

- Personalize messages: "Hi John, ..."
- Location-based offers: "Special deals in Nairobi"
- Age-appropriate content: Different offers for different age groups

---

#### 2. **Device & Technology**

Information about the customer's devices and technology preferences:

```javascript
{
  // Device Information
  device_type: "mobile",  // mobile, tablet, desktop
  device_category: "smartphone",  // smartphone, feature_phone
  device_model: "iPhone 12",
  operating_system: "iOS",
  os_version: "15.4.1",
  browser: "Safari",
  browser_version: "15.4",

  // Network Information
  network_type: "4G",  // 2G, 3G, 4G, 5G, WiFi
  carrier: "Equitel",
  connection_quality: "high",

  // App Information
  app_version: "2.5.3",
  app_installed: true,
  last_app_activity: "2024-06-01T10:30:00Z",
}
```

**Use Cases:**

- Device-specific offers: "Get our iOS app exclusive deal"
- Network-aware content: Optimize for 4G vs 3G users
- App engagement: Target users who haven't opened the system recently

---

#### 3. **Revenue & Financial**

Complete financial picture of the customer's value:

```javascript
{
  // Revenue Metrics
  lifetime_value: 50000.00,  // Total revenue from this customer
  monthly_revenue: 5000.00,  // Average monthly revenue
  total_spent: 45000.00,  // Total amount spent
  average_transaction_value: 500.00,  // Average per transaction

  // Transaction History
  total_transactions: 90,
  purchase_frequency: "high",  // high, medium, low
  last_purchase_date: "2024-05-28",
  last_purchase_amount: 750.00,
  days_since_last_purchase: 4,

  // Payment Information
  payment_methods: ["mobile_money", "credit_card"],
  preferred_payment_method: "mobile_money",
  payment_success_rate: 0.98,  // 98% success rate

  // Account Balance
  current_balance: 1500.00,
  credit_limit: 10000.00,
  outstanding_debt: 0.00,

  // Revenue Trends
  revenue_trend: "increasing",  // increasing, stable, decreasing
  monthly_revenue_change: 0.15,  // 15% increase from last month
}
```

**Use Cases:**

- High-value customer targeting: "VIP customers with LTV > $10,000"
- Win-back campaigns: "Customers who haven't purchased in 30+ days"
- Upselling: Target customers with high transaction values

---

#### 4. **Behavioral & Engagement**

How the customer interacts with the brand:

```javascript
{
  // Engagement Metrics
  engagement_score: 85,  // 0-100, calculated score
  engagement_level: "high",  // high, medium, low
  last_activity_date: "2024-06-01",
  days_since_last_activity: 0,

  // Communication Preferences
  preferred_channel: "SMS",  // SMS, Email, WhatsApp, Push, In-App
  preferred_language: "en",  // en, fr, sw, es
  preferred_communication_time: "morning",  // morning, afternoon, evening
  opt_in_status: {
    sms: true,
    email: true,
    whatsapp: false,
    push: true,
  },

  // Response Rates
  sms_response_rate: 0.75,  // 75% response rate
  email_open_rate: 0.60,  // 60% open rate
  email_click_rate: 0.25,  // 25% click rate
  campaign_response_rate: 0.45,  // 45% overall response

  // Interaction History
  total_campaigns_received: 50,
  total_campaigns_responded: 22,
  last_campaign_response: "2024-05-20",

  // Session Data
  average_session_duration: 300,  // seconds
  sessions_per_week: 5,
  last_session_date: "2024-06-01",
}
```

**Use Cases:**

- Channel selection: Send SMS to customers who prefer SMS
- Language personalization: Send Swahili messages to Swahili speakers
- Engagement-based targeting: "High engagement customers" segment
- Optimal timing: Send messages at preferred times

---

#### 5. **Subscription & Services**

Active subscriptions and service usage:

```javascript
{
  // Active Subscriptions
  subscriptions: [
    {
      id: 101,
      name: "Premium Data Plan",
      status: "active",
      start_date: "2024-01-01",
      renewal_date: "2024-07-01",
      monthly_cost: 2000.00,
      plan_type: "premium",
    },
    {
      id: 102,
      name: "Voice Minutes Bundle",
      status: "active",
      start_date: "2024-03-15",
      renewal_date: "2024-06-15",
      monthly_cost: 500.00,
      plan_type: "standard",
    },
  ],

  // Service Status
  total_active_services: 2,
  service_status: "active",  // active, suspended, cancelled
  account_tier: "premium",  // premium, standard, basic

  // Usage Statistics
  data_usage_gb: 8.5,
  data_limit_gb: 10.0,
  voice_minutes_used: 120,
  voice_minutes_limit: 200,

  // Product History
  products_purchased: [
    { product_id: 201, name: "10GB Data Bundle", purchase_date: "2024-05-15" },
    { product_id: 202, name: "Voice Minutes", purchase_date: "2024-05-20" },
  ],
}
```

**Use Cases:**

- Service-based targeting: "Premium plan customers"
- Renewal campaigns: "Customers with subscriptions expiring soon"
- Usage-based offers: "Customers using 80%+ of data limit"

---

#### 6. **Risk & Health Indicators**

Customer health and risk assessment:

```javascript
{
  // Churn Risk
  churn_risk: "low",  // low, medium, high
  churn_risk_score: 0.25,  // 0-1, probability of churning
  churn_risk_factors: [
    "declining_engagement",
    "reduced_purchase_frequency"
  ],

  // Satisfaction
  satisfaction_score: 85,  // 0-100
  satisfaction_level: "high",  // high, medium, low
  last_satisfaction_survey: "2024-05-01",

  // Complaints & Support
  total_complaints: 2,
  complaints_last_30_days: 0,
  support_tickets: 5,
  support_tickets_last_30_days: 1,
  average_resolution_time: 24,  // hours

  // Payment Health
  payment_delinquency: false,
  late_payments: 0,
  payment_delinquency_days: 0,
  credit_score: 750,

  // Account Health
  account_health: "good",  // excellent, good, fair, poor
  account_health_score: 0.85,  // 0-1
  health_indicators: {
    active_usage: true,
    timely_payments: true,
    no_complaints: true,
  },
}
```

**Use Cases:**

- Churn prevention: "High churn risk customers" segment
- Retention campaigns: Target at-risk customers with special offers
- Support prioritization: Focus on customers with multiple complaints

---

#### 7. **Campaign & Marketing History**

Customer's interaction with marketing campaigns:

```javascript
{
  // Campaign Participation
  campaigns_received: 50,
  campaigns_responded: 22,
  campaigns_redeemed: 15,
  campaign_response_rate: 0.44,  // 44%

  // Offer History
  offers_received: 75,
  offers_redeemed: 20,
  offer_redemption_rate: 0.27,  // 27%
  last_offer_redemption: "2024-05-25",

  // Campaign Preferences
  preferred_campaign_types: ["promotional", "discount"],
  least_preferred_types: ["newsletter", "survey"],

  // Redemption History
  redemptions: [
    {
      offer_id: 456,
      campaign_id: 789,
      redeemed_at: "2024-05-25",
      reward_value: 200.00,
      status: "used",
    },
  ],

  // Conversion Tracking
  total_conversions: 15,
  conversion_rate: 0.30,  // 30%
  last_conversion_date: "2024-05-25",
}
```

**Use Cases:**

- Campaign effectiveness: See which campaigns this customer responds to
- Offer optimization: Learn what types of offers work best
- Frequency management: Avoid over-messaging customers

---

#### 8. **Temporal & Lifecycle Data**

Customer journey and lifecycle stage:

```javascript
{
  // Lifecycle Stage
  lifecycle_stage: "active",  // new, active, at_risk, churned, win_back
  customer_journey_stage: "loyalty",  // awareness, consideration, purchase, loyalty

  // Temporal Metrics
  customer_since: "2020-03-15",
  days_as_customer: 1509,  // ~4 years
  account_age_days: 1509,

  // Recency
  recency_score: 95,  // 0-100, how recent their activity
  recency_category: "very_recent",  // very_recent, recent, moderate, old, very_old
  last_interaction_date: "2024-06-01",
  days_since_last_interaction: 0,

  // Frequency
  frequency_score: 80,  // 0-100, how often they interact
  frequency_category: "high",  // high, medium, low
  interactions_last_30_days: 12,

  // Monetary
  monetary_score: 90,  // 0-100, how much they spend
  monetary_category: "high",  // high, medium, low

  // RFM Analysis
  rfm_segment: "champions",  // champions, loyal_customers, potential_loyalists, etc.
  rfm_score: "555",  // Recency=5, Frequency=5, Monetary=5 (best)
}
```

**Use Cases:**

- Lifecycle-based campaigns: "New customers" vs "Loyal customers"
- RFM segmentation: Target "champions" differently than "at risk"
- Win-back campaigns: Target "churned" customers

---

### How Customer 360 Data is Used in CVM:

#### 1. **Segmentation**

Customer 360 data powers segment creation:

```javascript
// Example Segment: "High-Value At-Risk Customers"
{
  name: "High-Value At-Risk Customers",
  conditions: [
    {
      field: "lifetime_value",
      operator: "greater_than",
      value: 10000
    },
    {
      field: "churn_risk",
      operator: "equals",
      value: "high"
    },
    {
      field: "days_since_last_purchase",
      operator: "greater_than",
      value: 30
    }
  ]
}

// This segment finds customers who:
// - Have spent more than $10,000 (high value)
// - Are at high risk of churning
// - Haven't purchased in 30+ days
```

#### 2. **Personalization**

Customer 360 enables message personalization:

```javascript
// Creative Template
"Hi {{name}}! Your current balance is {{current_balance}}.
Get {{amount}} OFF on {{product_name}}.
Valid until {{expiry_date}}."

// Customer 360 Data
{
  name: "John Doe",
  current_balance: 1500.00,
  preferred_language: "en",
  preferred_channel: "SMS"
}

// Personalized Message
"Hi John Doe! Your current balance is 1500.00.
Get KES 500 OFF on 10GB Data Bundle.
Valid until June 30, 2024."
```

#### 3. **Channel Selection**

Customer 360 determines the best communication channel:

```javascript
// System logic
if (customer.preferred_channel === "SMS" && customer.opt_in_status.sms) {
  sendViaSMS();
} else if (
  customer.preferred_channel === "Email" &&
  customer.opt_in_status.email
) {
  sendViaEmail();
} else {
  // Fallback to default channel
  sendViaSMS();
}
```

#### 4. **Offer Selection**

Customer 360 helps determine which offers to send:

```javascript
// Campaign manager logic
if (customer.lifetime_value > 50000 && customer.engagement_score > 80) {
  // High-value, highly engaged customer
  offer = "Premium VIP Offer";
} else if (customer.churn_risk === "high") {
  // At-risk customer
  offer = "Retention Offer";
} else if (customer.lifecycle_stage === "new") {
  // New customer
  offer = "Welcome Offer";
}
```

#### 5. **Timing Optimization**

Customer 360 determines when to send messages:

```javascript
// Optimal send time based on customer data
if (customer.preferred_communication_time === "morning") {
  sendTime = "08:00";
} else if (customer.preferred_communication_time === "evening") {
  sendTime = "18:00";
} else {
  // Default to business hours
  sendTime = "10:00";
}
```

---

### Customer 360 Data Sources:

Customer 360 data comes from multiple systems:

```
┌─────────────────────────────────────────────────────────┐
│              CUSTOMER 360 DATA SOURCES                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. CUSTOMER DATABASE                                    │
│     └─ Registration data, account info, demographics     │
│                                                           │
│  2. TRANSACTION SYSTEM                                   │
│     └─ Purchase history, payment data, revenue           │
│                                                           │
│  3. SUBSCRIPTION SYSTEM                                  │
│     └─ Active services, plan details, usage              │
│                                                           │
│  4. CAMPAIGN SYSTEM                                      │
│     └─ Campaign participation, response rates           │
│                                                           │
│  5. ANALYTICS SYSTEM                                     │
│     └─ Engagement scores, behavior patterns              │
│                                                           │
│  6. SUPPORT SYSTEM                                       │
│     └─ Complaints, tickets, satisfaction scores          │
│                                                           │
│  7. DEVICE TRACKING                                      │
│     └─ Device type, OS, app usage                        │
│                                                           │
│  8. COMMUNICATION SYSTEM                                 │
│     └─ Channel preferences, opt-in status               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

### Real-World Example: Using Customer 360

**Scenario:** A customer named Jane Smith

#### Customer 360 Profile:

```javascript
{
  // Identity
  name: "Jane Smith",
  age: 28,
  city: "Nairobi",
  customer_since: "2021-06-15",

  // Device
  device_type: "iPhone 13",
  os: "iOS 16",

  // Revenue
  lifetime_value: 35000.00,
  monthly_revenue: 3000.00,
  last_purchase_date: "2024-05-20",  // 12 days ago
  days_since_last_purchase: 12,

  // Engagement
  engagement_score: 75,
  preferred_channel: "SMS",
  preferred_language: "en",
  campaign_response_rate: 0.60,

  // Risk
  churn_risk: "medium",
  churn_risk_score: 0.45,

  // Lifecycle
  lifecycle_stage: "active",
  rfm_segment: "loyal_customers",
}
```

#### How Campaign Manager Uses This:

1. **Segmentation Decision:**
   - Jane matches: "Active customers with medium churn risk"
   - Segment: "At-Risk Loyal Customers"

2. **Offer Selection:**
   - High lifetime value ($35,000) → Premium offer
   - Medium churn risk → Retention-focused offer
   - Result: "Win-Back Premium Offer" with 20% discount

3. **Channel Selection:**
   - Preferred channel: SMS → Send via SMS
   - Preferred language: English → Use English creative

4. **Message Personalization:**
   - Template: "Hi {{name}}, we miss you! Get {{amount}} OFF..."
   - Personalized: "Hi Jane Smith, we miss you! Get 20% OFF..."

5. **Timing:**
   - Based on historical data: Jane responds best to morning messages
   - Send at: 09:00 AM

**Result:** Jane receives a personalized SMS at 9 AM with a premium retention offer, increasing the likelihood of re-engagement.

---

### Key Takeaways:

1. **Customer 360 is Comprehensive**
   - Aggregates data from multiple sources
   - Provides complete customer context
   - Enables informed decision-making

2. **Data Powers Personalization**
   - Every field can be used for personalization
   - Variables in messages come from Customer 360
   - Channel and timing based on preferences

3. **Segmentation Relies on Customer 360**
   - Segment conditions query Customer 360 fields
   - Dynamic segments update as data changes
   - Enables precise targeting

4. **Value Management Uses Customer 360**
   - Identify high-value customers
   - Spot at-risk customers early
   - Optimize customer experience

5. **Continuous Updates**
   - Customer 360 data updates in real-time
   - Campaigns use current data at send time
   - Ensures accuracy and relevance

---

## Campaign Creation Flow

### Step-by-Step Process:

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: CREATE CAMPAIGN                                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User fills in:                                          │
│  - Campaign Name: "Summer Sale 2024"                    │
│  - Description: "Promote summer products"               │
│  - Objective: "retention"                                │
│  - Campaign Type: "multiple_target_group"               │
│  - Status: "draft"                                        │
│                                                           │
│  Backend stores in: campaigns table                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: DEFINE AUDIENCE (SEGMENTS)                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User selects/creates segments:                          │
│                                                           │
│  Segment 1: "VIP Customers in Nairobi"                   │
│    Conditions:                                            │
│    - tier = "VIP"                                         │
│    - city = "Nairobi"                                     │
│    - last_purchase < 30 days ago                         │
│                                                           │
│  Segment 2: "New Customers"                              │
│    Conditions:                                            │
│    - account_age < 7 days                                │
│    - first_purchase = true                               │
│                                                           │
│  Backend stores in:                                      │
│  - segments table (if new segment)                       │
│  - campaign_segment_mappings table                       │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: MAP OFFERS TO SEGMENTS                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User maps:                                               │
│  - Segment 1 → Offer A, Offer B                          │
│  - Segment 2 → Offer C                                   │
│                                                           │
│  Backend stores in:                                      │
│  - campaign_segment_offer_mappings table                 │
│                                                           │
│  Note: Offers are PRE-CREATED with:                      │
│  - Products (what customer gets)                         │
│  - Creatives (message content)                           │
│  - Rewards (incentives)                                   │
│  - Tracking (measurement)                                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: SCHEDULE CAMPAIGN                                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User sets:                                               │
│  - Start Date: 2024-06-01 08:00                          │
│  - End Date: 2024-06-30 23:59                            │
│  - Timezone: "Africa/Nairobi"                             │
│  - Recurrence: None (one-time)                           │
│                                                           │
│  Backend updates:                                         │
│  - campaigns.start_date                                   │
│  - campaigns.end_date                                     │
│  - campaigns.timezone                                     │
│  - campaigns.status = "scheduled"                        │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: APPROVE & ACTIVATE                               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Manager approves campaign                                │
│  Backend updates:                                         │
│  - campaigns.approval_status = "approved"               │
│  - campaigns.status = "active" (when start_date reached) │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## How Segments Work

### What is a Segment?

A **segment** is a group of customers that share common characteristics or behaviors.

### Segment Structure:

```javascript
// Segment Definition Example
{
  id: 123,
  name: "VIP Customers in Nairobi",
  type: "dynamic",  // Can be: static, dynamic, behavioral

  // CONDITIONS - These define WHO qualifies
  criteria: {
    conditions: [
      {
        field: "tier",
        operator: "equals",
        value: "VIP"
      },
      {
        field: "city",
        operator: "equals",
        value: "Nairobi"
      },
      {
        field: "last_purchase_date",
        operator: "less_than",
        value: "30 days ago"
      }
    ],
    logic: "AND"  // All conditions must be true
  },

  // ESTIMATED SIZE
  size_estimate: 1000,  // ~1000 customers match

  // MEMBERS (calculated when segment is evaluated)
  members: [
    { customer_id: 123, name: "John Doe", ... },
    { customer_id: 456, name: "Jane Smith", ... },
    // ... more customers
  ]
}
```

### How Segments Are Evaluated:

```sql
-- Backend converts segment conditions to SQL query
-- Example: "VIP Customers in Nairobi"

SELECT
  customer_id,
  name,
  email,
  phone,
  tier,
  city,
  last_purchase_date
FROM customers
WHERE
  tier = 'VIP'
  AND city = 'Nairobi'
  AND last_purchase_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND is_active = true
  AND opted_out = false;

-- Returns: List of customer IDs that match
-- [123, 456, 789, 1011, ...]
```

### Segment Types:

1. **Static Segment**: Fixed list of customers
   - Manually selected customers
   - Example: "Top 100 customers"

2. **Dynamic Segment**: Conditions-based
   - Automatically updates as customers change
   - Example: "VIP customers in Nairobi"

3. **Behavioral Segment**: Based on actions
   - Example: "Customers who clicked but didn't purchase"

---

## How Offers Connect

### What is an Offer?

An **offer** is a complete package that includes:

- Products (what customer gets)
- Creatives (how to communicate)
- Rewards (incentives)
- Tracking (measurement)

### Offer Structure:

```javascript
// Complete Offer Example
{
  id: 456,
  name: "Summer Data Bundle Offer",
  description: "Special summer promotion",
  status: "active",

  // 1. PRODUCTS - What customer receives
  products: [
    {
      id: 789,
      name: "10GB Data Bundle",
      type: "data",
      value: "10GB",
      price: 500
    }
  ],

  // 2. CREATIVES - Message content (multiple languages/channels)
  creatives: [
    {
      id: 101,
      channel: "SMS",
      locale: "en",
      title: "Equitel",  // Sender ID for SMS
      text_body: "Hi {{name}}! Get {{amount}} OFF. Code: {{code}}",
      variables: {
        amount: "KES 500",
        code: "SUMMER2024"
      }
    },
    {
      id: 102,
      channel: "SMS",
      locale: "sw",  // Swahili version
      title: "Equitel",
      text_body: "Hujambo {{name}}! Pata punguzo la {{amount}}. Nambari: {{code}}",
      variables: {
        amount: "KES 500",
        code: "SUMMER2024"
      }
    },
    {
      id: 103,
      channel: "Email",
      locale: "en",
      title: "Summer Special Offer",
      html_body: "<h1>Hi {{name}}!</h1><p>Get {{amount}} OFF...</p>",
      variables: {
        amount: "KES 500",
        code: "SUMMER2024"
      }
    }
  ],

  // 3. REWARDS - Incentives
  rewards: [
    {
      id: 201,
      type: "credit",
      value: 200,
      currency: "KES",
      description: "KES 200 account credit"
    }
  ],

  // 4. TRACKING - How to measure
  tracking_sources: [
    {
      id: 301,
      source: "campaign_code",
      value: "SUMMER2024",
      description: "Campaign tracking code"
    },
    {
      id: 302,
      source: "utm_source",
      value: "cvm_campaign",
      description: "UTM parameter"
    }
  ]
}
```

### How Offers Are Created:

```
┌─────────────────────────────────────────────────────────┐
│ OFFER CREATION PROCESS                                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Create Offer Base                                    │
│     - Name, Description, Status                          │
│                                                           │
│  2. Add Products                                         │
│     - Link existing products                             │
│     - Define what customer receives                      │
│                                                           │
│  3. Create Creatives                                     │
│     - For each channel (SMS, Email, etc.)               │
│     - For each language (en, fr, sw, etc.)               │
│     - Define message content                             │
│     - Set variables ({{name}}, {{amount}}, etc.)         │
│                                                           │
│  4. Add Rewards                                          │
│     - Define incentives                                  │
│     - Credit, discount, bonus, etc.                     │
│                                                           │
│  5. Configure Tracking                                   │
│     - Campaign codes                                     │
│     - UTM parameters                                     │
│     - Analytics tags                                     │
│                                                           │
│  Result: Complete offer ready to use in campaigns        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### How Offers Connect to Campaigns:

```javascript
// Campaign Segment Offer Mapping
{
  campaign_id: 789,
  segment_id: 123,  // "VIP Customers in Nairobi"
  offer_id: 456,     // "Summer Data Bundle Offer"

  // Additional mapping config (for Round Robin, Multiple Level)
  interval_config: null,      // For Round Robin campaigns
  condition_config: null,     // For Multiple Level campaigns
  priority: 1                 // Order of execution
}

// This means:
// "When campaign 789 runs, send offer 456 to segment 123"
```

---

## How Creatives Work

### What is a Creative?

A **creative** is the actual message content that customers receive. It includes:

- Channel (SMS, Email, Push, etc.)
- Language/Locale (en, fr, sw, etc.)
- Content (text, HTML)
- Variables (placeholders for personalization)

### Creative Structure:

```javascript
// SMS Creative Example
{
  id: 101,
  offer_id: 456,
  channel: "SMS",
  locale: "en",

  // For SMS: title = Sender ID
  title: "Equitel",  // This is the Sender ID (max 12 chars)

  // Message content with variables
  text_body: "Hi {{name}}! Get {{amount}} OFF on {{product_name}}. Use code: {{code}}. Valid until {{expiry_date}}.",

  // Variables that will be replaced
  variables: {
    // Static variables (same for all customers)
    amount: "KES 500",
    product_name: "10GB Data Bundle",
    code: "SUMMER2024",
    expiry_date: "2024-06-30",

    // Dynamic variables (from customer profile - replaced at send time)
    // {{name}} - comes from customer.name
    // {{email}} - comes from customer.email
    // etc.
  },

  // SMS Route (which gateway to use)
  sms_route: "Route 1",

  // Character count
  // Calculated: Sender ID + ": " + message = total chars
  // If > 160 chars, splits into multiple SMS
}
```

### Creative Selection Logic:

```javascript
// When sending to a customer, system selects creative:

function selectCreative(customer, offer) {
  // 1. Get customer's preferred language
  const customerLanguage = customer.preferred_language; // e.g., "en", "sw"

  // 2. Get customer's preferred channel
  const customerChannel = customer.preferred_channel; // e.g., "SMS", "Email"

  // 3. Find matching creative
  const creative = offer.creatives.find(
    (c) =>
      c.channel === customerChannel &&
      c.locale === customerLanguage &&
      c.is_active === true,
  );

  // 4. Fallback if no exact match
  if (!creative) {
    // Try same channel, default language (en)
    creative = offer.creatives.find(
      (c) =>
        c.channel === customerChannel &&
        c.locale === "en" &&
        c.is_active === true,
    );
  }

  return creative;
}

// Example:
// Customer: { preferred_language: "sw", preferred_channel: "SMS" }
// Offer has: SMS creative in "sw" → Use it!
// Offer has: SMS creative in "en" only → Use English as fallback
```

### Creative Variables:

```javascript
// Two types of variables:

// 1. STATIC VARIABLES (from offer.creatives[].variables)
//    - Same for ALL customers
//    - Set when creating the creative
{
  amount: "KES 500",
  code: "SUMMER2024",
  expiry_date: "2024-06-30"
}

// 2. DYNAMIC VARIABLES (from customer profile)
//    - Different for EACH customer
//    - Fetched from customer database at send time
{
  name: customer.name,           // "John Doe"
  email: customer.email,          // "john@example.com"
  phone: customer.phone,          // "+254700000000"
  account_balance: customer.balance,  // 1500.00
  last_purchase: customer.last_purchase_date,  // "2024-05-15"
  // ... any field from customer table
}
```

---

## Variable Replacement System

### How Variables Work:

```javascript
// STEP 1: Creative Template (stored in database)
const creative = {
  text_body:
    "Hi {{name}}! Your balance is {{account_balance}}. Get {{amount}} OFF. Code: {{code}}",
  variables: {
    amount: "KES 500",
    code: "SUMMER2024",
  },
};

// STEP 2: Customer Profile (fetched from database at send time)
const customer = {
  customer_id: 123,
  name: "John Doe",
  email: "john@example.com",
  phone: "+254700000000",
  account_balance: 1500.0,
  preferred_language: "en",
  preferred_channel: "SMS",
};

// STEP 3: Variable Replacement Function
function replaceVariables(template, customer, offerVariables) {
  let message = template;

  // Replace dynamic variables (from customer)
  message = message.replace(/\{\{name\}\}/g, customer.name);
  message = message.replace(
    /\{\{account_balance\}\}/g,
    customer.account_balance,
  );
  message = message.replace(/\{\{email\}\}/g, customer.email);
  // ... replace all customer fields

  // Replace static variables (from offer)
  message = message.replace(/\{\{amount\}\}/g, offerVariables.amount);
  message = message.replace(/\{\{code\}\}/g, offerVariables.code);
  // ... replace all offer variables

  return message;
}

// STEP 4: Result
const finalMessage = replaceVariables(
  creative.text_body,
  customer,
  creative.variables,
);

// Output: "Hi John Doe! Your balance is 1500.00. Get KES 500 OFF. Code: SUMMER2024"
```

### Variable Sources:

```
┌─────────────────────────────────────────────────────────┐
│ VARIABLE REPLACEMENT SOURCES                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  {{name}}              → customer.name                   │
│  {{email}}             → customer.email                  │
│  {{phone}}             → customer.phone                   │
│  {{account_balance}}   → customer.account_balance         │
│  {{city}}              → customer.city                    │
│  {{tier}}              → customer.tier                    │
│  ... (any customer field)                                │
│                                                           │
│  {{amount}}            → creative.variables.amount        │
│  {{code}}              → creative.variables.code         │
│  {{expiry_date}}       → creative.variables.expiry_date   │
│  {{product_name}}      → creative.variables.product_name  │
│  ... (any offer variable)                                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### How Customer Data is Retrieved:

```javascript
// When campaign runs, backend does this:

// 1. Evaluate Segment (get customer IDs)
const segmentQuery = `
  SELECT customer_id 
  FROM customers 
  WHERE tier = 'VIP' AND city = 'Nairobi'
`;
const customerIds = await db.query(segmentQuery);
// Result: [123, 456, 789, ...]

// 2. Fetch Customer Profiles (for each customer_id)
for (const customerId of customerIds) {
  const customer = await db.query(
    `SELECT * FROM customers WHERE customer_id = ?`,
    [customerId],
  );
  // Result: { customer_id: 123, name: "John Doe", email: "...", ... }

  // 3. Select Creative (based on customer preferences)
  const creative = selectCreative(customer, offer);

  // 4. Replace Variables
  const message = replaceVariables(
    creative.text_body,
    customer,
    creative.variables,
  );

  // 5. Send Message
  await sendMessage(customer, message, creative.channel);
}
```

---

## Campaign Execution & Job Management

### What is Job Management?

**Job Management** is the backend system that automatically executes campaigns when they become active. It processes everything asynchronously in the background.

### Job Flow:

```
┌─────────────────────────────────────────────────────────┐
│ JOB 1: CAMPAIGN ACTIVATION                               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: When campaign.start_date is reached            │
│                                                           │
│  Process:                                                 │
│  1. Check if campaign is approved                         │
│  2. Update campaign.status = "active"                    │
│  3. Queue Segment Evaluation Job                          │
│                                                           │
│  Status: pending → processing → completed                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 2: SEGMENT EVALUATION                                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: After campaign activation                       │
│                                                           │
│  Process:                                                 │
│  1. For each segment in campaign:                        │
│     - Convert segment.criteria to SQL query             │
│     - Execute query against customer database            │
│     - Get list of customer_ids that match                │
│                                                           │
│  2. Apply Control Group (if enabled):                    │
│     - Exclude X% of customers (e.g., 10%)                │
│     - Randomly select who to exclude                     │
│                                                           │
│  3. Store results:                                        │
│     - campaign_participants table                        │
│     - customer_id, segment_id, campaign_id               │
│                                                           │
│  Output: List of customer_ids to send to                 │
│  Example: [123, 456, 789, 1011, ...]                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 3: CUSTOMER PROFILE FETCH                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: After segment evaluation                        │
│                                                           │
│  Process:                                                 │
│  For each customer_id from segment:                       │
│    1. Fetch full customer profile from database          │
│       SELECT * FROM customers WHERE customer_id = ?      │
│                                                           │
│    2. Get customer preferences:                         │
│       - preferred_language (en, fr, sw, etc.)           │
│       - preferred_channel (SMS, Email, etc.)            │
│       - timezone                                          │
│       - opt_out status                                    │
│                                                           │
│    3. Check communication policies:                      │
│       - DND (Do Not Disturb) hours                       │
│       - Frequency limits                                 │
│       - Channel preferences                              │
│                                                           │
│  Output: Full customer objects with all data             │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 4: OFFER SELECTION                                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: After customer profiles fetched                │
│                                                           │
│  Process:                                                 │
│  For each customer:                                       │
│    1. Get mapped offers for their segment                │
│       (from campaign_segment_offer_mappings)             │
│                                                           │
│    2. For Round Robin campaigns:                         │
│       - Check intervals (wait X days between offers)    │
│       - Select next offer in sequence                    │
│                                                           │
│    3. For Multiple Level campaigns:                     │
│       - Evaluate conditions                              │
│       - Select offer based on customer state             │
│                                                           │
│    4. For other campaigns:                               │
│       - Select all mapped offers                         │
│                                                           │
│  Output: List of (customer, offer) pairs                │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 5: CREATIVE SELECTION                                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: After offer selection                           │
│                                                           │
│  Process:                                                 │
│  For each (customer, offer) pair:                        │
│    1. Get customer preferences:                          │
│       - preferred_language                               │
│       - preferred_channel                                │
│                                                           │
│    2. Find matching creative:                            │
│       - channel = customer.preferred_channel             │
│       - locale = customer.preferred_language             │
│       - is_active = true                                 │
│                                                           │
│    3. Fallback logic:                                    │
│       - If no match, try same channel + "en"             │
│       - If still no match, use first active creative     │
│                                                           │
│  Output: (customer, offer, creative) triplets            │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 6: VARIABLE REPLACEMENT (CREATIVE RENDERING)         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: After creative selection                       │
│                                                           │
│  Process:                                                 │
│  For each (customer, offer, creative):                   │
│    1. Get creative template:                             │
│       text_body: "Hi {{name}}! Get {{amount}} OFF..."   │
│                                                           │
│    2. Get customer data:                                 │
│       customer.name = "John Doe"                         │
│       customer.email = "john@example.com"                │
│       ...                                                 │
│                                                           │
│    3. Get offer variables:                               │
│       creative.variables.amount = "KES 500"             │
│       creative.variables.code = "SUMMER2024"            │
│                                                           │
│    4. Replace all variables:                             │
│       {{name}} → "John Doe"                              │
│       {{amount}} → "KES 500"                             │
│       {{code}} → "SUMMER2024"                            │
│                                                           │
│    5. Validate message:                                  │
│       - SMS: Check character count                       │
│       - Email: Validate HTML                             │
│       - Check for missing variables                      │
│                                                           │
│  Output: Fully rendered, personalized messages           │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 7: MESSAGE DELIVERY                                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: After variable replacement                      │
│                                                           │
│  Process:                                                 │
│  For each rendered message:                              │
│                                                           │
│    If channel = "SMS":                                   │
│      1. Get SMS route from creative.variables.sms_route  │
│      2. Get sender ID from creative.title                 │
│      3. Send via SMS Gateway (Route 1, Route 2, etc.)    │
│      4. Track delivery status                            │
│                                                           │
│    If channel = "Email":                                 │
│      1. Get email template (creative.html_body)           │
│      2. Send via Email Service                            │
│      3. Track opens, clicks                              │
│                                                           │
│    If channel = "Push":                                  │
│      1. Get push notification content                    │
│      2. Send via Push Notification Service                │
│      3. Track delivery                                   │
│                                                           │
│  Output: Delivery status for each message                │
│  - sent, delivered, failed, bounced                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 8: REWARD DISTRIBUTION                               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: After message delivery (or on customer action)   │
│                                                           │
│  Process:                                                 │
│  For each customer who:                                   │
│    - Received message AND                                │
│    - Took action (clicked, redeemed, etc.)              │
│                                                           │
│    1. Get offer rewards:                                 │
│       - Credit: KES 200                                  │
│       - Discount: 10%                                    │
│       - Bonus: Extra data                                │
│                                                           │
│    2. Apply rewards to customer account:                 │
│       - Update customer balance                          │
│       - Apply discount code                              │
│       - Add bonus product                                │
│                                                           │
│    3. Track redemption:                                  │
│       - Update offer_redemptions table                   │
│       - Update campaign metrics                          │
│                                                           │
│  Output: Rewards applied, redemptions tracked            │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ JOB 9: ANALYTICS & TRACKING                              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trigger: Continuously (real-time)                        │
│                                                           │
│  Process:                                                 │
│  1. Track events:                                         │
│     - Message sent                                        │
│     - Message delivered                                   │
│     - Message opened (Email)                              │
│     - Link clicked                                        │
│     - Offer redeemed                                      │
│     - Conversion (purchase, signup, etc.)                │
│                                                           │
│  2. Update campaign metrics:                             │
│     - Total sent                                          │
│     - Delivery rate                                       │
│     - Open rate                                           │
│     - Click rate                                          │
│     - Conversion rate                                     │
│     - Revenue generated                                   │
│                                                           │
│  3. Update dashboard:                                     │
│     - Real-time statistics                                │
│     - Performance reports                                 │
│                                                           │
│  Output: Updated campaign statistics                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Job Queue System:

```javascript
// Example: How jobs are queued and executed

// When campaign becomes active:
async function activateCampaign(campaignId) {
  // 1. Update campaign status
  await db.update("campaigns", { status: "active" }, { id: campaignId });

  // 2. Queue Segment Evaluation Job
  await jobQueue.add("segment-evaluation", {
    campaignId: campaignId,
    priority: "high",
  });
}

// Job Queue Processor (runs continuously)
jobQueue.process("segment-evaluation", async (job) => {
  const { campaignId } = job.data;

  // Execute segment evaluation
  const customerIds = await evaluateSegments(campaignId);

  // Queue next job: Customer Profile Fetch
  await jobQueue.add("customer-profile-fetch", {
    campaignId: campaignId,
    customerIds: customerIds,
  });
});

// Jobs run in parallel for efficiency
// Example: Process 1000 customers in batches of 100
```

---

## Job Management Infrastructure

### What is Job Management Infrastructure?

**Job Management Infrastructure** is the backend system that orchestrates, schedules, executes, and monitors all automated tasks (jobs) in the CVM platform. It ensures campaigns run smoothly, dependencies are respected, and failures are handled gracefully.

### Key Components:

```
┌─────────────────────────────────────────────────────────┐
│           JOB MANAGEMENT INFRASTRUCTURE                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. JOB TYPES                                            │
│     └─ Categories of jobs (segment-evaluation,          │
│        message-delivery, etc.)                          │
│                                                           │
│  2. SCHEDULED JOBS                                        │
│     └─ Jobs configured to run automatically              │
│        (cron, interval, event-driven)                    │
│                                                           │
│  3. JOB DEPENDENCIES                                     │
│     └─ Relationships between jobs                        │
│        (Job A must complete before Job B starts)         │
│                                                           │
│  4. JOB WORKFLOWS                                        │
│     └─ Steps within a job (SQL, API calls, scripts)     │
│                                                           │
│  5. JOB EXECUTIONS                                       │
│     └─ Actual runs of jobs (tracking, monitoring)        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

### 1. Job Types

**Job Types** are categories that classify different kinds of jobs in the system.

#### Example Job Types:

```javascript
// Common Job Types in CVM Platform:

const jobTypes = [
  {
    id: 1,
    name: "Segment Evaluation",
    code: "segment-evaluation",
    description: "Evaluates segment conditions to find matching customers",
  },
  {
    id: 2,
    name: "Customer Profile Fetch",
    code: "customer-profile-fetch",
    description: "Retrieves full customer profiles for variable replacement",
  },
  {
    id: 3,
    name: "Creative Rendering",
    code: "creative-rendering",
    description: "Replaces variables in creative templates with customer data",
  },
  {
    id: 4,
    name: "Message Delivery",
    code: "message-delivery",
    description: "Sends messages via SMS, Email, or Push channels",
  },
  {
    id: 5,
    name: "Reward Distribution",
    code: "reward-distribution",
    description: "Applies rewards to customer accounts",
  },
  {
    id: 6,
    name: "Analytics & Tracking",
    code: "analytics-tracking",
    description: "Updates campaign metrics and statistics",
  },
];
```

**Purpose:**

- Organize jobs into logical categories
- Enable filtering and searching
- Track job performance by type
- Configure default settings per type

---

### 2. Scheduled Jobs

**Scheduled Jobs** are jobs configured to run automatically based on schedules, events, or dependencies.

#### Schedule Types:

```javascript
// 1. MANUAL - Run only when triggered manually
{
  schedule_type: "manual",
  cron_expression: null,
  interval_seconds: null
}

// 2. CRON - Run on a schedule (e.g., daily at 8 AM)
{
  schedule_type: "cron",
  cron_expression: "0 8 * * *",  // Every day at 8:00 AM
  timezone: "Africa/Nairobi"
}

// 3. INTERVAL - Run every X seconds
{
  schedule_type: "interval",
  interval_seconds: 3600,  // Every hour
  timezone: "Africa/Nairobi"
}

// 4. EVENT_DRIVEN - Run when an event occurs
{
  schedule_type: "event_driven",
  trigger_event_type: "webhook",
  trigger_condition: {
    event: "campaign.activated",
    campaign_id: 123
  }
}

// 5. DEPENDENCY_BASED - Run when dependencies are satisfied
{
  schedule_type: "dependency_based",
  depends_on_jobs: [1, 2, 3],  // Wait for jobs 1, 2, 3
  dependency_mode: "all_success"  // All must succeed
}
```

#### Example: Campaign Activation Job

```javascript
// When a campaign is activated, this job is scheduled
const campaignActivationJob = {
  id: 101,
  name: "Summer Campaign 2024 - Activation",
  code: "campaign-789-activation",
  job_type_id: 1, // Segment Evaluation

  // Schedule: Run immediately when campaign activates
  schedule_type: "event_driven",
  trigger_event_type: "event_bus",
  trigger_condition: {
    event: "campaign.activated",
    campaign_id: 789,
  },

  // Execution settings
  max_concurrent_executions: 1, // Don't run multiple at once
  execution_timeout_minutes: 60,
  priority: 10, // High priority

  // Dependencies: None (this is the first job)
  depends_on_jobs: null,

  // Resource limits
  max_memory_mb: 2048,
  max_cpu_cores: 2,

  // SLA: Must complete within 30 minutes
  sla_duration_minutes: 30,
  sla_breach_action: "alert_and_continue",

  // Notifications
  notify_on_success: false,
  notify_on_failure: true,
  notification_recipients: ["admin@example.com"],

  status: "active",
  is_active: true,
};
```

---

### 3. Job Dependencies

**Job Dependencies** define relationships between jobs, ensuring jobs run in the correct order and only when prerequisites are met.

#### Dependency Types:

```javascript
// 1. BLOCKING - Job B CANNOT start until Job A completes
{
  job_id: 2,  // Customer Profile Fetch
  depends_on_job_id: 1,  // Segment Evaluation
  dependency_type: "blocking",
  wait_for_status: "success",  // Wait for success
  max_wait_minutes: 60,  // Timeout after 60 minutes
  lookback_days: 1  // Check last 1 day for completion
}

// 2. OPTIONAL - Job B can start even if Job A fails
{
  job_id: 5,  // Analytics & Tracking
  depends_on_job_id: 4,  // Message Delivery
  dependency_type: "optional",
  wait_for_status: "any",  // Any status is fine
  max_wait_minutes: null,
  lookback_days: 1
}

// 3. CROSS_DAY - Job A runs today, Job B runs tomorrow
{
  job_id: 6,  // Daily Report
  depends_on_job_id: 5,  // Analytics (from yesterday)
  dependency_type: "cross_day",
  wait_for_status: "success",
  max_wait_minutes: null,
  lookback_days: 2  // Check last 2 days
}

// 4. CONDITIONAL - Job B starts only if Job A meets condition
{
  job_id: 7,  // Reward Distribution
  depends_on_job_id: 4,  // Message Delivery
  dependency_type: "conditional",
  wait_for_status: "success",
  max_wait_minutes: 30,
  lookback_days: 1,
  // Additional condition: Only if delivery_rate > 80%
  execution_condition: "delivery_rate > 0.8"
}
```

#### Wait For Status Options:

```javascript
wait_for_status: "any"; // Any status (success, failure, etc.)
wait_for_status: "success"; // Must be successful
wait_for_status: "completed"; // Must be completed (success or failure)
wait_for_status: "failure"; // Must have failed (for retry jobs)
```

#### Example: Campaign Job Dependency Chain

```javascript
// Campaign 789: Summer Data Bundle Campaign

// JOB 1: Segment Evaluation
const job1 = {
  id: 1,
  name: "Segment Evaluation - Campaign 789",
  code: "segment-eval-789",
};

// JOB 2: Customer Profile Fetch (depends on Job 1)
const dependency1 = {
  job_id: 2, // Customer Profile Fetch
  depends_on_job_id: 1, // Segment Evaluation
  dependency_type: "blocking",
  wait_for_status: "success",
  max_wait_minutes: 60,
  lookback_days: 1,
  is_active: true,
};

// JOB 3: Creative Rendering (depends on Job 2)
const dependency2 = {
  job_id: 3, // Creative Rendering
  depends_on_job_id: 2, // Customer Profile Fetch
  dependency_type: "blocking",
  wait_for_status: "success",
  max_wait_minutes: 120,
  lookback_days: 1,
  is_active: true,
};

// JOB 4: Message Delivery (depends on Job 3)
const dependency3 = {
  job_id: 4, // Message Delivery
  depends_on_job_id: 3, // Creative Rendering
  dependency_type: "blocking",
  wait_for_status: "success",
  max_wait_minutes: 180,
  lookback_days: 1,
  is_active: true,
};

// JOB 5: Analytics (optional, depends on Job 4)
const dependency4 = {
  job_id: 5, // Analytics & Tracking
  depends_on_job_id: 4, // Message Delivery
  dependency_type: "optional",
  wait_for_status: "any",
  max_wait_minutes: null,
  lookback_days: 1,
  is_active: true,
};

// Dependency Chain Visualization:
// Job 1 → Job 2 → Job 3 → Job 4 → Job 5
//   ↓       ↓       ↓       ↓       ↓
//  Must   Must    Must   Must   Optional
// succeed succeed succeed succeed
```

#### How Dependencies Work:

```javascript
// When Job 2 is triggered, the system checks:

async function checkDependencies(jobId) {
  // 1. Get all dependencies for this job
  const dependencies = await getJobDependencies(jobId);

  for (const dep of dependencies) {
    if (!dep.is_active) continue;  // Skip inactive dependencies

    // 2. Check if dependency job has completed
    const dependentJob = await getJobExecution(
      dep.depends_on_job_id,
      lookbackDays: dep.lookback_days
    );

    // 3. Check if status matches requirement
    if (dep.wait_for_status === "success") {
      if (dependentJob.execution_status !== "success") {
        return {
          satisfied: false,
          reason: `Job ${dep.depends_on_job_id} has not succeeded`
        };
      }
    }

    // 4. Check timeout
    if (dep.max_wait_minutes) {
      const waitTime = calculateWaitTime(dependentJob);
      if (waitTime > dep.max_wait_minutes) {
        return {
          satisfied: false,
          reason: `Dependency timeout exceeded`
        };
      }
    }
  }

  return { satisfied: true };
}

// Only start job if all dependencies are satisfied
if (await checkDependencies(jobId)) {
  await startJobExecution(jobId);
} else {
  await queueJobForRetry(jobId, delay: 5 * 60 * 1000);  // Retry in 5 minutes
}
```

---

### 4. Job Workflows

**Job Workflows** define the internal steps that a job executes. Each job can have multiple steps that run sequentially or in parallel.

#### Step Types:

```javascript
const stepTypes = [
  "sql", // Execute SQL query
  "stored_proc", // Call stored procedure
  "api_call", // Make HTTP API call
  "python_script", // Run Python script
  "node_js_script", // Run Node.js script
  "shell_script", // Run shell/bash script
  "file_transfer", // Transfer files (FTP, S3, etc.)
  "data_validation", // Validate data quality
  "notification", // Send notification
  "wait", // Wait for condition
];
```

#### Example: Segment Evaluation Job Workflow

```javascript
// Job: Segment Evaluation for Campaign 789
const segmentEvaluationWorkflow = {
  job_id: 1,
  steps: [
    // STEP 1: Validate Campaign Status
    {
      id: 101,
      step_order: 1,
      step_name: "Validate Campaign Status",
      step_code: "validate-campaign",
      step_type: "sql",
      step_action: `
        SELECT status FROM campaigns 
        WHERE id = :campaign_id
      `,
      is_parallel: false,
      depends_on_step_codes: null,
      retry_count: 3,
      retry_delay_seconds: 10,
      timeout_seconds: 30,
      on_failure_action: "abort", // Stop if campaign not active
      is_critical: true,
      is_active: true,
    },

    // STEP 2: Get Segment Conditions
    {
      id: 102,
      step_order: 2,
      step_name: "Get Segment Conditions",
      step_code: "get-segment-conditions",
      step_type: "sql",
      step_action: `
        SELECT criteria, logic 
        FROM segments s
        JOIN campaign_segment_mappings csm ON s.id = csm.segment_id
        WHERE csm.campaign_id = :campaign_id
      `,
      is_parallel: false,
      depends_on_step_codes: ["validate-campaign"],
      retry_count: 2,
      retry_delay_seconds: 5,
      timeout_seconds: 60,
      on_failure_action: "abort",
      is_critical: true,
      is_active: true,
    },

    // STEP 3: Evaluate Segment (Parallel for multiple segments)
    {
      id: 103,
      step_order: 3,
      step_name: "Evaluate Segment - VIP Customers",
      step_code: "evaluate-segment-vip",
      step_type: "sql",
      step_action: `
        SELECT customer_id, name, email, phone
        FROM customers
        WHERE tier = 'VIP' AND city = 'Nairobi'
      `,
      is_parallel: true,
      parallel_group_id: 1, // Same group = run in parallel
      depends_on_step_codes: ["get-segment-conditions"],
      retry_count: 2,
      retry_delay_seconds: 10,
      timeout_seconds: 300,
      on_failure_action: "continue", // Continue even if one segment fails
      is_critical: false,
      is_active: true,
      post_validation_query: `
        SELECT COUNT(*) as count 
        FROM segment_members 
        WHERE segment_id = :segment_id
      `,
      expected_row_count_min: 1, // At least 1 customer
    },

    {
      id: 104,
      step_order: 3, // Same order = parallel
      step_name: "Evaluate Segment - New Customers",
      step_code: "evaluate-segment-new",
      step_type: "sql",
      step_action: `
        SELECT customer_id, name, email, phone
        FROM customers
        WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
      is_parallel: true,
      parallel_group_id: 1, // Same group = run in parallel
      depends_on_step_codes: ["get-segment-conditions"],
      retry_count: 2,
      retry_delay_seconds: 10,
      timeout_seconds: 300,
      on_failure_action: "continue",
      is_critical: false,
      is_active: true,
    },

    // STEP 4: Store Segment Members
    {
      id: 105,
      step_order: 4,
      step_name: "Store Segment Members",
      step_code: "store-members",
      step_type: "stored_proc",
      step_action: "sp_store_segment_members",
      is_parallel: false,
      depends_on_step_codes: ["evaluate-segment-vip", "evaluate-segment-new"],
      retry_count: 3,
      retry_delay_seconds: 15,
      timeout_seconds: 600,
      on_failure_action: "abort",
      is_critical: true,
      is_active: true,
      parameters: {
        campaign_id: 789,
        execution_date: "2024-06-01",
      },
    },

    // STEP 5: Send Notification
    {
      id: 106,
      step_order: 5,
      step_name: "Send Completion Notification",
      step_code: "send-notification",
      step_type: "notification",
      step_action: "email",
      is_parallel: false,
      depends_on_step_codes: ["store-members"],
      retry_count: 1,
      retry_delay_seconds: 5,
      timeout_seconds: 30,
      on_failure_action: "skip_remaining", // Skip if notification fails
      is_critical: false,
      is_active: true,
      parameters: {
        recipients: ["admin@example.com"],
        subject: "Segment Evaluation Complete",
        message: "Segment evaluation for Campaign 789 completed successfully",
      },
    },
  ],
};
```

#### Workflow Execution Flow:

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Validate Campaign Status                        │
│ (Critical, Abort on failure)                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Get Segment Conditions                          │
│ (Critical, Abort on failure)                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Evaluate Segments (PARALLEL)                    │
│                                                           │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │ Segment VIP        │  │ Segment New        │        │
│  │ (Continue on fail) │  │ (Continue on fail) │        │
│  └────────────────────┘  └────────────────────┘        │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Store Segment Members                           │
│ (Critical, Abort on failure)                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Send Notification                               │
│ (Optional, Skip on failure)                              │
└─────────────────────────────────────────────────────────┘
```

#### Step Dependencies Within Workflow:

```javascript
// Steps can depend on other steps within the same job

// Step 3 depends on Step 2
{
  step_order: 3,
  depends_on_step_codes: ["get-segment-conditions"]
}

// Step 4 depends on BOTH Step 3a and Step 3b
{
  step_order: 4,
  depends_on_step_codes: [
    "evaluate-segment-vip",
    "evaluate-segment-new"
  ]
}

// Step 5 depends on Step 4
{
  step_order: 5,
  depends_on_step_codes: ["store-members"]
}
```

#### Failure Actions:

```javascript
on_failure_action: "abort"; // Stop entire job
on_failure_action: "continue"; // Continue to next step
on_failure_action: "retry"; // Retry this step
on_failure_action: "skip_remaining"; // Skip remaining steps
```

---

### 5. Job Executions

**Job Executions** are actual runs of jobs. They track the execution status, duration, metrics, and results.

#### Execution Statuses:

```javascript
execution_status: "pending"; // Queued, waiting to start
execution_status: "queued"; // In queue, ready to run
execution_status: "running"; // Currently executing
execution_status: "success"; // Completed successfully
execution_status: "failure"; // Failed
execution_status: "aborted"; // Manually stopped
execution_status: "timeout"; // Exceeded timeout
execution_status: "cancelled"; // Cancelled before start
```

#### Example: Job Execution Record

```javascript
const jobExecution = {
  id: "550e8400-e29b-41d4-a716-446655440000", // UUID
  job_id: 1, // Segment Evaluation Job

  // Status
  execution_status: "success",
  started_at: "2024-06-01T08:00:00Z",
  completed_at: "2024-06-01T08:15:30Z",
  duration_seconds: 930, // 15.5 minutes

  // Trigger
  triggered_by: "scheduler", // or "manual", "api", "dependency", etc.
  triggered_by_user_id: null,

  // Infrastructure
  server_instance: "worker-01",
  worker_node_id: "node-abc-123",
  trace_id: "trace-xyz-789",
  correlation_id: "campaign-789-exec-001",

  // Results
  error_message: null,
  error_code: null,
  error_step_id: null,

  // Metrics
  peak_memory_mb: 512,
  peak_cpu_percent: 45,
  rows_read: 50000,
  rows_processed: 1000,
  rows_inserted: 1000,
  rows_updated: 0,
  rows_deleted: 0,
  data_quality_score: 0.95,

  // Step Progress
  steps_total: 5,
  steps_completed: 5,
  steps_failed: 0,

  // SLA
  sla_breached: false,

  // Context
  execution_context: {
    campaign_id: 789,
    execution_date: "2024-06-01",
    segment_ids: [123, 124],
  },

  execution_date: "2024-06-01",
  archived: false,
  created_at: "2024-06-01T08:00:00Z",
  updated_at: "2024-06-01T08:15:30Z",
};
```

#### Execution Triggers:

```javascript
triggered_by: "scheduler"; // Scheduled job ran automatically
triggered_by: "manual"; // User manually triggered
triggered_by: "api"; // API call triggered
triggered_by: "webhook"; // Webhook received
triggered_by: "event"; // Event bus event
triggered_by: "retry"; // Automatic retry after failure
triggered_by: "dependency"; // Triggered by dependency satisfaction
triggered_by: "system"; // System-initiated
```

---

### How Jobs Connect to Campaigns

#### Connection Flow:

```
┌─────────────────────────────────────────────────────────┐
│ 1. CAMPAIGN CREATED                                      │
│    - User creates campaign in UI                         │
│    - Campaign saved with status = "draft"                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CAMPAIGN ACTIVATED                                    │
│    - User activates campaign                              │
│    - Campaign status = "active"                           │
│    - Event: "campaign.activated" fired                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. SCHEDULED JOB CREATED                                 │
│    - Event listener catches "campaign.activated"         │
│    - Creates ScheduledJob with:                          │
│      * schedule_type: "event_driven"                     │
│      * trigger_event_type: "event_bus"                   │
│      * trigger_condition: { campaign_id: 789 }           │
│    - Job Type: "Segment Evaluation"                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. JOB EXECUTION TRIGGERED                               │
│    - Event triggers job execution                        │
│    - Creates JobExecution record                         │
│    - Status: "pending" → "queued" → "running"            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. WORKFLOW STEPS EXECUTE                                │
│    - Step 1: Validate campaign                           │
│    - Step 2: Get segment conditions                      │
│    - Step 3: Evaluate segments (parallel)                │
│    - Step 4: Store segment members                      │
│    - Step 5: Send notification                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. JOB COMPLETES                                         │
│    - Execution status: "success"                          │
│    - Results stored in database                          │
│    - Metrics updated                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. DEPENDENCY CHECK                                      │
│    - System checks if other jobs depend on this job       │
│    - If Job 2 depends on Job 1 (success):                │
│      → Trigger Job 2 execution                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 8. NEXT JOB IN CHAIN EXECUTES                           │
│    - Job 2: Customer Profile Fetch                      │
│    - Job 3: Creative Rendering                          │
│    - Job 4: Message Delivery                            │
│    - Job 5: Analytics & Tracking                        │
└─────────────────────────────────────────────────────────┘
```

#### Example: Complete Campaign-to-Job Connection

```javascript
// CAMPAIGN DATA
const campaign = {
  id: 789,
  name: "Summer Data Bundle Campaign",
  status: "active",
  start_date: "2024-06-01T08:00:00Z",
  end_date: "2024-06-30T23:59:59Z",
};

// SCHEDULED JOBS (created when campaign activates)
const scheduledJobs = [
  // JOB 1: Segment Evaluation
  {
    id: 1,
    name: "Segment Evaluation - Campaign 789",
    code: "segment-eval-789",
    schedule_type: "event_driven",
    trigger_event_type: "event_bus",
    trigger_condition: { campaign_id: 789 },
    depends_on_jobs: null, // First job, no dependencies
  },

  // JOB 2: Customer Profile Fetch
  {
    id: 2,
    name: "Customer Profile Fetch - Campaign 789",
    code: "profile-fetch-789",
    schedule_type: "dependency_based",
    depends_on_jobs: [1], // Depends on Job 1
    dependency_mode: "all_success",
  },

  // JOB 3: Creative Rendering
  {
    id: 3,
    name: "Creative Rendering - Campaign 789",
    code: "creative-render-789",
    schedule_type: "dependency_based",
    depends_on_jobs: [2], // Depends on Job 2
    dependency_mode: "all_success",
  },

  // JOB 4: Message Delivery
  {
    id: 4,
    name: "Message Delivery - Campaign 789",
    code: "message-delivery-789",
    schedule_type: "dependency_based",
    depends_on_jobs: [3], // Depends on Job 3
    dependency_mode: "all_success",
  },

  // JOB 5: Analytics & Tracking
  {
    id: 5,
    name: "Analytics & Tracking - Campaign 789",
    code: "analytics-789",
    schedule_type: "dependency_based",
    depends_on_jobs: [4], // Depends on Job 4
    dependency_mode: "any", // Optional, run even if delivery fails
  },
];

// JOB DEPENDENCIES (explicit relationships)
const jobDependencies = [
  {
    job_id: 2,
    depends_on_job_id: 1,
    dependency_type: "blocking",
    wait_for_status: "success",
    max_wait_minutes: 60,
    lookback_days: 1,
  },
  {
    job_id: 3,
    depends_on_job_id: 2,
    dependency_type: "blocking",
    wait_for_status: "success",
    max_wait_minutes: 120,
    lookback_days: 1,
  },
  {
    job_id: 4,
    depends_on_job_id: 3,
    dependency_type: "blocking",
    wait_for_status: "success",
    max_wait_minutes: 180,
    lookback_days: 1,
  },
  {
    job_id: 5,
    depends_on_job_id: 4,
    dependency_type: "optional",
    wait_for_status: "any",
    max_wait_minutes: null,
    lookback_days: 1,
  },
];

// EXECUTION FLOW
// 1. Campaign activated → Event fired
// 2. Job 1 execution triggered → Status: "running"
// 3. Job 1 completes → Status: "success"
// 4. Dependency check: Job 2 can start? → Yes (Job 1 succeeded)
// 5. Job 2 execution triggered → Status: "running"
// 6. Job 2 completes → Status: "success"
// 7. Dependency check: Job 3 can start? → Yes (Job 2 succeeded)
// 8. ... and so on
```

---

### Real-World Example: Campaign Execution with Jobs

#### Scenario: "Black Friday Sale 2024" Campaign

```javascript
// CAMPAIGN
const campaign = {
  id: 100,
  name: "Black Friday Sale 2024",
  status: "active",
  start_date: "2024-11-25T00:00:00Z",
  end_date: "2024-11-30T23:59:59Z",
};

// SCHEDULED JOBS
const jobs = [
  {
    id: 1001,
    name: "Segment Evaluation - Black Friday",
    code: "segment-eval-bf2024",
    job_type_id: 1, // Segment Evaluation
    schedule_type: "cron",
    cron_expression: "0 0 * * *", // Daily at midnight
    depends_on_jobs: null,
  },
  {
    id: 1002,
    name: "Customer Profile Fetch - Black Friday",
    code: "profile-fetch-bf2024",
    job_type_id: 2, // Customer Profile Fetch
    schedule_type: "dependency_based",
    depends_on_jobs: [1001],
  },
  {
    id: 1003,
    name: "Creative Rendering - Black Friday",
    code: "creative-render-bf2024",
    job_type_id: 3, // Creative Rendering
    schedule_type: "dependency_based",
    depends_on_jobs: [1002],
  },
  {
    id: 1004,
    name: "Message Delivery - Black Friday",
    code: "message-delivery-bf2024",
    job_type_id: 4, // Message Delivery
    schedule_type: "dependency_based",
    depends_on_jobs: [1003],
  },
];

// EXECUTION TIMELINE (November 25, 2024)
const executions = [
  {
    id: "exec-001",
    job_id: 1001,
    execution_status: "success",
    started_at: "2024-11-25T00:00:00Z",
    completed_at: "2024-11-25T00:10:30Z",
    duration_seconds: 630,
    triggered_by: "scheduler",
    rows_processed: 50000,
    rows_inserted: 50000, // 50,000 customers in segment
  },
  {
    id: "exec-002",
    job_id: 1002,
    execution_status: "success",
    started_at: "2024-11-25T00:10:35Z", // Started after Job 1
    completed_at: "2024-11-25T00:25:00Z",
    duration_seconds: 865,
    triggered_by: "dependency",
    rows_processed: 50000,
  },
  {
    id: "exec-003",
    job_id: 1003,
    execution_status: "success",
    started_at: "2024-11-25T00:25:05Z", // Started after Job 2
    completed_at: "2024-11-25T00:45:20Z",
    duration_seconds: 1215,
    triggered_by: "dependency",
    rows_processed: 50000,
  },
  {
    id: "exec-004",
    job_id: 1004,
    execution_status: "success",
    started_at: "2024-11-25T00:45:25Z", // Started after Job 3
    completed_at: "2024-11-25T01:30:00Z",
    duration_seconds: 2675,
    triggered_by: "dependency",
    rows_processed: 50000,
    rows_inserted: 50000, // 50,000 messages sent
  },
];

// TOTAL EXECUTION TIME: ~1.5 hours
// 50,000 customers processed and messaged
```

---

### Key Takeaways

1. **Jobs are the Execution Engine**
   - Campaigns define WHAT to do
   - Jobs define HOW to do it
   - Jobs execute the campaign logic

2. **Dependencies Ensure Order**
   - Jobs must run in the correct sequence
   - Dependencies prevent race conditions
   - Failed dependencies can block or allow continuation

3. **Workflows Break Down Complexity**
   - Each job has multiple steps
   - Steps can run sequentially or in parallel
   - Steps can have their own dependencies and retry logic

4. **Executions Track Everything**
   - Every job run is recorded
   - Metrics, errors, and performance are tracked
   - Historical data enables analysis and optimization

5. **Infrastructure Handles Scale**
   - Jobs can run in parallel
   - Resource limits prevent overload
   - SLA monitoring ensures performance

---

## Complete Data Flow

### End-to-End Flow Diagram:

```
┌─────────────────────────────────────────────────────────┐
│                    USER CREATES                          │
│                    CAMPAIGN                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Campaign Saved:                                         │
│  - campaigns table                                       │
│  - status = "draft"                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  User Maps Segments:                                     │
│  - campaign_segment_mappings table                       │
│  - Links segments to campaign                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  User Maps Offers:                                       │
│  - campaign_segment_offer_mappings table                 │
│  - Links offers to segments                              │
│                                                           │
│  Note: Offers already contain:                           │
│  - Products (from offer_products table)                  │
│  - Creatives (from offer_creatives table)               │
│  - Rewards (from offer_rewards table)                    │
│  - Tracking (from offer_tracking_sources table)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  User Schedules Campaign:                                │
│  - campaigns.start_date = "2024-06-01 08:00"            │
│  - campaigns.end_date = "2024-06-30 23:59"              │
│  - campaigns.status = "scheduled"                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Manager Approves:                                       │
│  - campaigns.approval_status = "approved"               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ⏰ START DATE REACHED                                   │
│  Job System Activates Campaign                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  JOB 1: Segment Evaluation                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ SELECT customer_id FROM customers                │   │
│  │ WHERE segment_conditions_match                   │   │
│  └─────────────────────────────────────────────────┘   │
│  Result: [123, 456, 789, ...]                           │
│  Stored in: campaign_participants table                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  JOB 2: Customer Profile Fetch                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ For each customer_id:                             │   │
│  │ SELECT * FROM customers WHERE customer_id = ?     │   │
│  └─────────────────────────────────────────────────┘   │
│  Result: Full customer objects                           │
│  { id: 123, name: "John", email: "...", ... }          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  JOB 3: Offer Selection                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ For each customer:                               │   │
│  │ - Get segment_id from campaign_participants      │   │
│  │ - Get offer_id from campaign_segment_offer_      │   │
│  │   mappings WHERE segment_id = ?                   │   │
│  │ - Load offer with all details                    │   │
│  └─────────────────────────────────────────────────┘   │
│  Result: (customer, offer) pairs                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  JOB 4: Creative Selection                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ For each (customer, offer):                      │   │
│  │ - Get customer.preferred_language                │   │
│  │ - Get customer.preferred_channel                 │   │
│  │ - SELECT * FROM offer_creatives                  │   │
│  │   WHERE offer_id = ? AND channel = ?             │   │
│  │   AND locale = ? AND is_active = true           │   │
│  └─────────────────────────────────────────────────┘   │
│  Result: (customer, offer, creative) triplets            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  JOB 5: Variable Replacement                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ For each (customer, offer, creative):            │   │
│  │ - Get creative.text_body (template)             │   │
│  │ - Get customer data (name, email, etc.)         │   │
│  │ - Get creative.variables (amount, code, etc.)   │   │
│  │ - Replace {{name}} → customer.name              │   │
│  │ - Replace {{amount}} → variables.amount         │   │
│  │ - ... replace all variables                     │   │
│  └─────────────────────────────────────────────────┘   │
│  Result: Fully rendered messages                         │
│  "Hi John Doe! Get KES 500 OFF. Code: SUMMER2024"       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  JOB 6: Message Delivery                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ For each rendered message:                        │   │
│  │                                                   │   │
│  │ If SMS:                                           │   │
│  │ - Get creative.variables.sms_route               │   │
│  │ - Get creative.title (sender ID)                 │   │
│  │ - Send via SMS Gateway                           │   │
│  │                                                   │   │
│  │ If Email:                                         │   │
│  │ - Get creative.html_body                         │   │
│  │ - Send via Email Service                         │   │
│  │                                                   │   │
│  │ Track: delivery_status, sent_at, delivered_at    │   │
│  └─────────────────────────────────────────────────┘   │
│  Result: Messages sent, delivery tracked                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  JOB 7: Reward Distribution                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ For customers who redeemed:                       │   │
│  │ - Get offer.rewards                              │   │
│  │ - Apply to customer account                      │   │
│  │ - Update offer_redemptions table                  │   │
│  └─────────────────────────────────────────────────┘   │
│  Result: Rewards applied                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  JOB 8: Analytics & Tracking                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Continuously track:                               │   │
│  │ - Opens, clicks, conversions                     │   │
│  │ - Update campaign metrics                        │   │
│  │ - Update dashboard                              │   │
│  └─────────────────────────────────────────────────┘   │
│  Result: Real-time statistics                            │
└─────────────────────────────────────────────────────────┘
```

---

## Real-World Example

### Complete Example: "Summer Sale Campaign"

```javascript
// ============================================
// STEP 1: CREATE OFFER (Pre-created)
// ============================================

const offer = {
  id: 456,
  name: "Summer Data Bundle Offer",

  // Products
  products: [{ id: 789, name: "10GB Data Bundle", price: 500 }],

  // Creatives (multiple languages)
  creatives: [
    {
      id: 101,
      channel: "SMS",
      locale: "en",
      title: "Equitel", // Sender ID
      text_body:
        "Hi {{name}}! Get {{amount}} OFF on {{product}}. Code: {{code}}. Valid until {{expiry}}.",
      variables: {
        amount: "KES 500",
        product: "10GB Data Bundle",
        code: "SUMMER2024",
        expiry: "June 30, 2024",
      },
      sms_route: "Route 1",
    },
    {
      id: 102,
      channel: "SMS",
      locale: "sw", // Swahili
      title: "Equitel",
      text_body:
        "Hujambo {{name}}! Pata punguzo la {{amount}} kwenye {{product}}. Nambari: {{code}}. Inaendelea hadi {{expiry}}.",
      variables: {
        amount: "KES 500",
        product: "Kifurushi cha Data 10GB",
        code: "SUMMER2024",
        expiry: "Juni 30, 2024",
      },
      sms_route: "Route 1",
    },
  ],

  // Rewards
  rewards: [{ type: "credit", value: 200, currency: "KES" }],

  // Tracking
  tracking_sources: [{ source: "campaign_code", value: "SUMMER2024" }],
};

// ============================================
// STEP 2: CREATE CAMPAIGN
// ============================================

const campaign = {
  id: 789,
  name: "Summer Sale 2024",
  status: "draft",
  start_date: "2024-06-01T08:00:00Z",
  end_date: "2024-06-30T23:59:59Z",
};

// ============================================
// STEP 3: MAP SEGMENT
// ============================================

const segment = {
  id: 123,
  name: "VIP Customers in Nairobi",
  criteria: {
    conditions: [
      { field: "tier", operator: "equals", value: "VIP" },
      { field: "city", operator: "equals", value: "Nairobi" },
    ],
  },
};

// Map segment to campaign
campaign_segment_mapping = {
  campaign_id: 789,
  segment_id: 123,
};

// ============================================
// STEP 4: MAP OFFER TO SEGMENT
// ============================================

campaign_segment_offer_mapping = {
  campaign_id: 789,
  segment_id: 123,
  offer_id: 456,
};

// ============================================
// STEP 5: CAMPAIGN EXECUTION (When start_date reached)
// ============================================

// JOB 1: Segment Evaluation
const customerIds = await db.query(`
  SELECT customer_id 
  FROM customers 
  WHERE tier = 'VIP' AND city = 'Nairobi'
`);
// Result: [123, 456, 789]

// JOB 2: Customer Profile Fetch
const customers = await Promise.all(
  customerIds.map((id) =>
    db.query(`SELECT * FROM customers WHERE customer_id = ?`, [id]),
  ),
);
// Result: [
//   { customer_id: 123, name: "John Doe", preferred_language: "en", ... },
//   { customer_id: 456, name: "Jane Smith", preferred_language: "sw", ... },
//   { customer_id: 789, name: "Bob Johnson", preferred_language: "en", ... }
// ]

// JOB 3: Offer Selection
// All customers get offer 456 (already mapped)

// JOB 4: Creative Selection
for (const customer of customers) {
  // Find matching creative
  const creative = offer.creatives.find(
    (c) => c.channel === "SMS" && c.locale === customer.preferred_language,
  );

  // Customer 123 (en) → Creative 101 (SMS, en)
  // Customer 456 (sw) → Creative 102 (SMS, sw)
  // Customer 789 (en) → Creative 101 (SMS, en)
}

// JOB 5: Variable Replacement
// For Customer 123 (John Doe, English):
const message1 = replaceVariables(
  "Hi {{name}}! Get {{amount}} OFF on {{product}}. Code: {{code}}.",
  { name: "John Doe" }, // from customer
  { amount: "KES 500", product: "10GB Data Bundle", code: "SUMMER2024" }, // from creative
);
// Result: "Hi John Doe! Get KES 500 OFF on 10GB Data Bundle. Code: SUMMER2024."

// For Customer 456 (Jane Smith, Swahili):
const message2 = replaceVariables(
  "Hujambo {{name}}! Pata punguzo la {{amount}} kwenye {{product}}. Nambari: {{code}}.",
  { name: "Jane Smith" },
  { amount: "KES 500", product: "Kifurushi cha Data 10GB", code: "SUMMER2024" },
);
// Result: "Hujambo Jane Smith! Pata punguzo la KES 500 kwenye Kifurushi cha Data 10GB. Nambari: SUMMER2024."

// JOB 6: Message Delivery
// Send SMS via Route 1
await smsGateway.send({
  to: "+254700000000", // John's phone
  from: "Equitel", // Sender ID
  message: message1,
  route: "Route 1",
});

await smsGateway.send({
  to: "+254711111111", // Jane's phone
  from: "Equitel",
  message: message2,
  route: "Route 1",
});

// JOB 7: Reward Distribution (when customer redeems)
// Customer 123 redeems code "SUMMER2024"
await applyReward({
  customer_id: 123,
  reward: { type: "credit", value: 200 },
  offer_id: 456,
});
// Updates customer balance: +KES 200

// JOB 8: Analytics
// Track: 3 sent, 3 delivered, 1 redeemed
campaign_metrics = {
  campaign_id: 789,
  total_sent: 3,
  total_delivered: 3,
  total_redeemed: 1,
  conversion_rate: 33.33,
};
```

---

## Key Takeaways

### 1. **Pre-Configuration is Key**

- Offers are created FIRST with all components (products, creatives, rewards, tracking)
- Campaigns just reference existing offers
- You don't create creatives during campaign creation

### 2. **Segments Define WHO**

- Segments have conditions that query the customer database
- When campaign runs, segments are evaluated to find matching customers
- Results are stored as participant lists

### 3. **Offers Define WHAT**

- Offers contain everything needed: products, creatives, rewards, tracking
- Multiple creatives per offer (different languages/channels)
- Campaigns map offers to segments

### 4. **Creatives Define HOW**

- Creatives are the actual messages
- Selected based on customer preferences (language, channel)
- Variables are replaced at send time with customer data

### 5. **Jobs Execute Everything**

- Jobs run automatically when campaigns activate
- Each job processes data and queues the next job
- Jobs can run in parallel for efficiency

### 6. **Variables Come from Two Sources**

- **Dynamic**: Customer profile (name, email, balance, etc.) - different per customer
- **Static**: Offer variables (amount, code, expiry) - same for all customers

### 7. **Customer Data is Fetched at Send Time**

- Segment evaluation returns customer IDs
- Full customer profiles are fetched for variable replacement
- This ensures data is always current

---

## Database Tables Overview

```
campaigns
  ├─ id, name, status, start_date, end_date, ...

campaign_segment_mappings
  ├─ campaign_id → segment_id

campaign_segment_offer_mappings
  ├─ campaign_id → segment_id → offer_id

segments
  ├─ id, name, criteria (conditions), ...

offers
  ├─ id, name, status, ...

offer_products
  ├─ offer_id → product_id

offer_creatives
  ├─ offer_id, channel, locale, text_body, variables, ...

offer_rewards
  ├─ offer_id, type, value, ...

offer_tracking_sources
  ├─ offer_id, source, value, ...

customers
  ├─ customer_id, name, email, phone, preferred_language, ...

campaign_participants
  ├─ campaign_id, segment_id, customer_id, ...

message_queue
  ├─ customer_id, campaign_id, offer_id, creative_id, message, status, ...

offer_redemptions
  ├─ customer_id, offer_id, campaign_id, redeemed_at, ...
```

---

## Summary

**Campaigns** orchestrate everything:

1. They reference **segments** (who to target)
2. They map **offers** to segments (what to send)
3. **Offers** contain pre-configured **creatives** (how to say it)
4. When campaign runs, **jobs** execute:
   - Evaluate segments → get customer IDs
   - Fetch customer profiles → get customer data
   - Select offers → based on mapping
   - Select creatives → based on customer preferences
   - Replace variables → personalize messages
   - Send messages → via appropriate channels
   - Distribute rewards → when customers act
   - Track analytics → measure success

Everything is connected through database relationships and executed automatically by the job management system!

---

## Manual Broadcasts

### What are Manual Broadcasts?

**Manual Broadcasts** are a way to send **messages directly to customers** without going through the campaign system. They're designed for quick, one-off communications that don't require the full campaign infrastructure.

### Key Characteristics:

- ✅ **Send messages only** (SMS, Email, WhatsApp, Push)
- ✅ **Bypass campaigns** - no segment evaluation needed
- ✅ **Direct customer list** - upload CSV or enter manually
- ✅ **Immediate or scheduled** - send now or later
- ❌ **No offers/products** - just messages
- ❌ **No rewards** - no incentives attached
- ❌ **No campaign tracking** - basic delivery tracking only

### When to Use Manual Broadcasts:

| Use Case                   | Example                                              |
| -------------------------- | ---------------------------------------------------- |
| **System Announcements**   | "System maintenance tonight 2-4 AM"                  |
| **Urgent Notifications**   | "Your payment failed. Please update payment method." |
| **Quick Promotions**       | "Flash sale! 50% off for next 2 hours only"          |
| **Event Reminders**        | "Don't forget: Webinar tomorrow at 3 PM"             |
| **One-off Communications** | "Thank you for your feedback!"                       |

### Manual Broadcast Flow:

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: SELECT TARGET AUDIENCE                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Option A: Upload CSV File                               │
│  - Excel file with customer contacts                    │
│  - Columns: email, phone, name, etc.                    │
│  - Example: "customer_list.xlsx" with 1,000 rows        │
│                                                           │
│  Option B: Manual Entry                                  │
│  - Type/paste email addresses or phone numbers          │
│  - One per line                                          │
│  - Example:                                              │
│    john@example.com                                       │
│    +254712345678                                          │
│    jane@example.com                                       │
│                                                           │
│  Creates a "Quick List" in the system                    │
│  - List Name: "VIP Customers Q4"                        │
│  - Row Count: 1,000 recipients                           │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: DEFINE COMMUNICATION                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Select Channel:                                         │
│  - SMS (Short Message Service)                          │
│  - Email                                                  │
│  - WhatsApp                                               │
│  - Push Notification                                      │
│                                                           │
│  Write Message:                                           │
│  - Subject (for Email): "Happy New Year!"              │
│  - Body: "Dear {{name}}, Get 20% off all products..."   │
│  - Can use variables from CSV columns                    │
│  - Rich text formatting (for Email)                      │
│                                                           │
│  Preview:                                                 │
│  - See how message looks on device                      │
│  - Test variable replacement                             │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: TEST BROADCAST (Optional)                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Send test to your own contact:                          │
│  - Your email: admin@company.com                        │
│  - Your phone: +254712345678                            │
│                                                           │
│  Verify:                                                  │
│  - Message format looks correct                          │
│  - Variables replaced properly                           │
│  - Links work (if included)                             │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: SCHEDULE & SEND                                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Option A: Send Now                                      │
│  - Immediate delivery                                    │
│  - All recipients get message right away                 │
│                                                           │
│  Option B: Schedule for Later                            │
│  - Date: 2024-12-25                                      │
│  - Time: 08:00 AM                                        │
│  - Timezone: Africa/Nairobi                              │
│  - Message sent automatically at scheduled time          │
│                                                           │
│  Summary:                                                 │
│  - Audience: "VIP Customers Q4" (1,000 recipients)     │
│  - Channel: SMS                                          │
│  - Schedule: Send Now                                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Real-World Example: System Maintenance Announcement

**Scenario:** You need to notify all customers about scheduled system maintenance tonight.

#### Step 1: Select Audience

- **Upload CSV file:** `maintenance_notification_list.xlsx`
- **File contains:** 50,000 customer phone numbers
- **Quick List created:** "Maintenance Notification - Dec 2024"
- **Recipients:** 50,000 customers

#### Step 2: Define Communication

- **Channel:** SMS (fastest way to reach everyone)
- **Message Body:**

  ```
  Dear {{name}},

  We'll be performing system maintenance tonight from 2:00 AM to 4:00 AM.
  Services may be temporarily unavailable.

  Thank you for your patience.

  - Equitel Team
  ```

#### Step 3: Test Broadcast

- **Test sent to:** Admin phone (+254712345678)
- **Result:** ✅ Message received, format looks good

#### Step 4: Schedule & Send

- **Schedule:** Send Now
- **Action:** Click "Launch Broadcast"
- **Result:**
  - 50,000 SMS messages queued
  - Messages sent over next 30 minutes
  - Delivery status tracked

### Manual Broadcasts vs Campaigns:

| Feature            | Manual Broadcasts        | Campaigns                                   |
| ------------------ | ------------------------ | ------------------------------------------- |
| **Purpose**        | Send messages            | Send offers/products                        |
| **Audience**       | Direct list (CSV/manual) | Segments (dynamic, rule-based)              |
| **Content**        | Simple message           | Full offer with products/rewards            |
| **Setup Time**     | 5-10 minutes             | 30-60 minutes                               |
| **Tracking**       | Basic delivery status    | Full analytics (opens, clicks, conversions) |
| **Use Case**       | Quick announcements      | Strategic marketing                         |
| **Segments**       | ❌ Not used              | ✅ Required                                 |
| **Offers**         | ❌ Not used              | ✅ Required                                 |
| **Products**       | ❌ Not used              | ✅ Required                                 |
| **Rewards**        | ❌ Not used              | ✅ Optional                                 |
| **Job Management** | Simple queue             | Complex job workflows                       |

### Technical Implementation:

**Database Tables:**

```
quicklists
  ├─ id, name, upload_type, rows_imported, created_at, ...

manual_broadcasts
  ├─ id, quicklist_id, channel, message_title, message_body,
  ├─ schedule_type, schedule_date, schedule_time, status, ...

broadcast_recipients
  ├─ broadcast_id, customer_id, contact_info, status, sent_at, ...
```

**Flow:**

1. User uploads CSV → Creates `quicklist` record
2. User writes message → Stored in `manual_broadcast` record
3. User schedules → Broadcast queued
4. System sends messages → Creates `broadcast_recipient` records
5. Delivery tracked → Status updated in `broadcast_recipients`

### Key Takeaways:

1. **Manual Broadcasts are for messages only** - They don't send offers, products, or rewards
2. **Direct customer lists** - You provide the exact list of recipients (CSV or manual)
3. **No segment evaluation** - No need to define rules or conditions
4. **Quick setup** - Perfect for urgent or one-off communications
5. **Basic tracking** - Delivery status only, no campaign analytics
6. **Use campaigns for offers** - If you need to send products/rewards, use campaigns instead

---

## QuickLists: Recipient Management for Manual Broadcasts

### What are QuickLists?

**QuickLists** are the recipient management system specifically designed for **Manual Broadcasts**. They serve as temporary data containers that store customer contact information and enable personalized messaging through template variables.

### Key Characteristics:

- ✅ **Recipient Storage** - Holds customer contact data (phone, email, names)
- ✅ **Template Variables** - Auto-generates variables from data columns
- ✅ **Manual Broadcast Only** - Currently integrated as part of Manual Broadcast workflow
- ✅ **Temporary Nature** - Created per broadcast, not persistent long-term
- ✅ **Multiple Data Types** - Supports different customer data formats
- ❌ **Not Standalone** - Currently not accessible as independent feature
- ❌ **No Segmentation** - No advanced filtering or rule-based selection

### How QuickLists Work with Manual Broadcasts

#### 1. **Audience Creation → QuickList Storage**

```
Manual Broadcast Step 1 (Target Audience)
        ↓
File Upload or Manual Entry
        ↓
Data Validation & Processing
        ↓
QuickList Created (API: POST /quicklists)
        ↓
Returns QuickList ID for Broadcast
```

#### 2. **QuickList Data Types & Structure**

QuickLists support different upload types based on the type of customer data:

**Customer Subscription Data (`customer_subscription`)**:

- **Purpose**: Target customers by their subscription status and details
- **Required Columns**: `msisdn` (phone number), `subscription_id`
- **Optional Columns**: `status`, `plan_name`, `activation_date`
- **Example CSV:**
  ```csv
  msisdn,subscription_id,status,plan_name
  +254700000001,12345,active,Premium Plan
  +254700000002,12346,inactive,Basic Plan
  +254700000003,12347,suspended,Family Plan
  ```

**Customer Data (`customer_data`)**:

- **Purpose**: Target customers using personal information and demographics
- **Required Columns**: `msisdn`, `first_name`, `last_name`
- **Optional Columns**: `email`, `age`, `gender`, `city`, `registration_date`
- **Example CSV:**
  ```csv
  msisdn,first_name,last_name,email,age,city
  +254700000001,John,Doe,john.doe@email.com,25,Nairobi
  +254700000002,Jane,Smith,jane.smith@email.com,32,Mombasa
  +254700000003,Mike,Johnson,mike.j@email.com,45,Kisumu
  ```

#### 3. **Template Variables System**

QuickLists automatically convert column headers into template variables:

**Example QuickList with Customer Data:**

```
File: vip_customers.csv
Columns: msisdn, first_name, last_name, email, age, city
Available Variables: {{msisdn}}, {{first_name}}, {{last_name}}, {{email}}, {{age}}, {{city}}
```

**Variable Usage in Messages:**

**SMS Message Template:**

```
Hi {{first_name}} {{last_name}}, your account ending in {{msisdn}} has been upgraded! Enjoy {{city}}'s best service.
```

**Rendered SMS for John Doe:**

```
Hi John Doe, your account ending in +254700000001 has been upgraded! Enjoy Nairobi's best service.
```

**Email Subject Template:**

```
Welcome to our service, {{first_name}}!
```

**Rendered Subject:**

```
Welcome to our service, John!
```

#### 4. **Complete QuickList Lifecycle**

**Phase 1: Creation (Manual Broadcast Step 1)**

- User selects "File Upload" or "Manual Entry"
- System validates file format and required columns
- QuickList created via API: `POST /quicklists`
- Response includes `quicklist_id` for the broadcast

**Phase 2: Variable Discovery (Manual Broadcast Step 2)**

- System fetches available variables: `GET /communications/template-variables/{quicklist_id}`
- User sees available variables: `{{first_name}}`, `{{email}}`, `{{city}}`, etc.
- Variables used in message composition and validation

**Phase 3: Communication Execution (Manual Broadcast Step 4)**

- Broadcast sent using QuickList as recipient source
- API Payload structure:
  ```json
  {
    "source_type": "quicklist",
    "source_id": 123,
    "channels": ["SMS", "EMAIL"],
    "message_template": {
      "subject": "Special Offer for {{first_name}}",
      "body": "Dear {{first_name}}, we have a special offer just for you in {{city}}!"
    },
    "schedule_type": "now"
  }
  ```

#### 5. **QuickList Management Operations**

- **View Recipients**: `GET /quicklists/{id}/data` - Paginated list of all recipients
- **Import Logs**: `GET /quicklists/{id}/logs` - Track upload success/failures
- **Export Data**: `GET /quicklists/{id}/export` - Download recipients as CSV
- **Delete List**: `DELETE /quicklists/{id}` - Remove QuickList and all data

#### 6. **Data Validation & Error Handling**

**File Upload Validation:**

- ✅ Correct file format (CSV, Excel)
- ✅ Required columns present
- ✅ Data type validation (phone numbers, emails)
- ✅ Duplicate detection
- ❌ Shows validation errors with specific row/column details

**Manual Entry Validation:**

- ✅ Phone/email format validation
- ✅ Duplicate contact detection
- ✅ Maximum recipient limits
- ❌ Real-time validation feedback

#### 7. **Current Integration Status**

**As Part of Manual Broadcasts:**

- Created automatically during Manual Broadcast Step 1
- Variables available immediately in Step 2
- Used directly for sending in Step 4
- Not accessible outside Manual Broadcast workflow

**Future Independent Feature:**

- Standalone QuickLists page: `/dashboard/quicklists`
- CRUD operations for data management
- Reusable across multiple broadcasts
- Advanced filtering and search capabilities
- Data import/export workflows

#### 8. **Real-World Example: Customer Reactivation Campaign**

**Scenario:** Send reactivation SMS to inactive customers with personalized city mentions.

**Step 1: Create QuickList**

- **File**: `inactive_customers_dec2024.csv`
- **Upload Type**: `customer_subscription`
- **Data**:
  ```csv
  msisdn,first_name,last_name,city,status
  +254700000001,John,Doe,Nairobi,inactive
  +254700000002,Jane,Smith,Mombasa,inactive
  +254700000003,Mike,Johnson,Kisumu,inactive
  ```

**Step 2: Compose Message**

- **Channel**: SMS
- **Message**:
  ```
  Hi {{first_name}}, we miss you in {{city}}! Your {{msisdn}} account is inactive.
  Reactivate now and get 20% off your next bill. Reply YES to continue.
  ```

**Step 3: Test Broadcast**

- **Test to**: Admin phone (+254712345678)
- **Rendered Test**:
  ```
  Hi John, we miss you in Nairobi! Your +254700000001 account is inactive.
  Reactivate now and get 20% off your next bill. Reply YES to continue.
  ```

**Step 4: Send Broadcast**

- **QuickList ID**: 456
- **Recipients**: 2,500 inactive customers
- **Schedule**: Send immediately
- **API Call**: `POST /communications/send` with `source_type: "quicklist"`

### QuickLists vs Other CVM Components

| Feature          | QuickLists                  | Segment Lists           | Dynamic Segments              |
| ---------------- | --------------------------- | ----------------------- | ----------------------------- |
| **Purpose**      | Manual Broadcast recipients | Campaign audience lists | Rule-based customer selection |
| **Data Source**  | Uploaded CSV/Manual         | Pre-defined lists       | Database queries              |
| **Persistence**  | Temporary (per broadcast)   | Permanent storage       | Dynamic evaluation            |
| **Variables**    | ✅ Auto-generated           | ❌ No variables         | ✅ Database variables         |
| **Segmentation** | ❌ No filtering             | ✅ List-based           | ✅ Complex rules              |
| **Use Case**     | Direct messaging            | Pre-selected audiences  | Targeted campaigns            |
| **Management**   | Basic CRUD                  | Advanced management     | Rule configuration            |

### Technical Implementation

**Database Schema:**

```
quicklists
  ├─ id (Primary Key)
  ├─ name (List name)
  ├─ upload_type ('customer_subscription', 'customer_data')
  ├─ rows_imported (Total recipients)
  ├─ created_at, updated_at
  ├─ file_path (Stored file location)
  └─ status ('processing', 'completed', 'failed')

quicklist_data
  ├─ quicklist_id (Foreign Key)
  ├─ row_number (Sequential)
  ├─ column_name (Field name)
  ├─ column_value (Field data)
  └─ created_at
```

**API Endpoints:**

- `POST /quicklists` - Create new QuickList
- `GET /quicklists/{id}` - Get QuickList details
- `GET /quicklists/{id}/data` - Get recipient data (paginated)
- `GET /quicklists/{id}/logs` - Get import logs
- `GET /quicklists/{id}/export` - Export as CSV
- `DELETE /quicklists/{id}` - Delete QuickList

**Integration Points:**

- Manual Broadcast Step 1: Creates QuickList
- Manual Broadcast Step 2: Fetches variables from QuickList
- Communication Service: Uses QuickList as `source_type`

### Key Takeaways

1. **QuickLists = Recipient Management** - They're containers for customer contact data specifically for Manual Broadcasts

2. **Template Variables are Automatic** - Column headers become `{{variable}}` placeholders for personalization

3. **Currently Manual Broadcast Only** - QuickLists are created and used within the Manual Broadcast workflow

4. **Data Types Matter** - Different upload types (`customer_subscription`, `customer_data`) require different columns

5. **Temporary by Design** - QuickLists are meant for one-time broadcasts, not long-term customer management

6. **Validation is Critical** - Phone numbers, emails, and required columns must be validated before creation

7. **Future Flexibility** - Can become standalone feature by uncommenting sidebar navigation and routes

---

## Infrastructure in the CVM System

### What is Infrastructure?

**Infrastructure** in the CVM system refers to the backend servers and database connections that power the entire platform. It's the foundation that enables all CVM operations - from storing customer data to executing campaigns and sending messages.

### Infrastructure Components:

```
┌─────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE COMPONENTS                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. SERVERS                                              │
│     └─ Backend servers that the CVM system connects to  │
│        (API servers, database servers, message gateways) │
│                                                           │
│  2. CONNECTION PROFILES                                  │
│     └─ Database connection configurations                │
│        (How to connect to customer data sources)        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

### 1. Servers

**Servers** are the backend infrastructure endpoints that the CVM platform uses to:

- Store and retrieve customer data
- Execute campaign jobs
- Send messages (SMS, Email, Push)
- Process analytics and tracking

#### Server Structure:

```javascript
// Example: Production Database Server
{
  id: 1,
  name: "Production Customer Database",
  code: "PROD-DB-01",
  server_type: "database",
  environment: "prod",
  region: "Africa/Nairobi",
  protocol: "https",
  host: "db.production.example.com",
  port: 5432,
  base_path: "/api/v1",
  timeout_seconds: 30,
  max_retries: 3,

  // Circuit Breaker (prevents cascading failures)
  circuit_breaker_enabled: true,
  circuit_breaker_threshold: 5, // Fail after 5 consecutive errors

  // Health Monitoring
  health_check_enabled: true,
  health_check_url: "/health",
  health_check_interval_seconds: 60,
  last_health_check_at: "2024-06-01T08:00:00Z",
  last_health_check_status: "healthy",
  consecutive_health_failures: 0,

  // Security
  tls_enabled: true,
  authentication_type: "bearer_token",

  // Status
  is_active: true,
  is_deprecated: false,

  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T08:00:00Z"
}
```

#### Server Types in CVM:

```javascript
// 1. DATABASE SERVER
// Stores customer data, campaigns, segments, offers
{
  name: "Customer Database Server",
  server_type: "database",
  protocol: "https",
  host: "db.cvm.example.com",
  port: 5432
}

// 2. API SERVER
// Handles API requests from the frontend
{
  name: "CVM API Server",
  server_type: "api",
  protocol: "https",
  host: "api.cvm.example.com",
  port: 443,
  base_path: "/api/v1"
}

// 3. MESSAGE GATEWAY SERVER
// Sends SMS, Email, Push notifications
{
  name: "SMS Gateway Server",
  server_type: "message_gateway",
  protocol: "https",
  host: "sms-gateway.example.com",
  port: 443
}

// 4. ANALYTICS SERVER
// Processes campaign analytics and metrics
{
  name: "Analytics Processing Server",
  server_type: "analytics",
  protocol: "https",
  host: "analytics.example.com",
  port: 443
}
```

#### How Servers Connect to Campaigns:

```
┌─────────────────────────────────────────────────────────┐
│ CAMPAIGN EXECUTION FLOW WITH SERVERS                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Campaign Activated                                   │
│     ↓                                                     │
│  2. Job System connects to Database Server              │
│     - Fetches segment definitions                        │
│     - Queries customer data                              │
│     ↓                                                     │
│  3. Segment Evaluation Job                              │
│     - Uses Database Server to run SQL queries           │
│     - Returns customer IDs                              │
│     ↓                                                     │
│  4. Message Delivery Job                                │
│     - Uses Message Gateway Server                       │
│     - Sends SMS/Email/Push                              │
│     ↓                                                     │
│  5. Analytics Job                                        │
│     - Uses Analytics Server                             │
│     - Tracks opens, clicks, conversions                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### Example: Campaign Using Multiple Servers

```javascript
// Scenario: "Summer Sale Campaign" execution

// STEP 1: Segment Evaluation
// Uses: Database Server (PROD-DB-01)
const segmentQuery = `
  SELECT customer_id 
  FROM customers 
  WHERE tier = 'VIP' AND city = 'Nairobi'
`;
// Executed on: db.production.example.com:5432
// Result: [123, 456, 789, ...]

// STEP 2: Customer Profile Fetch
// Uses: Database Server (PROD-DB-01)
const customerProfiles = await db.query(
  `SELECT * FROM customers WHERE customer_id IN (?)`,
  [customerIds],
);
// Executed on: db.production.example.com:5432

// STEP 3: Message Delivery
// Uses: SMS Gateway Server (SMS-GW-01)
await smsGateway.send({
  server: "sms-gateway.example.com",
  to: customer.phone,
  message: renderedMessage,
});
// Executed on: sms-gateway.example.com:443

// STEP 4: Analytics Tracking
// Uses: Analytics Server (ANALYTICS-01)
await analytics.track({
  server: "analytics.example.com",
  event: "message_sent",
  campaign_id: 789,
  customer_id: 123,
});
// Executed on: analytics.example.com:443
```

---

### 2. Connection Profiles

**Connection Profiles** define how the CVM system connects to data sources (databases, APIs, file systems) to retrieve customer data. They provide a secure, reusable way to configure database connections.

#### Connection Profile Structure:

```javascript
// Example: Customer Database Connection Profile
{
  id: 101,
  profile_name: "Production Customer DB",
  profile_code: "PROD-CUSTOMER-DB",
  connection_type: "database",

  // Server Reference
  server_id: 1, // Links to Server (PROD-DB-01)

  // Database Configuration
  database_name: "customer_database",
  database_type: "postgresql",

  // Data Loading Strategy
  load_strategy: "incremental", // Options: full, incremental, delta, cdc, merge, append, upsert
  sync_column_name: "updated_at", // Column to track changes
  sync_column_type: "timestamp",

  // Performance Settings
  batch_size: 1000, // Process 1000 records at a time
  parallel_threads: 4, // Use 4 parallel connections

  // Connection Pooling
  min_pool_size: 5, // Minimum connections in pool
  max_pool_size: 20, // Maximum connections in pool
  connection_timeout_seconds: 30,
  idle_timeout_seconds: 300,

  // Retry Logic
  max_retries: 3,
  retry_backoff_multiplier: 2, // Exponential backoff: 2s, 4s, 8s

  // Circuit Breaker
  circuit_breaker_threshold: 5, // Fail after 5 consecutive errors

  // Health Monitoring
  health_check_enabled: true,
  health_check_query: "SELECT 1", // Simple query to test connection
  last_health_check_at: "2024-06-01T08:00:00Z",
  last_health_check_status: "healthy",

  // Data Governance
  data_classification: "confidential", // public, internal, confidential, restricted
  contains_pii: true, // Contains Personally Identifiable Information
  gdpr_applicable: true, // Subject to GDPR regulations

  // Environment
  environment: "production", // development, staging, production, uat

  // Validity Period
  valid_from: "2024-01-01T00:00:00Z",
  valid_to: null, // null = no expiration

  // Security
  encryption_key_version: 2, // Encryption key version for credentials

  // Status
  is_active: true,

  // Usage Tracking
  last_used_at: "2024-06-01T08:15:30Z",

  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T08:00:00Z"
}
```

#### Connection Types:

```javascript
// 1. DATABASE CONNECTION
// Connects to SQL databases (PostgreSQL, MySQL, SQL Server, etc.)
{
  connection_type: "database",
  database_name: "customer_database",
  database_type: "postgresql",
  load_strategy: "incremental"
}

// 2. API CONNECTION
// Connects to REST APIs for customer data
{
  connection_type: "api",
  server_id: 5, // API Server
  load_strategy: "full"
}

// 3. FILE SYSTEM CONNECTION
// Connects to SFTP/FTP servers for file-based data
{
  connection_type: "sftp",
  server_id: 6, // SFTP Server
  load_strategy: "delta"
}

// 4. CLOUD STORAGE CONNECTION
// Connects to S3, Azure Blob Storage
{
  connection_type: "s3",
  load_strategy: "append"
}

// 5. STREAMING CONNECTION
// Connects to Kafka for real-time data
{
  connection_type: "kafka",
  load_strategy: "cdc" // Change Data Capture
}
```

#### Load Strategies:

```javascript
// FULL LOAD
// Loads all data every time (use for small datasets)
{
  load_strategy: "full"
}
// Example: Load all 10,000 customers every day

// INCREMENTAL LOAD
// Only loads new/updated records since last sync
{
  load_strategy: "incremental",
  sync_column_name: "updated_at",
  sync_column_type: "timestamp"
}
// Example: Load only customers updated in last 24 hours

// DELTA LOAD
// Loads only changed records (inserts, updates, deletes)
{
  load_strategy: "delta",
  sync_column_name: "change_timestamp"
}
// Example: Load only customers that changed

// CDC (CHANGE DATA CAPTURE)
// Real-time streaming of changes
{
  load_strategy: "cdc"
}
// Example: Stream customer changes as they happen

// MERGE LOAD
// Merges new data with existing data
{
  load_strategy: "merge"
}
// Example: Merge updated customer profiles

// APPEND LOAD
// Adds new records without updating existing ones
{
  load_strategy: "append"
}
// Example: Add new customers without modifying existing ones

// UPSERT LOAD
// Updates existing records or inserts new ones
{
  load_strategy: "upsert"
}
// Example: Update customer if exists, insert if new
```

#### How Connection Profiles Work in Campaigns:

```
┌─────────────────────────────────────────────────────────┐
│ CAMPAIGN SEGMENT EVALUATION WITH CONNECTION PROFILE    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Campaign activates                                   │
│     ↓                                                     │
│  2. Segment Evaluation Job starts                        │
│     ↓                                                     │
│  3. System selects Connection Profile                   │
│     - Profile: "Production Customer DB"                │
│     - Connection Type: database                         │
│     - Server: PROD-DB-01                                │
│     ↓                                                     │
│  4. Connection Pool established                          │
│     - min_pool_size: 5 connections                      │
│     - max_pool_size: 20 connections                     │
│     ↓                                                     │
│  5. Segment query executed                               │
│     - Uses connection from pool                         │
│     - Query: SELECT customer_id FROM customers...      │
│     - Batch size: 1000 records                          │
│     ↓                                                     │
│  6. Results returned                                     │
│     - Customer IDs: [123, 456, 789, ...]               │
│     ↓                                                     │
│  7. Connection returned to pool                        │
│     - Available for next query                          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### Example: Segment Evaluation Using Connection Profile

```javascript
// STEP 1: Get Connection Profile
const connectionProfile = await getConnectionProfile("PROD-CUSTOMER-DB");
// Result: {
//   id: 101,
//   server_id: 1,
//   database_name: "customer_database",
//   batch_size: 1000,
//   parallel_threads: 4
// }

// STEP 2: Get Server Details
const server = await getServer(connectionProfile.server_id);
// Result: {
//   host: "db.production.example.com",
//   port: 5432,
//   protocol: "https"
// }

// STEP 3: Establish Connection Pool
const connectionPool = await createConnectionPool({
  host: server.host,
  port: server.port,
  database: connectionProfile.database_name,
  minPoolSize: connectionProfile.min_pool_size, // 5
  maxPoolSize: connectionProfile.max_pool_size, // 20
  connectionTimeout: connectionProfile.connection_timeout_seconds * 1000,
});

// STEP 4: Execute Segment Query (with batching)
const segment = {
  criteria: {
    conditions: [
      { field: "tier", operator: "equals", value: "VIP" },
      { field: "city", operator: "equals", value: "Nairobi" },
    ],
  },
};

// Convert segment criteria to SQL
const sqlQuery = `
  SELECT customer_id, name, email, phone
  FROM customers
  WHERE tier = 'VIP' AND city = 'Nairobi'
  AND is_active = true
  AND opted_out = false
`;

// Execute query in batches
const customerIds = [];
let offset = 0;
const batchSize = connectionProfile.batch_size; // 1000

while (true) {
  const batch = await connectionPool.query(
    `${sqlQuery} LIMIT ${batchSize} OFFSET ${offset}`,
  );

  if (batch.length === 0) break;

  customerIds.push(...batch.map((row) => row.customer_id));
  offset += batchSize;

  // Use parallel threads for faster processing
  if (
    customerIds.length % (batchSize * connectionProfile.parallel_threads) ===
    0
  ) {
    await Promise.all(
      Array(connectionProfile.parallel_threads)
        .fill(null)
        .map(() => processBatch(customerIds.slice(-batchSize))),
    );
  }
}

// Result: [123, 456, 789, 1011, ...] - All VIP customers in Nairobi
```

---

### How Infrastructure Connects to the CVM System

#### Complete Flow: Campaign Execution with Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│ 1. CAMPAIGN CREATED                                      │
│    - User creates campaign in UI                         │
│    - Campaign stored in database                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CAMPAIGN ACTIVATED                                    │
│    - Campaign status = "active"                          │
│    - Job system triggered                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. JOB SYSTEM CONNECTS TO INFRASTRUCTURE                 │
│    - Gets Connection Profile: "Production Customer DB" │
│    - Gets Server: PROD-DB-01                            │
│    - Establishes connection pool                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. SEGMENT EVALUATION JOB                                │
│    - Uses Connection Profile to query database          │
│    - Executes SQL: SELECT customer_id FROM customers...│
│    - Returns: [123, 456, 789, ...]                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. CUSTOMER PROFILE FETCH                                │
│    - Uses same Connection Profile                       │
│    - Fetches full customer data                         │
│    - Returns: { customer_id: 123, name: "John", ... } │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. MESSAGE DELIVERY                                      │
│    - Uses Message Gateway Server                        │
│    - Server: SMS-GW-01                                  │
│    - Sends SMS via gateway                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. ANALYTICS TRACKING                                    │
│    - Uses Analytics Server                              │
│    - Server: ANALYTICS-01                               │
│    - Tracks delivery, opens, clicks                    │
└─────────────────────────────────────────────────────────┘
```

#### Key Benefits of Infrastructure Management:

1. **Centralized Configuration**
   - All server and connection settings in one place
   - Easy to update without changing code
   - Consistent configuration across environments

2. **Health Monitoring**
   - Automatic health checks
   - Circuit breakers prevent cascading failures
   - Real-time status visibility

3. **Performance Optimization**
   - Connection pooling reduces overhead
   - Batch processing improves efficiency
   - Parallel threads speed up data loading

4. **Security & Compliance**
   - Encrypted connections (TLS)
   - Data classification tracking
   - GDPR compliance features
   - Audit trails for data access

5. **Reliability**
   - Retry logic with exponential backoff
   - Circuit breakers prevent system overload
   - Automatic failover capabilities

---

## Segment Lists

### What are Segment Lists?

**Segment Lists** are pre-uploaded lists of customers that can be used as building blocks for creating segments. Instead of defining segment conditions (like "tier = VIP"), you can upload a CSV file with specific customer IDs and use that list directly in your segments.

### Key Characteristics:

- ✅ **Pre-uploaded customer data** - CSV, TSV, TXT, or XLSX files
- ✅ **Reusable** - Use the same list in multiple segments/campaigns
- ✅ **Flexible** - Can be combined with segment conditions
- ✅ **Quick setup** - No need to write complex SQL queries
- ✅ **Static or dynamic** - Lists can be updated over time

### Segment List Structure:

```javascript
// Example: High Value Customers List
{
  list_id: 501,
  name: "High Value Customers Q4 2024",
  description: "Top 1000 customers by revenue in Q4 2024",
  subscriber_count: 1000,
  created_on: "2024-12-01",
  list_type: "standard", // Options: "seed", "and", "standard"

  // File Configuration
  subscriber_id_col_name: "customer_id", // Column containing customer IDs
  file_delimiter: ",", // CSV delimiter
  list_headers: "customer_id,name,email,phone,revenue", // CSV headers
  file_text: "customer_id,name,email,phone,revenue\n123,John Doe,john@example.com,+254712345678,50000\n456,Jane Smith,jane@example.com,+254723456789,45000\n...", // File content
  file_name: "high_value_customers_q4.csv",
  file_size: 125000, // bytes

  // Metadata
  tags: ["high-value", "q4-2024", "revenue"]
}
```

### List Types:

```javascript
// 1. STANDARD LIST
// General purpose list for most campaigns
{
  list_type: "standard",
  description: "Use for regular campaign targeting"
}
// Example: "VIP Customers List", "New Customers List"

// 2. SEED LIST
// Internal QA or preview audiences (testing)
{
  list_type: "seed",
  description: "Use for testing campaigns before full launch"
}
// Example: "QA Test List", "Preview Audience"

// 3. AND LIST
// Intersect with existing segment logic
{
  list_type: "and",
  description: "Combine with segment conditions using AND logic"
}
// Example: Use list AND segment conditions together
```

### How Segment Lists Work:

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: UPLOAD LIST                                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User uploads CSV file:                                 │
│  customer_id,name,email,phone                          │
│  123,John Doe,john@example.com,+254712345678           │
│  456,Jane Smith,jane@example.com,+254723456789         │
│  789,Bob Johnson,bob@example.com,+254734567890         │
│  ...                                                     │
│                                                           │
│  System stores:                                          │
│  - File content in database                             │
│  - List metadata (name, description, type)             │
│  - Subscriber count: 1,000                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: USE LIST IN SEGMENT                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User creates segment:                                   │
│  - Name: "High Value Customers Campaign"                │
│  - Type: "List-based"                                   │
│  - List: "High Value Customers Q4 2024" (list_id: 501) │
│                                                           │
│  System creates segment:                                 │
│  {                                                       │
│    segment_id: 201,                                      │
│    name: "High Value Customers Campaign",               │
│    type: "static",                                      │
│    list_id: 501,                                        │
│    members: [123, 456, 789, ...] // From list          │
│  }                                                       │
│                                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: USE SEGMENT IN CAMPAIGN                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User creates campaign:                                  │
│  - Campaign: "Q4 Revenue Campaign"                     │
│  - Segment: "High Value Customers Campaign" (201)       │
│  - Offer: "Premium Data Bundle Offer"                  │
│                                                           │
│  When campaign runs:                                     │
│  1. System loads list (list_id: 501)                    │
│  2. Gets customer IDs: [123, 456, 789, ...]            │
│  3. Fetches customer profiles                           │
│  4. Sends offers to all customers in list               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Segment List File Format:

```csv
# Example CSV File: high_value_customers.csv
customer_id,name,email,phone,revenue,tier
123,John Doe,john@example.com,+254712345678,50000,VIP
456,Jane Smith,jane@example.com,+254723456789,45000,Premium
789,Bob Johnson,bob@example.com,+254734567890,40000,Standard
1011,Alice Brown,alice@example.com,+254745678901,55000,VIP
```

#### File Configuration:

```javascript
// When uploading, user specifies:
{
  subscriber_id_col_name: "customer_id", // Which column has customer IDs
  file_delimiter: ",", // Comma, semicolon, tab, or pipe
  list_headers: "customer_id,name,email,phone,revenue,tier" // First row
}

// System parses file:
// - Extracts customer IDs from "customer_id" column
// - Counts total rows (excluding header)
// - Stores file content for later use
```

### Using Segment Lists in Segments:

#### Option 1: List-Only Segment

```javascript
// Segment that uses ONLY the list (no additional conditions)
{
  segment_id: 201,
  name: "High Value Customers",
  type: "static",
  list_id: 501, // "High Value Customers Q4 2024"
  criteria: null, // No additional conditions

  // Members: All customers from list
  members: [123, 456, 789, 1011, ...] // From list file
}
```

#### Option 2: List + Conditions (AND List)

```javascript
// Segment that uses list AND additional conditions
{
  segment_id: 202,
  name: "High Value Customers in Nairobi",
  type: "dynamic",
  list_id: 501, // "High Value Customers Q4 2024"
  criteria: {
    conditions: [
      { field: "city", operator: "equals", value: "Nairobi" }
    ],
    logic: "AND"
  },

  // Members: Customers from list WHO ALSO live in Nairobi
  // Process:
  // 1. Get customers from list: [123, 456, 789, ...]
  // 2. Filter by city = "Nairobi"
  // 3. Result: [123, 789, ...] (only those in Nairobi)
  members: [123, 789, ...] // Intersection of list and conditions
}
```

### Real-World Example: Using Segment Lists

#### Scenario: Black Friday Campaign with Pre-Selected Customers

```javascript
// STEP 1: Upload Customer List
const segmentList = {
  list_id: 501,
  name: "Black Friday VIP Customers",
  description: "Top 500 customers selected for exclusive Black Friday offer",
  subscriber_count: 500,
  list_type: "standard",
  file_text: `customer_id,name,email,phone
123,John Doe,john@example.com,+254712345678
456,Jane Smith,jane@example.com,+254723456789
789,Bob Johnson,bob@example.com,+254734567890
...` // 500 rows total
};

// STEP 2: Create Segment Using List
const segment = {
  segment_id: 201,
  name: "Black Friday VIP Segment",
  type: "static",
  list_id: 501, // Uses the uploaded list
  members: [123, 456, 789, ...] // 500 customer IDs from list
};

// STEP 3: Create Campaign
const campaign = {
  campaign_id: 789,
  name: "Black Friday Exclusive Sale",
  segments: [201], // Uses segment with list
  offers: [456] // "Black Friday Data Bundle Offer"
};

// STEP 4: Campaign Execution
// When campaign runs:
// 1. System loads list (list_id: 501)
// 2. Gets customer IDs: [123, 456, 789, ...]
// 3. Fetches customer profiles for all 500 customers
// 4. Sends Black Friday offer to all customers in list
```

### Segment Lists vs Dynamic Segments:

| Feature         | Segment Lists               | Dynamic Segments                  |
| --------------- | --------------------------- | --------------------------------- |
| **Definition**  | Pre-uploaded customer list  | Conditions-based query            |
| **Data Source** | CSV/Excel file              | Database query                    |
| **Updates**     | Manual re-upload            | Automatic (runs query each time)  |
| **Use Case**    | Specific customer selection | Rule-based targeting              |
| **Example**     | "Top 100 customers"         | "VIP customers in Nairobi"        |
| **Flexibility** | Fixed list                  | Dynamic (changes as data changes) |

### Combining Lists with Segment Conditions:

```javascript
// Example: Use list AND apply additional filters

// List: "High Value Customers" (1,000 customers)
const list = {
  list_id: 501,
  subscriber_count: 1000,
};

// Segment: "High Value Customers in Nairobi" (uses list + condition)
const segment = {
  segment_id: 201,
  list_id: 501, // Start with list
  criteria: {
    conditions: [{ field: "city", operator: "equals", value: "Nairobi" }],
  },
};

// Execution:
// 1. Load list: Get 1,000 customer IDs
// 2. Apply condition: Filter by city = "Nairobi"
// 3. Result: ~200 customers (only those in Nairobi from the list)
```

### Key Takeaways:

1. **Segment Lists are Pre-Uploaded Customer Lists**
   - Upload CSV/Excel files with customer data
   - Reuse lists across multiple segments/campaigns
   - Quick way to target specific customers

2. **Three List Types**
   - **Standard**: General purpose lists
   - **Seed**: Testing/preview audiences
   - **AND**: Combine with segment conditions

3. **Can Combine with Segment Conditions**
   - Use list as starting point
   - Apply additional filters (city, tier, etc.)
   - Result: Intersection of list and conditions

4. **Infrastructure Powers Everything**
   - Servers provide backend connectivity
   - Connection Profiles define data access
   - Both work together to execute campaigns

5. **Lists vs Dynamic Segments**
   - Lists: Fixed, pre-selected customers
   - Dynamic: Rule-based, automatically updates

---

## Summary
