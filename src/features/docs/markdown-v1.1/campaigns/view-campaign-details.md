# View Campaign Details

## Overview

The Campaign Details page displays all information about a specific campaign including its configuration, performance metrics, and available actions. From this page, you can manage the campaign's lifecycle with various actions.


## Campaign Overview Header

At the top of the page, displays basic campaign identification:
- **Campaign Name** - The campaign's title
- **Campaign Code** - Unique system identifier
- **Status Badge** - Current execution status (Draft, Active, Paused, Completed, etc.)
- **Approval Status Badge** - Current approval state (Pending Approval, Approved, Rejected)


## Execution Metrics

Real-time metrics showing campaign performance during execution:

**Messages Sent**
- Total number of messages sent to customers
- Updated continuously during campaign run

**Failed**
- Number of messages that failed to send
- Click to view detailed failure reasons and logs

**Success Rate**
- Percentage of successfully sent messages
- Calculated as: (Messages Sent / Total Attempts) × 100%
- Click to see detailed success metrics

**Broadcasts**
- Shows completed vs. total broadcasts for the campaign
- Format: "X / Y" (completed / total)
- Click to view broadcast schedule and status

**Execution Time**
- Total time elapsed during campaign execution
- Displayed in seconds
- Helps monitor campaign duration

![Execution Metrics & Stat Cards](/img/campaign-images/campaigndetailsstatcards.png)


## Campaign Information Section

Comprehensive campaign details displayed in an organized grid:

**Campaign Definition:**
- **Name** - Campaign title
- **Code** - Unique system identifier
- **Status** - Current state (Draft, Active, Paused, Completed, Archived)
- **Approval Status** - Review state (Pending, Approved, Rejected)
- **Description** - Campaign purpose and details
- **Objective** - Goal (see [Campaign Objectives](/documentation/configuration/campaign-objectives))

**Audience & Targeting:**
- **Category** - Campaign category/catalog (see [Campaign Catalogs](/documentation/configuration/campaign-catalog))
- **Segments** - Number and names of target segments
- **Total Audience Size** - Sum of all segment members

**Timing & Duration:**
- **Start Date** - When campaign begins
- **End Date** - When campaign ends (if set)
- **Timezone** - Execution timezone
- **Recurrence** - If campaign runs on schedule (One-time, Daily, Weekly, Monthly)

**Configuration:**
- **Budget Allocated** - Total budget (if set)
- **Budget Utilized** - Amount spent so far
- **Control Group Size** - Percentage excluded for testing
- **Offers Assigned** - Number of offers in campaign

**Audit Trail:**
- **Created By** - User who created campaign
- **Created Date** - When campaign was created
- **Updated By** - User who last modified
- **Updated Date** - Last modification timestamp
- **Approved By** - User who approved (if applicable)
- **Approved Date** - When approval occurred

![Campaign Information Section](/img/campaign-images/campaigndetails-campindetailssection.png)

![Budget Information](/img/campaign-images/campaigndetails-budget.png)

![Offers by Segment](/img/campaign-images/campaigndetails-offersbysegment.png)


## Action Buttons

Each campaign has an action menu (three dots) with the following options:

### Edit Campaign
See [Edit Campaign](/documentation/campaigns/edit-campaign) for comprehensive information about editing campaigns.


### Pause Campaign
**What it does:** Temporarily stop an active campaign from sending messages.

**When to use:** When you need to halt a campaign temporarily.

**Status Change:** Active → Paused


### Resume Campaign
**What it does:** Restart a paused campaign.

**When to use:** When you're ready to continue a paused campaign.

**Status Change:** Paused → Active


### Approve Campaign
**What it does:** Approve a campaign pending approval.

**When to use:** As an approver, when campaign is ready to launch.

**Requirements:**
- Campaign must be in "Pending Approval" status
- You must have approval permissions
- Campaign must pass validation

**Confirmation:** Approval modal appears for confirmation.


### Reject Campaign
**What it does:** Reject a campaign pending approval.

**When to use:** When campaign needs revisions before approval.

**Requirements:**
- Campaign must be in "Pending Approval" status
- You must have approval permissions

