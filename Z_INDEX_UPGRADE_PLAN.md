# Z-Index Upgrade Planning Document

## Overview

This document outlines the strategy for standardizing and managing z-index values across the application to eliminate arbitrary high values (like 9999999) and create a maintainable, predictable layering system.

---

## Phase 1: Discovery & Audit

### 1.1 Search Strategy

- [ ] Search for all `z-index` occurrences (CSS, inline styles)
- [ ] Search for all `zIndex` occurrences (React style objects)
- [ ] Search for all `z-[` occurrences (Tailwind arbitrary values)
- [ ] Search for all `zIndex:` occurrences (JavaScript objects)
- [ ] Check CSS files for z-index declarations
- [ ] Check component libraries (HeadlessUI, etc.) for default z-index values

### 1.2 Data Collection Template

For each z-index found, document:

- **File path**:
- **Line number**:
- **Value**:
- **Component/Element**:
- **Context** (dropdown, modal, notification, etc.):
- **Current behavior**:
- **Potential conflicts**:

### 1.3 Categorization

Group findings by:

- [ ] **Dropdowns/Selects** (HeadlessSelect, custom dropdowns)
- [ ] **Modals/Dialogs** (all modal components)
- [ ] **Notifications/Toasts** (toast system, notification dropdown)
- [ ] **Search bars** (global search, autocomplete)
- [ ] **Tooltips/Popovers** (hover tooltips, context menus)
- [ ] **Overlays/Backdrops** (modal backgrounds, dimmers)
- [ ] **Sticky/Fixed elements** (headers, sidebars, navigation)
- [ ] **Other** (document what they are)

### 1.4 Analysis Questions

- [ ] What is the highest z-index value currently used?
- [ ] What is the lowest z-index value currently used?
- [ ] Are there any obvious conflicts or stacking issues?
- [ ] Which components are most problematic?
- [ ] Are there any patterns in current usage?
- [ ] Which areas of the app have the most z-index usage?

---

## Phase 2: Layer System Design

### 2.1 Proposed Z-Index Scale

Decide on scale increments (recommend 1000s for flexibility):

```
Base Layer:        0-99       (default content, normal flow)
Sticky Elements:   100-199    (sticky headers, nav bars)
Fixed Elements:   200-299    (fixed sidebars, fixed headers)
Dropdowns:         1000-1999  (selects, dropdowns, menus, HeadlessSelect)
Overlays:          2000-2999  (backdrops, dimmers, modal backgrounds)
Modals:            3000-3999  (dialogs, modals, popups)
Popovers:          4000-4999  (tooltips, context menus, dropdowns inside modals)
Notifications:     5000-5999  (toasts, alerts, notification dropdowns)
Maximum:           9999       (emergency override, rarely used - only for critical cases)
```

**Rationale based on audit:**

- Current highest reasonable value is z-[100] for sticky header
- Most modals use z-[9999], so 3000-3999 gives room for growth
- Dropdowns need to be above content but below modals
- 1000s increments provide flexibility for sub-layers if needed
- Job pages using 999999/1000000 will be reduced to Modals layer (3000)

### 2.2 Component Mapping

Map each component type to a layer:

**Base & Layout (0-299)**

- [x] **Sticky headers** → Sticky layer (100) - Currently using z-[100] ✓
- [ ] **Fixed sidebars** → Fixed layer (200)
- [ ] **Normal content** → Base layer (0)

**Dropdowns (1000-1999)**

- [ ] **HeadlessSelect dropdowns** → Dropdowns layer (1000) - Currently 99999, needs reduction
- [ ] **Global search dropdown** → Dropdowns layer (1000)
- [ ] **NotificationDropdown** → Keep at 50 or move to Dropdowns (1000)? Currently z-50
- [ ] **Connection profile dropdown** → Dropdowns layer (1000) - Currently z-[100000] ⚠️

**Overlays (2000-2999)**

- [ ] **Modal backdrops** → Overlays layer (2000)
- [ ] **Sidebar mobile overlay** → Overlays layer (2000) - Currently 99999 ⚠️

**Modals (3000-3999)**

- [ ] **Standard modals** → Modals layer (3000) - Currently z-[9999], standardize to 3000
- [ ] **Modal dialogs** → Modals layer (3000)
- [ ] **CreateOfferModalWrapper** → Modals layer (3000) - Currently z-[9999]
- [ ] **UserModal** → Modals layer (3000) - Currently z-[9999]
- [ ] **TemplateSelector modal** → Modals layer (3000) - Currently z-[10000]
- [ ] **SegmentListModal** → Modals layer (3000) - Currently z-[10000]

**Popovers (4000-4999)**

- [ ] **Tooltips** → Popovers layer (4000)
- [ ] **Dropdowns inside modals** → Popovers layer (4000) - Currently z-[10000] in CommunicationPolicyModal
- [ ] **Context menus** → Popovers layer (4000)

**Notifications (5000-5999)**

