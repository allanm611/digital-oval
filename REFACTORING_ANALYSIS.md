# Delete Pattern Refactoring - Analysis Report

## Status
**2 files completed**, **58 files remaining**

## Task Overview
Systematically refactor delete-related UI patterns across 58 TSX files to use consistent patterns and the `itemActionHandler` factory function.

## Common Patterns Identified

### Pattern 1: Delete Modal State Management
**Current Pattern:**
```typescript
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
const [isDeleting, setIsDeleting] = useState(false);

const handleDelete = (item: Item) => {
  setItemToDelete(item);
  setShowDeleteModal(true);
};

const handleConfirmDelete = async () => {
  try {
    setIsDeleting(true);
    // Delete logic
  } finally {
    setIsDeleting(false);
    setShowDeleteModal(false);
  }
};

// In JSX:
<DeleteConfirmModal
  isOpen={showDeleteModal}
  onClose={() => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  }}
  onConfirm={handleConfirmDelete}
  isLoading={isDeleting}
/>
```

**Transformation Steps:**
1. Identify the delete state variables (showDeleteModal, itemToDelete, isDeleting)
2. Extract the entity type and property names being deleted
3. Replace with `itemActionHandler` factory calls
4. Clean up unused state
5. Verify DeleteConfirmModal still receives correct props

### Pattern 2: Delete Handler Functions
Most files follow this pattern:
- `handleDeleteX()` - Opens modal with selected item
- `handleConfirmDelete()` - Executes delete action
- `handleCancelDelete()` - Closes modal

These should be consolidated using `itemActionHandler` which handles:
- UI state (loading, open/close)
- Optimistic updates
- Error handling
- Toast notifications

## Files with Delete Patterns

### Category: Campaigns (10 files)
- [x] CampaignCategoriesPage.tsx (DONE - reference implementation)
- [x] CampaignFlowDetailsPage.tsx (DONE)
- [ ] CampaignDetailsPage.tsx
- [ ] CampaignsPage.tsx
- [ ] CommunicationPolicyDetailPage.tsx
- [ ] CommunicationPolicyPage.tsx
- [ ] DNDBulkManagementPage.tsx
- [ ] DNDChannelPage.tsx
- [ ] ProgramDetailsPage.tsx
- [ ] ProgramsPage.tsx

### Category: Communications (1 file)
- [ ] TemplateSelector.tsx

### Category: Configurations (5 files)
- [ ] ConfigurationManagerAPI.tsx
- [ ] ConfigurationManager.tsx
- [ ] CommunicationChannelDetailsPage.tsx
- [ ] GatewayConfigurationsPage.tsx
- [ ] NotificationTypesPage.tsx

### Category: Connection Profiles (1 file)
- [ ] ConnectionProfilesPage.tsx

### Category: Control Groups (2 files)
- [ ] ControlGroupDetailPage.tsx
- [ ] ControlGroupsPage.tsx

### Category: Customers360 (2 files)
- [ ] CustomerDetailPage.tsx
- [ ] CustomersPage.tsx

### Category: Data Connectors (2 files)
- [ ] DataConnectorDetailsPage.tsx
- [ ] DataConnectors.tsx

### Category: Docs (2 files)
- [ ] EditDocsPage.tsx
- [ ] ManageSidebarPage.tsx

### Category: Jobs (7 files)
- [ ] JobDependenciesPage.tsx
- [ ] JobWorkflowStepDetailsPage.tsx
- [ ] JobWorkflowStepsPage.tsx
- [ ] ScheduledJobDetailsPage.tsx
- [ ] ScheduledJobsPage.tsx
- [ ] WorkflowDetailsPage.tsx
- [ ] WorkflowsPage.tsx

### Category: KPIs (3 files)
- [ ] KpiCategoriesListPage.tsx
- [ ] AllKPIsPage.tsx
- [ ] SubscriberProfileListPage.tsx

### Category: Manual Broadcast (1 file)
- [ ] ManualBroadcastListsPage.tsx

### Category: Manual Rewards (1 file)
- [ ] ManualRewardsPage.tsx

### Category: Notifications (1 file)
- [ ] NotificationsPage.tsx

