# Campaign Communication Policy

## Overview

Manage communication policies that control how and when customers are contacted in campaigns. Policies allow you to configure time windows, frequency limits, Do Not Disturb (DND) rules, and VIP list handling in a single unified policy. Apply these policies to ensure compliant and effective customer engagement.

## Communication Policy List

Navigate to **Configuration → Campaign Communication Policy** to manage all policies.

![Communication Policy List](/img/v1.1/configuration/communicaitonpolicylist.png)

The policy list displays all configured communication policies with:
- **Policy Name** - Unique identifier
- **Channels** - Communication channels the policy applies to (SMS, Email, Push, etc.)
- **Configuration Summary** - Quick overview of policy settings
- **Status** - Active or Inactive badge
- **Actions** - Edit or Delete buttons


## Policy Types

Each communication policy configures up to 4 different policy types, all in one single modal. You can configure any combination of these types:

### 1. Time Window Policy

Define allowed time periods when customers can receive messages:

- **Start Time** - When the communication window opens (e.g., 09:00)
- **End Time** - When the communication window closes (e.g., 18:00)
- **Timezone** - Timezone for time calculations
- **Days of Week** - Select which days this window applies (Monday, Tuesday, etc.)

**Use Case:** Ensure messages are only sent during business hours or avoid weekends. For example, only send SMS between 9 AM and 6 PM on weekdays.

### 2. Maximum Communication Policy

Set frequency caps to limit how many messages customers receive:

- **Period Type** - Choose rollover period: Daily, Weekly, or Monthly
- **Maximum Count** - Maximum messages allowed in that period (e.g., max 5 per week)
- **Multiple Periods** - Configure limits for multiple periods (e.g., max 3/day AND max 15/week)

**Use Case:** Prevent message fatigue by limiting contact frequency. Example: "Max 3 messages per day but no more than 10 per week."

### 3. Do Not Disturb (DND) Policy

Manage customer preferences and restrictions by category:

- **Category Type** - Type of message being restricted (Marketing, Promotional, Transactional, etc.)
- **Value** - Whether that category is "Allowed" or "Not Allowed"
- **Multiple Categories** - Configure restrictions for multiple categories independently

**Use Case:** Respect customer opt-outs and preferences. Example: "Marketing and Promotional blocked, but Transactional messages allowed."

### 4. VIP List Policy

Special handling for high-value customers:

- **Action** - Include or Exclude VIP lists
- **Priority Level** - Priority ranking for VIP handling (1 = highest priority)

**Use Case:** Ensure VIP customers receive priority treatment. Example: "Include VIP list with priority 1 to bypass frequency caps for VIP members."


## Creating a Communication Policy

### Steps

1. Click **Create Policy** button in the top right

![Create Policy Button](/img/v1.1/configuration/communicaitonpolicylist.png)


![Create Policy Form](/img/v1.1/configuration/createpolicy.png)


2. **Enter Basic Information:**
   - **Policy Name** - Unique identifier for the policy (required)
   - **Description** - Explain the policy's purpose and scope
   - **Communication Channels** - Select one or more channels this policy applies to (Email, SMS, Push, etc.)

3. **Configure Policy Types** - Expand sections to configure any combination of:

#### Time Window Configuration

Click the **Time Window** section to expand:

![Policy Type Selection](/img/v1.1/configuration/createpolicy-policydropdown.png)

- Set **Start Time** (e.g., 09:00)
- Set **End Time** (e.g., 18:00)
- Select **Days of Week** (checkboxes for each day)

#### Maximum Communication Configuration

Click the **Maximum Communication** section to expand:

![Maximum Communication Policy](/img/v1.1/configuration/createpolicy-maximum.png)

- Click **Add Period** to add frequency limits
- For each period:
  - Select **Period Type**: Daily, Weekly, or Monthly
  - Enter **Maximum Count**: How many messages max in that period
  - Click trash icon to remove a period

Example configurations:
- Max 3 per day
- Max 10 per week
- Max 50 per month

#### Do Not Disturb Configuration

Click the **DND** section to expand:

![DND Policy](/img/v1.1/configuration/createpolicy-dnd.png)

- Click **Add Category** to add a preference restriction
- For each category:
  - Select **Type**: Marketing, Promotional, Transactional, etc.
  - Select **Value**: Allowed or Not Allowed
  - Click trash icon to remove a category

#### VIP List Configuration

Click the **VIP List** section to expand:

![VIP Policy](/img/v1.1/configuration/createpolicy-vip.png)

- Select **Action**: 
  - Include VIP List - VIP customers get special treatment
  - Exclude VIP List - VIP customers are excluded from this policy
- Enter **Priority**: Priority level (1 = highest)

4. **Set Policy Status**
   - Check **Active Policy** to enable the policy immediately
   - Uncheck to keep it inactive until ready to use

5. Click **Save** to create the policy



## Editing a Communication Policy

To modify an existing policy:

1. Click **Edit** (pencil icon) on the policy row
2. The modal opens with the current policy configuration
3. Modify any fields:
   - Policy Name and Description
   - Communication Channels
   - Policy Type configurations
   - Active status
4. Click **Save** to apply changes

<!-- **Note:** Changes apply immediately. If the policy is already assigned to campaigns, updates affect how those campaigns enforce the policy. -->


## Deleting a Communication Policy

To remove a policy:

1. Click **Delete** (trash icon) on the policy row
2. Confirm deletion in the modal

<!-- **Warning:** Cannot delete a policy that is currently assigned to active campaigns. You must:
1. Remove the policy from all campaigns first, OR
2. Reassign those campaigns to a different policy
3. Then delete the policy -->

<!-- 
## Policy Status

Each policy has an **Active/Inactive** status:

- **Active** - Policy is enabled and will be enforced when assigned to campaigns
- **Inactive** - Policy exists but is not applied to any campaigns

Toggle the Active checkbox when editing to enable or disable a policy. -->


## Using Policies in Campaigns

Once created, communication policies are available when:

**Creating a Campaign:**
- A campaign can be assigned ONE communication policy
- The policy's rules automatically apply during campaign execution
<!-- - All 4 policy types in the policy enforce together -->

<!-- **Editing a Campaign:**
- Change the assigned policy for existing campaigns
- Updates apply to future campaign actions
- Previously sent messages are not affected by policy changes -->

## Next Steps

After configuring communication policies:
- Create campaigns and assign policies during setup
- Configure individual Communication Channels for delivery
- Set up DND management to respect customer preferences
- Monitor campaign performance and policy effectiveness