- [ ] **Toast notifications** → Notifications layer (5000)
- [ ] **Notification dropdown** → Notifications layer (5000) - Consider moving from 50

**Critical/Job Pages (Special Handling)**

- [ ] **JobWorkflowStepsPage overlays** → Modals layer (3000) - Currently 999999, 1000000 ⚠️
- [ ] **ScheduledJobsPage overlays** → Modals layer (3000) - Currently 999999, 1000000 ⚠️
- [ ] **JobDependenciesPage overlays** → Modals layer (3000) - Currently 99999, 999999, 1000000 ⚠️

### 2.3 Edge Cases & Exceptions

**Special Cases Identified:**

- [ ] **Nested modals** - If modals can open other modals, may need sub-layer (e.g., 3000, 3100)
- [ ] **Dropdowns inside modals** - Need to be above modal content but below other modals → Use Popovers (4000)
- [ ] **Job workflow pages** - These have complex overlay systems, need careful migration
- [ ] **HeadlessUI defaults** - Need to check if HeadlessUI has its own z-index system that needs overriding
- [ ] **NotificationDropdown** - Currently z-50, decide if it should stay low or move to Notifications (5000)

**Future Considerations:**

- [ ] Plan for components that might need sub-layers within each category
- [ ] Consider if we need intermediate values (e.g., 1050 for special dropdowns)
- [ ] Document when it's acceptable to use Maximum (9999) layer

---

## Phase 3: Implementation Planning

### 3.1 Token System Design

**Structure to add to tokens.ts:**

```typescript
export const zIndex = {
  base: 0,
  sticky: 100,
  fixed: 200,
  dropdown: 1000,
  overlay: 2000,
  modal: 3000,
  popover: 4000,
  notification: 5000,
  max: 9999,
};
```

**Tasks:**

- [ ] Add `zIndex` object to `tokens.ts` with all layer values
- [ ] Export `zIndex` through `utils.ts` as a constant
- [ ] Consider adding Tailwind utility classes (optional, for className usage)
- [ ] Document each layer's purpose in code comments
- [ ] Test that imports work: `import { zIndex } from './shared/utils/utils'`

### 3.2 Migration Strategy

**Option A: Big Bang Approach**

- Update everything at once
- Pros: Consistent, done quickly
- Cons: High risk, harder to test

**Option B: Incremental Approach** (Recommended) ✅

**Step-by-step:**

1. Add z-index tokens to tokens.ts (no breaking changes)
2. Start with one component type (e.g., HeadlessSelect)
3. Update all instances of that component
4. Test thoroughly in isolation
5. Move to next component type
6. Repeat until complete

**Pros:** Lower risk, easier to test, can rollback individual changes
**Cons:** Takes longer, need to track progress

**Recommended order:**

1. HeadlessSelect (affects many dropdowns)
2. Modals (high visibility, many instances)
3. Job pages (critical issues)
4. Everything else

**Option C: Feature-by-Feature**

- Update one feature area at a time
- Test that feature completely
- Move to next feature
- Pros: Isolated testing, lower risk
- Cons: Takes longest

### 3.3 Priority Order

Decide order of implementation:

1. [ ] **First Priority (Critical)**:

   - Job pages (999999, 1000000) → Reduce to 3000
   - Sidebar mobile overlay (99999) → Reduce to 2000
   - Connection profile dropdown (100000) → Reduce to 1000
   - HeadlessSelect default (99999) → Change default to 1000

2. [ ] **Second Priority (High)**:

   - Standardize all modals to 3000 (currently mix of 9999 and 10000)
   - Dropdowns inside modals → Move to 4000
   - Modal backdrops → Move to 2000

3. [ ] **Third Priority (Medium)**:

   - NotificationDropdown (decide on 50 vs 5000)
   - Global search dropdown
   - Tooltips and popovers

4. [ ] **Fourth Priority (Low)**:
   - Edge cases and exceptions
   - Future-proofing for new components

### 3.4 Testing Strategy

**Test Scenarios:**

- [ ] **Dropdowns**: Open multiple dropdowns, verify correct stacking
- [ ] **Modals**: Open modal, verify it's above everything
- [ ] **Modals with dropdowns**: Open modal, then dropdown inside modal
- [ ] **Nested modals**: Open modal, then another modal from first modal
- [ ] **Notifications**: Show notification while modal is open
- [ ] **Job pages**: Test all overlay scenarios in job workflow pages
- [ ] **Mobile**: Test sidebar overlay, mobile modals
- [ ] **Search**: Test global search dropdown with other elements

**Testing Checklist:**

- [ ] Visual inspection - everything stacks correctly
- [ ] No elements appearing behind others incorrectly
- [ ] Dropdowns appear above content but below modals
- [ ] Modals appear above everything except notifications
- [ ] Notifications always visible
- [ ] Mobile sidebar works correctly
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Different screen sizes (mobile, tablet, desktop)
- [ ] No console errors related to z-index

---

## Phase 4: Execution Checklist

