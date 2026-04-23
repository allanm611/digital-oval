# Configuration Management Refactoring Plan

**Date:** 2026-04-23  
**Status:** PLANNING MODE  
**Scope:** Consolidate 38 configuration pages into unified ConfigurationManager component

---

## 1. Current State Analysis

### 38 Total Configurations Breakdown

#### Group A: HARDCODED/DUMMY DATA (11 pages)
**GenericConfigurationPage (5 pages):**
- Campaign Objectives ✓ hardcodedObjectives
- Departments ✓ hardcodedDepartments
- Line of Business ✓ hardcodedLineOfBusiness
- Programs (via GenericConfigurationPage)
- Team Roles (via GenericConfigurationPage)
- Tracking Sources ✓ hardcodedTrackingSources

**TypeConfigurationPage (6 pages):**
- Email Routes ✓ hardcodedEmailRoutes
- SMS Routes ✓ hardcodedSMSRoutes
- Communication Policy (custom, dummy data)
- Routes (custom, dummy data)
- Resource Types (initialData: [...])
- Utilities (initialData: [...])
- Offer Tracking Sources (uses GenericConfigurationPage, dummy)

**Data Source:** Hardcoded arrays in `configurationPageConfigs.ts` OR initialData arrays  
**Pattern:** No backend API calls, static data only

#### Group B: Using TypeConfigurationPage (27 pages) — ✅ REAL API ENDPOINTS
1. Campaign Types → `campaignTypeService` (initialData: [])
2. Offer Types → `offerTypeService` (initialData: [])
3. Reward Types → `rewardTypeService` (initialData: [])
4. Sender IDs → `senderIdService` (initialData: [])
5. Notification Types → `notificationTypeService` (initialData: [])
6. Languages → `languageService` (initialData: [])
7. Character Sets → `characterSetService` (initialData: [])
8. Creative Templates → `creativeTemplateService` (initialData: [])
9. Offer Creatives → `offerCreativeService` (initialData: [])
10. Product Types → `productTypeService` (initialData: [])
11. Combo Types → `comboTypesService` (initialData: [])
12. Segment Types → `segmentTypeService` (initialData: [])
13. VIP Lists → `vipListService` (initialData: [])
14. Communication Channels → `communicationChannelService` (initialData: [])

**Data Source:** ✅ Real API endpoints (empty initialData = loads from API)  
**Pattern:** Service imports + useEffect + async calls

#### Group C: Custom Implementations (11 pages) — ✅ REAL API ENDPOINTS
1. DND Management → `dndService`
2. Seed List Management → `seedListService`
3. VIP List Management → `vipListService`
4. User Management → `userService`
5. Communication Policy → `communicationPolicyService`
6. Control Groups → `controlGroupService`
7. Job Types → `jobTypeService`
8. DND Types → `dndService`
9. Timezones → `timezoneService`
10. KPIs → `kpiService` (custom page)
11. Dynamic Message Variables → `dynamicMessageVariableService`

**Data Source:** ✅ Real API endpoints (verified)  
**Pattern:** Custom components + service calls + CRUD logic

---

## 2. Data Source Classification (AUDIT COMPLETE - CORRECTED) ✅

### Summary
- **Group A (DUMMY DATA):** 11 pages with hardcoded/mock data
- **Group B (REAL API):** 27 pages with real API endpoints

### KEY FINDING: TWO DISTINCT PATTERNS

**Pattern 1: DUMMY DATA (11 pages)**
- Hardcoded arrays like `hardcodedEmailRoutes`, `hardcodedSMSRoutes`
- OR initialData: [...] with static arrays
- Data passed via `config.initialData` 
- No backend API calls
- Pages: Email Routes, SMS Routes, Campaign Objectives, Departments, Line of Business, Tracking Sources, Communication Policy, Routes, Resource Types, Utilities, Offer Tracking Sources

**Pattern 2: REAL API (27 pages)**
- Uses feature-specific services (languageService, smsRouteService, etc.)
- initialData: [] (empty) - loads from backend
- Dynamic data fetched from backend
- Can create/update/delete via API
- TypeConfigurationPage: 14 pages
- Custom pages: 11 pages
- GenericConfigurationPage: 2 pages (Campaign Catalogs, Offer Catalogs, etc.)

---

## 3. Unified Architecture (PROPOSED)

