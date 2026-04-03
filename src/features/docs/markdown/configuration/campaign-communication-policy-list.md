# Campaign Communication Policy

## Overview

Manage communication policies that control how and when customers are contacted in campaigns. Policies define frequency caps, opt-out rules, and channel preferences to ensure compliant and effective customer engagement.

## Communication Policy List

![Communication Policy List](/img/configuration/communicaitonpolicylist.png)

The policy list displays all configured communication policies with options to view, edit, and delete policies.

## Policy Types

Communication policies support multiple policy types to control different aspects of customer contact:

### 1. DND (Do Not Disturb) Policy

![DND Policy](/img/configuration/createpolicy-dnd.png)

Define quiet hours when customers should not receive communications:

- **Time Window** - Specify start and end times for DND periods
- **Days** - Select which days the DND applies (e.g., weekends, specific weekdays)
- **Channels** - Choose which communication channels are affected (SMS, Email, Push, etc.)
- **Override Option** - Allow urgent/priority messages to override DND settings

**Use Case:** Prevent late-night or early-morning messages to respect customer preferences.

### 2. Maximum Frequency Policy

![Maximum Frequency Policy](/img/configuration/createpolicy-maximum.png)

Set limits on how often customers receive communications:

- **Maximum Messages** - Define frequency cap (e.g., max 3 messages per week)
- **Time Period** - Set the rollover period (daily, weekly, monthly)
- **Channels** - Apply frequency cap to specific channels
- **Priority Handling** - Configure how priority/urgent messages interact with frequency caps

**Use Case:** Prevent message fatigue by limiting contact frequency.

### 3. VIP Policy

![VIP Policy](/img/configuration/createpolicy-vip.png)

Special handling for VIP customers:

- **VIP List Selection** - Choose VIP customer lists to apply special rules
- **Priority Treatment** - Bypass or modify frequency caps for VIP customers
- **Channel Preferences** - Define preferred channels for VIP communications
- **Timing** - Customize quiet hours for VIP customers

**Use Case:** Ensure high-value customers receive messages even during frequency cap restrictions.

## Creating a Communication Policy

### Steps

1. Click **Create Policy** button
2. Enter **Policy Name** - Unique identifier for the policy
3. Enter **Description** - Explain the policy purpose
4. Select **Policy Type** from dropdown

![Policy Type Selection](/img/configuration/createpolicy-policydropdown.png)

5. Configure type-specific settings (see Policy Types section above)
6. Define **Scope**:
   - Apply to all campaigns
   - Apply to specific campaign types
   - Apply to specific departments

![Create Policy Form](/img/configuration/createpolicy.png)

7. Click **Save** to create the policy

## Using Policies in Campaigns

Once created, communication policies are available when creating or editing campaigns:

**In Campaign Creation:**
- Select policy during campaign definition step
- The selected policy automatically enforces its rules during campaign execution
- Can be overridden with custom inline settings if needed

**In Campaign Edit:**
- Change the communication policy for existing campaigns
- Updates apply to future broadcasts within the campaign
- Previously sent broadcasts are not affected

## Policy Management

### View Policy Details

Click **View** (eye icon) to see:
- Policy configuration
- Associated campaigns using this policy
- Creation and modification history
- Policy status (active/inactive)

### Edit Policy

Click **Edit** (pencil icon) to:
- Update policy name and description
- Modify policy type settings
- Change scope (campaigns/departments)
- Enable/disable the policy

### Delete Policy

Click **Delete** (trash icon) to remove a policy:

**Warning:** Cannot delete a policy if it's currently assigned to active campaigns. You must:
1. Remove the policy from all campaigns first, OR
2. Reassign campaigns to a different policy
3. Then delete the policy

## Best Practices

1. **Segment-Specific Policies** - Create separate policies for different customer segments (VIP, high-frequency, opt-in only)
2. **Channel Alignment** - Ensure policy rules match your communication channels (some channels may have regulatory requirements)
3. **Testing** - Test policies in pilot campaigns before full rollout
4. **Compliance** - Use DND policies to respect local quiet hour regulations
5. **Review Regularly** - Monitor policy effectiveness and adjust frequency caps based on engagement metrics

## Next Steps

After configuring communication policies:
- [Create Campaign](/documentation/campaigns/create-campaign) — Launch campaigns with policies
- [Communication Channels](/documentation/configuration/communication-channels) — Configure delivery channels
- [Campaign Objectives](/documentation/configuration/campaign-objectives) — Define campaign goals
