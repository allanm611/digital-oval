# Campaign List

## Overview

View, search, and manage all your campaigns in one place. The Campaign List page displays all campaigns with their current status, key information, and quick actions.

## Stat Cards

At the top of the page, you'll see quick stats showing:
- **Total Campaigns** - All campaigns in the system
- **Active Campaigns** - Currently running campaigns
- **Draft** - Campaigns in progress
- **Pending Approval** - Campaigns waiting for approval

![Campaign List Overview](/img/v1.1/campaign-images/campaign-list.png)

## Campaign Table

The main table shows all campaigns with:
- **Campaign Name** - Name of the campaign
- **Category** - Campaign category or audience segment
- **Status** - Current status (Active, Draft, Paused, Approved, etc.)
- **Offers** - Number of offers included in the campaign
- **Segments** - Number of customer segments targeted
- **Performance** - Key metrics (Conversion rate, Revenue, etc.)
- **Actions** - Quick action buttons (View, Edit, Delete, etc.)

## Search & Filter

### Search by Name
Use the search bar to find campaigns by name.

### Filter Campaigns
Click the **Filters** button to filter by:
- **Status** - All Campaigns, Active, Paused, Completed, Draft, Archived
- **Catalog** - Filter by catalog
- **Approval Status** - Pending, Approved, etc.
- **Date Range** - Filter by start/end date

![Filter Modal](/img/v1.1/campaign-images/campaign-filterbyall.png)

![Filter by Status](/img/v1.1/campaign-images/campaign-filterbystatus.png)

## Page-Level Actions

At the top of the Campaign List page, you'll find:
- **Create Campaign** button - [Create a new campaign](/documentation/campaigns/create-campaign) (requires "create" permission)
- **Analytics** button - [View campaign analytics](/documentation/reports/campaign-reports)

## Quick Actions

Click the **More** button (three dots) on each campaign row to access actions. You can also click the **Eye icon** to [view campaign details](/documentation/campaigns/view-campaign-details). The available actions depend on your campaign's current status and approval status.

![Action Buttons](/img/v1.1/campaign-images/campaignlist-actionbuttons.png)

### Action Button Visibility

The actions available for each campaign vary based on its **Status** and **Approval Status**:

#### For Draft Campaigns (Status: Draft)
- **Request Approval** - Submit the campaign for approval review

#### For Pending Approval Campaigns (Status: Pending Approval)
- **Approve Campaign** - Approve the campaign to make it executable (requires "Approve" permission)
- **Reject Campaign** - Reject the campaign and return it to draft status (requires "Reject" permission)

#### For Approved & Active Campaigns (Status: Any, Approval Status: Approved, Is Active: Yes)
- **Execute Campaign** - Start running the campaign immediately (requires "Execute" permission)
- **Pause Campaign** - Pause a running campaign (shows only if status is not already paused)
- **Resume Campaign** - Resume a paused campaign (shows only if status is paused)

#### For Approved & Inactive Campaigns (Status: Any, Approval Status: Approved, Is Active: No)
- **Activate Campaign** - Activate a campaign to make it executable
- **Execute Campaign** - Start running the campaign (shows only if is_active is true)

#### For All Campaigns (Any Status)
These actions are always available regardless of campaign status:
- **[Edit Campaign](/documentation/campaigns/view-campaign-details)** - Modify campaign details at any point in the campaign lifecycle
- **Archive Campaign** - Archive the campaign when you no longer need it
- **Unarchive Campaign** - Restore an archived campaign back to active use (only visible for archived campaigns)
- **Delete Campaign** - Permanently delete the campaign (requires "Delete" permission)

### Campaign Status Reference


****Draft**** - Campaign is being created/edited - Request Approval, Edit, Archive, Delete


****Pending Approval**** - Campaign is waiting for approval - Approve, Reject, Edit, Archive, Delete


****Approved**** - Campaign has been approved - Execute, Pause/Resume, Edit, Archive, Delete


****Paused**** - Approved campaign is temporarily paused - Resume, Edit, Archive, Delete


****Active**** - Campaign is currently running - Pause, Edit, Archive, Delete


### Approval Status States


****Pending**** - Campaign is awaiting reviewer approval


****Approved**** - Campaign has been approved and can be rund


****Rejected**** - Campaign was rejected and returned to draft for edits


### Key Notes

- **Permission Requirements**: Some actions require specific user permissions (e.g., only users with "Approve" permission can approve campaigns)
- **Status Flow**: Campaigns flow from Draft → Pending Approval → Approved → can be paused/resumed → completed

