# Delete Pattern Refactoring - Transformation Guide

## Quick Reference: State Consolidation Patterns

### Pattern Removal Checklist
For each file, remove these state declarations:

```typescript
// REMOVE THESE:
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [itemToDelete, setItemToDelete] = useState<Item | null>(null);  
const [isDeleting, setIsDeleting] = useState(false);

// REMOVE THESE HANDLERS:
const handleDeleteItem = (item: Item) => { ... };
const handleConfirmDelete = async () => { ... };
const handleCancelDelete = () => { ... };

// REMOVE FROM JSX:
<DeleteConfirmModal
  isOpen={showDeleteModal}
  onClose={handleCancelDelete}
  onConfirm={handleConfirmDelete}
  ...
/>
```

## File-by-File Transformation Map

### 1. CampaignsPage.tsx
**Location**: `src/features/campaigns/pages/CampaignsPage.tsx`
**Delete State Variables** (lines ~85-90):
```typescript
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [campaignToDelete, setCampaignToDelete] = useState<{id: number; name: string} | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
```

**Delete Handlers** (~search for):
- handleDeleteCampaign(campaign)
- handleConfirmDelete()
- handleCancelDelete()

**Service Method**: `campaignService.deleteCampaign(id)`
**Modal Usage** (search for `DeleteConfirmModal` component)

---

### 2. CampaignDetailsPage.tsx
**Location**: `src/features/campaigns/pages/CampaignDetailsPage.tsx`
**SPECIAL**: Has TWO delete contexts:
1. Campaign delete (line 110)
2. Flow delete (line 130)

**State to Remove**:
```typescript
const [showDeleteModal, setShowDeleteModal] = useState(false);  // Campaign delete
const [showFlowDeleteModal, setShowFlowDeleteModal] = useState(false);  // Flow delete
```

Handle separately or use two `itemActionHandler` instances.

---

### 3. DND Channel/Bulk Pages
- DNDChannelPage.tsx
- DNDBulkManagementPage.tsx

**Pattern**: Typically simpler - single delete modal for DND list items
**Service**: Check `dndService` or `campaignService` methods

---

### 4. Communication Policy Pages
- CommunicationPolicyPage.tsx
- CommunicationPolicyDetailPage.tsx

**Pattern**: Policy-specific delete handlers
**Service**: `communicationPolicyService.deletePolicy(id)`

---

### 5. Seed List & VIP List Pages
- SeedListManagementPage.tsx
- VIPListManagementPage.tsx

**Pattern**: List management with delete modal
**Service Methods**:
- `seedListService.deleteSeedList(id)`
- `vipListService.deleteVipList(id)`

---

### 6. Program Pages
- ProgramsPage.tsx
- ProgramDetailsPage.tsx

**Pattern**: Program-specific CRUD
**Service**: `programService.deleteProgram(id)`

---

## Refactoring Checklist

For each file:

- [ ] 1. Identify and document delete state variables
- [ ] 2. Identify delete handler functions
- [ ] 3. Identify service method name for deletion
- [ ] 4. Locate DeleteConfirmModal component usage
- [ ] 5. Backup original file (git)
- [ ] 6. Remove state declarations
- [ ] 7. Replace handlers with itemActionHandler calls
- [ ] 8. Update modal props
- [ ] 9. Verify no broken references
- [ ] 10. Test deletion functionality

## Post-Refactoring Verification

After refactoring each file:

1. **Import checks**: Remove unused `useState` import if applicable
2. **Reference checks**: Grep for old variable names
3. **Handler checks**: Verify no orphaned handler calls
4. **Modal checks**: Verify DeleteConfirmModal still receives all props
5. **Service checks**: Verify service methods are called correctly
6. **Type checks**: Run `tsc --noEmit` to catch TypeScript errors

## Common Issues & Fixes

### Issue 1: Modal doesn't close after delete
**Cause**: Handler not calling modal close
**Fix**: Ensure `itemActionHandler` closes modal in success callback

### Issue 2: Optimistic update breaks
**Cause**: State manipulation removed
**Fix**: Use itemActionHandler's built-in optimistic update feature

### Issue 3: Multiple delete contexts
**Cause**: Same component has >1 delete modal
**Fix**: Create separate `itemActionHandler` for each context

### Issue 4: Service method signature mismatch
**Cause**: Service method has different name/params
**Fix**: Update handler to match actual service signature

## Batch Execution Priority

### Tier 1 (Simplest - List pages with standard delete)
1. ProductsPage.tsx
2. OffersPage.tsx (if exists)
3. SegmentsPage.tsx (if exists)
4. CampaignsPage.tsx
5. CustomersPage.tsx

### Tier 2 (Moderate - Detail pages)
1. ProductDetailsPage.tsx
2. OfferDetailsPage.tsx
3. SegmentDetailsPage.tsx
4. CampaignDetailsPage.tsx (⚠️ has 2 delete contexts)

### Tier 3 (Complex - Nested/special delete)
1. ControlGroupsPage.tsx
2. ConfigurationManager.tsx
3. DataConnectors.tsx

## Reference Implementations

### Already Completed
1. ✅ CampaignCategoriesPage.tsx
2. ✅ CampaignFlowDetailsPage.tsx

Review these to see:
- How state was consolidated
- How handlers were refactored
- How modal props were updated
- How service integration works

## Execution Timeline

- **Batch 1**: Campaigns (4-6 files) - 2-3 hours
- **Batch 2**: Offers/Products/Segments (6-8 files) - 2-3 hours  
- **Batch 3**: Remaining (20+ files) - 4-6 hours
- **Testing & Verification**: 1-2 hours

**Total Estimated**: 10-15 hours

## Notes

- All 58 files follow variations of the same pattern
- Service method names vary by feature (campaignService, offerService, etc.)
- Some files have multiple delete contexts (handle separately)
- Modal props are standardized across components
- Post-refactoring testing is critical for correctness
