# IS NULL / IS NOT NULL SQL Generation Bug

## Issue
When using "is empty" (IS NULL) or "is not empty" (IS NOT NULL) operators in Customer Identity conditions, the generated SQL preview shows an extra "null" value appended:

```sql
WHERE layer_0."msisdn" IS NULL null
```

Instead of the correct:
```sql
WHERE layer_0."msisdn" IS NULL
```

## Root Cause
The backend SQL generator is **always appending the value field to the SQL**, regardless of whether the operator actually needs a value.

**Flow:**
1. Frontend sends: `operator_id: 10` (IS NULL) + `value: null`
2. Backend generates SQL:
   - Takes operator from operator_id: `"IS NULL"`
   - Appends the value: `" null"` 
   - Result: `IS NULL null` ❌

## Why This Happens
The backend SQL generator doesn't check if an operator is a null operator before appending its value.

**Null operators don't need values:**
- `IS NULL` - just checks if field is empty (no value needed)
- `IS NOT NULL` - just checks if field has a value (no value needed)

But the generator treats them like other operators that do need values (e.g., `= "value"`).

## Proper Solution
**The fix needs to be in the backend SQL generation logic.**

The backend should:
1. Check if operator_id is 10 (IS NULL) or 11 (IS NOT NULL)
2. If yes, generate SQL without appending any value
3. If no, append the value as normal

**Backend code should do something like:**
```
if operator_id is 10 or 11:
    return "IS NULL" or "IS NOT NULL"
else:
    return operator + " " + value
```

## Frontend Workaround Status
- ✅ Prevents value input from showing for null operators
- ✅ Sends explicit `value: null` to backend
- ❌ Cannot fix the SQL generation since that's backend logic
- ⚠️ Preview SQL still shows the extra "null" until backend is fixed

## Action Items
- [ ] Backend team needs to fix SQL generator to skip value appending for null operators
- [ ] Test null operators after backend fix is deployed

---

# Between Operator - Array Storage Pattern

## Design Decision
The "between" operator (for numeric ranges) stores min/max values as an array in the `value` field, not in `start_date`/`end_date`.

**Why:**
- `start_date` and `end_date` are semantically for date ranges, not numeric ranges
- Using `value` as an array is consistent with how "in list" operator works
- Cleaner, more semantic data model

## Implementation
```javascript
// User enters: Min=3, Max=180
// Stored as: value: [3, 180]

// Display: Two separate inputs
<Input placeholder="Min" value={betweenValues[0]} />
<Input placeholder="Max" value={betweenValues[1]} />
```

## Handling in Frontend
1. Read from `value` array: `[min, max]`
2. Display in two separate input fields
3. On change, update array: `[newMin, prevMax]` or `[prevMin, newMax]`

## Backend Integration
Backend receives:
```json
{
  "operator": "between",
  "operator_id": 9,
  "value": [3, 180]
}
```

Should generate SQL like:
```sql
WHERE field BETWEEN 3 AND 180
```

---

# Date Operator SQL Generation Bug

## Issue
When using date operators (on_date, since_date, until_date, between_dates), the backend SQL generator is treating all of them as **BETWEEN** operators, causing incorrect SQL.

**Example:**
User selects "until_date" with date 2026-04-26:

Frontend sends:
```json
{
  "operator_id": 15,
  "end_date": "2026-04-26T23:59:59Z",
  "start_date": null
}
```

Backend generates (WRONG):
```sql
WHERE layer_0."activation_date" BETWEEN ''::timestamp AND '2026-04-26T23:59:59Z'::timestamp
```

Should generate (CORRECT):
```sql
WHERE layer_0."activation_date" <= '2026-04-26T23:59:59Z'::timestamp
```

## Root Cause
The backend SQL generator doesn't distinguish between the different date operator types (12, 13, 14, 15). It treats all of them as BETWEEN and tries to use both start_date and end_date, causing:
- Empty strings when start_date is null
- Wrong comparison operators being used
- Incorrect SQL syntax

## Backend Fix Required
The backend query builder needs to handle each date operator correctly:

| operator_id | operator | SQL Pattern |
|---|---|---|
| 12 | ON_DATE | `column = value` |
| 13 | BETWEEN_DATES | `column BETWEEN start_date AND end_date` |
| 14 | SINCE_DATE | `column >= start_date` |
| 15 | UNTIL_DATE | `column <= end_date` |

## Question for Backend Team
> "The backend SQL generator currently treats all date operators (12, 13, 14, 15) as BETWEEN. Each operator type should generate different SQL patterns. Can you fix the query builder to handle:
> - ON_DATE (12): equality check
> - BETWEEN_DATES (13): BETWEEN with both date bounds
> - SINCE_DATE (14): greater than or equal (>=)
> - UNTIL_DATE (15): less than or equal (<= )
> 
> Currently, selecting UNTIL_DATE generates: `BETWEEN ''::timestamp AND date` instead of `<= date`"
