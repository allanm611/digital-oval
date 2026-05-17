# Status Colors Refactor Plan

## Overview
This document identifies all status types and their color mappings across the CVM Sentra frontend application. A centralized utility (`statusColors.ts`) has been created to standardize status colors system-wide.

## Status Categories and Locations

### 1. Campaign Statuses
**File**: `src/features/campaigns/pages/CampaignDetailsPage.tsx`
- **Workflow statuses** (getStatusBadge):
  - `active` → green (bg-green-100 text-green-800)
  - `paused` → yellow (bg-yellow-100 text-yellow-800)
  - `draft` → gray (bg-gray-100 text-gray-800)
  - `completed` → blue (bg-blue-100 text-blue-800)

- **Approval statuses** (getApprovalBadge):
  - `approved` → green (bg-green-100 text-green-800 border-green-200)
  - `rejected` → red (bg-red-100 text-red-800 border-red-200)
  - `pending` → yellow (bg-yellow-100 text-yellow-800 border-yellow-200)

### 2. Offer Statuses
**Files**: `src/features/offers/pages/OffersPage.tsx`, `src/features/offers/pages/OfferDetailsPage.tsx`
- **Workflow statuses**:
  - `draft` → gray (bg-surface.cards text-text.primary)
  - `active` → green (bg-status.success text-status.success)
  - `paused` → orange/yellow

- **Approval statuses**:
  - `pending` → yellow (bg-status.warning/10 text-status.warning)
  - `approved` → green (bg-status.success/10 text-status.success)
  - `rejected` → red (bg-status.danger/10 text-status.danger)

**Files**: `src/features/offers/pages/OfferCategoriesPage.tsx`
- `active` status mapping

### 3. Job Execution Statuses
**Files**: `src/features/jobs/pages/AllJobsPage.tsx`, `src/features/jobs/pages/StepExecutionsPage.tsx`, `src/features/jobs/pages/JobExecutionDetailsPage.tsx`
- `completed` → green (text-green-600 bg-green-50)
- `running` → blue (text-blue-600 bg-blue-50)
- `failed` → red (text-red-600 bg-red-50)
- `pending` → yellow (text-yellow-600 bg-yellow-50)

### 4. Segment Statuses
**File**: `src/features/segments/pages/SegmentDetailsPage.tsx`
- Uses status from segment data structure
- Likely needs mapping (currently not using hardcoded badges)

### 5. User Account Statuses
**File**: `src/features/users/pages/UserProfilePage.tsx`
- `active` status handling

### 6. Manual Broadcast Statuses
**File**: `src/features/manual-broadcast/pages/BroadcastDetailsPage.tsx`
- `pending` status mapping

## Standardized Color Mappings

### Workflow Statuses (Blue/Yellow/Green/Gray)
Used for: Campaigns, Offers, Segments, Products

| Status | Background | Text | Purpose |
|--------|-----------|------|---------|
| `active` | bg-green-100 | text-green-800 | Currently running/enabled |
| `paused` | bg-yellow-100 | text-yellow-800 | Temporarily stopped |
| `draft` | bg-gray-100 | text-gray-800 | Not yet published |
| `completed` | bg-blue-100 | text-blue-800 | Finished execution |
| `archived` | bg-gray-200 | text-gray-700 | Archived/hidden |

### Approval Statuses (Green/Red/Yellow)
Used for: Campaign approvals, Offer approvals, Compliance checks

| Status | Background | Text | Border | Purpose |
|--------|-----------|------|--------|---------|
| `approved` | bg-green-100 | text-green-800 | border-green-200 | Accepted/Approved |
| `rejected` | bg-red-100 | text-red-800 | border-red-200 | Denied/Rejected |
| `pending` | bg-yellow-100 | text-yellow-800 | border-yellow-200 | Awaiting decision |

### Job Execution Statuses (Softer tones)
Used for: Job runs, ETL processes, Data pipelines

| Status | Background | Text | Purpose |
|--------|-----------|------|---------|
| `completed` | bg-green-50 | text-green-600 | Successfully finished |
| `running` | bg-blue-50 | text-blue-600 | Currently executing |
| `failed` | bg-red-50 | text-red-600 | Error during execution |
| `pending` | bg-yellow-50 | text-yellow-600 | Queued/waiting |

### Account Statuses (For users, servers, etc.)
Used for: User accounts, Server connections, System components

| Status | Background | Text | Purpose |
|--------|-----------|------|---------|
| `active` | bg-green-100 | text-green-800 | Active/Operational |
| `inactive` | bg-gray-100 | text-gray-800 | Inactive/Disabled |
| `suspended` | bg-red-100 | text-red-800 | Temporarily restricted |
| `pending` | bg-yellow-100 | text-yellow-800 | Awaiting activation |

## Refactoring Priority (by impact)

### Priority 1: High Impact (Multiple locations)
1. **CampaignDetailsPage.tsx** - Uses hardcoded colors in getStatusBadge & getApprovalBadge
   - Replace with: `getWorkflowStatusColor()` and `getApprovalStatusColor()`
   
2. **OffersPage.tsx & OfferDetailsPage.tsx** - Multiple status mappings
   - Replace with: `getWorkflowStatusColor()` and `getApprovalStatusColor()`

3. **AllJobsPage.tsx** - Job status colors in getStatusColor
   - Replace with: `getJobStatusColor()`

### Priority 2: Medium Impact
4. **OfferCategoriesPage.tsx** - Category status handling
5. **OfferApprovalHistoryPage.tsx** - Approval status mappings
6. **ScheduledJobsPage.tsx** - Job status colors
7. **StepExecutionsPage.tsx** - Job step status colors

### Priority 3: Lower Impact
8. Other pages with single status indicators

## Usage Examples

### Before (Hardcoded)
```tsx
const getStatusBadge = (status: string | undefined) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800";
    case "paused":
      return "bg-yellow-100 text-yellow-800";
    // ... more cases
  }
};

// In JSX
<span className={getStatusBadge(campaign.status)}>{campaign.status}</span>
```

### After (Centralized Utility)
```tsx
import { getWorkflowStatusColor, getApprovalStatusColor } from '../../../shared/utils/statusColors';

// In JSX - Workflow status
<span className={getWorkflowStatusColor(campaign.status)}>{campaign.status}</span>

// Approval status
<span className={getApprovalStatusColor(campaign.approval_status)}>{campaign.approval_status}</span>
```

## Benefits
✅ Single source of truth for all status colors  
✅ Consistent UI across all features  
✅ Easier to maintain and update colors globally  
✅ Reduced code duplication  
✅ Type-safe status color mappings  
✅ Easy to extend with new status types  

## Implementation Steps
1. ✅ Create `src/shared/utils/statusColors.ts` with all mappings
2. Identify all pages with status color functions
3. Update imports in each file
4. Replace hardcoded functions with utility functions
5. Test across all pages
6. Remove old color mapping functions
7. Clean up unused code
