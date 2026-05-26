# Offer Catalogs

## Overview

Offer Catalogs organize offers into categories for easier management and organization. Catalogs help you group related offers together and manage them as a collection.

![Offer Catalogs List](/img/v1.1/configuration/offercataloglist.png)

## Summary Statistics

The Offer Catalogs page displays key metrics at the top in five stat cards:

- **Total Categories** - Total number of offer catalogs in the system
- **Active** - Number of currently active catalogs
- **Inactive** - Number of inactive catalogs
- **With Offers** - Number of catalogs that contain offers
- **Unused** - Number of catalogs that have no offers assigned

## Catalog Cards

Catalogs are displayed as cards in a grid or list view with the following information:

**Grid View:**

- Catalog name
- Description (if provided)
- Number of offers in the catalog (with active count)
- Performance metrics (Revenue and Conversion Rate, if applicable)
- Action buttons (View Offers, Toggle Active, Edit, Delete)

**List View:**

- Catalog name and description
- Number of offers with active count
- Performance metrics in a side-by-side layout
- View Offers link
- Action buttons (Toggle Active, Edit, Delete)

## Catalog Actions

### Create Catalog

Click the **Create** button to open the create catalog modal:

- **Catalog Name\*** (required) - Descriptive name for your catalog
- **Description** (optional) - Additional details about the catalog

![Create Offer Catalog](/img/v1.1/configuration/createoffercatalog.png)

### Edit Catalog

Click the **Edit** button (pencil icon) on any catalog card to modify:

- Catalog name
- Catalog description

### Toggle Active Status

Click the power icon on any catalog card to enable or disable it:

- **Power On icon (green)** - Catalog is inactive, click to activate
- **Power Off icon (orange)** - Catalog is active, click to deactivate

### Delete Catalog

Click the **Delete** button (trash icon) to permanently remove a catalog. You will be asked to confirm the deletion.

## View Offers in Catalog

Click the **View Offers** button on any catalog card to open the View Offers modal. This modal displays:

- All offers assigned to this catalog
- Offer name and description
- Offer status badge (Active, Draft, Paused, etc.)
- Option to remove offers from the catalog individually

![View Offers in Catalog](/img/v1.1/configuration/viewoffersinacatalog.png)

## Add Offers to Catalog

Click the **Add Offers** action button within the View Offers modal to open the Add Offers to Catalog modal.

![Assign Offers to Catalog](/img/v1.1/configuration/assignofferstoacatalog.png)

**Search and Filters:**

- **Search** - Find offers by name or description
- **Status Filter** - Filter by offer status (All Statuses, Active, Draft, Paused, Expired, Archived)
- **Type Filter** - Filter by offer type (All Types, Data, Voice, SMS, Combo, Voucher, Loyalty, Discount, Bundle, Bonus, Other)

**Offer Selection:**

- Click the checkbox next to any offer to select it
- Click **Select All** to select all available offers at once
- The selection counter shows how many offers you've selected

**Assignment:**

- Click the **Assign Selected** button to add the selected offers to this catalog
- Already assigned offers appear dimmed and cannot be selected again
- A success message appears when offers are assigned

## Search and Filters

### Search

Use the **Search** field to find catalogs by:

- Catalog name
- Catalog description

### Advanced Filters

Click the **Filters** button to access filtering options:

- **Unused Categories** - Show only catalogs with no offers
- **Popular Categories** - Show only the most frequently used catalogs
- **Active Categories** - Show only active catalogs
- **Inactive Categories** - Show only inactive catalogs

### View Mode

Toggle between:

- **Grid View** - Cards displayed in a grid layout
- **List View** - Catalogs displayed in a list with full details

## Managing Catalog Contents

Each catalog card shows the total number of offers, including the count of active offers. Click **View Offers** to:

- See all offers in that catalog
- Remove offers individually (if they are not the primary category)
- Add more offers using the Add Offers modal