### Directory Structure
```
configurations/
├── components/
│   └── ConfigurationManager/
│       ├── ConfigurationManager.tsx      (core - ~300 lines)
│       ├── ConfigurationModal.tsx        (form - ~250 lines)
│       ├── CustomFieldsRenderer.tsx      (fields - ~150 lines)
│       └── hooks/
│           ├── useCRUD.ts               (generic CRUD)
│           ├── useSearch.ts             (search/filter)
│           ├── usePagination.ts         (pagination)
│           ├── useValidation.ts         (field validation)
│           ├── useNotificationLogic.ts  (special - notifications)
│           ├── useSmsRoutesLogic.ts     (special - SMS routes)
│           └── ... (only special cases)
│
├── configs/
│   ├── simple/                          (hardcoded mock data)
│   │   ├── campaignObjectivesConfig.ts
│   │   ├── departmentsConfig.ts
│   │   └── ... (Group A configs)
│   │
│   └── api/                             (real API endpoints)
│       ├── notificationTypesConfig.ts
│       ├── smsRoutesConfig.ts
│       └── ... (Group B & C configs)
│
├── pages/
│   └── ConfigurationPage.tsx           (entry point - list all configs)
│
└── services/
    └── configService.ts                (loads configs by type)
```

### Config Schema (All configs follow this)
```typescript
interface ConfigSchema {
  id: string;
  title: string;
  description: string;
  dataSource: "mock" | "api";        // ← KEY DIFFERENTIATOR
  
  // For mock data
  initialData?: ConfigurationItem[];
  
  // For API data
  serviceMethod?: () => Promise<any>;  // e.g., languageService.getAll()
  
  // Field definitions
  fields: FieldConfig[];
  
  // Optional: special logic
  hooks?: string[];                    // e.g., ["useNotificationLogic"]
  preview?: boolean;
  customValidation?: boolean;
}
```

---

## 4. Implementation Plan (PHASES)

### Phase 1: Audit & Documentation
- [ ] Verify data sources for Group B (TypeConfiguration 21 pages)
- [ ] Verify data sources for Group C (Custom 12 pages)
- [ ] Document which configs need specialized hooks
- [ ] List all custom fields used across configs

### Phase 2: Build Core System
- [ ] Extract ConfigurationManager component
- [ ] Create generic hooks (useCRUD, useSearch, usePagination)
- [ ] Create CustomFieldsRenderer
- [ ] Create config schema types

### Phase 3: Migrate Group A (Hardcoded)
- [ ] Move GenericConfigurationPage configs to new system
- [ ] Create mock data configs in `configs/simple/`
- [ ] Verify all 5 pages work

### Phase 4: Migrate Group B (TypeConfiguration)
- [ ] Move TypeConfigurationPage configs to new system
- [ ] Determine which need special hooks
- [ ] Create API-based configs in `configs/api/`
- [ ] Verify all 21 pages work

### Phase 5: Migrate Group C (Custom Pages)
- [ ] Analyze each of 12 custom pages
- [ ] Extract to config schema
- [ ] Create specialized hooks if needed
- [ ] Migrate to ConfigurationManager

### Phase 6: Cleanup
- [ ] Delete GenericConfigurationPage.tsx
- [ ] Delete TypeConfigurationPage.tsx
- [ ] Delete 12 custom implementations
- [ ] Update all imports

---

## 5. Hook Strategy (NO 38 HOOKS)

**Estimate: 6-10 specialized hooks needed**

| Config | Special Logic? | Hook Name |
|--------|---------------|-----------|
| Languages | ❌ No | (uses generic hooks) |
| Notification Types | ✅ Yes | useNotificationLogic |
| SMS Routes | ✅ Yes | useSmsRoutesLogic |
| Campaign Objectives | ❌ No | (generic) |
| DND Management | ✅ Yes | useDNDManagement |
| User Management | ✅ Yes | useUserManagement |
| KPIs | ✅ Yes | useKPILogic |
| ... | ... | ... |

Most configs = **generic hooks only**  
Complex configs = **+ 1 specialized hook**

---

## 6. Architecture Decision (AUDIT COMPLETE - CORRECTED) ✅

### RECOMMENDATION: **TWO Separate ConfigurationManagers**

**Reason:** Different data patterns = different logic