**Note:** Provide a rejection reason for the campaign creator.


### Run Campaign
**What it does:** Launch an approved campaign to start sending messages.

**When to use:** When campaign is approved and ready to go live.

**Requirements:**
- Campaign must be in "Approved" status
- Scheduling must be configured
- Audience must be selected

**Note:** Campaign begins sending according to its offer configuration and schedule.

**Confirmation:** Run modal appears for final confirmation.

![Run Campaign Modal](/img/campaign-images/runcampaignmodal.png)


### Archive Campaign
**What it does:** Move campaign to archived state.

**When to use:** When campaign is complete and no longer active.

**Status Change:** Any status → Archived

**Note:** Archived campaigns can be viewed by filtering.


### Unarchive Campaign
**What it does:** Restore an archived campaign back to its previous active state.

**When to use:** When you need to reactivate a previously archived campaign.

**Status Change:** Archived → Active (or previous status)


### Delete Campaign
**What it does:** Permanently remove campaign from system.

**When to use:** To remove draft or unwanted campaigns.

**Typical Use:** Draft campaigns, test campaigns


## Sections Overview

The campaign details page displays several organized sections with all campaign information:

### Campaign Overview Section
Displays basic campaign identification and status:
- **Campaign Name** - Clickable title for editing
- **Campaign Code** - Unique system identifier
- **Status** - Current execution state (Draft, Active, Paused, Completed, Archived)
- **Approval Status** - Current approval state (Pending, Approved, Rejected)
- **Description** - Full campaign description and purpose
- **Objective** - Campaign goal 
- **Category** - Campaign catalog/category assignment
- **Tags** - Custom tags for organization
- **Program ID** - Associated program identifier

### Schedule & Timeline Section
Campaign execution timing and recurrence:
- **Start Date** - Campaign launch date
- **End Date** - Campaign end date (if set)
- **Timezone** - Execution timezone for all scheduled activities

![Schedule & Timeline](/img/campaign-images/campaigndetails-schedule&timeline.png)

### Targets & Performance Section
Campaign scope and performance targets:
- **Max Participants** - Maximum number of customers in campaign
- **Current Participants** - Current number of participating customers
- **Target Reach** - Intended audience size
- **Target Conversion Rate** - Expected conversion percentage
- **Target Revenue** - Expected revenue goal
- **Control Group Enabled** - Whether control group is active
- **Control Group Percentage** - Size of control group (if enabled)
- **Control Group UUID** - System identifier for control group tracking

### Audit Trail Section
Track campaign creation, updates, and approvals:
- **Created Date** - When campaign was created
- **Created By** - User who created the campaign
- **Updated Date** - Last modification timestamp
- **Updated By** - User who last modified the campaign
- **Approved Date** - When campaign was approved (if applicable)
- **Approved By** - User who approved the campaign

![Audit Trail](/img/campaign-images/campaigndetails-audittrail.png)


## Approval Workflow

### Campaign Approval States

Campaigns progress through defined approval states based on their lifecycle:

1. **Draft**
   - Initial state when campaign is created
   - Not yet submitted for review
   - Can be edited freely
   - Visible only to creator

2. **Pending Approval**
   - Campaign submitted for review
   - Awaiting approver decision
   - Cannot be edited until decision
   - Approvers notified of pending review

3. **Approved**
   - Campaign approved and ready to run
   - Cannot be edited directly
   - Can be paused/resumed if running
   - Can be run when approval_status = "approved"

4. **Rejected**
   - Campaign rejected by approver
   - Rejection reason provided to creator
   - Must return to Draft status for edits
   - Rejection reason displayed on details page

<!-- ### Approval Process Workflow

1. **Creator submits campaign** - Campaign moves from Draft → Pending Approval
2. **Approver receives notification** - Approver alerted to pending review
3. **Approver reviews details** - Reviews campaign configuration, audience, offers, and schedule
4. **Approver makes decision** - Approves or rejects the campaign
5. **Creator is notified** - Email/notification sent with decision
6. **If approved:** Campaign can be rund by authorized users
7. **If rejected:** Creator receives rejection reason and can edit to address concerns