### Category: Offers (9 files)
- [ ] CategoryDetailsPage.tsx
- [ ] CharacterSetDetailsPage.tsx
- [ ] CreativeTemplateDetailsPage.tsx
- [ ] CreativeTemplatesPage.tsx
- [ ] EmailRoutesPage.tsx
- [ ] LanguagesPage.tsx
- [ ] OfferCategoriesPage.tsx
- [ ] OfferCreativesPage.tsx
- [ ] OfferDetailsPage.tsx

### Category: Products (5 files)
- [ ] ComboTypeDetailsPage.tsx
- [ ] ComboTypesPage.tsx
- [ ] ProductCategoriesPage.tsx
- [ ] ProductDetailsPage.tsx
- [ ] ProductsPage.tsx

### Category: Quicklists (2 files)
- [ ] QuickListDetailsPage.tsx
- [ ] QuickListsPage.tsx

### Category: Routes (3 files)
- [ ] PushNotificationRouteDetailsPage.tsx
- [ ] RouteDetailsPage.tsx
- [ ] WhatsAppRouteDetailsPage.tsx

### Category: Segments (3 files)
- [ ] SegmentCategoriesPage.tsx
- [ ] SegmentDetailsPage.tsx
- [ ] SegmentManagementPage.tsx

### Category: Servers (2 files)
- [ ] ServerDetailsPage.tsx
- [ ] ServersPage.tsx

### Category: Team Roles (1 file)
- [ ] TeamRolesPage.tsx

### Category: Users (1 file)
- [ ] UserManagementPage.tsx

## Transformation Rules

### Rule 1: State Variable Consolidation
Replace these 3-4 state variables:
```typescript
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [itemToDelete, setItemToDelete] = useState<T | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
```

With action handler pattern:
```typescript
const { handleDelete, deletingId, showDeleteModal, itemToDelete, ... } = 
  useItemActionHandler(serviceFunction);
```

### Rule 2: Handler Consolidation
Consolidate these handlers:
- `handleDeleteX()` → Delete trigger point
- `handleConfirmDelete()` → Single confirmation handler
- `handleCancelDelete()` → Modal close handler

### Rule 3: Modal Integration
Update DeleteConfirmModal props:
```typescript
<DeleteConfirmModal
  isOpen={showDeleteModal}
  onClose={handleCancelDelete}
  onConfirm={handleConfirmDelete}
  isLoading={isDeleting}
  itemName={itemToDelete?.name || ""}
/>
```

## Implementation Strategy

### Phase 1: High-Impact Files (Quick Wins)
Files with simple, standard delete patterns:
1. ProductsPage.tsx
2. SegmentsPage.tsx
3. OffersPage.tsx
4. CampaignsPage.tsx

### Phase 2: List Pages
Pages with tables and bulk operations:
1. AllKPIsPage.tsx
2. AllJobsPage.tsx
3. CustomersPage.tsx

### Phase 3: Detail Pages
Detail/edit pages with single item deletion:
1. ProductDetailsPage.tsx
2. OfferDetailsPage.tsx
3. CampaignDetailsPage.tsx

### Phase 4: Complex Pages
Pages with nested deletion or multiple delete contexts:
1. CampaignDetailsPage.tsx (has flow delete + campaign delete)
2. ControlGroupsPage.tsx (nested deletions)

## Notes & Caveats

1. **Flow Deletion in CampaignDetailsPage**: Has both campaign delete AND flow delete patterns - requires careful handling
2. **Nested Modals**: Some files have primary + secondary delete modals
3. **Bulk Operations**: Some list pages may have bulk delete patterns
4. **Service Dependencies**: Each file has different service layer naming conventions

## Success Criteria

- [x] 2/60 files completed (CampaignCategoriesPage, CampaignFlowDetailsPage)
- [ ] All delete state variables consolidated
- [ ] All handlers refactored to consistent pattern
- [ ] All DeleteConfirmModal integrations verified
- [ ] No broken references to deleted state variables
- [ ] TypeScript compilation passes
- [ ] All tests pass (if applicable)

## Files Status Tracking

```
Status  | Count | Files
--------|-------|--------
DONE    |   2   | CampaignCategoriesPage, CampaignFlowDetailsPage
TODO    |  58   | (see list above)
```

## References

- **Reference Implementation**: `src/features/campaigns/pages/CampaignCategoriesPage.tsx`
- **Service Pattern**: Check specific feature service (campaignService, offerService, etc.)
- **Component**: `src/shared/components/ui/DeleteConfirmModal`
