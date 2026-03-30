# SMS Routes Overview

SMS Routes are specialized Communication Routes that handle SMS (text message) delivery through external SMS gateway providers. They are the critical link between your messaging platform and mobile carriers worldwide.

## Why SMS Routes Matter

SMS Routes:
- **Enable SMS Delivery** - Connect to providers that send text messages
- **Ensure Redundancy** - Support failover to backup providers
- **Control Costs** - Route to cheapest viable provider
- **Optimize Performance** - Balance load across providers
- **Maintain Reliability** - Guarantee message delivery

## How SMS Routes Work

### SMS Delivery Pipeline

```
Campaign with SMS
        ↓
SMS Channel (SMS - Normal or Flash)
        ↓
SMS Route Selection (Primary, Secondary, Backup)
        ↓
SMS Gateway Provider (Effortel, Twilio, AWS, etc.)
        ↓
Telecom Network
        ↓
Customer's Mobile Device
        ↓
Delivery Report (Success/Failure)
```

## SMS Route Components

### Provider Configuration
- **Gateway Provider** - Company sending the SMS
- **API Credentials** - Authentication tokens
- **API Endpoint** - Provider's API URL
- **Account Settings** - Region, rate limits

### SMS Settings
- **Sender IDs** - Who SMS appears to be from
- **Character Encoding** - Unicode, GSM-7, etc.
- **Message Handling** - Concatenate long messages
- **Delivery Reports** - Track delivery status

### Route Settings
- **Route Name** - Unique identifier
- **Priority** - Failover order (1=highest)
- **Status** - Active or Inactive
- **Rate Limits** - Messages per second

## SMS Route Providers

### Available Providers

**Premium Providers (High Reliability)**
- **Effortel** - Africa focused, high reliability
- **Twilio** - Global, feature-rich
- **Vonage** - Enterprise grade
- **AWS SNS** - Cloud-based, scalable

**Budget Providers (Cost-Effective)**
- **Plivo** - Affordable, global
- **Bandwidth** - US-focused
- **Custom SMPP** - Direct provider connections

## Default SMS Routes

Your system includes:

### Effortel SMS Gateway (Primary)
- **Provider:** Effortel
- **Coverage:** Africa and Global
- **Status:** Active
- **Type:** SMS - Normal and Flash
- **Capacity:** High-volume capable

## SMS Message Types

### SMS - Normal
- Standard text message
- Stores on customer device
- Supports customer reply
- Full SMS capabilities
- Uses SMS - Normal channel

### SMS - Flash
- Display-only message
- Doesn't store on device
- No reply option
- Limited to 160 characters
- Uses SMS - Flash channel
- Good for urgent alerts

## Sender IDs

### What is a Sender ID?
The name or number appearing in the SMS:
- **"COMPANY_NAME"** - Alphanumeric (most common)
- **"+1234567890"** - Phone number
- **"12345"** - Numeric code

### Sender ID Management
- Request from SMS provider
- Often requires approval
- Linked to SMS routes
- Select per campaign
- Track approval status

## SMS Delivery Reports

### Delivery Tracking
SMS providers send back:
- **Delivery Status** - Delivered/Failed/Pending
- **Failure Reason** - If message failed
- **Delivery Time** - When message reached device
- **Message ID** - Provider's message reference

### Configuring Delivery Reports
- Enable webhooks in route config
- Specify callback URL
- Parse delivery reports
- Update message status database

## SMS Route Redundancy

### Primary Route
- Handles all SMS by default
- Must be reliable
- Monitor constantly
- Failover if fails

### Backup Routes
- Used only if primary fails
- Can be cheaper
- Lower capacity acceptable
- Tested regularly

### Failover Process
1. Send via Primary Route
2. Monitor delivery status
3. If failed, retry via Secondary
4. Continue through chain
5. Message guaranteed delivery

## Performance Metrics

### Key Metrics
- **Delivery Rate** - % successfully delivered
- **Failed Rate** - % failed delivery
- **Avg Delivery Time** - Time to reach device
- **SMS/Second Capacity** - Peak throughput

### Monitoring
- Track metrics per route
- Compare provider performance
- Identify bottlenecks
- Optimize routing

## SMS Route Costs

### Pricing Models
- **Per SMS** - Pay for each message
- **Volume-based** - Discounts for high volume
- **Subscription** - Fixed monthly fee
- **Hybrid** - Combination approach

### Cost Optimization
- Route to cheapest viable provider
- Negotiate volume discounts
- Consolidate providers
- Monitor usage patterns

## Common SMS Route Tasks

### Viewing SMS Routes
- [SMS Routes Overview](./sms-routes)
- [SMS Routes List](./sms-routes-list)

### Creating SMS Routes
- [Create SMS Route](./create-sms-route)
- Configure provider credentials
- Set sender IDs
- Establish failover

### Managing SMS Routes
- [Edit SMS Route](./edit-sms-route)
- Update credentials
- Modify configuration
- Change settings

### SMS Route Details
- [View SMS Route](./view-sms-route)
- See full configuration
- Review metrics
- Check campaigns using route

## Best Practices

### SMS Route Setup
- Create clear naming
- Document each route
- Configure redundancy
- Test thoroughly

### SMS Sender ID Management
- Request approved sender IDs
- Track approval status
- Test with test numbers
- Monitor for issues

### Monitoring & Maintenance
- Monitor delivery rates
- Check error logs
- Verify sender ID status
- Test failover regularly

### Cost Management
- Compare provider rates
- Optimize routing
- Consolidate accounts
- Negotiate volume discounts

## Troubleshooting SMS Routes

### SMS Not Delivering
1. Check route is Active
2. Verify provider available
3. Check credentials valid
4. Review error logs

### High Failure Rate
1. Contact provider support
2. Check rate limits
3. Validate phone numbers
4. Verify sender ID

### Slow Delivery
1. Check provider performance
2. Load balance routes
3. Monitor network
4. Contact provider

## Related Documentation

### SMS Routes
- [SMS Routes List](./sms-routes-list) - All SMS routes
- [Create SMS Route](./create-sms-route) - Add SMS routes
- [Edit SMS Route](./edit-sms-route) - Modify SMS routes
- [View SMS Route](./view-sms-route) - SMS route details

### General Routes
- [Routes Overview](./routes) - All routes information
- [Routes List](./routes-list) - View all routes
- [Create Route](./create-route) - Add routes
- [View Route](./view-route) - Route details

### Related Features
- [SMS Channels](../communication-channels-list) - SMS channels
- [Campaign Communication Policies](../campaign-communication-policy-list) - Policy enforcement
- [Sender IDs](../sender-ids) - Sender ID configuration
