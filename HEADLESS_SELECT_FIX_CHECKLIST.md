# HeadlessSelect Floating Labels - Complete Fix Checklist

## Executive Summary
- **Total Instances to Fix**: 159 instances of HeadlessSelect without floating labels
- **Affected Files**: 76 files across the entire codebase
- **Estimated Effort**: High-priority fixes should be completed first, then batch the remaining instances

## Phase 1: User-Mentioned Components (11 fixes)

### 1. Creative Templates (2 fixes)
**File**: `/src/features/offers/pages/CreativeTemplateFormPage.tsx`
- [ ] Line 235: Add `label="Channel *"` to HeadlessSelect (remove wrapper label)
- [ ] Line 245: Add `label="Locale"` to HeadlessSelect (remove wrapper label)

### 2. Character Sets (2 fixes)
**File**: `/src/features/offers/pages/CharacterSetFormPage.tsx`
- [ ] Line 148: Add `label="Message Type *"` to HeadlessSelect (remove wrapper label)
- [ ] Line 160: Add `label="Character Set Type *"` to HeadlessSelect (remove wrapper label)

### 3. Languages (2 fixes)
**File**: `/src/features/configurations/components/LanguageModal.tsx`
- [ ] Line 204: Add `label="Country"` to HeadlessSelect (remove wrapper label)
- [ ] Line 239: Add `label="Character Set"` to HeadlessSelect (remove wrapper label)

### 4. Offer Creatives (2 fixes)
**File**: `/src/features/offers/components/OfferCreativeFormModal.tsx`
- [ ] Line 450: Add `label="Offer *"` to HeadlessSelect (remove wrapper label)
- [ ] Line 469: Add `label="Channel"` to HeadlessSelect (remove wrapper label)
- [ ] Line 547: Add `label="Sender ID"` to HeadlessSelect (remove wrapper label)
- [ ] Line 593: Add `label="SMS Route"` to HeadlessSelect (remove wrapper label)

### 5. Offer Tracking Source (3 fixes)
**File**: `/src/features/offers/components/OfferTrackingStep.tsx`
- [ ] Line 451: Add `label="Type"` to HeadlessSelect (remove wrapper label)
- [ ] Line 661: Add `label="Parameter"` to HeadlessSelect (remove wrapper label)
- [ ] Line 681: Add `label="Condition"` to HeadlessSelect (remove wrapper label)

### 6. Resource Types (ComboTypeFormPage.tsx)
**File**: `/src/features/products/pages/ComboTypeFormPage.tsx`
- ✓ Already has proper labels - No fixes needed

---

## Phase 2: High-Priority Files (by frequency)

### ETL Files (25 fixes)
- [ ] `/src/features/etl/components/FetchControlsModal.tsx` - 12 fixes
  - Lines: 347, 383, 399, 414, 429, 453, 476, 491, 506, 527, 542, 557
- [ ] `/src/features/etl/pages/EtlFetchControlsPage.tsx` - 10 fixes
  - Lines: 305, 319, 332, 345, 403, 409, 415, 429, 435, 441
- [ ] `/src/features/etl/pages/EtlFileRegistryPage.tsx` - 3 fixes
  - Lines: 463, 470, 673

### Segment-Related Files (20 fixes)
- [ ] `/src/features/segments/components/SegmentConditionsBuilder.tsx` - 6 fixes
  - Lines: 559, 603, 623, 813, 889, 1138
- [ ] `/src/features/segments/components/CustomerIdentityConditionRow.tsx` - 5 fixes
  - Lines: 138, 229, 267, 318, 506
- [ ] `/src/features/segments/components/MetricsConditionRow.tsx` - 3 fixes
  - Lines: 85, 150, 288
- [ ] `/src/features/segments/components/SegmentListModal.tsx` - 1 fix
  - Line: 335
- [ ] `/src/features/segments/components/SystemEventConditionRow.tsx` - 2 fixes
  - Lines: 79, 209
- [ ] `/src/features/segments/components/UnifiedPickerModal.tsx` - 1 fix
  - Line: 102
- [ ] `/src/features/segments/components/QuickListPickerModal.tsx` - 1 fix
  - Line: 216
- [ ] `/src/features/segments/components/ListConditionRow.tsx` - 1 fix
  - Line: 55

### Campaign Pages (11 fixes)
- [ ] `/src/features/campaigns/pages/DNDBulkManagementPage.tsx` - 2 fixes
  - Lines: 375, 391
- [ ] `/src/features/campaigns/pages/DNDChannelPage.tsx` - 2 fixes
  - Lines: 364, 380
