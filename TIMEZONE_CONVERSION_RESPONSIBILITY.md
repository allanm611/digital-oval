# Timezone Conversion Responsibility - NEEDS CLARIFICATION

**Status:** NEEDS CLARIFICATION WITH BACKEND

## Current Situation

Right now, the code is **confusing and potentially incorrect**:

### What Frontend Currently Does

**SchedulingComponent.tsx (lines 482-514):**
```tsx
// When timezone changes:
onChange={(value) => {
  const selectedTz = timezoneList.find((tz) => tz.value === value);
  
  if (selectedTz?.utc_offset && scheduling?.start_date) {
    updatedData.start_date = formatDateWithTimezone(
      scheduling.start_date,
      selectedTz.utc_offset,
      { includeTime: true }
    );
  }
  updateScheduling(updatedData);
}}
```

This calls `formatDateWithTimezone()` which is a **DISPLAY function**, not a conversion-for-backend function.

### What formatDateWithTimezone Actually Does

**dateService.ts (lines 129-176):**
```typescript
export const formatDateWithTimezone = (
  date: Date | string | number | null | undefined,
  timezoneOffset: string
): string => {
  // ... parse offset
  const convertedDate = new Date(dateObj.getTime() + offsetMinutes * 60 * 1000);
  // Returns a formatted STRING like "2026-06-18 14:30:45"
  return formatted;
}
```

**Problem:** This function:
- ✅ Works for DISPLAYING dates to the user in their timezone
- ❌ Should NOT be used to modify dates before sending to backend
- ❌ Doesn't actually convert to UTC, it just reformats with offset applied
- ❌ Returns a string, not a date object that backend can parse

### What Gets Sent to Backend

**CreateCampaignPage.tsx (lines 1090, 1091):**
```typescript
const campaignData: CreateCampaignRequest = {
  ...
  ...(formData.start_date && { start_date: formData.start_date }),
  ...(formData.end_date && { end_date: formData.end_date }),
  ...
};
await campaignService.createCampaign(campaignData);
```

The dates are sent as-is (string format) with NO explicit UTC conversion in frontend service layer.

### CreateCampaignRequest Type

**createCampaign.ts:**
```typescript
export interface CreateCampaignRequest {
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;
  ...
}
```

No indication of format (ISO 8601? YYYY-MM-DD? With time?). Ambiguous.

---

## Industry Standard (What SHOULD Happen)

All major CVM tools follow this pattern:

```
USER EXPERIENCE:
User enters: "June 15, 2 PM" in timezone "Africa/Nairobi"

FRONTEND RESPONSIBILITY:
1. Parse user input: June 15, 2 PM (local)
2. Get timezone offset: Africa/Nairobi = +03:00
3. Convert to UTC: June 15, 2 PM - 03:00 = June 15, 11:00 AM UTC
4. Send to backend: { start_date: "2026-06-15T11:00:00Z", timezone: "Africa/Nairobi" }

BACKEND RESPONSIBILITY:
1. Receive UTC date + timezone
2. Store UTC internally
3. When retrieving: convert back to user's timezone for display

DISPLAY (Any time):
Convert UTC back to user's timezone using timezone offset
```

**Tools that follow this pattern:**
- Segment
- Iterable
- Klaviyo
- Salesforce Marketing Cloud
- HubSpot

---

## The Real Question

**Does backend expect:**

### Option A: UTC dates (Industry Standard) ✅ PREFERRED
```json
{
  "start_date": "2026-06-15T11:00:00Z",  // UTC with Z
  "timezone": "Africa/Nairobi",          // User's timezone
  "end_date": "2026-06-30T18:00:00Z"     // UTC with Z
}
```
✅ Backend stores UTC internally  
✅ Consistent across all timezones  
✅ What Segment, Iterable, Salesforce do  
✅ ISO 8601 standard  

### Option B: UTC without Z marker
```json
{
  "start_date": "2026-06-15 11:00:00",   // UTC, no Z
  "timezone": "Africa/Nairobi",
  "end_date": "2026-06-30 18:00:00"
}
```
⚠️ Works but less clear it's UTC

### Option C: Local time string (WRONG) ❌
```json
{
  "start_date": "2026-06-15 14:00:00",   // Local time, NOT UTC
  "timezone": "Africa/Nairobi",
  "end_date": "2026-06-30 18:00:00"
}
```
❌ Ambiguous (is this UTC or local?)  
❌ Hard to store/compare across timezones  
❌ Backend has to guess what the date means  

