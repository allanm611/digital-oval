# SMS Routes

## Overview

SMS Routes is a configuration page used to manage SMS gateway route records in the app.

The page lets you:

- View SMS routes in a table
- Search SMS routes by name or description
- Create an SMS route
- Edit an SMS route
- Delete an SMS route

---

## Accessing SMS Routes

**Navigation:** Dashboard -> Configuration -> SMS Routes

From the main Configuration page, SMS Routes appears under **Offer Configuration**.

---

## SMS Routes List Page

The SMS Routes page includes:

### Header

- Page title: **SMS Routes**
- Page description explaining that routes determine which gateway provider is used to send SMS messages
- **Create** button

### Search

- A search input with the placeholder **Search routes...**
- Search filters the list by:
  - Route name
  - Description

### Table Columns

The list table shows these columns:

- **SMS route**
- **Description**
- **Status**
- **Gateway Provider**
- **Actions**

### Status Display

Each row shows one of these statuses:

- **Active**
- **Inactive**

### Row Actions

Each row provides:

- **Edit** button
- **Delete** button

---

## Creating an SMS Route

Click **Create** to open the SMS route modal.

**Modal title:** Create New SMS Route

### Visible Fields

**Route Name**

- Required
- Text input

**Description**

- Optional
- Multi-line text area

**Gateway Provider**

- Text input

### Modal Actions

- **Cancel** closes the modal without saving
- **Save** submits the SMS route

---

## Editing an SMS Route

Click the **Edit** button in the list to open the edit modal.

**Modal title:** Edit SMS Route

The edit modal uses the same visible fields as the create modal:

- Route Name
- Description
- Gateway Provider

---

## Deleting an SMS Route

Click the **Delete** button in the Actions column.

A confirmation modal appears with:

- Title: **Delete SMS Route**
- A message warning that deleting the item may affect SMS delivery

If deletion succeeds, the app shows a success message.

---

## Empty State

If there are no SMS routes and no search term is entered, the page shows an empty state with a prompt to create the first SMS route.

If a search returns no results, the page shows a no-results message.

Fill in the following fields:

1. **Name** (Required)
   - Enter a descriptive route name
   - Example: "Effortel Primary Route"

2. **Provider** (Required)
   - Select SMS gateway provider
   - Example: Effortel, Twilio, Vonage
   - Choose based on coverage and cost

3. **API Endpoint** (Required)
   - Enter provider's API URL
   - Example: `https://api.effortel.com/sms/send`
   - Verify with provider documentation

4. **API Credentials** (Required)
   - Enter authentication credentials
   - Type varies by provider (API Key, Token, Username/Password)
   - Keep credentials secure

**Step 3: Configure Route Settings**

1. **Route Priority** (Required)
   - Set failover order
   - Primary route: Priority 1
   - Secondary route: Priority 2
   - Backup route: Priority 3

2. **Rate Limit** (Required)
   - Set maximum messages per second
   - Check provider's limits
   - Example: 100 msgs/sec

3. **Coverage Area** (Optional)
   - Specify regions served
   - Example: "Africa", "Global", "Europe"
   - Helps with route selection

4. **Description** (Optional)
   - Add notes about route purpose
   - Example: "Primary route for bulk campaigns"

**Step 4: Test Configuration**

- System tests provider connection
- Validates API credentials
- Confirms endpoint is reachable
- Reports any configuration errors

**Step 5: Save**

- Click "Create SMS Route" button
- Route becomes available for use
- Set to Active status automatically

### Validation Rules

**Name:**

- 1-255 characters
- Must be unique
- Alphanumeric and underscores

**API Endpoint:**

- Valid URL format required
- Must start with https:// or http://
- Endpoint must be reachable

**API Credentials:**

- Format varies by provider
- Must be valid and active
- Tested on save

**Route Priority:**

- Numeric value (1-999)
- No duplicates allowed
- Lower numbers = higher priority

---

## Managing SMS Routes

### Viewing SMS Routes

**SMS Routes List**

- Access main SMS Routes page
- View all configured routes
- See: Name, Provider, Priority, Status, Rate Limit, Coverage
- Filter by provider, status, or coverage

