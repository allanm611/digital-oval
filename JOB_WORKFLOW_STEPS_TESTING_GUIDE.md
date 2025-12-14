# Job Workflow Steps Endpoints - Testing Guide

## Overview

This guide helps you test all 39 job workflow step endpoints that are now connected to the UI. All endpoints have been implemented and integrated.

## ✅ Testing Checklist

### 1. GET Endpoints (26 endpoints)

#### Core List & Search

- [ ] **`listJobWorkflowSteps`** - Navigate to `/dashboard/job-workflow-steps` and verify list loads
- [ ] **`searchJobWorkflowSteps`** - Use search bar and filters to search for steps
- [ ] **`getJobWorkflowStepById`** - Click on any step to view details page

#### Job-Specific Queries

- [ ] **`getStepsByJobId`** - Filter by job ID using the job filter dropdown
- [ ] **`getStepByJobAndOrder`** - Select a job, enter step order in advanced filters, verify precise lookup
- [ ] **`getStepByJobAndCode`** - Select a job, enter step code in advanced filters, verify precise lookup
- [ ] **`getParallelSteps`** - View details of a parallel step, check parallel steps section

#### Type & Status Filters

- [ ] **`getStepsByType`** - Filter by step type (SQL, API Call, etc.)
- [ ] **`getCriticalSteps`** - Click "Critical Steps" filter button
- [ ] **`getValidationSteps`** - Click "Validation Steps" filter button
- [ ] **`getRetrySteps`** - Click "Retry Steps" filter button
- [ ] **`getOrphanedSteps`** - Click "Orphaned Steps" filter button
- [ ] **`getStepsByFailureAction`** - Use failure action filter in advanced filters

#### Execution & Dependencies

- [ ] **`getExecutionOrder`** - View step details, check execution order section
- [ ] **`getNextStep`** - View step details, check next step information
- [ ] **`canStepExecute`** - View step details, check execution status
- [ ] **`getParallelGroups`** - View step details, check parallel groups section
- [ ] **`getDependencies`** - View step details, check dependencies section
- [ ] **`getHealthSummary`** - View step details, check health summary

#### Statistics & Analytics

- [ ] **`getStatistics`** - View stats cards at top of list page
- [ ] **`getMostFailedSteps`** - Click "Show Analytics", check most failed steps section
- [ ] **`getLongestRunningSteps`** - Click "Show Analytics", check longest running steps section
- [ ] **`getTypeDistribution`** - Click "Show Analytics", check type distribution chart
- [ ] **`getComplexWorkflows`** - Click "Show Analytics", check complex workflows section
- [ ] **`getDependencyComplexity`** - Click "Show Analytics", check dependency complexity section
- [ ] **`getTimeoutAnalysis`** - Click "Show Analytics", check timeout analysis section

---

### 2. POST Endpoints (6 endpoints)

#### Create Operations

- [ ] **`createJobWorkflowStep`** - Click "Create Step", fill form, submit, verify step created
- [ ] **`batchCreateSteps`** - Navigate to create page with `?batch=true`, add multiple steps, submit

#### Batch Operations

- [ ] **`batchActivateSteps`** - Select multiple steps, click "Activate" in batch toolbar
- [ ] **`batchDeactivateSteps`** - Select multiple steps, click "Deactivate" in batch toolbar

#### Utility Operations

- [ ] **`duplicateStep`** - Click duplicate icon on any step, verify duplicate created
- [ ] **`validateWorkflowIntegrity`** - Click "Validate Integrity" button for a job, verify validation results

---

### 3. PUT Endpoints (3 endpoints)

- [ ] **`updateJobWorkflowStep`** - Edit an existing step, modify fields, save, verify changes
- [ ] **`batchUpdateSteps`** - Select multiple steps, click "Update" in batch toolbar, modify fields, save
- [ ] **`reorderSteps`** - Click "Reorder Steps" button, drag and drop steps, save new order

---

### 4. PATCH Endpoints (2 endpoints)

- [ ] **`activateStep`** - View step details, click "Activate" button
- [ ] **`deactivateStep`** - View step details, click "Deactivate" button

---

### 5. DELETE Endpoints (2 endpoints)

- [ ] **`deleteJobWorkflowStep`** - Click delete icon on a step, confirm deletion
- [ ] **`deleteAllStepsForJob`** - Select a job, click "Delete All" button, confirm deletion

---

## 🧪 Test Scenarios

### Scenario 1: Create and Edit Workflow Step

