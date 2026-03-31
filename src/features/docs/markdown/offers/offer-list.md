# Offer List

## Overview

The Offer List page displays all offers in your system with summary statistics, search capabilities, filtering options, and management tools for each offer.

**[Insert screenshot of offer list page]**


## Summary Statistics

The Offer List page displays key metrics at the top in four stat cards:

- **Total Offers** - Total number of offers in your system
- **Active Offers** - Number of currently active offers
- **Expired Offers** - Number of offers past their expiration date
- **Draft** - Number of draft offers pending approval


## Search and Filtering

### Search

Use the **Search** field to find offers by:
- Offer name
- Offer description

### Filters

**Category Filter**
- Filter offers by their assigned category
- Option: "All Categories" (shows all offers regardless of category)

**Status Filter**
- All Status
- Draft
- Active
- Paused
- Expired
- Archived

**Advanced Filters**
- Click the **Filters** button to access additional filtering options


## Offers Table

The offers are displayed in a table with the following columns:

| Column | Description |
|--------|-------------|
| **Offer** | Offer name and description |
| **Category** | The category/catalog the offer belongs to |
| **Status** | Current status (Draft, Active, Paused, Expired, Archived) |
| **Approval** | Approval status (Pending, Approved, Rejected) |
| **Created** | Date the offer was created |
| **Actions** | Available management actions (View, Edit, Pause/Resume, Archive, Delete, etc.) |


## Action Buttons

Each offer row has an actions menu with available buttons based on the offer's status:

**View** - Opens the [Offer Details](./view-offer-details) page

**Edit** - Allows you to modify offer configuration (available based on status and permissions)

**Pause** - Temporarily disables the offer from being used in campaigns
- Available when: offer status is Active

**Resume/Activate** - Re-enables a paused offer
- Available when: offer status is Paused or approved but not yet active

**Submit for Approval** - Submit draft offer for review
- Available when: offer status is Draft

**Approve** - Approve a pending offer
- Available when: approval status is Pending and you have approval permissions

**Archive** - Move offer to archived state
- Available when: offer is no longer needed

**Delete** - Permanently remove the offer
- Available when: offer is in Draft status or has no campaign associations


## Pagination

Use the pagination controls at the bottom to navigate through offers if there are more than the displayed page size.


## Tips

- Use the search feature to quickly find offers by name
- Filter by status to focus on specific offer types (e.g., only Active offers)
- Check the Category filter to view offers organized by category
- Review expired offers and archive them to keep your list organized
- Use the Advanced Filters for more specific searches