**Route Details**

- Click route name to view full configuration
- See API endpoint and credentials (masked)
- View performance metrics
- Check campaigns using route

**Filtering &amp; Search**

- Filter by provider (Effortel, Twilio, etc.)
- Filter by status (Active/Inactive)
- Filter by coverage area
- Search by route name

### Editing SMS Routes

**Update Existing Route**

1. Locate the SMS route in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Name can be changed freely
   - Provider cannot be changed (recreate if needed)
   - API credentials can be updated
   - Priority can be changed
   - Status can be toggled
4. Click "Save" to update

**What Can Be Changed:**

- Name (display name)
- API Credentials (authentication)
- Route Priority (failover order)
- Status (Active/Inactive)
- Rate Limit
- Coverage Area
- Description

**What Cannot Be Changed:**

- Provider (recreate route if needed)
- API Endpoint (must match provider)

### Changing Route Status

**Deactivate Route**

- Set status to "Inactive"
- Route skipped in failover chain
- Useful for maintenance
- Can be reactivated when ready

**Reactivate Route**

- Set status to "Active"
- Route available for failover
- Takes effect immediately

### Deleting SMS Routes

**Delete Route**

1. Locate the SMS route in the list
2. Click the "Delete" action button
3. Confirm deletion in dialog
4. Route removed from system

**Deletion Rules:**

- Can only delete inactive routes
- Active routes must be deactivated first
- Cannot delete if campaigns depend on it
- Historical data retained

**Before Deleting:**

- Ensure route not in use
- Reassign any campaigns using it
- Backup configuration if needed
- Consider deactivating instead

---

## Using SMS Routes in Campaigns

### Assigning Routes to Campaigns

**During Campaign Creation**

1. Select SMS as channel
2. Choose SMS type (Normal or Flash)
3. System selects route automatically OR
4. Manually select preferred route
5. Route applies to all SMS sends

**During Campaign Editing**

- Change route if needed
- Effective for next send
- Different campaigns can use different routes

### SMS Route Selection Guidelines

**For Primary Route:**

- Choose most reliable provider
- Verify coverage for target market
- Monitor performance metrics
- Test thoroughly

**For Backup Routes:**

- Choose provider with good coverage
- Can prioritize cost over speed
- Should cover same regions as primary
- Test failover regularly

**By Region:**

- Use region-specific providers
- Example: Effortel for Africa, Twilio for Global
- Optimize for local regulations
- Consider local carrier relationships

**By Cost:**

- Compare provider pricing
- Route high-volume to cheapest provider
- Use premium for important messages
- Track costs per route

---

## Best Practices

### SMS Route Configuration

**Clear Naming**

- Use descriptive route names
- Include provider and priority
- Examples: "Effortel Primary", "Twilio Backup", "Africa Route"
- Avoid vague names like "SMS 1" or "Route"

**Redundancy Setup**

- Configure at least 2 routes (Primary &amp; Backup)
- Stagger providers for true redundancy
- Test failover regularly
- Monitor all routes for health

**Performance Optimization**

- Monitor delivery rates per route
- Compare provider performance
- Load balance across routes if needed
- Adjust priorities based on performance

### Provider Management

**Credential Security**

- Store credentials securely
- Rotate API keys periodically
- Limit access to configuration
- Audit credential usage

**Provider Relationships**

- Maintain accounts with 2+ providers
- Document account details
- Track billing and contracts
- Regular performance reviews

**Rate Limits**

- Set realistic rate limits
- Match provider capacity
- Monitor actual throughput
- Adjust if hitting limits

### Monitoring &amp; Maintenance

**Health Monitoring**

- Monitor delivery success rates
- Track failed message counts
- Alert on failures
- Review logs regularly

**Testing**

- Test new routes before production
- Test failover quarterly
- Verify credentials remain valid
- Send test messages monthly

**Documentation**

- Document route purposes
- Keep provider contact info
- Record performance baselines
- Maintain configuration history

---

## Common Use Cases

### Use Case 1: Regional SMS Delivery

**Scenario:** Company with customers across different regions

