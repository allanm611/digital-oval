# Campaign Execution - Complete Backend Flow (Industry Standard)

## Overview

A campaign is a **coordinated multi-day messaging program** that:
1. Targets customers using segments (with conditions + identity field)
2. Sends them offers (with messages in different channels)
3. Respects communication policies (frequency, consent, quiet hours)
4. Executes on schedule (now, later, recurring, trigger-based)
5. Tracks by department/line of business
6. Throttles to prevent overload
7. Personalizes with dynamic variables

---

## Part 1: Campaign Data Structure

### Campaign Object (What frontend sends to backend)

```json
{
  "campaign": {
    "id": 100,
    "name": "App Download Campaign Q2",
    "code": "APP_DL_Q2_2026",
    "description": "Encourage app downloads for Q2",
    "objective": "acquisition",
    "status": "draft",
    "approval_status": "pending",
    
    "organization": {
      "department_id": 2,
      "line_of_business_id": 3,
      "program_id": 5,
      "owner_team": "Marketing Growth"
    },
    
    "budget": {
      "allocated": 50000,
      "currency": "USD"
    },
    
    "dates": {
      "start_date": "2026-06-08",
      "end_date": "2026-06-30",
      "timezone": "Africa/Kampala"
    },
    
    "scheduling": {
      "type": "scheduled",
      "start_time": "09:00",
      "frequency": {
        "type": "daily",
        "interval": 1,
        "days_of_week": null,
        "days_of_month": null
      },
      "frequency_capping": {
        "max_per_day": 100000,
        "max_per_week": 500000,
        "max_per_month": 2000000
      },
      "throttling": {
        "max_per_hour": 50000,
        "max_per_minute": 1000
      }
    },
    
    "communication_policy_id": 7
  },
  
  "segments": [
    {
      "id": 1,
      "name": "Active Users",
      "conditions": [
        {
          "field": "status",
          "operator": "=",
          "value": "active"
        },
        {
          "field": "revenue",
          "operator": ">=",
          "value": 200,
          "time_window": "last_7_days"
        }
      ],
      "unique_identifier": "p_msisdn",
      "member_count": 1000
    }
  ],
  
  "campaign_flows": [
    {
      "segment_id": 1,
      "offer_id": 5,
      "offer_creative_id": 12,
      "flow_type": "STANDARD",
      "step_order": 1,
      "wait_interval_hours": 0,
      "bucket_allocation": null
    }
  ]
}
```

---

## Part 2: Communication Policy (Industry Standard)

### What is Communication Policy?

A set of **rules that govern how often customers can be contacted** and under what conditions.

### Policy Structure

```json
{
  "id": 7,
  "name": "Standard SMS Policy",
  "description": "Default policy for SMS campaigns",
  
  "frequency_limits": {
    "max_per_day": 1,
    "max_per_week": 2,
    "max_per_month": 8,
    "rolling_window_days": 7
  },
  
  "quiet_hours": {
    "enabled": false,
    "start_time": null,
    "end_time": null,
    "timezone": "UTC"
  },
  
  "consent_requirements": {
    "sms": true,
    "email": true,
    "push": false,
    "whatsapp": true
  },
  
  "opt_out_handling": "SKIP",
  "priority_campaigns": ["urgent", "transactional"],
  "channel_preferences": true
}
```

### How Policy Filters Customers

```
Before Sending (Policy Evaluation):

Customer #123:
├─ Has SMS consent? ✅ YES
├─ SMS sent this week? Count: 0 / Max: 2 ✅ OK
├─ SMS sent today? Count: 0 / Max: 1 ✅ OK
├─ In quiet hours? ❌ NO (disabled)
├─ Opted out? ❌ NO
└─ Result: ✅ ELIGIBLE → Send

Customer #456:
├─ Has SMS consent? ❌ NO
└─ Result: ❌ SKIP (No consent)

Customer #789:
├─ Has SMS consent? ✅ YES
├─ SMS sent this week? Count: 2 / Max: 2 ❌ EXCEEDED
└─ Result: ❌ SKIP (Frequency cap exceeded)

Final: 1000 customers → 950 eligible → Send to 950
```

---

## Part 3: Scheduling (When to Send)

### Scheduling Types

#### Type 1: Immediate

```json
{
  "type": "immediate",
  "description": "Send as soon as campaign is approved"
}
```

