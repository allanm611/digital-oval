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
Base Layer:        0-999      (default content)
Dropdowns:         1000-1999  (selects, dropdowns, menus)
Sticky Elements:  1100-1200  (sticky headers, nav bars)
Fixed Elements:   1200-1300  (fixed sidebars, headers)
Overlays:          2000-2999  (backdrops, dimmers)
Modals:            3000-3999  (dialogs, modals)
Popovers:          4000-4999  (tooltips, context menus)
Notifications:     5000-5999  (toasts, alerts)
Maximum:           9999       (emergency override, rarely used)
```

### 2.2 Component Mapping

Map each component type to a layer:

- [ ] **HeadlessSelect dropdowns** → Dropdowns layer (1000)
- [ ] **HeadlessUI modals** → Modals layer (3000)
- [ ] **Notification dropdown** → Notifications layer (5000)
- [ ] **Global search dropdown** → Dropdowns layer (1000) or slightly higher?
- [ ] **Toast notifications** → Notifications layer (5000)
- [ ] **Tooltips** → Popovers layer (4000)
- [ ] **Modal backdrops** → Overlays layer (2000)
- [ ] **Sticky headers** → Sticky layer (1100)
- [ ] **Fixed sidebars** → Fixed layer (1200)

### 2.3 Edge Cases & Exceptions

- [ ] Document any components that need special handling
- [ ] Identify components that might need sub-layers (e.g., nested modals)
- [ ] Plan for future components that might need new layers

---

## Phase 3: Implementation Planning

### 3.1 Token System Design

- [ ] Add `zIndex` object to `tokens.ts`
- [ ] Export through `utils.ts` as `zIndex` constant
- [ ] Create Tailwind classes if needed (optional)
- [ ] Document usage in code comments

### 3.2 Migration Strategy

**Option A: Big Bang Approach**

- Update everything at once
- Pros: Consistent, done quickly
- Cons: High risk, harder to test

**Option B: Incremental Approach** (Recommended)

- Start with one component type
- Test thoroughly
- Move to next component type
- Pros: Lower risk, easier to test
- Cons: Takes longer

**Option C: Feature-by-Feature**

- Update one feature area at a time
- Test that feature completely
- Move to next feature
- Pros: Isolated testing, lower risk
- Cons: Takes longest

### 3.3 Priority Order

Decide order of implementation:

1. [ ] **First Priority**: Most problematic areas (highest z-index values, known conflicts)
2. [ ] **Second Priority**: Frequently used components (dropdowns, modals)
3. [ ] **Third Priority**: Less critical components
4. [ ] **Fourth Priority**: Edge cases and exceptions

### 3.4 Testing Strategy

- [ ] Create test scenarios for each component type
- [ ] Test stacking order in different combinations
- [ ] Test on different screen sizes
- [ ] Test browser compatibility
- [ ] Create regression test checklist

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

- [ ] Add z-index tokens to `tokens.ts`
- [ ] Export z-index constants in `utils.ts`
- [ ] Update first component type
- [ ] Test thoroughly
- [ ] Document any issues
- [ ] Move to next component type
- [ ] Repeat until complete

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
