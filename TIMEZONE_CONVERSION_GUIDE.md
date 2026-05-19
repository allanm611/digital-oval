# Timezone Conversion Guide

## What is Timezone Conversion?

Timezone conversion is the process of taking a time in one timezone and displaying it in another timezone while maintaining the same moment in time.

**Example:**
```
Same moment in time:
├─ UTC (London):        2:00 PM
├─ Africa/Nairobi:      5:00 PM (+3 hours)
└─ America/New_York:    9:00 AM (-5 hours)
```

All these represent the **exact same moment**, just displayed differently.

---

## Understanding UTC (Coordinated Universal Time)

**UTC is the global baseline time** - like a reference clock everyone agrees on.

- **UTC ≠ Your Local Time**
- **UTC is fixed** - doesn't change
- **Your local time = UTC + your timezone offset**

### Why Do We Use UTC?

```
❌ If everyone stored local time:
   - Person A saves: "3:00 PM" (Nairobi)
   - Person B saves: "9:00 AM" (New York)
   - Same moment = Different numbers = CONFUSION!

✅ If everyone stores UTC:
   - Both store: "2:00 PM UTC"
   - Same moment = Same number = NO CONFUSION!
```

---

## How Timezone Offsets Work

A timezone offset tells you how many hours ahead (+) or behind (-) UTC you are.

### Common Offsets:

```
Africa/Nairobi    → +03:00  (3 hours AHEAD of UTC)
America/New_York  → -05:00  (5 hours BEHIND UTC)
Europe/London     → +00:00  (same as UTC)
Asia/Tokyo        → +09:00  (9 hours AHEAD of UTC)
```

### Offset Meaning:

```
Offset +03:00 means:
    Your time = UTC time + 3 hours
    
Offset -05:00 means:
    Your time = UTC time - 5 hours
```

---

## The Math: Converting UTC to User's Timezone

### Formula:
```
User's Local Time = UTC Time + Timezone Offset
```

### Step-by-Step Example:

**Scenario:** API returns `2026-05-18T14:00:00Z` (UTC)
**User's timezone:** Africa/Nairobi (+03:00)

**Step 1:** Parse the offset
```
+03:00 → 3 hours = 180 minutes
```

**Step 2:** Add the offset to UTC
```
UTC Time:     14:00 (2 PM)
Offset:       +03:00 (add 3 hours)
Result:       17:00 (5 PM)
```

**Step 3:** Display
```
User sees: "May 18, 2026 5:00 PM"
```

---

## How We Implemented It

### 1. **Store User's Timezone in Settings**

User goes to **Settings** → selects **Africa/Nairobi**

```typescript
// Stored in localStorage
appSettings = {
  timezone: "Africa/Nairobi",      // IANA ID
  timezone_offset: "+03:00"        // The offset for conversion
}
```

### 2. **API Returns UTC Times**

Backend always sends times in UTC:

```json
{
  "id": 60,
  "name": "Campaign",
  "created_at": "2026-05-08T12:27:14.029Z",  ← UTC time
  "updated_at": "2026-05-16T12:35:41.336Z"   ← UTC time
}
```

### 3. **Frontend Converts on Display**

When showing dates, we:
1. Get UTC time from API
2. Get user's timezone offset from settings
3. Convert: `UTC + offset = display time`
4. Format and show to user

```typescript
// Code flow:
API Data          Settings           Component
   ↓                 ↓                   ↓
UTC time     +  Timezone offset  →  DateFormatter
  "14:00"    +  "+03:00"          →  "5:00 PM"
```

### 4. **Code Implementation**

#### In `dateService.ts`:

```typescript
export function formatDateWithTimezone(
  utcDate,           // From API: "2026-05-08T12:27:14.029Z"
  timezoneOffset,    // From settings: "+03:00"
  format,            // "YYYY-MM-DD"
  includeTime        // true/false
) {
  // Step 1: Parse offset
  // "+03:00" → 180 minutes
  
  // Step 2: Add offset to UTC
  // UTC + 180 minutes = Local time
  
  // Step 3: Format and return
  // "2026-05-08 17:27:14" (in user's timezone)
}
```

#### In `DateFormatter.tsx`:

```typescript
<DateFormatter 
  date={campaign.created_at}        // UTC from API
  useUserTimezone                   // Use settings timezone
  includeTime                       // Show time
/>
```

This component:
1. Gets UTC time from `date` prop
2. Gets user's timezone offset from `getSettingsTimezoneOffset()`
3. Calls `formatDateWithTimezone()` to convert
4. Displays: "May 8, 2026 5:27 PM"

