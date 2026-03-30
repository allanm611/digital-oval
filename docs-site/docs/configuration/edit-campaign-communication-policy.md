# Edit Campaign Communication Policy

## Overview

Modify an existing Campaign Communication Policy to update rules, channels, or settings. Changes apply to all new campaigns using this policy, and may affect ongoing campaigns.

## How to Edit a Policy

### Step 1: Open the Edit Form

#### From the List View
1. Navigate to **Configuration → Campaign Communication Policy**
2. Find the policy to edit
3. Click the **Edit** button (pencil icon) next to the policy
4. The edit modal opens with current settings pre-filled

#### From the Details View
1. Navigate to **Configuration → Campaign Communication Policy**
2. Click the policy name to view details
3. Click the **Edit** button on the details page
4. The edit modal opens

### Step 2: Update Policy Information

#### Policy Name
- **Field Type:** Text input (max 100 characters)
- **Current Value:** Shows existing name
- **To Update:**
  1. Click in the field
  2. Modify the name as needed
  3. Ensure uniqueness if changing

#### Description
- **Field Type:** Text area (max 500 characters)
- **Current Value:** Shows existing description
- **To Update:**
  1. Update the text
  2. Keep it clear and descriptive
  3. Can be left empty

#### Status
- **Field Type:** Active/Inactive toggle
- **Current Value:** Shows current status
- **To Update:**
  1. Toggle between Active/Inactive
  2. Active policies are enforced
  3. Inactive policies are archived but available

### Step 3: Update Communication Channels

Modify which channels this policy applies to:

- **SMS** - Toggle on/off
- **Email** - Toggle on/off
- **USSD** - Toggle on/off
- **Push** - Toggle on/off

**Important:** Ensure at least one channel remains selected.

### Step 4: Update Policy Rules

#### Time Window Configuration
- **Toggle:** Enable or disable this rule
- **Start Time:** Update when messages can begin
- **End Time:** Update when messages must stop
- **Example:** Change from "09:00-17:00" to "08:00-22:00"

#### Maximum Communication Configuration
- **Toggle:** Enable or disable this rule
- **Frequency Type:** Change between Per Hour / Per Day / Per Week
- **Maximum Count:** Update the limit value
- **Example:** Change from "5 per day" to "10 per day"

#### DND (Do Not Disturb) Configuration
- **Toggle:** Enable or disable this rule
- **Categories:** Add/remove DND categories
  - Marketing
  - Promotional
  - Transactional
  - Urgent
- **Example:** Add "Transactional" to existing categories

#### VIP List Configuration
- **Toggle:** Enable or disable this rule
- **Action:** Change between Priority Delivery / Standard Delivery
- **Priority Level:** Update priority (1-5)
- **Example:** Increase priority from 2 to 1

### Step 5: Save Changes

1. Review all modifications
2. Click the **Save** or **Update** button
3. System validates:
   - Name is unique
   - At least one channel selected
   - Valid configuration values
4. Upon success:
   - Confirmation message appears
   - Modal closes
   - List updates with changes

## Impact Analysis

### Before Making Changes

Consider the impact on:
1. **Active Campaigns** - Campaigns using this policy
2. **Message Flow** - How changes affect pending messages
3. **Customer Impact** - How changes affect customer experience
4. **Compliance** - How changes affect regulatory compliance

### Testing Changes

Recommended approach:
1. Note the original settings
2. Make changes
3. Test with a pilot campaign first
4. Monitor results
5. Roll out to all campaigns if successful

## Validation Rules

- **Name is required** - Cannot be empty
- **Name must be unique** - Cannot duplicate existing names
- **At least one channel** - Must have SMS, Email, USSD, or Push
- **Character limits:**
  - Name: Max 100 characters
  - Description: Max 500 characters
- **Time format:** Must be HH:MM (24-hour)
- **Numeric values:** Must be positive integers

## Common Edit Scenarios

### Relaxing Time Windows
**Scenario:** Need to send messages earlier in the day
- **Change:** Start time from 09:00 to 08:00
- **Effect:** Messages can begin at 8 AM instead of 9 AM
- **Impact:** May increase delivery to early risers

### Tightening Frequency Limits
**Scenario:** Customers complain about too many messages
- **Change:** From 10 to 5 messages per day
- **Effect:** Reduces message volume by 50%
- **Impact:** Better customer satisfaction, lower engagement

### Adding DND Categories
**Scenario:** Need GDPR compliance for specific message types
- **Change:** Add "Marketing" to DND categories
- **Effect:** Marketing messages skip opt-out customers
- **Impact:** Better legal compliance

### Promoting VIP Tier
**Scenario:** Want faster delivery for premium customers
- **Change:** Action from "Standard" to "Priority Delivery"
- **Effect:** VIP messages delivered immediately
- **Impact:** Better customer satisfaction for VIP segment

## Undo Changes

### Before Saving
- Click **Cancel** or close the modal
- All changes are discarded
- Original settings remain unchanged

### After Saving
- Changes are permanent immediately
- To revert:
  1. Edit the policy again
  2. Restore previous values
  3. Save again
- Keep documentation of changes for reference

## Error Handling

Common errors and solutions:

- **"Policy name is required"** - Ensure name field is not empty
- **"Policy name already exists"** - Choose a unique name
- **"Select at least one channel"** - Check at least one channel
- **"Invalid time format"** - Use HH:MM (e.g., 14:30)
- **"Maximum must be positive"** - Enter number greater than 0

## Best Practices

- Document the reason for changes
- Test changes on pilot campaigns first
- Notify team members of significant changes
- Keep version history of policy changes
- Review changed policies monthly
- Consider customer feedback when updating

## Related Documentation

- [Campaign Communication Policy List](./campaign-communication-policy-list) - View all policies
- [View Campaign Communication Policy](./view-campaign-communication-policy) - See detailed information
- [Create Campaign Communication Policy](./create-campaign-communication-policy) - Add new policy