- [ ] `/src/features/campaigns/pages/VIPListManagementPage.tsx` - 3 fixes
  - Lines: 678, 694, 726
- [ ] `/src/features/campaigns/pages/CampaignBroadcastsPage.tsx` - 1 fix
  - Line: 288
- [ ] `/src/features/campaigns/pages/CampaignDetailsPage.tsx` - 1 fix
  - Line: 2669 (plus 2 others with label)
- [ ] `/src/features/campaigns/pages/CampaignFlowDetailsPage.tsx` - 2 fixes
  - Lines: 597, 628

### Shared Components (20 fixes)
- [ ] `/src/shared/components/AssignItemsModal.tsx` - 5 fixes
  - Lines: 935, 956, 980, 998, 1026
- [ ] `/src/shared/pages/AssignItemsPage.tsx` - 5 fixes
  - Lines: 882, 902, 925, 942, 968
- [ ] `/src/shared/components/TypeSelector.tsx` - 2 fixes
  - Lines: 40, 53
- [ ] `/src/shared/components/CreateCommunicationModal.tsx` - 3 fixes
  - Lines: 812, 836, 864
- [ ] `/src/shared/components/AudienceCreator.tsx` - 2 fixes
  - Lines: 422, 460
- [ ] `/src/shared/components/CatalogItemsModal.tsx` - 1 fix
  - Line: 207
- [ ] `/src/shared/components/QuickListForm.tsx` - 1 fix
  - Line: 273
- [ ] `/src/shared/components/SeedListRecipientsModal.tsx` - 1 fix
  - Line: 166
- [ ] `/src/shared/components/ui/Pagination.tsx` - 1 fix
  - Line: 61
- [ ] `/src/shared/pages/DynamicMessageVariablesPage.tsx` - 1 fix
  - Line: 359

### Settings/Configuration Files (29 fixes)
- [ ] `/src/features/settings/pages/SettingsPage.tsx` - 8 fixes
  - Lines: 755, 820, 830, 870, 920, 931, 1008, 1046, 1129, 1143, 1191, 1213, 1335
- [ ] `/src/features/servers/pages/ServersPage.tsx` - 4 fixes
  - Lines: 904, 1061, 1078, 1097, 1114, 1130
- [ ] `/src/features/servers/components/CreateServerModal.tsx` - 1 fix
  - Line: 181
- [ ] `/src/features/connection-profiles/pages/ConnectionProfilesPage.tsx` - 6 fixes
  - Lines: 891, 999, 1019, 1040, 1061, 1096, 1115
- [ ] `/src/features/control-groups/pages/ControlGroupsPage.tsx` - 2 fixes
  - Lines: 259, 270
- [ ] `/src/features/notifications/pages/NotificationSettingsPage.tsx` - 3 fixes
  - Lines: 289, 358, 412
- [ ] `/src/features/configurations/components/GatewayConfigModal.tsx` - 1 fix
  - Line: 156
- [ ] `/src/features/configurations/components/ConfigurationManager/CustomFieldsRenderer.tsx` - 1 fix
  - Line: 96
- [ ] `/src/features/configurations/components/gateway-forms/GenericGatewayForm.tsx` - 1 fix
  - Line: 94
- [ ] `/src/features/docs/pages/EditDocsPage.tsx` - 1 fix
  - Line: 297

---

## Phase 3: Medium-Priority Files (30+ fixes)

### Offer-Related Files (14 fixes)
- [ ] `/src/features/offers/components/OfferCreativeStep.tsx` - 4 fixes
  - Lines: 1326, 1348, 1386, 1441, 1521
- [ ] `/src/features/offers/pages/OfferDetailsPage.tsx` - 1 fix
  - Line: 2707
- [ ] `/src/features/offers/pages/OffersPage.tsx` - 2 fixes
  - Lines: 1328, 1344
- [ ] `/src/features/offers/pages/OfferCategoriesPage.tsx` - 1 fix
  - Line: 1667
- [ ] `/src/features/offers/components/CreateLanguageModal.tsx` - Not analyzed yet
- [ ] `/src/features/offers/components/CreativeTemplateFormModal.tsx` - Not analyzed yet

### Product-Related Files (4 fixes)
- [ ] `/src/features/products/pages/ProductsPage.tsx` - 3 fixes
  - Lines: 712, 734, 756
- [ ] `/src/features/products/pages/ProductCategoriesPage.tsx` - 1 fix
  - Line: 1658

### Customer-Related Files (5 fixes)
- [ ] `/src/features/customers360/pages/CustomerDetailPage.tsx` - 3 fixes
  - Lines: 1229, 1241, 2255
