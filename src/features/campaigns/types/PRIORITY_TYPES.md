# Campaign Priority Types - Full TypeScript Structure

## Overview
This document defines the complete TypeScript structure for campaign priority configuration in the Sentra CVM Frontend.

## Type Definitions

### 1. PriorityLevel (Enum Type)
```typescript
type PriorityLevel = "low" | "medium" | "high" | "critical";
```
**Description:** Represents the 4 priority levels for campaigns.

---

### 2. PriorityOption (Interface)
```typescript
interface PriorityOption {
  value: PriorityLevel;              // "low" | "medium" | "high" | "critical"
  label: string;                     // Display label (e.g., "Low", "High")
  bars: number;                      // Visual indicator: 1-4 bars
  color: string;                     // Tailwind color class (e.g., "text-blue-600")
}
```

**Example:**
```typescript
{
  value: "high",
  label: "High",
  bars: 3,
  color: "text-orange-600"
}
```

**UI Rendering:** The `bars` property controls visual representation:
- Low = 1 bar (shortest)
- Medium = 2 bars
- High = 3 bars
- Critical = 4 bars (tallest)

---

### 3. RankOption (Interface)
```typescript
interface RankOption {
  value: number;                     // 1-5, rank within priority level
  label?: string;                    // Optional display label
}
```

**Example:**
```typescript
{
  value: 1  // Rank 1 is highest within the selected priority
}
```

**UI Rendering:** Displays 5 button options (1, 2, 3, 4, 5) for ranking within a priority level.

---

### 4. PriorityConfig (Interface)
```typescript
interface PriorityConfig {
  priority?: PriorityLevel;          // Selected priority level
  priority_rank?: number;            // Rank within priority: 1-5
}
```

**Example:**
```typescript
{
  priority: "high",
  priority_rank: 1
}
```

**Backend Mapping:** This should be included in the campaign creation/update payload.

---

### 5. PrioritySectionState (Interface)
```typescript
interface PrioritySectionState extends PriorityConfig {
  priorityOptions: PriorityOption[];
  rankOptions: RankOption[];
}
```

**Description:** Complete state structure for the priority selection section.

---

## Constants

### PRIORITY_OPTIONS
```typescript
const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: "low",
    label: "Low",
    bars: 1,
    color: "text-blue-600",
  },
  {
    value: "medium",
    label: "Medium",
    bars: 2,
    color: "text-yellow-600",
  },
  {
    value: "high",
    label: "High",
    bars: 3,
    color: "text-orange-600",
  },
  {
    value: "critical",
    label: "Critical",
    bars: 4,
    color: "text-red-600",
  },
];
```

### RANK_OPTIONS
```typescript
const RANK_OPTIONS: RankOption[] = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
];
```

---

## Frontend Usage

### In Campaign Form Data
```typescript
formData: {
  // ... other fields
  priority: "high",              // PriorityLevel
  priority_rank: 1,              // 1-5
}
```

### Campaign Creation Payload
```typescript
{
  name: "Summer Sale Campaign",
  priority: "high",              // Backend receives string: "low" | "medium" | "high" | "critical"
  priority_rank: 1,              // Backend receives number: 1-5
  // ... other campaign fields
}
```

---

## Backend Requirements

### Expected API Response Format
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Summer Sale Campaign",
    "priority": "high",
    "priority_rank": 1,
    "created_at": "2026-05-24T10:00:00Z",
    ...
  }
}
```

### Validation Rules
- `priority` must be one of: "low", "medium", "high", "critical"
- `priority_rank` must be a number between 1-5 (optional)
- If `priority_rank` is provided, `priority` must also be provided

---

## File Location
- **Types File:** `/src/features/campaigns/types/priority.ts`
- **Used In:** `/src/features/campaigns/components/steps/CampaignDefinitionStep.tsx`

---

## Integration Checklist for Backend

- [ ] Ensure campaign table has `priority` column (varchar: "low" | "medium" | "high" | "critical")
- [ ] Ensure campaign table has `priority_rank` column (int: 1-5, nullable)
- [ ] Validate priority values in campaign creation/update endpoints
- [ ] Return priority fields in campaign GET endpoints
- [ ] Add priority to campaign list filtering/sorting if needed
- [ ] Document priority values in API specification
