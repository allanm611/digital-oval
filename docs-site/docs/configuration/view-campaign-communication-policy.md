# View Campaign Communication Policy Details

## Overview

View complete details of a Campaign Communication Policy including all configured rules, channels, and settings. This page allows you to understand exactly how a policy governs customer communications.

## How to View Policy Details

### From the List View
1. Navigate to **Configuration → Campaign Communication Policy**
2. Click on any policy name in the table
3. The details page opens showing all policy information

### From Search Results
1. Use the search field to find a policy
2. Click on the matching policy name
3. Details page loads with complete information

## Policy Details Page

### Basic Information Section

**Policy Name**
- The unique identifier for the policy
- Used when assigning policies to campaigns

**Description**
- Detailed explanation of the policy's purpose
- Helps team members understand when to use this policy

**Status Badge**
- Green "Active" badge - Policy is currently enforced
- Blue "Inactive" badge - Policy exists but is not applied

**Created/Updated Dates**
- When the policy was created
- When it was last modified

### Channels Configuration

Shows which communication channels this policy applies to:

- **SMS** - Text message rules
- **Email** - Email communication rules
- **USSD** - USSD protocol rules
- **Push** - Mobile push notification rules

Each channel inherits the configured rules.

### Policy Rules Section

#### Time Window Rule
If configured, displays:
- **Status:** Enabled/Disabled
- **Start Time:** When messages can begin (e.g., 08:00 AM)
- **End Time:** When messages must stop (e.g., 10:00 PM)
- **Behavior:** Messages outside this window are queued or skipped

#### Maximum Communication Rule
If configured, displays:
- **Status:** Enabled/Disabled
- **Type:** Per Hour / Per Day / Per Week
- **Limit:** The maximum count (e.g., 5 messages per day)
- **Enforcement:** Hard limit - excess messages are rejected

#### DND (Do Not Disturb) Rule
If configured, displays:
- **Status:** Enabled/Disabled
- **Categories:** Which types of messages are affected
  - Marketing messages
  - Promotional messages
  - Transactional messages
  - Urgent messages
- **Enforcement:** Skips messages for customers who opted into DND

#### VIP List Rule
If configured, displays:
- **Status:** Enabled/Disabled
- **Action:** Priority Delivery or Standard Delivery
- **Priority Level:** Numeric priority (1-5)
- **Effect:** Special handling for VIP customers

### Campaign Usage

Shows which campaigns currently use this policy:
- Lists campaign names that reference this policy
- Helps identify impact of policy changes

## Available Actions

### Edit Policy
- Click **Edit** button to modify policy rules
- Opens the edit form with current settings
- See [Edit Campaign Communication Policy](./edit-campaign-communication-policy)

### Delete Policy
- Click **Delete** button to remove the policy
- Confirmation dialog appears
- Cannot delete if policy is in use by active campaigns
- Permanent action once confirmed

### Back to List
- Returns to the Campaign Communication Policy list
- Any viewed information is not saved as draft

## Understanding Policy Impact

### Message Routing
When a campaign uses a policy, messages follow these rules:
1. Check Time Window - message in allowed hours?
2. Check Frequency - customer under limit?
3. Check DND - customer opted out?
4. Apply VIP Rules - special handling needed?
5. Send or queue message based on results

### Policy Conflicts
- If multiple rules conflict, the most restrictive rule applies
- Time Window blocks everything outside hours
- Frequency limits hard-cap messages
- DND completely prevents message delivery

## Common Scenarios

### Reviewing a Time-Based Policy
1. View the policy details
2. Check the Start Time and End Time
3. Verify they match business requirements
4. Note any exceptions needed

### Checking Compliance Policy
1. View the policy details
2. Confirm DND categories are enabled
3. Verify all required categories are included
4. Review channels to ensure coverage

### Analyzing VIP Policy
1. View policy details
2. Check VIP action (Priority vs Standard)
3. Review Priority Level setting
4. Understand impact on delivery speed

## Related Documentation

- [Campaign Communication Policy List](./campaign-communication-policy-list) - View all policies
- [Create Campaign Communication Policy](./create-campaign-communication-policy) - Add new policy
- [Edit Campaign Communication Policy](./edit-campaign-communication-policy) - Modify existing policy
