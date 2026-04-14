# Tags Patterns Across Application

## Two Different Tag Types Mixed in Same Array ⚠️

### 1. User-Created Tags (Free-Form)
**Purpose:** Custom labels users add to items for categorization  
**Examples:** "premium", "seasonal", "promotional", "featured", "exclusive"

**Where used:**
- Products: Created in ProductForm (lines 741-776) via comma-separated input
- Segments: Added in SegmentDetailsPage (lines 1549-1589) via "Add Tag" button
- Campaigns: Field exists but no visible UI for adding in CreateCampaignPage

**How it works:**
```javascript
// User types "premium, seasonal"
// System stores as: ["premium", "seasonal"]

// When user adds a tag in Details page:
handleAddTag = () => {
  const updatedTags = [...existing.tags, newTag.toLowerCase()];
  await updateSegment({ tags: updatedTags });
}
```

### 2. System-Generated Catalog Tags
**Purpose:** Track which catalogs an item is assigned to  
**Format:** `catalog:{catalogId}`  
**Examples:** `catalog:5`, `catalog:123`

**Where used:**
- Automatically added when assigning items to catalogs via AssignItemsModal
- Automatically removed when removing items from catalogs via CatalogItemsModal

**How it works:**
```javascript
// User assigns item to catalog 5
// System adds: "catalog:5"

// Item's tags array becomes:
// ["premium", "seasonal", "catalog:5"]
```

---

## The Problem: Tags Array Mixing Two Concerns

### Current Structure
```javascript
Product {
  id: 48,
  name: "Premium Coffee",
  tags: [
    "premium",           // ← User tag
    "seasonal",          // ← User tag
    "featured",          // ← User tag
    "catalog:2",         // ← System catalog tag
    "catalog:5"          // ← System catalog tag
  ]
}
```

**Issues:**
1. **Semantic mixing** - Business tags mixed with system tags in same array
2. **No separation of concerns** - Frontend can't easily distinguish which are user tags vs catalog tags
3. **Parsing confusion** - Need to check every tag for `catalog:` prefix to parse properly
4. **UI confusion** - User tags and catalog tags displayed the same way in tag lists
5. **Deletion risk** - When removing a catalog tag, must not accidentally remove user tags
6. **Duplication** - Catalog 2 appears in both `category_id` field AND as `catalog:2` tag

---

## What SHOULD Exist (Proper Design)

### Proper Data Structure
```javascript
Product {
  id: 48,
  name: "Premium Coffee",
  
  // User-created tags
  tags: ["premium", "seasonal", "featured"],
  
  // System-managed catalog assignment
  category_id: 2,  // Primary catalog
  catalog_assignments: [2, 5],  // Other catalogs (OR via junction table)
}
```

### Or with Junction Table:
```sql
-- Products table
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR,
  tags JSON  -- ["premium", "seasonal", "featured"]
  category_id INT,  -- Primary catalog
  ...
);

-- Catalog assignments (proper relationship)
CREATE TABLE catalogs_products (
  catalog_id INT,
  product_id INT,
  PRIMARY KEY (catalog_id, product_id),
  FOREIGN KEY (catalog_id) REFERENCES catalogs(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## Current Implementation by Feature

| Feature | User Tags | Catalog Tags | UI for Adding Tags |
|---------|-----------|---|----|
| **Products** | ✅ Yes | ✅ Via `catalog:X` in same array | ProductForm (creation) |
| **Segments** | ✅ Yes | ✅ Via `catalog:X` in same array | SegmentDetailsPage ("Add Tag" button) |
| **Campaigns** | ❓ Field exists | ✅ Via `catalog:X` in same array | NO visible UI |
| **Offers** | ❌ No | ✅ Via `catalog:X` in same array | NO visible UI |

---

## How Frontend Currently Handles Mixed Tags

### Adding Catalog Tag (AssignItemsModal)
```javascript
const existingTags = item.tags ?? [];  // ["premium", "seasonal"]
const catalogTag = buildCatalogTag(5);  // "catalog:5"
const updatedTags = Array.from(new Set([...existingTags, catalogTag]));
// Result: ["premium", "seasonal", "catalog:5"]

await updateItem({ tags: updatedTags });
```

### Removing Catalog Tag (useRemoveFromCatalog)
```javascript
const catalogTag = buildCatalogTag(5);  // "catalog:5"
const updatedTags = item.tags.filter(tag => tag !== catalogTag);
// Result: ["premium", "seasonal"]  ← User tags preserved

await updateItem({ tags: updatedTags });
```

### Parsing Catalog Tags (catalogTags.ts)
```javascript
const catalogTag = tag.startsWith("catalog:") ? parseCatalogTag(tag) : null;
// If it's "catalog:5" → returns 5
// If it's "premium" → returns null
```

### Filtering in UI (Example: SegmentDetailsPage)
```javascript
// Shows ALL tags to user, no distinction
segment.tags.map(tag => (
  <div>{tag}</div>  // Shows "premium", "seasonal", AND "catalog:5"
))
```

---

## The Right Way: Separate Concerns

```typescript
// Should be:
interface Product {
  id: number;
  name: string;
  description: string;
  
  // User-created tags (searchable metadata)
  tags: string[];  // ["premium", "seasonal"]
  
  // System-managed catalog relationships
  category_id: number;  // Primary catalog
  // catalogs: number[];  // OR
  // catalog_assignments: CatalogAssignment[];  // With timestamps
}

// NOT mixed together
```

---

## Recommendations

1. **Separate the two concerns** - User tags ≠ Catalog assignments
2. **Use proper data structures** - Junction tables for catalog relationships
3. **Update UI accordingly** - Don't show catalog tags to users in tag lists
4. **Deprecate tag-based catalog assignments** - Move to proper endpoints
5. **When filtering/searching** - Only search user tags, not catalog tags
