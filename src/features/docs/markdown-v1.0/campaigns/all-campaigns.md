# All Campaigns

## Overview

The All Campaigns page is your central hub for managing all customer marketing campaigns. From here, you can create new campaigns, view existing ones, monitor their performance, and take actions such as pausing, resuming, approving, or archiving campaigns.

**Screenshot:**
[Insert screenshot of All Campaigns page]

## Key Features

- **Campaign List** - View all campaigns with their status, objective, and key metrics
- **Search & Filter** - Find campaigns quickly using search and advanced filters
- **Status Monitoring** - Track campaigns at a glance with status indicators
- **Bulk Actions** - Perform actions on multiple campaigns simultaneously
- **Campaign Analytics** - View performance metrics (sent, delivered, opened, converted)


## Action Buttons Explained

Each campaign in the list has an action menu (three dots) with the following options:

### View Campaign
**What it does:** Opens the campaign details page where you can see all campaign information, performance metrics, and execution history.

**When to use:** When you need to review campaign details, see performance data, or check approval status.

**Screenshot:**
[Insert screenshot of campaign details page]


### Edit Campaign
**What it does:** Allows you to modify campaign details such as name, description, objectives, segments, offers, delivery flows, and scheduling.

**When to use:** When you need to make changes to a campaign before it's ran.

**Note:** Some campaigns may have restrictions on editing based on their current status or approval state.

**Screenshot:**
[Insert screenshot of edit campaign form]


### Pause Campaign
**What it does:** Temporarily stops an active campaign from running or sending messages.

**When to use:** When you want to halt a campaign temporarily without deleting it (e.g., to make adjustments, pause during off-hours, or stop due to unforeseen circumstances).

**Status Change:** Campaign status changes from "Active" to "Paused"

**Screenshot:**
[Insert screenshot of pause action]


### Resume Campaign
**What it does:** Restarts a paused campaign so it continues running.

**When to use:** When you're ready to resume a campaign that was previously paused.

**Status Change:** Campaign status changes from "Paused" to "Active"

**Screenshot:**
[Insert screenshot of resume action]


### Approve Campaign
**What it does:** Approves a campaign that is pending approval before it can be ran.

**When to use:** When you have permission to approve campaigns and the campaign is ready to launch after review.

**Requirements:**
- Campaign must be in "Pending Approval" status
- You must have approval permissions
- Campaign must pass validation checks

**Note:** An approval modal may appear asking for confirmation.

**Screenshot:**
[Insert screenshot of approve campaign modal]


### Reject Campaign
**What it does:** Rejects a campaign that is pending approval, sending it back for revisions.

**When to use:** When a campaign needs changes before it can be approved.

**Requirements:**
- Campaign must be in "Pending Approval" status
- You must have approval permissions

**Note:** A rejection reason can be provided to the campaign creator.

**Screenshot:**
[Insert screenshot of reject campaign modal]


### Run Campaign
**What it does:** Immediately launches an approved campaign to send messages to the target audience.

**When to use:** When a campaign is approved and ready to go live.

**Requirements:**
- Campaign must be in "Approved" status
- Campaign scheduling must be configured
- Audience segments must be selected

**Note:** Once ran, the campaign begins sending messages according to its delivery flows and scheduling configuration.

**Screenshot:**
[Insert screenshot of Run campaign modal]


### Archive Campaign
**What it does:** Moves a campaign to an archived state, removing it from the active list.

**When to use:** When a campaign is complete and you want to keep it for historical records but don't want it cluttering your active list.

**Status Change:** Campaign status changes to "Archived"

**Note:** Archived campaigns can still be viewed by filtering the list.

**Screenshot:**
[Insert screenshot of archived campaigns filter]


### Delete Campaign
**What it does:** Permanently removes a campaign from the system.

**When to use:** When you want to permanently remove a campaign (typically draft campaigns or campaigns that were created by mistake).

