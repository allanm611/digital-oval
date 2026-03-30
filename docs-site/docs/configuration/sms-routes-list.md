# SMS Routes

## Overview

SMS Routes are specialized Communication Routes that handle SMS message delivery through SMS gateway providers. Each SMS Route connects your platform to an SMS provider that delivers text messages to mobile devices.

## What are SMS Routes?

SMS Routes configure:
- **SMS Gateway Providers** - Companies that send SMS messages
- **Sender IDs** - Who the SMS appears to be from
- **Delivery Configuration** - Message format and settings
- **Failover Routing** - Backup providers for reliability

## Default SMS Routes

Your system includes pre-configured SMS routes:

### Primary SMS Route
- **Name:** Effortel SMS Gateway
- **Provider:** Effortel
- **Status:** Active
- **Type:** SMS - Normal and SMS - Flash
- **Capacity:** High-volume SMS delivery

## Supported SMS Gateway Providers

### Popular Providers

**Effortel**
- **Coverage:** Africa and Global
- **Features:** SMS, OTP, Flash SMS
- **Integration:** HTTP/SMPP
- **Pricing:** Volume-based

**Twilio**
- **Coverage:** Global
- **Features:** SMS, MMS, Voice
- **Integration:** REST API
- **Pricing:** Pay-as-you-go

**AWS SNS**
- **Coverage:** Global
- **Features:** SMS, SNS
- **Integration:** AWS SDK
- **Pricing:** Pay-per-message

**Vonage (Nexmo)**
- **Coverage:** Global
- **Features:** SMS, Voice, Verify
- **Integration:** REST API
- **Pricing:** Per SMS

**Plivo**
- **Coverage:** Global
- **Features:** SMS, Voice, Messaging
- **Integration:** REST API
- **Pricing:** Tiered

## SMS Route Configuration

### Basic Settings
- **Route Name** - Unique identifier
- **Provider** - Gateway provider selection
- **Status** - Active or Inactive
- **Priority** - Failover priority level

### Provider Credentials
- **API Key** - Provider authentication
- **API Secret** - Secret credential
- **Account ID** - Provider account identifier
- **Endpoint** - Provider API endpoint

### SMS-Specific Settings
- **Sender IDs** - Associated sender identifiers
- **Character Encoding** - Unicode, GSM-7, etc.
- **Long Message Handling** - Concatenation options
- **Delivery Reports** - Status tracking

### Delivery Configuration
- **Rate Limits** - Messages per second
- **Retry Settings** - Failed message retry policy
- **Timeout** - Message delivery timeout

## SMS Route Operations

### View All SMS Routes
- Navigate to **Configuration → Routes**
- Filter for SMS routes
- [View SMS Routes List](./sms-routes)

### Create SMS Route
- [Create SMS Route](./create-sms-route)
- Configure provider credentials
- Set sender IDs
- Establish failover

### Edit SMS Route
- [Edit SMS Route](./edit-sms-route)
- Update credentials
- Modify configuration
- Adjust settings

### View SMS Route Details
- [View SMS Route](./view-sms-route)
- See full configuration
- Review performance metrics
- Check campaign usage

## SMS Type Routing

### SMS - Normal Route
- Standard SMS delivery
- Stores on customer device
- Supports replies
- Full character support

### SMS - Flash Route
- Display-only SMS
- No storage on device
- Immediate display
- Limited to 160 characters

Both types typically route through same provider but may use different API parameters.

## Sender IDs in SMS Routes

### What are Sender IDs?
- The name/number appearing in SMS
- Who the SMS appears to be from
- Customer-visible identifier
- Provider-specific format

### Sender ID Examples
- "COMPANY_NAME" (Alphanumeric)
- "12345" (Numeric)
- "+1234567890" (Phone number)

### SMS Route Sender ID Configuration
- Link sender IDs to SMS route
- Each route supports multiple sender IDs
- Select sender ID per campaign
- Provider approval often required

## SMS Delivery Reports

### What are Delivery Reports?
- Status updates from provider
- Confirms message delivered or failed
- Includes failure reasons
- Timestamp information

### Configuring Delivery Reports
- Enable in SMS route settings
- Webhook/Callback configuration
- Report parsing
- Status database updates

## Performance Metrics for SMS Routes

### Delivery Statistics
- Total SMS sent
- Successfully delivered
- Failed deliveries
- Pending messages

### Performance Indicators
- Delivery rate (%)
- Average delivery time
- Peak SMS/second throughput
- Provider latency

### Error Analysis
- Common failure reasons
- Error rate trends
- Time-of-day patterns
- Provider issues

## Best Practices for SMS Routes

### Route Configuration
- Create meaningful route names
- Document provider details
- Set appropriate priority
- Configure redundancy

### Provider Management
- Monitor provider status
- Keep credentials current
- Test connectivity regularly
- Have backup providers

### Sender ID Management
- Request necessary sender IDs
- Document approval status
- Track expiration dates
- Plan for renewals

### Monitoring & Maintenance
- Monitor delivery rates
- Review error logs
- Test failover regularly
- Update credentials as needed

## SMS Route Failover

### Failover Sequence
1. Try Primary SMS Route
2. If fails, try Secondary Route
3. Continue through chain
4. Guaranteed delivery

### Configuring Failover
- Set priority levels (1=highest)
- Test failover manually
- Monitor all routes
- Alert on failures

### Testing Failover
- Disable primary route
- Send test SMS
- Verify secondary route used
- Monitor for latency

## Troubleshooting SMS Routes

### SMS Not Delivering

**Check:**
1. Is route Active?
2. Is provider available?
3. Are credentials valid?
4. Is sender ID approved?

**Fix:**
1. Enable route if needed
2. Check provider status
3. Update credentials
4. Request/update sender ID

### High Failure Rate

**Check:**
1. Provider status page
2. Rate limit usage
3. Invalid phone numbers
4. Account balance

**Fix:**
1. Contact provider support
2. Reduce sending rate
3. Validate phone numbers
4. Top up account

### Slow SMS Delivery

**Check:**
1. Provider latency
2. Route load
3. Provider congestion
4. Network issues

**Fix:**
1. Use different provider
2. Load balance across routes
3. Optimize message size
4. Check network

## Related Documentation

### SMS Routes
- [SMS Routes Overview](./sms-routes) - SMS routing details
- [Create SMS Route](./create-sms-route) - Add SMS routes
- [Edit SMS Route](./edit-sms-route) - Modify SMS routes
- [View SMS Route](./view-sms-route) - SMS route details

### General Routes
- [Routes Overview](./routes) - All routes information
- [Routes List](./routes-list) - View all routes
- [Create Route](./create-route) - Add new routes
- [View Route](./view-route) - Route details

### Related Features
- [Communication Channels](../communication-channels-list) - SMS channels
- [Campaign Communication Policies](../campaign-communication-policy-list) - SMS policies
- [Sender IDs](../sender-ids) - SMS sender configuration
