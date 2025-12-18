# Quicklist Endpoints - Complete List (14/14)

## ✅ All Endpoints Added to Service

### Upload Type Configuration (2/2)

1. ✅ `GET /quicklists/upload-types` - `getUploadTypes()`
2. ✅ `GET /quicklists/upload-types/:uploadType/schema` - `getUploadTypeSchema()` ⭐ **NEW**

### Table Mappings (2/2)

3. ✅ `GET /quicklists/mappings` - `getTableMappings()` ⭐ **NEW**
4. ✅ `GET /quicklists/mappings/:uploadType` - `getTableMappingByUploadType()` ⭐ **NEW**

### Statistics (1/1)

5. ✅ `GET /quicklists/stats` - `getStats()`

### Search (1/1)

6. ✅ `GET /quicklists/search` - `searchQuickLists()`

### Core QuickList Operations (6/6)

7. ✅ `POST /quicklists` - `createQuickList()` (cleaned up to use standard endpoint)
8. ✅ `GET /quicklists` - `getAllQuickLists()`
9. ✅ `GET /quicklists/:id` - `getQuickListById()`
10. ✅ `GET /quicklists/:id/data` - `getQuickListData()`
11. ✅ `GET /quicklists/:id/logs` - `getImportLogs()`
12. ✅ `GET /quicklists/:id/export` - `exportQuickList()`

### Update & Delete (2/2)

13. ✅ `PATCH /quicklists/:id` - `updateQuickList()`
14. ✅ `DELETE /quicklists/:id` - `deleteQuickList()`

---

## 📋 Types Added

### New Types (Need Backend Structure)

- `UploadTypeSchema` - Schema structure for upload types
- `UploadTypeSchemaResponse` - Response wrapper
- `TableMapping` - Table mapping structure
- `TableMappingsResponse` - Response for all mappings
- `SingleTableMappingResponse` - Response for single mapping

**Note**: Types have placeholder structures marked with `TODO` comments. These need to be updated once backend response structures are shared.

---

## 🔌 Connection Status

### Connected & Used (11/14)

- `getAllQuickLists` - ✅ Used in both QuickLists pages
- `getQuickListById` - ✅ Used in both QuickLists pages & QuickListDetailsModal
- `getQuickListData` - ✅ Used in QuickListDetailsModal
- `createQuickList` - ✅ Used in both QuickLists pages
- `deleteQuickList` - ✅ Used in both QuickLists pages
- `searchQuickLists` - ✅ Used in both QuickLists pages
- `exportQuickList` - ✅ Used in both QuickLists pages
- `getUploadTypes` - ✅ Used in both QuickLists pages
- `getStats` - ✅ Used in both QuickLists pages (stats cards)
- `updateQuickList` - ✅ Used in both QuickLists pages (edit modal)
- `getImportLogs` - ✅ Used in QuickListDetailsModal

### Not Yet Connected (3/14)

- `getUploadTypeSchema` - ⏳ Available but not used
- `getTableMappings` - ⏳ Available but not used
- `getTableMappingByUploadType` - ⏳ Available but not used

---

## 🎯 Next Steps

1. **Update Types**: Wait for backend response structures and update placeholder types
2. **Connect Endpoints**: Integrate unused endpoints into UI components
3. **Test**: Verify all endpoints work correctly with backend

---

## 📝 Changes Made

1. ✅ Added 3 missing endpoints to service
2. ✅ Added corresponding types (with TODOs for structure)
3. ✅ Cleaned up `createQuickList` to use standard endpoint
4. ✅ All 14 endpoints now available in service
