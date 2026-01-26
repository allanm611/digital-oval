# Page Refactoring Checklist

## Quick Summary
This document lists all pages that need Suspense refactoring to fix the 5-second routing delay.

**Scope:** 13 main pages + 4 sub-pages = **17 pages total**

---

## Priority 1: Critical (Most used, heavy data loading)

### 1. CreateCampaignPage ⭐
- **Current delay:** 5-6 seconds (multiple API calls)
- **API calls:** getCampaignById, getMappingsByCampaign, getSegmentById (multiple), getOfferById (multiple)
- **Pattern:** Multi-step form with progressive data loading
- **Estimated refactor time:** 1.5-2 hours
- **Status:** NOT STARTED
- **Steps:**
  ```
  1. Extract each useEffect hook into separate async function
  2. Create useSuspenseData wrapper for each
  3. Wrap each section in <Suspense>
  4. Test each step independently
  ```

### 2. CampaignsPage ⭐⭐
- **Current delay:** 3-4 seconds
- **API calls:** getCampaignCategories, getCampaigns, getCampaignStats
- **Pattern:** List page with filters and search
- **Estimated refactor time:** 1.5 hours
- **Status:** NOT STARTED
- **Implementation template:**
  ```tsx
  // Step 1: Create useCampaignsInitialData hook
  export function useCampaignsInitialData() {
    const cacheRef = useRef(null);
    if (!cacheRef.current) {
      throw Promise.all([
        campaignService.getCampaignCategories(),
        campaignService.getCampaigns({ limit: 100 }),
        campaignService.getCampaignStats()
      ]).then(([cats, camps, stats]) => {
        cacheRef.current = { categories: cats, campaigns: camps, stats };
      });
    }
    return cacheRef.current;
  }

  // Step 2: Create data loader component
  function CampaignsDataLoader() {
    const data = useCampaignsInitialData();
    return <CampaignsContent {...data} />;
  }

  // Step 3: Wrap with Suspense
  export default function CampaignsPage() {
    return (
      <SuspenseBoundary type="table">
        <CampaignsDataLoader />
      </SuspenseBoundary>
    );
  }
  ```

### 3. OfferCategoriesPage ⭐⭐
- **Current delay:** 3-4 seconds
- **API calls:** listOffers, getOfferCategories, getOfferTypes
- **Pattern:** Catalog list with categories
- **Estimated refactor time:** 1.5 hours
- **Status:** NOT STARTED

### 4. SegmentCategoriesPage ⭐⭐
- **Current delay:** 3-4 seconds
- **API calls:** listSegments, getSegmentCategories, getSegmentTypes
- **Pattern:** Catalog list with categories
- **Estimated refactor time:** 1.5 hours
- **Status:** NOT STARTED

### 5. ProductCategoriesPage ⭐⭐
- **Current delay:** 3-4 seconds
- **API calls:** listProducts, getProductCategories, getProductTypes
- **Pattern:** Catalog list with categories
- **Estimated refactor time:** 1.5 hours
- **Status:** NOT STARTED

---

## Priority 2: High (Frequently used)

### 6. JobExecutionsPage
- **Current delay:** 2-3 seconds
- **API calls:** listJobExecutions, getJobStats
- **Pattern:** Large dataset list
- **Estimated refactor time:** 1 hour
- **Status:** NOT STARTED

### 7. CampaignDetailsPage
- **Current delay:** 2-3 seconds
- **API calls:** getCampaignById, getStats, getSegments, getOffers
- **Pattern:** Detail page with multiple sections
- **Estimated refactor time:** 1.5 hours
- **Status:** NOT STARTED

### 8. OfferDetailsPage
- **Current delay:** 2-3 seconds
- **API calls:** getOfferById, getStats
- **Pattern:** Detail page
- **Estimated refactor time:** 1 hour
- **Status:** NOT STARTED

### 9. AllJobsPage / JobsPage
- **Current delay:** 2-3 seconds
- **API calls:** listJobs, getJobStats
- **Pattern:** Large dataset list
- **Estimated refactor time:** 1 hour
- **Status:** NOT STARTED

### 10. CustomersPage
- **Current delay:** 2-3 seconds
- **API calls:** listCustomers (large dataset)
- **Pattern:** Large dataset list with pagination
- **Estimated refactor time:** 1 hour
- **Status:** NOT STARTED

---

## Priority 3: Medium (Used occasionally)

### 11. ProgramsPage
- **Estimated refactor time:** 45 minutes
- **Status:** NOT STARTED

### 12. UserManagementPage
- **Estimated refactor time:** 45 minutes
- **Status:** NOT STARTED

### 13. CommunicationAnalyticsPage
- **Estimated refactor time:** 1 hour
- **Status:** NOT STARTED

### 14. SettingsPage
- **Estimated refactor time:** 45 minutes
- **Status:** NOT STARTED

### 15. ReportsPages (Multiple)
- **Count:** 4+ pages
- **Estimated refactor time:** 2-3 hours total
- **Status:** NOT STARTED

---

## Total Effort Summary

| Priority | Count | Total Hours | Status |
|----------|-------|------------|--------|
| **Critical** | 5 | 8-9h | ⏳ TODO |
| **High** | 5 | 6-7h | ⏳ TODO |
| **Medium** | 4+ | 5-6h | ⏳ TODO |
| **Total** | **14+** | **19-22h** | ⏳ TODO |

---

## Implementation Strategy

### Phase 1: Setup (Already done ✅)
- ✅ Create useSuspenseData hook
- ✅ Create SuspenseBoundary component
- ✅ Create skeleton components
- ✅ Create documentation

### Phase 2: Template Pages (1-2 days)
- Start with **CampaignsPage** (simplest list page)
- Then **OfferCategoriesPage** (similar pattern)
- Then **CreateCampaignPage** (most complex, but template for multi-step forms)

### Phase 3: Apply to All Pages (2-3 days)
- Use templates from Phase 2
- Follow same pattern for each page
- Test progressively

---

## Testing Checklist (For Each Page)

- [ ] Page skeleton shows immediately on navigation
- [ ] URL updates before page renders
- [ ] Page layout visible with skeleton
- [ ] Data loads in background
- [ ] Skeleton disappears when data arrives
- [ ] All data displays correctly
- [ ] Filters/search still work
- [ ] Error handling works
- [ ] Form state persists
- [ ] No console errors
- [ ] No breaking changes

---

## Next Steps

1. Pick **CampaignsPage** to refactor first
2. Follow the template in REFACTORING_EXAMPLE.md
3. Test thoroughly with slow network (DevTools)
4. Document any issues
5. Move to next page using same pattern
6. Track progress in this file

---

## Files Created (Available Now)

✅ `/shared/hooks/useSuspenseData.ts` - Core hook
✅ `/shared/hooks/usePageLoader.ts` - Helper hooks
✅ `/shared/components/SuspenseBoundaryWrapper.tsx` - Wrapper component
✅ `/shared/components/skeletons/PageSkeleton.tsx` - Skeleton components
✅ `ROUTING_PERFORMANCE_GUIDE.md` - Complete guide
✅ `REFACTORING_EXAMPLE.md` - CampaignsPage template
✅ `REFACTORING_CHECKLIST.md` - This file

---

## Notes

- Each page follows the same pattern → Faster implementation
- Estimated total time: 3-4 days for complete refactoring
- Can be done incrementally (1-2 pages per day)
- No breaking changes to existing functionality
- Significantly improves user experience