---

## Real-World Example

### Scenario:

**Campaign created in Nairobi at 5:27 PM local time**

#### What Happens:

```
1. User in Nairobi (offset +03:00)
   └─ Creates campaign at: 5:27 PM Nairobi time
   └─ Browser converts to UTC: 5:27 PM - 3 hours = 2:27 PM UTC
   └─ Sends to API: "2026-05-08T14:27:14.029Z"

2. Backend stores in database:
   └─ created_at: "2026-05-08T14:27:14.029Z"  ← UTC

3. User in New York (offset -05:00) views same campaign:
   └─ API returns: "2026-05-08T14:27:14.029Z"
   └─ Converts: 2:27 PM UTC - 5 hours = 9:27 AM
   └─ Sees: "May 8, 2026 9:27 AM"

4. User in London (offset +00:00) views same campaign:
   └─ API returns: "2026-05-08T14:27:14.029Z"
   └─ Converts: 2:27 PM UTC + 0 = 2:27 PM
   └─ Sees: "May 8, 2026 2:27 PM"
```

**Same moment in time, different displays!** ✓

---

## The Three Components We Built

### 1. **timezoneConverterService.ts**
```typescript
// Pure conversion logic
convertUtcToTimezone(utcDate, "+03:00")
formatDateInTimezone(utcDate, "+03:00", "YYYY-MM-DD", true)
```

### 2. **dateService.ts**
```typescript
// Adds conversion to date formatting
formatDateWithTimezone(utcDate, timezoneOffset)
```

### 3. **DateFormatter.tsx**
```typescript
// React component that uses everything
<DateFormatter date={utcTime} useUserTimezone includeTime />
```

---

## Pages Using Timezone Display

✅ **Campaigns**
- `CampaignsPage` - List view timestamps
- `CampaignDetailsPage` - Created, Updated, Start, End dates

✅ **Jobs**
- `JobExecutionsPage` - Started at time
- `JobExecutionDetailsPage` - Started/Completed/Estimated times
- `ScheduledJobDetailsPage` - All job timestamps
- `StepExecutionsPage` & `StepExecutionDetailsPage` - Step timestamps

✅ **Offers**
- `OfferDetailsPage` - Created/Updated dates
- `OffersPage` - Created dates in list

✅ **Customer Management**
- `CreateCustomerModal` - Timezone selector (fetches from API)
- `EditCustomerModal` - Timezone selector (fetches from API)

✅ **Scheduling**
- `SchedulingComponent` - Timezone selector (fetches from API)
- `SchedulingStepNew` - Timezone selector (fetches from API)

---

## How to Use It

### Display a Date in User's Timezone:

```typescript
import DateFormatter from "./shared/components/DateFormatter";

// In your component:
<DateFormatter 
  date={campaign.created_at}        // UTC time from API
  useUserTimezone                   // Use settings timezone
  includeTime                       // Include time
/>

// Result: "May 8, 2026 5:27 PM" (in user's selected timezone)
```

### Let User Select Timezone:

```typescript
import { timezoneService } from "./configurations/services/timezoneService";

// In your component:
const [timezones, setTimezones] = useState([]);

useEffect(() => {
  const data = await timezoneService.getTimezones();
  setTimezones(data.filter(tz => tz.is_active));
}, []);

<HeadlessSelect
  options={timezones.map(tz => ({
    value: tz.value,
    label: `${tz.label} (${tz.utc_offset})`
  }))}
/>
```

---

## Key Takeaways

1. **UTC is the base** - All times stored in database are UTC
2. **User's timezone is the offset** - Stored in settings as "+03:00"
3. **Conversion is simple math** - `UTC + offset = display time`
4. **We convert on display** - Not on storage
5. **Everyone sees the same moment** - Just displayed differently

---

## Timeline in App Flow

```
User's Device          App Frontend           Backend Server
     ↓                      ↓                        ↓
User selects      → Stored in settings    → (stays same)
timezone: "Africa/    timezone_offset:      (not used)
Nairobi"          "+03:00"

Campaign data       ← Returns UTC times ←   Stores UTC
received from         "2026-05-08T14:27"    "2026-05-08
API                                         T14:27"

DateFormatter       Converts and displays:
called              "May 8, 2026 5:27 PM"
                    (UTC + 3 hours)
```

---

## Summary

**Timezone conversion** is about taking a single moment in time (UTC) and displaying it differently based on where the user is located. We store UTC to avoid confusion, and convert to the user's timezone for display using simple math: `UTC + offset = local time`.
