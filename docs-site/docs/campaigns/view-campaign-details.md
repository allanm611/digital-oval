# View Campaign Details

## Overview

The Campaign Details page displays all information about a specific campaign including its configuration, performance metrics, and available actions. From this page, you can manage the campaign's lifecycle with various actions.

**Screenshot:**
[Insert screenshot of campaign details page]

---

## Campaign Information Section

The campaign details page shows:
- **Campaign Name & Description** - Full campaign details
- **Status** - Current campaign status (Draft, Pending Approval, Approved, Active, Paused, Archived)
- **Approval Status** - Approval state (Pending, Approved, Rejected)
- **Category** - Campaign category
- **Objective** - Campaign objective (Acquisition, Retention, etc.)
- **Dates** - Start and end dates
- **Budget** - Allocated budget (if set)

---

## Performance Metrics

View real-time campaign performance data:
- **Sent** - Total messages sent
- **Delivered** - Successfully delivered messages
- **Opened** - Messages opened by customers
- **Clicked** - Messages clicked
- **Converted** - Conversions attributed to campaign
- **Revenue** - Revenue generated

**Screenshot:**
[Insert screenshot of performance metrics]

---

## Action Buttons

Each campaign has an action menu (three dots) with the following options:

### Edit Campaign
**What it does:** Modify campaign details, audience, delivery flows, or schedule.

**When to use:** Before submission or while in draft status.

**Restrictions:** Some fields may be locked based on campaign status.

**Screenshot:**
[Insert screenshot of edit action]

---

### Pause Campaign
**What it does:** Temporarily stop an active campaign from sending messages.

**When to use:** When you need to halt a campaign temporarily.

**Status Change:** Active → Paused

**Screenshot:**
[Insert screenshot of pause action]

---

### Resume Campaign
**What it does:** Restart a paused campaign.

**When to use:** When you're ready to continue a paused campaign.

**Status Change:** Paused → Active

**Screenshot:**
[Insert screenshot of resume action]

---

### Approve Campaign
**What it does:** Approve a campaign pending approval.

**When to use:** As an approver, when campaign is ready to launch.

**Requirements:**
- Campaign must be in "Pending Approval" status
- You must have approval permissions
- Campaign must pass validation

**Confirmation:** Approval modal appears for confirmation.

**Screenshot:**
[Insert screenshot of approve modal]

---

### Reject Campaign
**What it does:** Reject a campaign pending approval.

**When to use:** When campaign needs revisions before approval.

**Requirements:**
- Campaign must be in "Pending Approval" status
- You must have approval permissions

**Note:** Provide a rejection reason for the campaign creator.

**Screenshot:**
[Insert screenshot of reject modal]

---

### Execute Campaign
**What it does:** Launch an approved campaign to start sending messages.

**When to use:** When campaign is approved and ready to go live.

**Requirements:**
- Campaign must be in "Approved" status
- Scheduling must be configured
- Audience must be selected

**Note:** Campaign begins sending according to its delivery flows and schedule.

**Confirmation:** Execute modal appears for final confirmation.

**Screenshot:**
[Insert screenshot of execute modal]

---

### Archive Campaign
**What it does:** Move campaign to archived state.

**When to use:** When campaign is complete and no longer active.

**Status Change:** Any status → Archived

**Note:** Archived campaigns can be viewed by filtering.

**Screenshot:**
[Insert screenshot of archived campaigns filter]

---

### Delete Campaign
**What it does:** Permanently remove campaign from system.

**When to use:** To remove draft or unwanted campaigns.

**Warning:** ⚠️ This action is irreversible. Deleted campaigns cannot be recovered.

**Confirmation Modal:** Requires confirmation before deletion.

**Typical Use:** Draft campaigns, test campaigns, or mistakes.

**Screenshot:**
[Insert screenshot of delete confirmation]

---

## Tabs & Sections

### Configuration Tab
View all campaign settings:
- Campaign definition
- Audience configuration
- Delivery flows
- Scheduling details

**Screenshot:**
[Insert screenshot of configuration tab]

### Performance Tab
Monitor campaign performance:
- Delivery metrics
- Engagement metrics
- Conversion data
- Revenue tracking

**Screenshot:**
[Insert screenshot of performance tab]

### History Tab
Track campaign changes:
- Approval history
- Status changes
- Execution logs
- Modification history

**Screenshot:**
[Insert screenshot of history tab]

---

## Approval Workflow

**Campaign Approval States:**
1. **Draft** - Creator completes campaign setup
2. **Pending Approval** - Campaign submitted for review
3. **Approved** - Approver approved the campaign
4. **Rejected** - Approver rejected, send back for changes

**Approval Process:**
1. Creator submits campaign
2. Approver receives notification
3. Approver reviews and approves/rejects
4. Creator notified of decision
5. If approved, campaign can be executed

---

## Editing a Campaign

### When You Can Edit
- ✅ Campaign is in Draft status
- ✅ Campaign is Paused
- ✅ Campaign is Rejected (to make requested changes)

### Restrictions
- ❌ Cannot edit while Active
- ❌ Some fields locked during execution
- ❌ Cannot edit Archived campaigns

---

## Related Pages

- Learn how to [Create Campaign](./create-campaign)
- View campaign performance on [Campaign Reports](./campaign-reports)
- Understand campaign [objectives](./campaign-objectives)
- Learn about [Campaign Broadcasts](./campaign-broadcasts)

---

## Tips & Best Practices

1. **Review Before Actions** - Always verify you're taking action on the correct campaign
2. **Check Approval Status** - Verify campaign status before attempting actions
3. **Monitor Performance** - Regularly check metrics to ensure campaign success
4. **Save Changes** - Always save edits before navigating away
5. **Archive Old Campaigns** - Keep your active list clean by archiving completed campaigns
6. **Use Approval Process** - Let approvers review before execution to catch errors

---

## Troubleshooting

### Can't Edit Campaign
- Verify campaign is not currently executing
- Check you have edit permissions
- Ensure campaign status allows editing

### Action Button Disabled
- Check your user permissions
- Verify campaign status meets action requirements
- Contact administrator if still locked

### Performance Data Not Showing
- Campaign may still be executing
- Data updates may be delayed
- Refresh the page to see latest metrics
