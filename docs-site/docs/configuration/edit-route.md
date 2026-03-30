# Edit Communication Route

## Overview

Modify an existing Communication Route to update provider credentials, configuration settings, or route properties. Changes may affect active message delivery and campaigns.

## How to Edit a Route

### Step 1: Open the Edit Form

#### From the List View
1. Navigate to **Configuration → Routes**
2. Find the route to edit
3. Click the **Edit** button (pencil icon) next to the route
4. The edit modal opens with current settings pre-filled

#### From the Details View
1. Navigate to **Configuration → Routes**
2. Click the route name to view details
3. Click the **Edit** button on the details page
4. The edit modal opens

### Step 2: Update Route Information

#### Route Name
- **Field Type:** Text input (max 100 characters)
- **Current Value:** Shows existing name
- **To Update:**
  1. Click in the field
  2. Modify the name as needed
  3. Ensure new name is unique

#### Route Description
- **Field Type:** Text area (max 500 characters)
- **Current Value:** Shows existing description
- **To Update:**
  1. Update the text
  2. Clarify purpose or configuration
  3. Document any important details

#### Status
- **Field Type:** Active/Inactive toggle
- **Current Value:** Shows current status
- **To Update:**
  1. Toggle between Active and Inactive
  2. Active: Route processes messages
  3. Inactive: Route archived, no new traffic

### Step 3: Update Provider Configuration

#### Gateway Provider
- **Field Type:** Text input or select
- **Current Value:** Shows existing provider
- **To Update:**
  1. Change provider if needed
  2. Verify new provider is configured
  3. Update credentials accordingly

#### Provider Credentials
- **API Key/Secret** - Update authentication tokens
- **Endpoint URL** - Modify provider API endpoint
- **Account Settings** - Update rate limits, regions
- **Advanced Settings** - Provider-specific options

**Important:** Changes to credentials take effect immediately and may affect in-flight messages.

### Step 4: Adjust Route Settings

#### Rate Limiting
- **Messages per Second** - Provider throughput limit
- **Daily Limit** - Maximum messages per 24 hours
- **Burst Capacity** - Peak throughput allowed

#### Retry Configuration
- **Max Retries** - Number of retry attempts
- **Retry Interval** - Wait time between attempts
- **Timeout** - Message delivery timeout

#### Priority & Load Balancing
- **Route Priority** - 1 (highest) to 10 (lowest)
- **Load Balancing Weight** - Percentage of traffic
- **Failover Order** - Position in backup sequence

### Step 5: Test Changes

Before saving:
1. Click **Test Connection** button
2. Verify connection to new/updated provider
3. Check for success message
4. Fix any issues
5. Retry until connection succeeds

### Step 6: Save Changes

1. Review all modifications
2. Verify test connection passed
3. Click the **Save** or **Update** button
4. System validates:
   - Route name is unique
   - Provider is configured
   - Credentials are valid
   - Connection test passed
5. Upon success:
   - Confirmation message appears
   - Modal closes
   - Changes take effect

## Impact Analysis

### Before Making Changes

Consider impact on:

**Active Campaigns**
- Campaigns currently using this route
- Message volume through route
- Criticality of delivery
- Message types (transactional vs. marketing)

**Provider Changes**
- Different provider capabilities
- Configuration compatibility
- Delivery speed implications
- Cost implications

**Credential Updates**
- Immediate effect on in-flight messages
- May cause temporary delivery delays
- Affects monitoring and alerts

### Planning Route Changes

**Recommended Approach:**
1. **Assess Current Usage**
   - Review active campaigns
   - Check message volume
   - Identify dependencies

2. **Plan Changes**
   - Schedule during maintenance window
   - Notify stakeholders
   - Prepare rollback plan
   - Test in staging if possible

3. **Make Changes**
   - Update one field at a time
   - Test after each change
   - Monitor delivery metrics
   - Track any impact

4. **Verify Impact**
   - Monitor delivery success rates
   - Check error logs
   - Review performance metrics
   - Confirm expected behavior

## Common Edit Scenarios

### Updating Provider Credentials
**Scenario:** Provider API key expires
- **Change:** Update API key in credentials
- **Effect:** New messages use updated credentials
- **Impact:** Prevents authentication errors
- **Testing:** Click "Test Connection" to verify