**Warning:** This action is irreversible. Deleted campaigns cannot be recovered.

**Confirmation:** A confirmation modal will appear before deletion.

**Screenshot:**
[Insert screenshot of delete confirmation modal]


## Search & Filter

### Search Bar
**Use the search bar** to quickly find campaigns by name, description, or campaign code.

**Screenshot:**
[Insert screenshot of search bar in action]

### Advanced Filters

Click the **Filter** icon to access advanced filtering options:

- **Category** - Filter campaigns by category
- **Approval Status** - Filter by approval status (Pending, Approved, Rejected)
- **Date Range** - Filter campaigns by start or end date

**Screenshot:**
[Insert screenshot of advanced filters panel]


## Campaign Status Explained

- **Draft** - Campaign is being created and not yet submitted for approval
- **Pending Approval** - Campaign is waiting for approval before it can be ran
- **Approved** - Campaign has been approved and is ready to Run
- **Paused** - Campaign is temporarily stopped
- **Active** - Campaign is currently running and sending messages
- **Archived** - Campaign is complete and archived
- **Rejected** - Campaign was rejected during approval process


## Creating a New Campaign

### How to Start

Click the **+ Create Campaign** button in the top right corner of the page.

**Screenshot:**
[Insert screenshot of create button location]

### Campaign Creation Flow

The campaign creation process consists of **5 steps**:

#### Step 1: Definition
**What you'll do:**
- Enter campaign name and description
- Select campaign objective (Acquisition, Retention, Churn Prevention, Upsell/Cross-sell, Reactivation)
- Select campaign category
- Set budget (if applicable)

**Screenshot:**
[Insert screenshot of definition step]

#### Step 2: Audience
**What you'll do:**
- Select target segments for the campaign
- Configure segment-to-offer mappings
- Set up control groups (optional)

**Screenshot:**
[Insert screenshot of audience configuration step]

#### Step 3: Delivery Flows
**What you'll do:**
- Define how messages will be delivered to customers
- Configure delivery channels (Email, SMS, Push, etc.)
- Set up flow conditions and triggers
- Map offers to segments

**Screenshot:**
[Insert screenshot of delivery flows step]

#### Step 4: Scheduling
**What you'll do:**
- Set campaign start date and time
- Set campaign end date (if applicable)
- Configure execution schedule (immediate, scheduled, recurring)
- Timezone selection

**Screenshot:**
[Insert screenshot of scheduling step]

#### Step 5: Preview & Launch
**What you'll do:**
- Review all campaign details
- Verify segment counts and offer mappings
- Check delivery flow configuration
- Submit for approval or save as draft

**Screenshot:**
[Insert screenshot of preview step]

### Saving Progress

- **Draft** - Save as draft to continue later (progress is auto-saved)
- **Submit for Approval** - Submit the campaign for approval (only when ready)


## Tips & Best Practices

1. **Use Meaningful Names** - Give campaigns clear, descriptive names for easy identification
2. **Set Campaign Categories** - Properly categorize campaigns for better organization
3. **Review Before Submitting** - Always review all details in the Preview step before submitting
4. **Test First** - Consider using a small segment to test before launching to the full audience
5. **Monitor Performance** - Check campaign analytics regularly to measure success
6. **Archive Completed Campaigns** - Keep your list organized by archiving old campaigns
7. **Use Control Groups** - Include control groups to measure true campaign impact


## Troubleshooting

### Campaign Won't Run
- Verify the campaign is in "Approved" status
- Check that segments and offers are properly configured
- Ensure scheduling is set correctly
- Verify you have the required permissions

### Can't Delete Campaign
- Some campaigns may be locked during execution
- Wait until the campaign is complete before deleting
- Check your user permissions

### Need to Make Changes
- If a campaign is in draft or paused state, use the Edit button
- If approved, you may need to reject and resubmit
- Contact your administrator if changes are blocked

