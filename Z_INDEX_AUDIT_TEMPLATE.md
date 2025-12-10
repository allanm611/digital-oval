# Z-Index Audit Template

Use this template to document all z-index findings during the audit phase.

## Quick Reference: Search Commands

```bash
# Find all z-index usage
grep -r "z-index\|zIndex\|z-\[" --include="*.tsx" --include="*.ts" --include="*.css" src

# Find inline styles with zIndex
grep -r "zIndex:" --include="*.tsx" --include="*.ts" src

# Find Tailwind z- classes
grep -r "z-\[" --include="*.tsx" --include="*.ts" src
```

---

## Audit Findings Log

### Dropdowns/Selects

| File                                                                    | Line   | Value                       | Component                   | Notes                           | Priority |
| ----------------------------------------------------------------------- | ------ | --------------------------- | --------------------------- | ------------------------------- | -------- |
| src/shared/components/ui/HeadlessSelect.tsx                             | 48, 95 | zIndex prop (default 99999) | HeadlessSelect              | Uses zIndex prop, default 99999 | High     |
| src/shared/components/NotificationDropdown.tsx                          | 133    | z-50                        | NotificationDropdown        | Tailwind z-50 class             | Medium   |
| src/features/campaigns/components/CommunicationPolicyModal.tsx          | 702    | z-[10000]                   | Dropdown inside modal       | Very high for dropdown          | High     |
| src/features/connection-profiles/pages/ConnectionProfileDetailsPage.tsx | -      | z-[100000]                  | Connection profile dropdown | Extremely high                  | Critical |

### Modals/Dialogs

| File                                                                | Line | Value     | Component               | Notes                       | Priority |
| ------------------------------------------------------------------- | ---- | --------- | ----------------------- | --------------------------- | -------- |
| Multiple files                                                      | -    | z-[9999]  | Modal overlays          | Most common modal z-index   | High     |
| src/features/communications/components/TemplateSelector.tsx         | -    | z-[10000] | Template selector modal | Higher than standard modals | Medium   |
| src/features/segments/components/SegmentListModal.tsx               | -    | z-[10000] | Segment list modal      | Higher than standard modals | Medium   |
| src/features/dashboard/components/UserModal.tsx                     | -    | z-[9999]  | User modal              | Standard modal z-index      | Medium   |
| src/features/campaigns/components/steps/CreateOfferModalWrapper.tsx | -    | z-[9999]  | Offer modal wrapper     | Standard modal z-index      | Medium   |

### Notifications/Toasts

| File | Line | Value | Component | Notes | Priority |
| ---- | ---- | ----- | --------- | ----- | -------- |
|      |      |       |           |       |          |
|      |      |       |           |       |          |

### Search Bars

| File | Line | Value | Component | Notes | Priority |
| ---- | ---- | ----- | --------- | ----- | -------- |
|      |      |       |           |       |          |
|      |      |       |           |       |          |

### Tooltips/Popovers

| File | Line | Value | Component | Notes | Priority |
| ---- | ---- | ----- | --------- | ----- | -------- |
|      |      |       |           |       |          |
|      |      |       |           |       |          |

### Overlays/Backdrops

| File | Line | Value | Component | Notes | Priority |
| ---- | ---- | ----- | --------- | ----- | -------- |
|      |      |       |           |       |          |
|      |      |       |           |       |          |

### Sticky/Fixed Elements

| File                                             | Line     | Value                          | Component                 | Notes                          | Priority |
| ------------------------------------------------ | -------- | ------------------------------ | ------------------------- | ------------------------------ | -------- |
| src/features/dashboard/components/Header.tsx     | -        | z-[100]                        | Sticky header             | Reasonable value               | Low      |
| src/features/dashboard/components/Sidebar.tsx    | Multiple | zIndex: 99999                  | Sidebar mobile overlay    | Extremely high for sidebar     | Critical |
| src/features/jobs/pages/JobWorkflowStepsPage.tsx | Multiple | zIndex: 999999, 1000000        | Job workflow overlays     | Extremely high values          | Critical |
| src/features/jobs/pages/ScheduledJobsPage.tsx    | -        | zIndex: 999999, 1000000        | Scheduled jobs overlays   | Extremely high values          | Critical |
| src/features/jobs/pages/JobDependenciesPage.tsx  | -        | zIndex: 99999, 999999, 1000000 | Job dependencies overlays | Multiple extremely high values | Critical |