- [ ] `/src/features/customers360/pages/CustomersPage.tsx` - 1 fix
  - Line: 813
- [ ] `/src/features/customerIdentity/pages/CustomerIdentityPage.tsx` - 1 fix
  - Line: 224

### Reward/Broadcast Files (5 fixes)
- [ ] `/src/features/manual-rewards/pages/ManualRewardsPage.tsx` - 2 fixes
  - Lines: 220, 233
- [ ] `/src/features/manual-rewards/components/SelectCustomersStep.tsx` - 1 fix
  - Line: 201
- [ ] `/src/features/manual-broadcast/components/SubscriptionIdSelector.tsx` - 1 fix
  - Line: 65
- [ ] `/src/features/communications/components/RichTextEditor.tsx` - 1 fix
  - Line: 106

### Reports/Analytics Files (5 fixes)
- [ ] `/src/features/reports-analytics/pages/CampaignReportsPage.tsx` - 1 fix
  - Line: 1014
- [ ] `/src/features/reports-analytics/pages/OfferReportsPage.tsx` - 1 fix
  - Line: 1331
- [ ] `/src/features/reports-analytics/pages/SegmentReportsPage.tsx` - 1 fix
  - Line: 1191
- [ ] `/src/features/reports-analytics/pages/DeliveryEmailReportsPage.tsx` - 1 fix
  - Line: 860
- [ ] `/src/features/reports-analytics/pages/DeliverySMSReportsPage.tsx` - 1 fix
  - Line: 879

### Other Files (8 fixes)
- [ ] `/src/features/auth/pages/RequestAccountPage.tsx` - 3 fixes
  - Lines: 546, 586, 679
- [ ] `/src/features/data-connectors/pages/DataConnectors.tsx` - 2 fixes
  - Lines: 427, 454
- [ ] `/src/features/jobs/components/WorkflowModal.tsx` - 1 fix
  - Line: 160
- [ ] `/src/features/jobs/pages/CreateJobWorkflowStepPage.tsx` - 4 fixes
  - Lines: 619, 674, 765, 859
- [ ] `/src/features/jobs/pages/WorkflowsPage.tsx` - 2 fixes
  - Lines: 627, 637
- [ ] `/src/features/kpis/pages/AllKPIsPage.tsx` - 1 fix
  - Line: 376
- [ ] `/src/features/kpis/pages/KPIsPage.tsx` - 1 fix
  - Line: 136
- [ ] `/src/features/kpis/pages/RevenueMetricsPage.tsx` - 1 fix
  - Line: 321
- [ ] `/src/features/kpis/pages/SystemEventsPage.tsx` - 1 fix
  - Line: 262
- [ ] `/src/features/kpis/pages/UsageMetricsPage.tsx` - 1 fix
  - Line: 321
- [ ] `/src/features/monitoring/pages/MonitoringPage.tsx` - 2 fixes
  - Lines: 314, 324
- [ ] `/src/features/routes/pages/RoutesManagementPage.tsx` - 1 fix
  - Line: 426
- [ ] `/src/features/users/pages/UserManagementPage.tsx` - 1 fix
  - Line: 1897
- [ ] `/src/features/administration/pages/AdminHubPage.tsx` - 1 fix
  - Line: 353

---

## MultiCategorySelector Status

⚠️ **Not yet analyzed in this pass**. Should scan for MultiCategorySelector components that may also need floating labels.

---

## Fix Template

### Before:
```jsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Field Label
  </label>
  <HeadlessSelect
    value={value}
    onChange={handleChange}
    options={options}
    placeholder="Select..."
  />
</div>
```

### After:
```jsx
<HeadlessSelect
  label="Field Label"
  value={value}
  onChange={handleChange}
  options={options}
  placeholder="Select..."
/>
```

Or, if grid layout is needed:
```jsx
<div>
  <HeadlessSelect
    label="Field Label"
    value={value}
    onChange={handleChange}
    options={options}
    placeholder="Select..."
  />
</div>
```

---

## Implementation Progress

### Phase 1 (User-Mentioned): [ ] 0/11 Complete
### Phase 2 (High-Priority): [ ] 0/75 Complete
### Phase 3 (Medium-Priority): [ ] 0/73 Complete

**Total Progress**: [ ] 0/159 Complete

---

## Notes

1. Remove wrapper `<label>` elements when adding `label` prop
2. Preserve grid layout divs if used for spacing/layout
3. The HeadlessSelect component automatically handles floating label animation
4. Test after each fix to ensure labels display correctly in both empty and filled states
5. Consider batch editing for files with multiple instances (ETL, segments, shared components)
