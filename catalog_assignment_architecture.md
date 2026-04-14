# Catalog Assignment/Removal Architecture

## Current Implementation (Workaround via Tags)

### How It Works Now

**Tag Format:**
```
catalog:5  ← means "assigned to catalog ID 5"
catalog:123 ← means "assigned to catalog ID 123"
```

An item can have MULTIPLE catalog tags (assigned to multiple catalogs simultaneously).

### Assignment Flow

1. **Build the catalog tag**
   ```javascript
   const catalogTag = buildCatalogTag(categoryId);  // "catalog:5"
   ```

2. **Get existing tags**
   ```javascript
   const existingTags = campaign.tags ?? [];  // ["promotional", "seasonal"]
   ```

3. **Add catalog tag to array**
   ```javascript
   const updatedTags = Array.from(new Set([...existingTags, catalogTag]));
   // Result: ["promotional", "seasonal", "catalog:5"]
   ```

4. **Set primary category (if needed)**
   ```javascript
   if (!campaign.category_id) {
     updatePayload.category_id = catalogId;  // Set as primary
   }
   ```

5. **Send to backend**
   ```javascript
   await campaignService.updateCampaign(campaignId, {
     tags: updatedTags,
     category_id: catalogId  // only if null
   });
   ```

### Removal Flow

1. **Check if PRIMARY category**
   ```javascript
   if (campaign.category_id === catalogId) {
     // CANNOT REMOVE - show warning modal
     // User must change primary category first (via item details page)
     return;
   }
   ```

2. **Remove the tag from array**
   ```javascript
   const catalogTag = buildCatalogTag(catalogId);  // "catalog:5"
   const updatedTags = campaign.tags.filter(tag => tag !== catalogTag);
   // Result: ["promotional", "seasonal"]  (catalog:5 removed)
   ```

3. **Send to backend**
   ```javascript
   await campaignService.updateCampaign(campaignId, {
     tags: updatedTags
   });
   ```

### Fetching Items in Catalog

Backend endpoint: `GET /campaigns/by-category/{categoryId}`

Backend returns campaigns where **EITHER**:
- `category_id === categoryId` (primary category match), **OR**
- `tags` contains `catalog:{categoryId}` (tag-based assignment)

```sql
-- Backend logic (pseudocode)
SELECT * FROM campaigns
WHERE category_id = 5 
   OR tags LIKE '%catalog:5%'
```

---

## What SHOULD Happen (Proper Design)

### Proper Database Schema

**Should have a junction table:**
```sql
CREATE TABLE catalogs_campaigns (
  id INT PRIMARY KEY,
  catalog_id INT NOT NULL,
  campaign_id INT NOT NULL,
  assigned_at TIMESTAMP,
  assigned_by INT,
  FOREIGN KEY (catalog_id) REFERENCES campaign_catalogs(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  UNIQUE KEY (catalog_id, campaign_id)
);
```

### Proper Backend Endpoints NEEDED

#### 1. Assign Item to Catalog
```
POST /catalogs/{catalogId}/items/assign
Content-Type: application/json

{
  "itemType": "campaign",           // "campaign" | "offer" | "product" | "segment"
  "itemIds": [48, 50, 52],          // Bulk assign multiple items
  "setPrimaryCategory": true         // Optional: set as primary if item doesn't have one
}

Response:
{
  "success": true,
  "assigned": 3,
  "failed": 0,
  "message": "3 campaigns assigned to catalog successfully"
}
```

#### 2. Remove Item from Catalog
```
DELETE /catalogs/{catalogId}/items/remove
Content-Type: application/json

{
  "itemType": "campaign",
  "itemIds": [48]
}

Response:
{
  "success": true,
  "removed": 1,
  "failed": 0,
  "message": "1 campaign removed from catalog successfully"
}
```

#### 3. Get Items in Catalog
```
GET /catalogs/{catalogId}/campaigns?limit=50&offset=0

Response:
{
  "success": true,
  "data": [
    {
      "id": 48,
      "name": "Spring Sale",
      "status": "active",
      "assigned_at": "2026-04-14T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### 4. Check if Item is Primary Category
```
GET /catalogs/{catalogId}/is-primary/{itemType}/{itemId}