### Other

| File | Line | Value | Component | Notes | Priority |
| ---- | ---- | ----- | --------- | ----- | -------- |
|      |      |       |           |       |          |
|      |      |       |           |       |          |

---

## Summary Statistics

- **Total z-index occurrences found**: ~121 (17 z-index, 49 zIndex, 55 z-[)
- **Highest value**: 1000000 (JobWorkflowStepsPage, ScheduledJobsPage, JobDependenciesPage)
- **Lowest value**: -1 (index.css)
- **Unique values found**:
  - Tailwind: z-[100], z-[9999], z-[10000], z-[100000], z-[10050], z-[10100]
  - Inline styles: 9999, 99999, 999999, 1000000
  - CSS: -1, 0, 1, 2, 50
- **Most common value**: z-[9999] (modals/overlays)
- **Problem areas identified**:
  - Extremely high values (999999, 1000000) in job pages
  - Inconsistent values (9999, 99999, 100000) across similar components
  - 87 instances using values >= 9999

---

## Known Issues/Conflicts

| Issue                         | Files Involved                                               | Current Behavior                | Impact                                 |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------- | -------------------------------------- | -------- |
| Extremely high z-index values | JobWorkflowStepsPage, ScheduledJobsPage, JobDependenciesPage | Using 999999 and 1000000        | Creates z-index wars, hard to maintain | Critical |
| Inconsistent modal z-index    | Multiple modal components                                    | Some use 9999, others use 10000 | Potential stacking conflicts           | High     |
| Sidebar using 99999           | Sidebar.tsx                                                  | Mobile sidebar overlay at 99999 | Unnecessarily high                     | High     |
| HeadlessSelect default        | HeadlessSelect.tsx                                           | Default zIndex prop is 99999    | All dropdowns inherit very high value  | High     |
| Connection profile dropdown   | ConnectionProfileDetailsPage.tsx                             | Using z-[100000]                | Extremely high for a dropdown          | Critical |

---

## Component Library Defaults

| Library/Component       | Default Z-Index         | Notes                         |
| ----------------------- | ----------------------- | ----------------------------- |
| HeadlessUI Listbox      | Unknown                 | Need to check HeadlessUI docs |
| HeadlessSelect (custom) | 99999 (via zIndex prop) | Custom default, very high     |
| Tailwind z-50           | 50                      | Used in NotificationDropdown  |

---

## Notes

_Add any additional observations, patterns, or concerns here:_

### Key Observations:

1. **Extreme Values Found**:

   - Values like 999999 and 1000000 are being used in job-related pages
   - These are unnecessarily high and indicate z-index wars

2. **Inconsistent Patterns**:

   - Most modals use z-[9999] but some use z-[10000]
   - HeadlessSelect defaults to 99999 which is very high for dropdowns
   - No clear pattern for when to use which value

3. **High Priority Issues**:

   - Job workflow pages have the worst z-index values (999999, 1000000)
   - Sidebar mobile overlay uses 99999 unnecessarily
   - Connection profile dropdown uses z-[100000] which is extreme

4. **Positive Findings**:

   - Header uses reasonable z-[100] for sticky positioning
   - NotificationDropdown uses z-50 which is reasonable
   - Most modals consistently use z-[9999] (though could be standardized)

5. **Areas Needing Attention**:
   - All job-related pages (JobWorkflowStepsPage, ScheduledJobsPage, JobDependenciesPage)
   - Sidebar component
   - HeadlessSelect component (default zIndex prop)
   - Modal components (standardize on one value)
   - Dropdowns inside modals (need proper layering)