1. Navigate to Job Workflow Steps page
2. Click "Create Step" button
3. Fill in required fields:
   - Select a job
   - Enter step name and code
   - Select step type
   - Enter step action
   - Set step order
4. Add optional fields (dependencies, retry settings, etc.)
5. Click "Save"
6. Verify step appears in list
7. Click on the new step to view details
8. Click "Edit" button
9. Modify some fields
10. Save and verify changes

### Scenario 2: Batch Operations

1. Navigate to Job Workflow Steps page
2. Click selection mode toggle
3. Select multiple steps using checkboxes
4. Test batch activate - click "Activate" in toolbar
5. Test batch deactivate - click "Deactivate" in toolbar
6. Test batch update - click "Update" in toolbar, modify fields, save
7. Verify all selected steps were updated

### Scenario 3: Advanced Search with Specific Lookups

1. Navigate to Job Workflow Steps page
2. Select a job from the job filter
3. Open advanced filters (click "Filters" button)
4. Enter a step code that exists for that job
5. Click "Apply Filters"
6. Verify it uses `getStepByJobAndCode` endpoint (check network tab)
7. Clear filters
8. Select the same job
9. Enter a step order number
10. Click "Apply Filters"
11. Verify it uses `getStepByJobAndOrder` endpoint (check network tab)

### Scenario 4: Analytics Dashboard

1. Navigate to Job Workflow Steps page
2. Click "Show Analytics" button
3. Verify all analytics sections load:
   - Most Failed Steps
   - Longest Running Steps
   - Type Distribution
   - Complex Workflows
   - Dependency Complexity
   - Timeout Analysis
4. Filter by a specific job and verify analytics update

### Scenario 5: Workflow Integrity Validation

1. Navigate to Job Workflow Steps page
2. Select a job that has multiple steps
3. Click "Validate Integrity" button (if available)
4. Verify validation results show:
   - Valid workflows
   - Any errors or warnings
   - Dependency issues

### Scenario 6: Reorder Steps

1. Navigate to Job Workflow Steps page
2. Filter by a specific job
3. Click "Reorder Steps" button
4. Drag and drop steps to reorder
5. Click "Save Order"
6. Verify steps are reordered correctly
7. Refresh page and verify order persists

---

## 🔍 Verification Points

### Network Tab Verification

When testing, open browser DevTools → Network tab to verify:

- Correct endpoints are being called
- Request payloads are correct
- Response status codes are 200/201
- Response data structure matches expected format

### UI Verification

- Loading states appear during API calls
- Success/error toasts appear after operations
- Data refreshes after create/update/delete operations
- Filters and search work correctly
- Analytics data displays properly

### Error Handling

- Test with invalid data (missing required fields)
- Test with non-existent IDs
- Test network errors (disconnect internet temporarily)
- Verify error messages are user-friendly

---

## 📊 Expected Results

### Success Indicators

- ✅ All endpoints return 200/201 status codes
- ✅ Data displays correctly in UI
- ✅ Create/Update operations persist changes
- ✅ Delete operations remove items from list
- ✅ Search and filters work as expected
- ✅ Analytics data loads and displays
- ✅ Batch operations affect all selected items
- ✅ No console errors

### Common Issues to Watch For

- ⚠️ CORS errors (check API configuration)
- ⚠️ 404 errors (endpoint not found - check service URLs)
- ⚠️ 401/403 errors (authentication issues)
- ⚠️ 500 errors (backend server errors)
- ⚠️ Data not refreshing after operations
- ⚠️ Loading states not clearing

---

## 🐛 Debugging Tips

1. **Check Browser Console** - Look for JavaScript errors
2. **Check Network Tab** - Verify API calls and responses
3. **Check Redux/State** - If using state management, verify state updates
4. **Check Backend Logs** - Verify backend receives and processes requests
5. **Test with Postman** - Verify endpoints work independently
6. **Check Authentication** - Ensure user is logged in and has permissions

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

### GET Endpoints
- [ ] listJobWorkflowSteps: ✅ / ❌ Notes: ___________
- [ ] searchJobWorkflowSteps: ✅ / ❌ Notes: ___________
- [ ] getJobWorkflowStepById: ✅ / ❌ Notes: ___________
... (continue for all endpoints)

### POST Endpoints
- [ ] createJobWorkflowStep: ✅ / ❌ Notes: ___________
... (continue for all endpoints)

### Issues Found:
1. ___________
2. ___________
3. ___________

### Overall Status: ✅ Pass / ❌ Fail
```

---

**Last Updated**: 2025-01-XX  
**Status**: Ready for Testing ✅