### Changing Rate Limits
**Scenario:** Provider allows higher throughput
- **Change:** Increase messages-per-second limit
- **Effect:** Route can process more messages
- **Impact:** Better throughput, potentially lower latency
- **Caution:** Verify provider can handle load

### Adjusting Route Priority
**Scenario:** Change which route handles primary traffic
- **Change:** Adjust priority level (e.g., 1 to 2)
- **Effect:** Traffic distribution changes
- **Impact:** Different provider handles primary load
- **Testing:** Monitor delivery across routes

### Enabling/Disabling Route
**Scenario:** Temporarily disable route for maintenance
- **Change:** Toggle status to Inactive
- **Effect:** New messages don't use this route
- **Impact:** Uses backup routes if available
- **Recovery:** Toggle back to Active when ready

### Adding Backup Route
**Scenario:** Convert primary route to backup
- **Change:** Adjust priority to lower position
- **Effect:** Becomes failover route
- **Impact:** Only used if primary routes fail
- **Documentation:** Update routing strategy

### Changing Provider
**Scenario:** Migrate from one provider to another
- **Change:** Update provider name and credentials
- **Effect:** Messages route to new provider
- **Impact:** Delivery characteristics may change
- **Planning:** Requires careful testing

## Validation Rules

- **Route name is required** - Cannot be empty
- **Route name must be unique** - No duplicate names
- **Provider is required** - Must specify provider
- **Valid credentials required** - Provider must be reachable
- **Character limits:**
  - Name: Maximum 100 characters
  - Description: Maximum 500 characters

## Testing Changes

### Provider Connectivity
1. Click **Test Connection** after changes
2. Verify success message appears
3. Fix any authentication errors
4. Retry until successful

### Message Delivery
After changes:
1. Send test message through route
2. Verify successful delivery
3. Check delivery logs
4. Monitor success rate

### Performance
Monitor after changes:
1. Check delivery times
2. Monitor success rates
3. Review error patterns
4. Compare with other routes

## Undo Changes

### Before Saving
- Click **Cancel** or close modal without saving
- All changes are discarded
- Original settings remain unchanged

### After Saving
- Changes are permanent immediately
- To revert:
  1. Edit the route again
  2. Restore previous values
  3. Save changes
  4. Re-test connection
- Keep documentation of all changes

## Error Handling

Common errors and solutions:

- **"Route name is required"** - Ensure name field is not empty
- **"Route name already exists"** - Choose a unique name
- **"Invalid credentials"** - Verify API keys and authentication
- **"Connection failed"** - Check provider status and credentials
- **"Name exceeds 100 characters"** - Shorten route name
- **"Provider not found"** - Verify provider name is correct

## Managing Multiple Routes

### Coordinating Changes
If editing multiple routes:
1. Make changes one at a time
2. Test each change
3. Monitor combined impact
4. Document all changes
5. Verify failover works

### Updating Provider Credentials
For all routes with same provider:
1. Update each route individually
2. Test connection for each
3. Stagger updates to avoid outage
4. Monitor delivery across routes

### Changing Provider Strategy
To migrate all routes to new provider:
1. Create new routes with new provider
2. Set with lower priority initially
3. Test thoroughly
4. Gradually increase priority
5. Remove old routes when ready

## Best Practices

### Documentation
- Document the reason for changes
- Keep version history
- Record implementation date
- Note any issues or observations

### Testing
- Test changes in non-production first
- Test connection before saving
- Verify with sample messages
- Monitor for side effects

### Scheduling
- Make changes during low-traffic times
- Notify team about major changes
- Have rollback plan ready
- Plan for potential downtime

### Monitoring
- Watch delivery metrics after changes
- Review error logs for issues
- Check provider performance
- Track success rates over time

## Related Documentation

### Route Management
- [Communication Routes List](./routes-list) - View all routes
- [Create Route](./create-route) - Add new routes
- [View Route](./view-route) - See detailed information

### SMS Specific
- [SMS Routes](./sms-routes) - SMS-specific routing
- [Edit SMS Route](./edit-sms-route) - Modify SMS routes

### Related Features
- [Communication Channels](../communication-channels-list) - Available channels
- [Campaign Communication Policies](../campaign-communication-policy-list) - Messaging policies