**Execution:**
```
User clicks: Approve Campaign
↓
Backend: Check all validations
↓
Start sending immediately to all eligible customers
↓
Complete within hours (depending on throttle)
```

#### Type 2: Scheduled

```json
{
  "type": "scheduled",
  "start_date": "2026-06-08",
  "start_time": "09:00",
  "timezone": "Africa/Kampala",
  "frequency": {
    "type": "daily",
    "interval": 1
  }
}
```

**Execution:**
```
Scheduled: 2026-06-08 at 09:00 Africa/Kampala

Timezone Conversion:
  Input: 2026-06-08 09:00 Africa/Kampala (UTC+3)
  Convert: 2026-06-08 06:00 UTC
  
Backend Timer:
  Wait until 2026-06-08 06:00 UTC
  ↓
  Trigger campaign execution
  ↓
  Send to all eligible customers
  ↓
  Schedule next execution: 2026-06-09 06:00 UTC (repeat daily)
```

#### Type 3: Recurring

```json
{
  "type": "recurring",
  "frequency": {
    "type": "weekly",
    "interval": 1,
    "days_of_week": [1, 3, 5]  // Monday, Wednesday, Friday
  },
  "start_date": "2026-06-01",
  "end_date": "2026-06-30"
}
```

**Execution:**
```
Every Monday, Wednesday, Friday in June:
  2026-06-01 (Mon) 09:00 → Send to eligible customers
  2026-06-03 (Wed) 09:00 → Send to eligible customers
  2026-06-05 (Fri) 09:00 → Send to eligible customers
  ... continue until end_date
```

#### Type 4: Trigger-Based

```json
{
  "type": "trigger_based",
  "trigger_event": "customer_signup",
  "delay_hours": 2
}
```

**Execution:**
```
Customer signs up at: 2026-06-08 14:00 UTC
↓
Wait: 2 hours
↓
At 2026-06-08 16:00 UTC: Check if customer matches segment
↓
If yes: Send campaign message
If no: Skip
```

---

## Part 4: Dynamic Variables (How They Work)

### Variable Structure

Variables are **placeholders** that get replaced with actual customer data at execution time.

### Variable Types

```
{{customer.first_name}}        // Customer profile field
{{customer.email}}
{{customer.p_msisdn}}
{{customer.status}}

{{subscription.activation_date}} // Related data
{{subscription.plan_name}}

{{offer.download_link}}        // Offer-specific data
{{offer.discount_percentage}}
{{offer.description}}

{{campaign.name}}              // Campaign metadata
{{campaign.code}}
```

### Variable Replacement Flow

```
STEP 1: Template Creation (in Offer Creative)

Creative text_body:
"Hi {{customer.first_name}}, 
 download our app! 
 Get {{offer.discount_percentage}}% off. 
 Link: {{offer.download_link}}"

STEP 2: Runtime - Fetch Customer Data

For customer #123:
  Fetch from database:
  {
    id: 123,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    p_msisdn: "+256700000001",
    status: "active"
  }

STEP 3: Fetch Offer Data

Offer #5:
  {
    id: 5,
    download_link: "app.link/abc123xyz",
    discount_percentage: 20,
    description: "Free Premium Access"
  }

STEP 4: Replace Variables

Original:
"Hi {{customer.first_name}}, 
 download our app! 
 Get {{offer.discount_percentage}}% off. 
 Link: {{offer.download_link}}"

After replacement:
"Hi John, 
 download our app! 
 Get 20% off. 
 Link: app.link/abc123xyz"

STEP 5: Send Message

SMS to: +256700000001
Body: "Hi John, download our app! Get 20% off. Link: app.link/abc123xyz"
```

### Variable Resolution (What if data is missing?)

```
Variable: {{customer.first_name}}
Data value: NULL (customer didn't provide name)

Options:
1. Use empty string: "Hi , download our app!"
2. Use fallback: "Hi there, download our app!"
3. Skip message: Don't send (customer incomplete)

Industry Standard: Option 2 (use fallback)
```

---

## Part 5: Complete Execution Flow

### Hour-by-Hour Execution Timeline