---

## Current Code Issues

### Issue 1: Confusing Date Flow

```
User input (UI) 
  ↓
SchedulingComponent 
  ↓ (timezone change triggers formatDateWithTimezone)
Modifies start_date/end_date with display-formatted strings
  ↓
Stored in formData.scheduling.start_date
  ↓
Sent to backend as-is (NO UTC conversion!)
  ↓
Backend receives... what exactly?
```

### Issue 2: formatDateWithTimezone Misuse

The function is meant for **display only**:
```typescript
// ✅ Correct use: Display UTC date in user's timezone
const displayed = formatDateWithTimezone(
  "2026-06-15T11:00:00Z",  // UTC
  "+03:00",                  // Nairobi offset
  { includeTime: true }
);
// Result: "2026-06-15 14:00:00" (displayed to user)

// ❌ Wrong use: Modify date before sending to backend
const badData = formatDateWithTimezone(
  "2026-06-15",
  selectedTz.utc_offset
);
// This doesn't convert to UTC, just reformats with offset
```

### Issue 3: No Explicit UTC Conversion Utility

There's NO function in the codebase that does:
```typescript
convertLocalToUTC(localTime: string, timezoneOffset: string): string
// Input:  "2026-06-15 14:00", "+03:00"
// Output: "2026-06-15T11:00:00Z"
```

---

## What Should Happen

### Frontend Should:
1. ✅ Accept user input in their local timezone
2. ✅ Get the timezone offset for that timezone
3. ✅ CONVERT the local date to UTC using proper conversion math
4. ✅ Send to backend: UTC date + timezone IANA ID
5. ❌ NOT use `formatDateWithTimezone` for backend submission (display only)

### Backend Should:
1. ✅ Receive UTC date + timezone
2. ✅ Store UTC date internally
3. ✅ Store timezone for display/execution purposes
4. ✅ When returning campaign: return UTC date + timezone
5. ✅ Frontend displays by converting UTC back to user's timezone

---

## Critical Questions for Backend Team

**Q1: What format do you expect for start_date/end_date?**
- [ ] UTC ISO 8601? (e.g., "2026-06-15T11:00:00Z")
- [ ] UTC without Z? (e.g., "2026-06-15 11:00:00")
- [ ] Local time string? (e.g., "2026-06-15 14:00:00")

**Q2: How do you handle timezone conversion?**
- [ ] You convert local→UTC when receiving?
- [ ] You expect UTC already?
- [ ] Do you use the timezone field for anything?

**Q3: When you return campaign data, what timezone are dates in?**
- [ ] UTC?
- [ ] User's timezone?
- [ ] Something else?

**Q4: How do you handle scheduling/execution?**
- [ ] Do you convert UTC to user's timezone before sending?
- [ ] Do you store schedules in UTC and convert on execution?

---

## Current Hack Warning ⚠️

**The `formatDateWithTimezone` call on timezone change might be accidentally correct IF:**
- User enters date in UTC (unlikely)
- Backend doesn't care about timezone semantics (very bad)
- Backend just stores strings as-is (very bad)

But it's **unreliable** and **NOT following CVM standards**. This needs proper UTC conversion logic.

---

## Action Items (High Priority)

1. **☐ Clarify with backend** - Ask the critical questions above
2. **☐ Create proper UTC converter** - Add function to convert local → UTC correctly
3. **☐ Fix SchedulingComponent** - Use proper conversion, not formatDateWithTimezone
4. **☐ Update campaign service** - Ensure dates are in correct format before sending
5. **☐ Add tests** - Test timezone conversions across DST transitions
6. **☐ Document** - Make it clear what each date format means in code comments

---

## Files to Update (Once Backend Clarifies)

- `src/shared/components/SchedulingComponent.tsx` - Replace formatDateWithTimezone usage
- `src/shared/services/dateService.ts` - Add convertLocalToUTC function
- `src/features/campaigns/services/campaignService.ts` - Document date format expectations
- `src/features/campaigns/types/createCampaign.ts` - Add format documentation
- `src/features/campaigns/pages/CreateCampaignPage.tsx` - Use proper UTC conversion