### 4.1 Preparation

- [ ] Complete audit (Phase 1)
- [ ] Finalize layer system (Phase 2)
- [ ] Choose migration strategy (Phase 3)
- [ ] Set up testing environment
- [ ] Create feature branch
- [ ] Document current state (screenshots/videos if needed)

### 4.2 Implementation Steps

**Step 1: Setup (No breaking changes)**

- [ ] Add `zIndex` object to `tokens.ts` with all layer values
- [ ] Export `zIndex` constant in `utils.ts`
- [ ] Test that imports work correctly
- [ ] Commit: "Add z-index token system"

**Step 2: HeadlessSelect Component**

- [ ] Update HeadlessSelect default zIndex prop from 99999 to zIndex.dropdown (1000)
- [ ] Update any HeadlessSelect instances with custom zIndex to use tokens
- [ ] Test all dropdowns work correctly
- [ ] Commit: "Update HeadlessSelect to use z-index tokens"

**Step 3: Modals**

- [ ] Find all modal overlays using z-[9999] or z-[10000]
- [ ] Replace with zIndex.modal (3000) or z-[${zIndex.modal}]
- [ ] Update modal backdrops to zIndex.overlay (2000)
- [ ] Test all modals open/close correctly
- [ ] Commit: "Standardize modal z-index values"

**Step 4: Job Pages (Critical)**

- [ ] Update JobWorkflowStepsPage: 999999/1000000 → zIndex.modal (3000)
- [ ] Update ScheduledJobsPage: 999999/1000000 → zIndex.modal (3000)
- [ ] Update JobDependenciesPage: 99999/999999/1000000 → zIndex.modal (3000)
- [ ] Test all job page overlays work correctly
- [ ] Commit: "Fix critical z-index values in job pages"

**Step 5: Sidebar**

- [ ] Update Sidebar mobile overlay: 99999 → zIndex.overlay (2000)
- [ ] Test mobile sidebar works correctly
- [ ] Commit: "Fix sidebar z-index"

**Step 6: Remaining Components**

- [ ] Update connection profile dropdown: 100000 → zIndex.dropdown (1000)
- [ ] Update dropdowns inside modals: → zIndex.popover (4000)
- [ ] Update notifications/toasts: → zIndex.notification (5000)
- [ ] Update any remaining hardcoded values
- [ ] Commit: "Complete z-index migration"

**Step 7: Cleanup**

- [ ] Search for any remaining hardcoded z-index values
- [ ] Verify all use token system
- [ ] Update documentation
- [ ] Final commit: "Complete z-index standardization"

### 4.3 Validation

- [ ] All z-index values use token system
- [ ] No hardcoded z-index values remain
- [ ] All components stack correctly
- [ ] No visual regressions
- [ ] Cross-browser testing passed
- [ ] Code review completed

---

## Phase 5: Maintenance & Documentation

### 5.1 Documentation

- [ ] Document z-index system in codebase
- [ ] Create developer guide for using z-index
- [ ] Add examples of proper usage
- [ ] Document exceptions and why they exist

### 5.2 Standards

- [ ] Establish rules for when to use which layer
- [ ] Create review checklist for new z-index usage
- [ ] Set up linting rules (if possible) to prevent hardcoded values

### 5.3 Future Considerations

- [ ] Plan for new component types
- [ ] Consider CSS custom properties for dynamic z-index
- [ ] Evaluate if Tailwind z-index utilities are sufficient

---

## Risk Assessment

### Potential Risks

- [ ] Breaking existing UI stacking
- [ ] Missing edge cases
- [ ] Browser compatibility issues
- [ ] Performance impact (minimal, but document)
- [ ] Time investment vs. benefit

### Mitigation Strategies

- [ ] Thorough testing at each step
- [ ] Incremental rollout
- [ ] Keep old values commented during transition
- [ ] Have rollback plan ready
- [ ] Test in staging environment first

---

## Success Criteria

- [ ] All z-index values use centralized token system
- [ ] No z-index values exceed 9999
- [ ] Clear, predictable layering across app
- [ ] No stacking conflicts or visual bugs
- [ ] Easy to maintain and extend
- [ ] Well documented for future developers

---

## Notes & Decisions

_Use this section to document decisions made during planning:_

- Decision 1: [Date] - [Decision made]
- Decision 2: [Date] - [Decision made]
- etc.

---

## Timeline Estimate

- **Phase 1 (Audit)**: [X] days
- **Phase 2 (Design)**: [X] days
- **Phase 3 (Planning)**: [X] days
- **Phase 4 (Implementation)**: [X] days
- **Phase 5 (Documentation)**: [X] days

**Total Estimated Time**: [X] days/weeks

---

## Next Steps

1. [ ] Complete Phase 1 audit
2. [ ] Review findings with team
3. [ ] Finalize layer system design
4. [ ] Get approval to proceed
5. [ ] Begin implementation

---

_Last Updated: [Date]_
_Owner: [Name/Team]_