```
PRE-EXECUTION (Scheduled time arrives)

2026-06-08 06:00 UTC (09:00 Kampala):

PHASE 1: Load & Prepare
├─ Load campaign config
├─ Load communication policy #7
├─ Fetch segment #1 members: 1000 customers
├─ Load offer #5 + creative #12
├─ Initialize throttle counters:
│  ├─ Hour: 0/50,000
│  ├─ Day: 0/100,000
│  └─ Week: 0/500,000
└─ Initialize execution logs

PHASE 2: Apply Communication Policy Filter
├─ Check each customer against policy
├─ Customer has consent? 
├─ Frequency limits exceeded?
├─ Opted out?
└─ Result: 1000 → 950 eligible

PHASE 3: Send Messages (Throttled)
├─ Time: 06:00:00 - 06:01:00
│  ├─ Customer #1: Fetch data + replace variables + send
│  ├─ Customer #2: Fetch data + replace variables + send
│  ├─ ...continue...
│  └─ Customer #50000: Fetch data + replace variables + send
│  
│  Sent this hour: 50,000/50,000 (THROTTLE LIMIT HIT)
│  Total sent today: 50,000/100,000

├─ Time: 06:01:00 - 07:00:00 (WAIT - Throttle cooling)
│  └─ Cannot send (hourly limit reached)
│  └─ Next hour available: 07:00:00

├─ Time: 07:00:00 - 08:00:00
│  ├─ Customer #50001 to #100000: Send (next 50,000)
│  │  └─ Sent this hour: 50,000/50,000
│  │  └─ Total sent today: 100,000/100,000 (DAILY CAP HIT)

└─ Time: 08:00:00 onwards
   └─ Cannot send more today
   └─ PAUSE until next execution (tomorrow 06:00 UTC)

PHASE 4: Log Results
├─ Execution record:
│  {
│    campaign_id: 100,
│    execution_date: "2026-06-08",
│    execution_time: "06:00:00 UTC",
│    department_id: 2,
│    line_of_business_id: 3,
│    segment_id: 1,
│    
│    targeting: {
│      segment_members: 1000,
│      policy_eligible: 950,
│      consent_skip: 30,
│      frequency_skip: 20
│    },
│    
│    execution: {
│      sent: 100000,
│      failed: 0,
│      throttled: 850 (queued for next execution),
│      success_rate: 100%
│    },
│    
│    throttle_status: {
│      hour: 100000/50000 (LIMIT),
│      day: 100000/100000 (LIMIT),
│      week: 100000/500000 (OK)
│    }
│  }
└─ Update campaign status: "IN_PROGRESS"

NEXT EXECUTION: 2026-06-09 06:00 UTC
├─ Resume with remaining 850 customers
└─ Reset daily counter to 0/100,000
```

---

## Part 6: Multi-Day Campaign Execution

### Days 1-30 Pattern

```
2026-06-08 (Day 1):
  09:00 Kampala (06:00 UTC): Send 100,000 (daily cap)
  Remaining: 850
  
2026-06-09 (Day 2):
  09:00 Kampala (06:00 UTC): Send 850 remaining + eligible new members
  Daily cap: 100,000
  Sent: 850 (all eligible)
  Remaining: 0
  
2026-06-10 (Day 3):
  No new eligible customers (all already sent)
  Send: 0
  OR: If segment is dynamic, re-evaluate conditions
  
2026-06-11 to 2026-06-30:
  Same as Day 3 (unless new customers match segment)
```

---

## Part 7: Tracking by Department & Line of Business

### Data Model

```
campaigns Table:
┌────┬──────────────┬──────────────┬──────────────────┐
│ id │ department_id│ program_id   │ line_of_business │
├────┼──────────────┼──────────────┼──────────────────┤
│100 │ 2            │ 5            │ 3                │
│101 │ 1            │ 4            │ 1                │
└────┴──────────────┴──────────────┴──────────────────┘

campaign_executions Table:
┌────┬──────────────┬──────────────┬──────────────┬──────────┐
│ id │ campaign_id  │ department_id│ sent         │ status   │
├────┼──────────────┼──────────────┼──────────────┼──────────┤
│1000│ 100          │ 2            │ 100000       │ "sent"   │
│1001│ 100          │ 2            │ 50000        │ "sent"   │
└────┴──────────────┴──────────────┴──────────────┴──────────┘
```

### Campaign Reporting by Department