### Viewing Approval Information

On the campaign details page, approval information is displayed in:
- **Approval Status Badge** - Shows current state (Pending, Approved, Rejected)
- **Rejection Reason** - Displayed if campaign was rejected (shows feedback from approver)
- **Approved Date & By** - Shows when and who approved the campaign (if approved) -->

<!-- ## Editing a Campaign

To edit a campaign, click the **three dots menu (⋯)** and select **Edit Campaign**. You'll be guided through the same 5-step campaign creation flow where you can modify any aspect of your campaign.

For detailed information about editing campaigns, field restrictions, and edit workflows, see [Edit Campaign](/documentation/campaigns/edit-campaign).


## Related Pages

- Learn how to [Create Campaign](/documentation/campaigns/create-campaign) - Complete 5-step campaign creation process
- Learn how to [Edit Campaign](/documentation/campaigns/edit-campaign) - Modify campaign details and configuration
- View campaign performance on [Campaign Reports](/documentation/reports/campaign-reports) - Detailed performance metrics and reports
- Understand campaign [objectives](/documentation/campaigns/campaign-objectives) - Campaign goal types and strategies
- View all campaigns on [Campaign List](/documentation/campaigns/campaigns-list) - Browse, search, and manage campaigns
- Learn about campaign [types and configurations](/documentation/campaigns/campaign-types) - Different campaign type structures


## Tips & Best Practices

1. **Review Before Execution** - Always verify campaign details are correct before running a campaign
2. **Check Status Badges** - Monitor both execution status and approval status to understand campaign state
3. **Monitor Performance Metrics** - Regularly check execution metrics (sent, failed, success rate) during campaign run
4. **Use Rejection Feedback** - When campaign is rejected, review the rejection reason and address all feedback before resubmission
5. **Track Audit Trail** - Use the Audit Trail section to verify who made changes and when
6. **Archive When Done** - Move completed campaigns to archived state to keep active list clean
7. **Test with Seed Lists** - Always test with seed lists before launching to full audience (done during creation)
8. **Control Group Analysis** - Review control group performance to measure true campaign impact vs. natural behavior


## Troubleshooting

### Edit Button is Grayed Out
**Possible Causes:**
- Campaign is currently active (running)
- Campaign has already completed
- Campaign has been archived
- You don't have `campaigns.edit` permission

**Solution:**
- Wait for campaign to pause/complete before editing
- Check your user permissions with administrator
- Unarchive campaign if needed (via action menu)

### Can't Execute Campaign
**Possible Causes:**
- Campaign approval_status is not "approved"
- Campaign is already running (status = "active")
- Campaign is_active = false (campaign has been deactivated)
- You don't have `campaigns.run` permission

**Solution:**
- Ensure campaign has been approved by an approver
- Check campaign status before attempting to run
- Activate campaign if it's been deactivated
- Request `campaigns.run` permission if denied

### Reject or Approve Buttons Not Available
**Possible Causes:**
- Campaign status is not "pending_approval"
- You don't have approval permissions (`campaigns.approve`)
- Another approver already made a decision

**Solution:**
- Check campaign approval status at top of page
- Request approval permissions from administrator
- Refresh page to see latest status

### Performance Metrics Show Zero
**Possible Causes:**
- Campaign has not started executing yet
- Campaign completed with zero audience
- Metrics data is still loading
- Control group excluded all participants

**Solution:**
- Wait for campaign to begin execution
- Check campaign start date and current time
- Refresh page to reload metrics
- Review audience configuration to ensure segments have members

### Rejection Reason Not Displaying
**Possible Causes:**
- Campaign has not been rejected
- Campaign was rejected but reason was not provided
- You're viewing an approved campaign

**Solution:**
- Check Approval Status badge - should show "Rejected"
- Contact approver for feedback if reason is missing
- Review campaign details against approval requirements

### Can't Delete Campaign
**Possible Causes:**
- Campaign is currently active/running
- You don't have `campaigns.delete` permission
- Campaign has execution history

**Solution:**
- Pause or complete campaign before deletion
- Request delete permission from administrator
- Archive instead of delete to preserve campaign history -->