**SMS Routes Created:**

- `effortel_africa` (Priority 1) - Effortel for Africa
- `twilio_global` (Priority 2) - Twilio as backup
- `plivo_budget` (Priority 3) - Plivo for cost control

**Routing Logic:**

- Primary: Use Effortel for African numbers
- Secondary: Fail over to Twilio globally
- Tertiary: Use Plivo if both fail

**Benefit:** Optimized cost and delivery for each region

### Use Case 2: High-Reliability Setup

**Scenario:** Enterprise requiring 99\. 99% delivery reliability

**SMS Routes Created:**

- `vonage_primary` (Priority 1) - Vonage enterprise
- `twilio_secondary` (Priority 2) - Twilio backup
- `plivo_tertiary` (Priority 3) - Plivo failover

**Configuration:**

- Each route independently maintained
- All routes tested monthly
- Alerts set for any failures
- Automatic failover enabled

**Benefit:** Guaranteed delivery even with provider outages

### Use Case 3: Cost-Optimized Setup

**Scenario:** High-volume SMS with cost constraints

**SMS Routes Created:**

- `plivo_primary` (Priority 1) - Budget provider
- `twilio_secondary` (Priority 2) - Reliable backup

**Strategy:**

- Route 90% to Plivo (cheapest)
- Route 10% to Twilio (reliability margin)
- Monitor Plivo success rate
- Switch if success &lt; 95%

**Benefit:** 30-40% cost savings with minimal reliability impact

### Use Case 4: Multi-Channel Campaign

**Scenario:** Omnichannel campaign with SMS component

**SMS Routes:**

- All SMS (Normal &amp; Flash) use same route
- Route selected per campaign
- Can change between campaigns

**Example Campaign Flow:**

- Email via email sender
- SMS via SMS route
- Push via push provider
- All coordinated in single campaign

**Benefit:** Consistent messaging across channels

---

## Troubleshooting

### SMS Messages Not Delivering

**Check Route Status**

- Go to SMS Routes list
- Verify route status is Active
- Inactive routes are skipped
- Activate if needed

**Verify Credentials**

- Edit route and check credentials
- Test with provider's test tool
- Ask provider to verify account
- Regenerate API keys if needed

**Check Provider Status**

- Contact provider support
- Verify account is active
- Check for rate limit issues
- Review provider status page

**Review Error Logs**

- Check system error logs
- Look for provider error messages
- Contact support with error details
- Test with test numbers

### High Message Failure Rate

**Check Provider Capacity**

- Verify rate limit isn't exceeded
- Contact provider for capacity increase
- Consider load balancing
- Switch to higher-capacity provider

**Validate Phone Numbers**

- Ensure numbers are valid format
- Check for international format issues
- Verify numbers are active
- Remove invalid numbers

**Verify Sender ID**

- Check sender ID is approved
- Verify registration status
- Request new sender ID if needed
- Test with approved sender

**Monitor Provider Health**

- Check provider status page
- Review delivery reports
- Contact provider support
- Consider switching providers

### Slow SMS Delivery

**Check Network**

- Verify internet connectivity
- Monitor network latency
- Check for network congestion
- Contact ISP if issues

**Load Balance Routes**

- If using multiple routes, balance load
- Don't overload single provider
- Distribute across providers
- Monitor balance regularly

**Contact Provider**

- Ask about network issues
- Request performance optimization
- Review regional congestion
- Consider upgrading service

**Switch Providers**

- Compare delivery times
- Switch to faster provider
- Test alternative providers
- Document performance

### Failover Not Working

**Verify Priority Order**

- Check route priorities (1, 2, 3, etc.)
- Ensure no duplicate priorities
- Verify secondary route is Active
- Test failover manually

**Check Secondary Route**

- Verify secondary route credentials valid
- Test secondary route independently
- Ensure sufficient rate limit
- Contact provider if issues

**Test Failover Process**

- Deactivate primary route
- Send test SMS
- Verify uses secondary
- Reactive primary route
- Monitor failover chain

**Review Logs**

- Check system logs for failover attempts
- Look for error messages
- Contact support with logs
- Test with debug enabled

---
