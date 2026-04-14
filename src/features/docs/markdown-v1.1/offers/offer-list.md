# Offer List

## Overview

The Offer List page displays all offers in the system with summary statistics, search capabilities, filtering options, and management tools for each offer.

![Offer List](/img/v1.1/offer-images/offerlist.png)

## Summary Statistics

The Offer List page displays key metrics at the top in four stat cards:

- **Total Offers** - Total number of offers in the system
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

![Offer List Filters](/img/v1.1/offer-images/offerslistfilter.png)

## Offers Table

The offers are displayed in a table with the following columns:

**Offer** - Offer name and description

**Category** - The category/catalog the offer belongs to

**Status** - Current status (Draft, Active, Paused, Expired, Archived)

**Approval** - Approval status (Pending, Approved, Rejected)

**Created** - Date the offer was created

**Actions** - Available management actions (View, Edit, Pause/Resume, Archive, Delete, etc.)

## Action Buttons

Each offer row has an actions menu with available buttons based on the offer's current status and approval state. Different combinations of buttons appear depending on where the offer is in its lifecycle.

### Available Actions by Status

**Draft Status**

- **Edit** - Modify offer details, products, creatives, tracking, rewards
- **Submit for Approval** - Send offer to approvers for review (moves to Pending Approval)
- **Delete** - Remove draft offer permanently

**Pending Approval Status**

- **View** - View offer details (read-only)
- **Approve** - Approve the offer (requires approval permissions, moves to Approved)
- **Reject** - Reject with feedback (returns to Draft with rejection reason)

**Approved Status**

- **Edit** - Modify offer details
- **Activate** - Make offer available for use in campaigns (moves to Active)
- **Archive** - Move to archived state without activating

**Active Status**

- **Edit** - Modify offer details
- **Pause** - Temporarily disable from new campaigns (moves to Paused)
- **Archive** - Move to archived state

**Paused Status**

- **Resume** - Re-enable offer for campaigns (moves back to Active)
- **Archive** - Move to archived state

**Expired Status**

- **View** - View offer details
- **Archive** - Move to archived state

**Archived Status**

- **View** - View offer details (read-only)
- **Unarchive** - Restore archived offer back to Approved or Active status

---

## Offer Status & Approval Flow

Offers progress through defined statuses and approval states:

### Status Workflow

**Draft**

- Initial state when offer is created
- Can be edited freely
- Must be submitted for approval before activation
- Can be deleted

**Pending Approval**

- Offer submitted for review
- Cannot be edited until approval decision
- Approvers review and approve/reject
- Cannot be used in campaigns

**Approved**

- Approval decision made (approved)
- Ready to activate
- Cannot be edited in this state
- Must be activated to use in campaigns

**Active**

- Offer is available for use in campaigns
- Can be paused or archived
- Can be edited (if permissions allow)

**Paused**

- Temporarily disabled
- Cannot be assigned to new campaigns
- Can be resumed to Active state
- Can be archived

**Expired**

- Offer end date has passed
- Cannot be used in new campaigns
- Can be archived for record-keeping

**Archived**

- Inactive and preserved for historical records
- Not available for use
- Read-only access
