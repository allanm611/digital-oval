# Communication Routes

## Overview

Communication Routes establish the connection between your messaging channels (SMS, Email, USSD, Push) and external gateway providers that actually deliver messages to customers. Each route maps a channel to a specific provider with credentials and configuration.

## Routes List

Navigate to **Configuration → Routes** to manage all communication routes.

![Routes List](/img/v1.1/configuration/routeslist.png)

The routes list displays all configured routes with:
- **Route Name** - Unique identifier for the route
- **Channel** - Communication channel (SMS, Email, USSD, Push)
- **Provider** - External gateway provider (Effortel, Twilio, etc.)
- **Priority** - Route priority in failover sequence (1 = highest)
- **Status** - Active or Inactive badge
- **Actions** - Edit or Delete buttons

<!-- ## How Routes Work

The delivery pipeline:

1. A campaign sends a message through a communication channel
2. The system selects a route based on channel and policy
3. Message is formatted according to the provider's requirements
4. Provider receives the message via the route's credentials
5. Provider delivers the message to the customer
6. Delivery status is reported back through the route
7. System updates the message status (delivered, failed, bounced, etc.) -->

## Route Priorities & Failover

**Primary Route (Priority 1)**
- Handles all messages by default
- Highest priority in failover sequence
- Used for normal message delivery
- Should be your most reliable provider

**Backup Routes (Priority 2+)**
- Used only if primary route fails
- Automatic failover to next highest priority
- Ensures message delivery reliability
- Can be lower-cost or overflow routes

<!-- Example failover sequence:
1. Try Primary Route (Priority 1) - if fails
2. Try Secondary Route (Priority 2) - if fails
3. Try Tertiary Route (Priority 3) - etc. -->

## Creating a Communication Route

### Steps

1. Click **Create Route** button in the top right

![Create Route Button](/img/v1.1/configuration/routeslist.png)

2. **Enter Route Information:**
   - **Route Name** - Unique identifier (e.g., "Effortel SMS Primary", "Twilio Backup")
   - **Channel** - Select which channel this route handles (SMS, Email, USSD, Push)
   - **Provider** - Select the gateway provider 

![Create Communication Route Part 1](/img/v1.1/configuration/createcommunicationrouteimage1.png)

<!-- 3. **Configure Provider Credentials:**
   - Provider-specific fields based on selected provider
   - **API Key / Account ID** - Authentication credentials
   - **API Secret / Password** - Secure credentials
   - **Endpoint URL** - Provider API endpoint (if required)
   - Additional provider-specific settings -->

![Create Communication Route Part 2](/img/v1.1/configuration/createcommunicationrouteimage2.png)

<!-- 4. **Set Route Priority:**
   - **Priority** - Numeric priority (1 = highest, 2 = secondary failover, etc.)
   - Lower numbers take precedence in failover
   - Assign priorities based on provider reliability -->

<!-- 5. **Set Route Status:**
   - Check **Active** to enable the route immediately
   - Uncheck to keep it inactive until testing is complete -->

3. Click **Create** to save the route

<!-- ![Create Route Form](/img/v1.1/configuration/createroute.png) -->

## Editing a Route

To modify an existing route:

1. Click **Edit** (pencil icon) on the route row
2. The edit modal opens with current route configuration
3. Modify any fields:
   - Route Name
   - Provider credentials
   <!-- - Priority
   - Active status -->
4. Click **Save** to apply changes

![Edit Communication Route](/img/v1.1/configuration/editcommunicationroute.png)

<!-- **Note:** Changes apply immediately. If the route is actively being used, the system will use updated credentials for new messages. -->

## Deleting a Route

To remove a route:

1. Click **Delete** (trash icon) on the route row
2. Confirm deletion in the modal

<!-- **Warning:** Cannot delete a route that is currently active or assigned to campaigns. You must:
1. Make the route Inactive first
2. Remove it from any active campaigns or campaign policies
3. Then delete the route

If a primary route is deleted, failover routes will automatically become the primary. -->

<!-- ## Route Management Best Practices

1. **Prioritize Reliability** - Assign Priority 1 to your most reliable provider
2. **Test Credentials** - Verify provider credentials work before activating
3. **Monitor Provider Status** - Keep inactive routes for emergency backup
4. **Region-Specific Routes** - Create separate routes for different regions if needed
5. **Rate Limiting** - Understand provider rate limits and set accordingly
6. **Cost Optimization** - Use backup routes with lower-cost providers for failover
7. **Failover Coverage** - Always have at least one backup route per critical channel
8. **Documentation** - Keep notes about provider SLAs and support contacts -->

