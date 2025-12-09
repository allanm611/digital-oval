# Complete CVM Campaign System Explanation

## How Everything Connects - Reference Guide

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Campaign Creation Flow](#campaign-creation-flow)
3. [How Segments Work](#how-segments-work)
4. [How Offers Connect](#how-offers-connect)
5. [How Creatives Work](#how-creatives-work)
6. [Variable Replacement System](#variable-replacement-system)
7. [Campaign Execution & Job Management](#campaign-execution--job-management)
8. [Job Management Infrastructure](#job-management-infrastructure)
9. [Complete Data Flow](#complete-data-flow)
10. [Real-World Example](#real-world-example)

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
      c.is_active === true
  );

  // 4. Fallback if no exact match
  if (!creative) {
    // Try same channel, default language (en)
    creative = offer.creatives.find(
      (c) =>
        c.channel === customerChannel &&
        c.locale === "en" &&
        c.is_active === true
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
    customer.account_balance
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
  creative.variables
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
    [customerId]
  );
  // Result: { customer_id: 123, name: "John Doe", email: "...", ... }

  // 3. Select Creative (based on customer preferences)
  const creative = selectCreative(customer, offer);

  // 4. Replace Variables
  const message = replaceVariables(
    creative.text_body,
    customer,
    creative.variables
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
    db.query(`SELECT * FROM customers WHERE customer_id = ?`, [id])
  )
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
    (c) => c.channel === "SMS" && c.locale === customer.preferred_language
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
  { amount: "KES 500", product: "10GB Data Bundle", code: "SUMMER2024" } // from creative
);
// Result: "Hi John Doe! Get KES 500 OFF on 10GB Data Bundle. Code: SUMMER2024."

// For Customer 456 (Jane Smith, Swahili):
const message2 = replaceVariables(
  "Hujambo {{name}}! Pata punguzo la {{amount}} kwenye {{product}}. Nambari: {{code}}.",
  { name: "Jane Smith" },
  { amount: "KES 500", product: "Kifurushi cha Data 10GB", code: "SUMMER2024" }
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
