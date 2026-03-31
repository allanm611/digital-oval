# Campaign Catalog

## Overview

Campaign Catalogs are organizational structures that group and organize campaigns by category. The Campaign Catalog page displays all catalogs in your system, with summary statistics and management tools for each catalog.

**Screenshot:**
[Insert screenshot of campaign catalogs page]


## Summary Statistics

The Campaign Catalog page displays key metrics at the top:

- **Total Catalogs** - Total number of catalogs in your system
- **Active Catalogs** - Number of catalogs currently active
- **Inactive Catalogs** - Number of deactivated catalogs
- **Catalogs with Campaigns** - Number of catalogs that have campaigns assigned
- **Unused Catalogs** - Catalogs with no campaigns
- **Most Popular Catalog** - The catalog with the most campaigns assigned


## Catalog Cards

Each catalog is displayed as a card showing:

- **Catalog Name** - The name of the catalog
- **Description** - Brief description of the catalog's purpose
- **Campaign Count** - Number of campaigns in this catalog
- **Status** - Whether the catalog is active or inactive


## Catalog Actions

### Create Catalog

Click **Create** button to add a new catalog:

1. Enter **Campaign Catalog Name** (required, max 64 characters)
2. Enter **Description** (optional, max 500 characters)
3. Click **Create Category**

The new catalog is created and appears in the list.

### Edit Catalog

Click the **Edit** button on any catalog card:

1. Update the name and/or description
2. Click **Update Category** to save changes
3. Changes are saved immediately

### Delete Catalog

Click the **Delete** button on any catalog card:

1. Confirm the deletion in the confirmation modal
2. Catalog is permanently removed
3. Campaigns assigned to this catalog are not deleted

### Toggle Active Status

Click the **Power** button (activate/deactivate) on any catalog card:

- **Activated** - Catalog is available for use
- **Deactivated** - Catalog is disabled but catalogs are preserved


## View Campaigns in Catalog

Click the **View Campaigns** button on any catalog card to open a modal showing all campaigns assigned to this catalog.

**[Insert screenshot of View Campaigns modal]**

### Campaigns Modal

The modal displays:

**Header**
- Title showing catalog name (e.g., "Campaigns in Finance")
- Count of campaigns in this catalog

**Search and Filters**
- **Search** field to find campaigns by name or description
- **Status filter** dropdown with options: All Statuses, Active, Draft, Pending Approval, Approved, Paused, Completed, Cancelled

**Campaign List**
Each campaign shows:
- Campaign name
- Description
- Status badge (color-coded based on campaign status)
- **View** button - Opens the campaign details page
- **Remove** button - Removes the campaign from this catalog

**Empty State**
If no campaigns are assigned to the catalog, a message appears suggesting to create a new campaign or assign an existing one.

### Remove Campaigns from Catalog

In the View Campaigns modal, click the **Remove** button next to a campaign to unassign it from the catalog. The campaign itself is not deleted, only its association with the catalog is removed.


## Add Campaigns to Catalog

In the View Campaigns modal, click the **Add campaigns to this catalog** button at the bottom to assign campaigns to the catalog.

**[Insert screenshot of Add Campaigns button in modal]**

### Assign Campaigns Modal

When you click "Add campaigns to this catalog", an assignment modal opens displaying all available campaigns in your system.

**[Insert screenshot of Assign Campaigns modal]**

**Header**
- Title showing "Assign Campaigns to [catalog name]"
- Instructions to select campaigns to assign

**Search and Filters**
- **Search** field to find campaigns by name or description
- **Status filter** dropdown with options: All Statuses, Active, Draft, Pending Approval, Approved, Paused, Completed, Cancelled

**Campaign Table**
Displays all campaigns in a table with the following columns:

- **Checkbox** (Select All column)
  - Click to select/deselect individual campaigns
  - "Select All" checkbox in the header selects all available campaigns
  - **Campaigns already assigned to this catalog appear grayed out** with an "Already in catalog" badge and cannot be selected

- **Name** - Campaign name (click to select unassigned campaigns)

- **Description** - Campaign description (hidden on smaller screens)

- **Status** - Color-coded status badge

- **Created At** - Date the campaign was created (hidden on extra-large screens and smaller)

- **Actions**
  - For campaigns already in catalog: **Remove** button to unassign them
  - For campaigns not in catalog: Empty (selection is via checkbox)

**Empty State**
If no campaigns are available, a message appears.

**Selection and Assignment**
- At the top right, a counter shows "X campaigns selected"
- The **Assign Selected** button becomes active only when you have selected at least one campaign
- Click **Assign Selected** to add the selected campaigns to this catalog
- A success message confirms the assignment, and the modal refreshes to show updated assignments

**Removing Campaigns from Catalog**
In the Assign Campaigns modal, campaigns already in the catalog show a **Remove** button in the Actions column. Click this button to unassign the campaign from the catalog (without deleting the campaign itself).


## Search and Filter

Use the **Search** field to find catalogs by:
- Catalog name
- Catalog description

## View Modes

Switch between **Grid** and **List** views using the view toggle buttons at the top right.
