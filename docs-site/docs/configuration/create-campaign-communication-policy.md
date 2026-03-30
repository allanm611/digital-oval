# Create Campaign Communication Policy

## Overview

Create a new Campaign Communication Policy to define rules for how and when your campaigns can communicate with customers. Policies control timing, frequency, and special handling of messages across all communication channels.

## How to Create a Policy

### Step 1: Open the Creation Form

1. Navigate to **Configuration → Campaign Communication Policy**
2. Click the **Create Policy** button (top right)
3. A modal dialog opens with the policy creation form

### Step 2: Basic Policy Information

#### Policy Name (Required)
- **Field Type:** Text input
- **Max Length:** 100 characters
- **Description:** Unique name for the policy
- **Examples:**
  - "Standard Business Hours Policy"
  - "VIP Customer Premium Policy"
  - "Compliance Policy - GDPR"

#### Description (Optional)
- **Field Type:** Text area
- **Max Length:** 500 characters
- **Description:** Explain the policy's purpose
- **Examples:**
  - "Send messages only between 9 AM and 6 PM"
  - "Priority delivery for VIP customers with enhanced frequency limits"

#### Status
- **Options:** Active / Inactive
- **Default:** Active
- **Note:** Can be toggled after creation

### Step 3: Select Communication Channels

Choose which channels this policy applies to:

- **SMS** - Text message restrictions
- **Email** - Email communication rules
- **USSD** - USSD protocol messaging
- **Push** - Mobile push notifications

You can select multiple channels. Each selected channel inherits the policy rules.

### Step 4: Configure Policy Rules

#### Time Window Configuration
- **Enabled:** Toggle on/off
- **Start Time:** When messages can begin (e.g., 08:00 AM)
- **End Time:** When messages must stop (e.g., 10:00 PM)
- **Purpose:** Prevents messages outside business/quiet hours

#### Maximum Communication Configuration
- **Enabled:** Toggle on/off
- **Frequency Type:**
  - Per Hour (e.g., max 2 messages/hour)
  - Per Day (e.g., max 5 messages/day)
  - Per Week (e.g., max 20 messages/week)
- **Maximum Count:** The limit for selected frequency
- **Purpose:** Controls message frequency to prevent overwhelming customers

#### DND (Do Not Disturb) Configuration
- **Enabled:** Toggle on/off
- **DND Categories:** Select applicable categories
  - Marketing
  - Promotional
  - Transactional
  - Urgent
- **Purpose:** Respects customer preferences and regulations

#### VIP List Configuration
- **Enabled:** Toggle on/off
- **Action:**
  - Priority Delivery (send immediately)
  - Standard Delivery (follow normal schedule)
- **Priority Level:** 1-5 (1 = highest priority)
- **Purpose:** Special handling for high-value customers

### Step 5: Save the Policy

1. Review all configured rules
2. Click the **Save** or **Create** button
3. System validates:
   - Policy name is unique
   - Required fields are filled
   - At least one channel is selected
4. Upon success:
   - Confirmation message appears
   - Modal closes
   - Policy appears in the list

## Validation Rules

- **Policy name is required** - Cannot create without a name
- **Policy name must be unique** - No duplicate names allowed
- **At least one channel required** - Must select SMS, Email, USSD, or Push
- **Character limits:**
  - Name: Maximum 100 characters
  - Description: Maximum 500 characters

## Configuration Tips

### Time Window Strategy
- Set start/end times based on customer time zones
- Consider business hours for transactional messages
- Use relaxed windows for urgent/critical messages

### Frequency Limits Strategy
- Per Day: Best for promotional messages
- Per Week: Good for engagement campaigns
- Per Hour: Suitable for time-sensitive alerts

### DND Compliance
- Always enable DND for marketing messages
- Transactional messages may bypass DND
- Document your DND strategy

### VIP Handling
- Use Priority Delivery for premium customers
- Set higher priority for retention campaigns
- Test VIP policies on small segments first

## Error Handling

Common error messages and solutions:

- **"Policy name is required"** - Enter a policy name
- **"Policy name already exists"** - Use a different name
- **"Select at least one channel"** - Check SMS, Email, USSD, or Push
- **"Invalid time format"** - Use HH:MM format (24-hour)
- **"Maximum count must be positive"** - Enter number > 0

## Next Steps

After creating a policy:
1. View it in the [Campaign Communication Policy list](./campaign-communication-policy-list)
2. [Edit the policy](./edit-campaign-communication-policy) to adjust rules
3. Use the policy when creating campaigns
4. Monitor campaign metrics to validate policy effectiveness

## Best Practices

- Create separate policies for different customer segments
- Document the business reason for each rule
- Test policies with pilot campaigns first
- Review policies quarterly or when regulations change
- Communicate policy changes to marketing teams