Response:
{
  "success": true,
  "isPrimary": true,
  "canRemove": false
}
```

### What Frontend Would Do (CLEAN)
```javascript
// Super simple - no tag management
await catalogService.assignItems(catalogId, "campaign", [48, 50, 52]);
await catalogService.removeItems(catalogId, "campaign", [48]);
await catalogService.getItemsInCatalog(catalogId, "campaign");
```

---

## Why Current Approach is a Workaround

| Aspect | Current (Tags) | Proper (Junction Table) |
|--------|---|---|
| **Responsibility** | Frontend builds tags | Backend manages relationships |
| **Validation** | None - backend accepts any tags | Server-side constraints |
| **Integrity** | No foreign keys, can corrupt | UNIQUE constraints prevent dupes |
| **Deletion** | If catalog deleted, orphaned tags remain | Cascade delete works correctly |
| **Querying** | String matching on tags field | Simple SQL join |
| **Business Logic** | Scattered in frontend | Centralized in backend |
| **Tag Pollution** | Mixes real tags with catalog tags | Clean separation of concerns |

---

## Files Involved

### Frontend (Current Implementation)

**Building tags:**
- `src/shared/utils/catalogTags.ts` - `buildCatalogTag()`, `parseCatalogTag()`

**Assignment (AssignItemsModal):**
- `src/shared/components/AssignItemsModal.tsx` - Lines 650-695
  - Loops through selected items
  - For each item type, gets existing tags
  - Adds catalog tag to tags array
  - Calls `updateCampaign()` / `updateOffer()` / `updateProduct()` / `updateSegment()`

**Removal (useRemoveFromCatalog hook):**
- `src/shared/hooks/useRemoveFromCatalog.ts` - Lines 85-118
  - Checks if primary category
  - Filters out the catalog tag
  - Calls service update method

**Fetching items in catalog:**
- `src/features/campaigns/pages/CampaignCategoriesPage.tsx` - `handleViewCampaigns()`
  - Calls `campaignService.getCampaignsByCategory()`
  - Backend filters by category_id OR tag match

---

## Key Limitation: Primary Category Rule

**Rule:** An item can only be REMOVED from a catalog if it's not the PRIMARY catalog.

**Why:**
- Every item must have ONE primary category (`category_id` field)
- That primary category relationship is permanent until changed
- Tag-based assignments are removable
- But you cannot remove the primary category assignment via tags

**User Flow to Remove from Primary Catalog:**
1. User clicks "Remove" on primary catalog item
2. System detects it's primary → shows warning modal
3. Modal says: "Change the item's primary category before removing"
4. User must go to item details page
5. Edit the item → change primary category to something else
6. Then come back and remove from original catalog

---

## Data Example

```javascript
// Campaign assigned to 3 catalogs (IDs: 2, 5, 10)
// Primary category is catalog 2

Campaign {
  id: 48,
  name: "Spring Sale",
  category_id: 2,                           // ← PRIMARY catalog
  tags: [
    "promotional",
    "seasonal",
    "catalog:2",                            // ← Assigned (redundant with primary)
    "catalog:5",                            // ← Assigned
    "catalog:10"                            // ← Assigned
  ]
}

// Can be removed from catalogs 5 & 10 easily
// Cannot be removed from catalog 2 until primary category is changed
// If removed from 2, it must be removed from tag array AND category_id changed
```

---

## TODO: Backend Implementation Needed

- [ ] Create `catalogs_items` (or `catalogs_campaigns`, etc.) junction tables
- [ ] Implement `/catalogs/{id}/assign` endpoint (bulk)
- [ ] Implement `/catalogs/{id}/remove` endpoint (bulk)
- [ ] Implement `/catalogs/{id}/items` GET endpoint (with pagination)
- [ ] Add server-side validation for primary category rules
- [ ] Add cascade delete when catalog is deleted
- [ ] Deprecate tag-based catalog assignments (migration period)
