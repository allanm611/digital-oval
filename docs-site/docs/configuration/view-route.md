# View Communication Route Details

## Overview

View complete details of a Communication Route including provider configuration, channel mapping, and delivery statistics. This page displays all information about how messages are routed through your infrastructure.

## How to View Route Details

### From the List View
1. Navigate to **Configuration → Routes**
2. Click on any route name in the list
3. The details page opens showing all route information

### From Search Results
1. Use the search field to find a specific route
2. Click on the matching route name
3. Details page loads with complete information

## Route Details Page

### Basic Information

**Route Name**
- Unique identifier for the route
- Used in campaign and policy configurations
- Examples: "Effortel SMS Gateway", "AWS SES Email"

**Route Description**
- Explains the route's purpose and use case
- Documents intended usage scenarios
- Helps team understand routing strategy

**Status Badge**
- Green "Active" badge - Route is in use
- Blue "Inactive" badge - Route is archived

### Channel Mapping

**Associated Communication Channel**
- Which channel this route serves
- Example: SMS - Normal, Email, USSD - Interactive
- Controls what message types use this route

**Channel Type**
- SMS, Email, USSD, or Push
- Determines routing capabilities
- Defines configuration options

### Provider Configuration

**Gateway Provider**
- Provider handling message delivery
- Examples: Effortel, Twilio, AWS SES, Firebase
- Shows provider version/API type

**Provider Credentials Status**
- Credentials configured: ✓
- Last verified: Timestamp
- Connection status: Active/Inactive
- Test result: Success/Failed

**API Configuration**
- Endpoint URL (partially masked)
- Authentication type (API Key, OAuth, etc.)
- Protocol (HTTP, SMTP, etc.)
- Version/Specification

### Performance Metrics

**Delivery Statistics**
- Total messages sent through route
- Successful deliveries
- Failed deliveries
- Pending messages
- Success rate percentage

**Performance Indicators**
- Average delivery time
- Peak message throughput
- Current load
- Provider latency

**Error Tracking**
- Error types and counts
- Most common failures
- Recent error messages
- Trend analysis

### Timestamps

**Created**
- When the route was created
- User who created it (if available)

**Last Updated**
- When route was last modified
- Type of change made
- User who made changes

### Related Information

**Campaigns Using Route**
- List of campaigns currently using this route
- Message volume through campaigns
- Status of each campaign
- Links to campaign details

**Connected Policies**
- Communication policies referencing this route
- How policies affect message routing
- Policy priority levels

## Available Actions

### Edit Route
- Click **Edit** button to modify route settings
- Update name, description, provider configuration
- See [Edit Route](./edit-route)

### Test Connection
- Click **Test Connection** to verify provider connectivity
- Shows connection status and response time
- Helps diagnose delivery issues
- Safe to run while messages flow

### Configure Provider
- Click **Provider Settings** to manage credentials
- Update API keys or secrets
- Adjust rate limits
- Configure advanced options

### Delete Route
- Click **Delete** button to remove route
- Confirmation dialog appears
- Cannot delete if actively in use by campaigns
- Permanent action once confirmed

### View Performance
- Click **Performance Metrics** for detailed analytics
- Export delivery reports
- View trend graphs
- Analyze error patterns

### Back to List
- Returns to Communication Routes list
- All viewed information is preserved

## Understanding Route Status

### Active Routes
- Currently processing messages
- Available for campaigns and policies
- Being monitored for performance
- Can receive new traffic

### Inactive Routes
- Not processing new messages
- Pending messages continue delivery
- Can be reactivated if needed
- Good for archival or temporary disabling

## Route Performance Analysis

### Delivery Metrics
View route performance by:

**Success Rate**
- Percentage of successful deliveries
- Target: 98%+ for production routes
- Below target may indicate issues

**Delivery Time**
- Average time from send to delivery
- Varies by provider
- Affects customer experience

**Message Volume**
- Messages per hour/day/month
- Trending up or down
- Capacity planning indicator

### Error Analysis

**Common Errors**
- Authentication failures
- Rate limit exceeded
- Provider unavailable
- Invalid recipient format
- Timeout/connection errors

**Error Trends**
- Increasing/decreasing over time
- Time-of-day patterns
- Associated with campaigns

## Provider-Specific Details

### SMS Route Details
Shows:
- SMS gateway configuration
- Sender ID settings
- Delivery report configuration
- Character encoding options

### Email Route Details
Shows:
- SMTP server configuration
- Sender email address
- TLS/SSL settings
- Bounce handling rules

### USSD Route Details
Shows:
- USSD gateway configuration
- Session timeout
- Menu structure
- Character limits

### Push Route Details
Shows:
- FCM or APNS configuration
- Platform coverage (Android/iOS)
- Certificate expiration dates
- Device token count

## Troubleshooting Route Issues

### Route Not Delivering
1. Check route status (Active/Inactive)
2. Verify provider credentials
3. Test provider connection
4. Review error logs
5. Check message format

### High Failure Rate
1. Click **Test Connection**
2. Review error patterns
3. Check provider status page
4. Verify rate limits
5. Review message formatting

### Slow Delivery
1. Check current load
2. Verify no timeouts
3. Review provider performance
4. Compare with other routes
5. Consider load balancing

### Credential Issues
1. Verify credentials are current
2. Check credential expiration
3. Renew credentials if needed
4. Test connection after renewal
5. Monitor for success

## Dependencies

Before modifying or deleting, understand:

### Campaigns Relying on Route
- Which campaigns use this route
- Impact of disabling route
- Alternative route availability

### Backup Routes
- Primary vs. backup routes
- Failover order
- Load distribution

### Provider Integration
- Other systems using provider
- Shared credentials
- Concurrent usage

## Related Documentation

### Route Management
- [Communication Routes List](./routes-list) - View all routes
- [Create Route](./create-route) - Add new routes
- [Edit Route](./edit-route) - Modify routes

### SMS Specific
- [SMS Routes](./sms-routes) - SMS routing details
- [View SMS Route](./view-sms-route) - SMS route information

### Related Features
- [Communication Channels](../communication-channels-list) - Available channels
- [Campaign Communication Policies](../campaign-communication-policy-list) - Messaging policies