```sql
SELECT 
  d.name as department,
  COUNT(c.id) as active_campaigns,
  SUM(ce.sent) as total_sent,
  SUM(ce.sent - ce.failed) as total_delivered,
  ROUND(100 * SUM(ce.sent - ce.failed) / SUM(ce.sent), 2) as success_rate,
  SUM(c.budget) as total_budget
FROM departments d
LEFT JOIN campaigns c ON c.department_id = d.id
LEFT JOIN campaign_executions ce ON ce.campaign_id = c.id
WHERE c.status = 'active'
GROUP BY d.id

Result:
┌────────────┬──────────────┬────────────┬──────────────┬──────────────┬────────────┐
│department  │active_camps  │total_sent  │total_delivered│success_rate │total_budget│
├────────────┼──────────────┼────────────┼──────────────┼──────────────┼────────────┤
│Marketing   │ 5            │ 1200000    │ 1198000      │ 99.83%       │ 250000     │
│Sales       │ 3            │ 800000     │ 799500       │ 99.94%       │ 150000     │
│Operations  │ 2            │ 500000     │ 500000       │ 100%         │ 100000     │
└────────────┴──────────────┴────────────┴──────────────┴──────────────┴────────────┘
```

---

## Part 8: Error Handling During Execution

### Scenarios

```
Scenario 1: Customer has NULL identity field

Customer #456:
  p_msisdn: NULL
  ↓
  Cannot send SMS (no phone)
  ↓
  Log: {
    customer_id: 456,
    status: "failed",
    reason: "identity_field_null",
    identity_field: "p_msisdn"
  }

Scenario 2: SMS Gateway Failure

Message: "Hi John, download app"
Route: SMS Route #2
↓
Call external SMS API
↓
API returns: 500 Server Error
↓
Log: {
  customer_id: 123,
  status: "failed",
  reason: "gateway_error",
  error_code: "SMS_GATEWAY_DOWN"
}
↓
Queue for retry (next execution)

Scenario 3: Variable Resolution Failed

Variable: {{customer.first_name}}
Customer data: { first_name: NULL }
↓
Use fallback: "Hi there" instead of "Hi "
↓
Message sent successfully with fallback
↓
Log: {
  customer_id: 789,
  status: "sent",
  note: "fallback_used_for_first_name"
}
```

---

## Summary: Complete Flow Diagram

```
CAMPAIGN CREATION
    ↓
[Approval Process]
    ↓
CAMPAIGN SCHEDULED
    ↓
[Scheduled Time Arrives]
    ↓
LOAD DATA
  ├─ Campaign config
  ├─ Communication Policy
  ├─ Segment members (1000)
  ├─ Offer + Creative
  └─ Department/LOB metadata
    ↓
FILTER BY POLICY
  ├─ Check consent
  ├─ Check frequency limits
  ├─ Check opt-out
  └─ Result: 950 eligible
    ↓
SEND MESSAGES (THROTTLED)
  FOR each of 950 customers:
    ├─ Fetch customer profile
    ├─ Fetch offer data
    ├─ Replace variables in template
    ├─ Check throttle limits
    ├─ Send via channel route
    ├─ Log execution
    └─ Update counters
    ↓
APPLY CAPS
  ├─ Hourly: 50,000/hour
  ├─ Daily: 100,000/day
  ├─ Weekly: 500,000/week
    ↓
LOG & REPORT
  ├─ Execution record (by department/LOB)
  ├─ Success rate
  ├─ Failures & reasons
  └─ Throttle status
    ↓
SCHEDULE NEXT EXECUTION
  ├─ If recurring: Schedule next run
  ├─ If one-time: Mark complete
  └─ Resume throttled customers in next run
```

---

## Industry Best Practices

1. **Normalization**: Store department_id, LOB_id in campaigns table (not the reverse)
2. **Policy Filtering**: Apply BEFORE sending (don't waste resources)
3. **Throttling**: Implement at multiple levels (hour, day, week)
4. **Variables**: Replace at runtime, not storage
5. **Fallbacks**: Use sensible defaults for missing data
6. **Logging**: Detailed execution logs for audit/support
7. **Timezone**: Convert at scheduled time, respect user timezone
8. **Retry Logic**: Queue failed messages for next execution
9. **Idempotency**: Customer never receives duplicate (check by campaign+customer)
10. **Monitoring**: Real-time throttle/cap status for ops team
