# CampaignsPage Refactoring Example

## Current Flow (5+ second delay)

```
1. User clicks "Campaigns" link
2. URL updates immediately ✓
3. Old page still visible
4. useEffect in CampaignsPage runs:
   - await getCampaignCategories() - 1s
   - await getCampaigns() - 2s
   - await getCampaignStats() - 2s
5. setIsLoading(false)
6. Page re-renders with data
7. User finally sees Campaigns page (5+ seconds after click)
```

**Result:** 5+ second freeze showing old page

---

## Optimized Flow (Instant)

```
1. User clicks "Campaigns" link
2. URL updates immediately ✓
3. Page skeleton renders immediately ✓
4. Data loads in background:
   - getCampaignCategories() - 1s
   - getCampaigns() - 2s
   - getCampaignStats() - 2s
5. Each section updates as data arrives
6. User sees full page with data (appears after 2-5s)
```

**Result:** Page visible immediately, feels responsive

---

## Implementation Steps

### Step 1: Extract Data Fetching Functions

Create a new file: `src/features/campaigns/hooks/useCampaignsData.ts`

```tsx
import { useEffect, useState } from "react";
import { campaignService } from "../services/campaignService";

/**
 * Suspense-compatible hook for loading campaigns data
 */
export function useCampaignsData() {
  const cacheRef = useRef<{
    campaigns: any[];
    categories: any[];
    stats: any;
  } | null>(null);

  // Throw promise to Suspense while loading
  if (!cacheRef.current) {
    throw Promise.all([
      campaignService.getCampaignCategories(),
      campaignService.getCampaigns({ limit: 100, offset: 0 }),
      campaignService.getCampaignStats(true),
    ]).then(([categories, campaigns, stats]) => {
      cacheRef.current = { categories, campaigns, stats };
    });
  }

  return cacheRef.current;
}
```

### Step 2: Create Data Loader Component

```tsx
// Inside CampaignsPage or separate file

function CampaignsDataLoader() {
  // This throws promise to Suspense boundary
  // Suspense shows skeleton while loading
  const { campaigns, categories, stats } = useCampaignsData();

  // Once resolved, render content
  return (
    <CampaignsContent
      campaigns={campaigns}
      categories={categories}
      stats={stats}
    />
  );
}
```

### Step 3: Wrap with Suspense

```tsx
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";

export default function CampaignsPage() {
  return (
    <SuspenseBoundary type="table">
      <CampaignsDataLoader /> {/* Data loads here */}
    </SuspenseBoundary>
  );
}
```

---

## Result

✅ Page renders immediately with skeleton
✅ URL updates instantly
✅ Data loads in background
✅ No 5-second freeze
✅ Professional UX

---

## Minimal Changes Approach (If major refactor too risky)

If you want to keep CampaignsPage mostly unchanged:

```tsx
// Wrap the whole component
export default function CampaignsPageWrapper() {
  return (
    <SuspenseBoundary type="table">
      <CampaignsPage />
    </SuspenseBoundary>
  );
}

// Original CampaignsPage stays almost same, just move data loading
// to happen in a separate component that's wrapped in Suspense
```

---

## Which Approach?

- **Full refactor** (Recommended): Cleaner code, better performance, easier to maintain
- **Wrapper approach**: Faster to implement, less risk of breaking things

**Recommendation:** Full refactor because you'll do this for 10+ pages anyway.

---

## Rollout Plan

1. ✅ Setup infrastructure (done - in ROUTING_PERFORMANCE_GUIDE.md)
2. Start with **CampaignsPage** (template for others)
3. Then refactor in order:
   - CreateCampaignPage
   - OfferCategoriesPage
   - SegmentCategoriesPage
   - ProductCategoriesPage
   - JobExecutionsPage
   - CampaignDetailsPage
   - etc.

Each page should follow the same pattern → Easier for team to understand → Faster implementation.