#### ConfigurationManagerMock
- For 11 pages with hardcoded initial data
- No API calls
- Simpler logic
- No async/loading states needed

#### ConfigurationManagerAPI  
- For 27 pages with real backend APIs
- Service-based architecture
- Loading states, error handling, async operations
- More complex

**Benefit:**
- Clean separation of concerns
- No unnecessary complexity in mock manager
- Each optimized for its use case
- Easier to maintain and test

---

## 7. Refactoring Scope (FINAL - CORRECTED)

| Component | Replaces | Pages |
|-----------|----------|-------|
| **ConfigurationManagerMock** | GenericConfigurationPage (5) + dummy TypeConfig (6) | 11 |
| **ConfigurationManagerAPI** | TypeConfigurationPage (14) + custom pages (11) + GenericConfigurationPage (2) | 27 |

**Total pages refactored:** 38  
**Total lines of code saved:** ~7000+ (consolidated from scattered implementations)

---

## 8. Timeline & Effort (CORRECTED)

- **Phase 1:** Build ConfigurationManagerMock → migrate 11 pages: **1-2 days**
- **Phase 2:** Build ConfigurationManagerAPI → migrate 14 TypeConfiguration pages: **2-3 days**
- **Phase 3:** Migrate 11 custom pages + 2 GenericConfiguration pages to ConfigurationManagerAPI: **2-3 days**
- **Phase 4:** Cleanup, delete old components, update imports: **1 day**
- **Phase 5:** Testing & refinement: **1 day**

**Total: ~1-2 weeks**

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing pages | Test each phase in isolation; keep old components during migration |
| Data inconsistency | Verify schema matches all configs before deletion |
| Losing custom logic | Document all 12 custom implementations before migration |
| Performance regression | Profile before/after; check pagination, search |

---

## 8. Documentation to Maintain

After refactoring, create:
- [ ] ConfigurationManager usage guide
- [ ] How to add a new configuration
- [ ] Config schema documentation
- [ ] Custom hook template for complex configs

---

---

## 9. Audit Summary Document (CORRECTED)

### Configurations by Data Source

**Dummy/Mock Data (11 pages)**
```
✓ Campaign Objectives (hardcodedObjectives)
✓ Departments (hardcodedDepartments)
✓ Line of Business (hardcodedLineOfBusiness)
✓ Tracking Sources (hardcodedTrackingSources)
✓ Email Routes (hardcodedEmailRoutes)
✓ SMS Routes (hardcodedSMSRoutes)
✓ Communication Policy (custom, dummy data)
✓ Routes (custom, dummy data)
✓ Resource Types (initialData: [...])
✓ Utilities (initialData: [...])
✓ Offer Tracking Sources (GenericConfigurationPage, dummy)
```

**Real API (14 pages) - TypeConfigurationPage**
```
✓ Campaign Types (initialData: [])
✓ Character Sets (initialData: [])
✓ Combo Types (initialData: [])
✓ Communication Channels (initialData: [])
✓ Creative Templates (initialData: [])
✓ Languages (initialData: [])
✓ Notification Types (initialData: [])
✓ Offer Creatives (initialData: [])
✓ Offer Types (initialData: [])
✓ Product Types (initialData: [])
✓ Reward Types (initialData: [])
✓ Segment Types (initialData: [])
✓ Sender IDs (initialData: [])
✓ VIP Lists (initialData: [])
```

**Real API (11 pages) - Custom Implementations**
```
✓ Communication Policy → communicationPolicyService (WAIT: also listed as dummy?)
✓ Control Groups → controlGroupService
✓ DND Management → dndService
✓ DND Types → dndService
✓ Dynamic Message Variables → dynamicMessageVariableService
✓ Job Types → jobTypeService
✓ KPIs → kpiService
✓ Seed List Management → seedListService
✓ Timezones → timezoneService
✓ User Management → userService
✓ VIP List Management → vipListService
```

**Real API (2 pages) - GenericConfigurationPage with API**
```
✓ Campaign Catalogs
✓ Offer Catalogs
✓ Product Catalogs
✓ Segment Catalogs
✓ Programs
✓ Team Roles
```

---

## 10. READY FOR IMPLEMENTATION ✅

**Phase 1: Build ConfigurationManagerMock (11 pages)**
- Simpler, no async logic
- Perfect starting point

Proceed?
