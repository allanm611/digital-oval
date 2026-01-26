# Routing Performance Optimization Guide

## Problem
When navigating between pages, URL updates immediately but the old page stays visible for 5+ seconds while new page loads data. This is because data fetching happens in `useEffect` AFTER the page mounts.

## Solution: Suspense-based Progressive Data Loading
Show page skeleton immediately, load data in background with Suspense boundaries.

---

## Implementation Pattern

### Before (Current - Slow):
```tsx
export default function CreateCampaignPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // This delays rendering - URL changes but page waits 5+ seconds
    loadCampaignData(); // Takes 5 seconds
    loadSegments();     // Takes 2 seconds
    loadOffers();       // Takes 1 second
  }, []);

  return <Form data={data} />; // Only renders after all data loads
}
```

**Problem:** Everything happens sequentially in useEffect, blocking render.

---

### After (Optimized - Fast):
```tsx
export default function CreateCampaignPage() {
  return (
    <SuspenseBoundary type="stepper">
      <Form /> {/* Renders immediately with skeleton */}
      <CampaignDataLoader /> {/* Data loads in background */}
    </SuspenseBoundary>
  );
}

// Separate component that throws promise to Suspense
function CampaignDataLoader() {
  const campaignId = useParams().id;

  // This throws a promise which Suspense catches
  // While promise is pending, skeleton shows
  // When resolved, component renders with data
  const campaign = useSuspenseData(() =>
    campaignService.getCampaignById(campaignId)
  );

  return <CampaignForm data={campaign} />;
}
```

**Result:**
- Page renders instantly (skeleton shows)
- URL updates immediately
- Data loads in background
- No 5-second delay

---

## Step-by-Step Refactoring

### 1. Extract Data Fetching Functions
Move all API calls into separate functions that can be called by Suspense components.

```tsx
// BEFORE: In useEffect
useEffect(() => {
  const loadData = async () => {
    const campaign = await campaignService.getCampaignById(id);
    const segments = await segmentService.listSegments();
    setData({ campaign, segments });
  };
  loadData();
}, []);

// AFTER: Standalone function
async function fetchCampaignData(id: string) {
  const campaign = await campaignService.getCampaignById(id);
  const segments = await segmentService.listSegments();
  return { campaign, segments };
}
```

### 2. Wrap in Suspense Boundary
```tsx
<SuspenseBoundary type="stepper">
  <DataLoader campaignId={id} />
</SuspenseBoundary>

function DataLoader({ campaignId }: { campaignId: string }) {
  const data = useSuspenseData(() => fetchCampaignData(campaignId));
  return <Form data={data} />;
}
```

### 3. Multiple Independent Suspense Boundaries
For complex pages, use multiple Suspense boundaries for progressive loading:

```tsx
<div>
  <SuspenseBoundary type="form">
    <HeaderSection /> {/* Loads independently */}
  </SuspenseBoundary>

  <SuspenseBoundary type="grid">
    <DataSection /> {/* Loads independently */}
  </SuspenseBoundary>
</div>
```

---

## Common Patterns

### Pattern 1: Single Data Load
```tsx
function PageContent() {
  const data = useSuspenseData(() => fetchData());
  return <Content data={data} />;
}

export default function Page() {
  return (
    <SuspenseBoundary type="form">
      <PageContent />
    </SuspenseBoundary>
  );
}
```

### Pattern 2: Parallel Data Loads
```tsx
function PageContent() {
  const [campaigns, segments] = useSuspenseData(
    () => Promise.all([
      campaignService.list(),
      segmentService.list()
    ])
  );
  return <Content campaigns={campaigns} segments={segments} />;
}
```

### Pattern 3: Multi-Step Forms (Like CreateCampaignPage)
```tsx
// Load only what's needed for first step
function StepOneLoader() {
  const objectives = useSuspenseData(() => fetchObjectives());
  return <StepOne objectives={objectives} />;
}

// Other steps load on demand when step changes
export default function MultiStepForm() {
  const [step, setStep] = useState(1);

  return (
    <div>
      <SuspenseBoundary type="form">
        {step === 1 && <StepOneLoader />}
        {step === 2 && <StepTwoLoader />}
        {step === 3 && <StepThreeLoader />}
      </SuspenseBoundary>
    </div>
  );
}
```

---

## Pages to Refactor (Priority Order)

### Critical (Most used, heavy data loading):
1. **CreateCampaignPage** - 5-6 API calls
2. **CampaignsPage** - Large list, sorting, filtering
3. **OfferCategoriesPage** - List with complex filtering
4. **SegmentCategoriesPage** - List with complex filtering
5. **ProductCategoriesPage** - List with complex filtering

### High Priority (Used frequently):
6. **JobExecutionsPage** - Large dataset
7. **CampaignDetailsPage** - Multiple data loads
8. **OfferDetailsPage** - Multiple data loads
9. **AllJobsPage** - Large dataset
10. **CustomersPage** - Large dataset

### Medium Priority (Used occasionally):
11. **SettingsPage** - Config loads
12. **CommunicationAnalyticsPage** - Analytics data
13. **ReportsPages** - Report data loading

---

## Testing Checklist

After refactoring each page:
- [ ] Page skeleton shows immediately on navigation
- [ ] URL updates instantly
- [ ] Data loads without blocking
- [ ] Skeleton disappears when data arrives
- [ ] Error handling works if API fails
- [ ] Form state persists correctly
- [ ] No console errors

---

## Tools Available

### Hooks:
- `useSuspenseData<T>()` - Throw promise for Suspense
- `createResource<T>()` - Pre-create data resource
- `useResource<T>()` - Read resource data

### Components:
- `<SuspenseBoundary type="form" />` - Wraps Suspense with skeleton
- `<SuspenseList_ />` - Multiple independent boundaries

### Skeletons:
- `<FormSkeleton />` - Form-like layout
- `<TableSkeleton />` - Table layout
- `<CardGridSkeleton />` - Grid layout
- `<StepperSkeleton />` - Multi-step form
- `<DetailPageSkeleton />` - Detail page layout
- etc.

---

## Performance Gains

**Before:**
- Navigate → URL changes (instant) → Wait 5+ seconds → Page renders

**After:**
- Navigate → URL changes (instant) → Skeleton renders (instant) → Data loads in background → Page updates

**User Impact:**
✅ Perceived performance: 5x faster
✅ Feels responsive and professional
✅ No "stuck on old page" feeling
✅ Better for slow network connections
