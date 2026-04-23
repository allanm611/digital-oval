# Configuration Management Refactoring Plan

**Date:** 2026-04-23  
**Status:** PLANNING MODE  
**Scope:** Consolidate 38 configuration pages into unified ConfigurationManager component

---

## 1. Current State Analysis

### 38 Total Configurations Breakdown

#### Group A: Using GenericConfigurationPage (5 pages) — HARDCODED DATA
- Campaign Catalogs
- Offer Catalogs  
- Product Catalogs
- Segment Catalogs
- Campaign Objectives
- Departments
- Line of Business
- Programs
- Team Roles

**Data Source:** Hardcoded in `configurationPageConfigs.ts`  
**Pattern:** initialData array with mock data

#### Group B: Using TypeConfigurationPage (21 pages) — MIXED (BOTH?)
- Campaign Types
- Offer Types
- Reward Types
- Sender IDs
- SMS Routes (3 instances)
- Email Routes
- Notification Types
- Languages
- Character Sets
- Creative Templates
- Offer Creatives
- Product Types
- Combo Types
- Resource Types
- Segment Types
- Utilities
- VIP Lists
- Communication Channels (2 instances)

**Data Source:** TBD - NEED TO VERIFY (might use configurationDataService or API)

#### Group C: Custom Implementations (12 pages) — REAL API ENDPOINTS
- DND Management → `communicationChannelService`
- Seed List Management → TBD (needs checking)
- User Management → TBD (needs checking)
- Job Types → TBD (needs checking)
- DND Types → TBD (needs checking)
- Communication Policy → TBD (needs checking)
- VIP List Management → TBD (needs checking)
- Routes → TBD (needs checking)
- Control Groups → TBD (needs checking)
- KPIs → TBD (needs checking)
- Timezones → TBD (needs checking)
- Offer Tracking Sources → TBD (needs checking)

**Data Source:** Real API endpoints / services  
**Pattern:** useEffect + service calls + useState

---

## 2. Data Source Classification (CRITICAL)

### DO NOT MIX:
- ✅ **Hardcoded Mock Data** → ConfigurationManager with static configs
- ✅ **Real API Endpoints** → ConfigurationManager with service integration

### Next Step: Audit Group B & C
Need to determine:
1. Does TypeConfigurationPage use hardcoded OR API data?
2. Which of the 12 custom pages use real APIs?
3. Are any currently using placeholder data intended for later API integration?

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

## 6. Next Actions (DECISION NEEDED)

Before implementing, we need to:

1. **Verify Group B Data Source**
   - Does TypeConfigurationPage use API or mock data?
   - Run: `grep -r "configurationDataService\|Service" src/shared/components/TypeConfigurationPage.tsx`

2. **Audit Group C Data Sources**
   - Which custom pages use real APIs?
   - Which are hardcoded?
   - Create mapping

3. **Decision: Single vs Dual ConfigurationManager**
   - Option A: ONE manager that handles both mock + API data
   - Option B: TWO managers (ConfigurationManagerMock + ConfigurationManagerAPI)

4. **Timeline & Effort**
   - Phase 1-2: ~2 days (core system)
   - Phase 3-4: ~3 days (migrate 26 pages)
   - Phase 5-6: ~2 days (custom pages + cleanup)
   - **Total: ~1 week**

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

**DECISION POINT:** Ready to proceed with Phase 1 (Audit)?
