# Create Communication Route

## Overview

Create a new Communication Route to establish a delivery path between a communication channel and a gateway provider. Routes control how messages are sent through your infrastructure.

## How to Create a Route

### Step 1: Open the Creation Form

1. Navigate to **Configuration → Routes**
2. Click the **Create** button at the top of the page
3. A modal dialog opens with the route creation form

### Step 2: Fill in Route Information

#### Route Name (Required)
- **Field Type:** Text input
- **Max Length:** 100 characters
- **Description:** Unique identifier for the route
- **Examples:**
  - "Effortel SMS Gateway"
  - "Primary Email Route - AWS SES"
  - "Backup SMS - Twilio"
  - "Push Notifications - FCM"
  - "USSD Interactive - MainProvider"

#### Route Description (Optional)
- **Field Type:** Text area
- **Max Length:** 500 characters
- **Description:** Explain the route's purpose and details
- **Examples:**
  - "Primary SMS delivery via Effortel gateway for standard SMS messages"
  - "Backup email route using AWS SES for transactional emails"
  - "High-volume SMS route for promotional campaigns"
  - "Interactive USSD route for customer self-service menus"

#### Status
- **Field Type:** Toggle (Active/Inactive)
- **Default:** Active
- **Description:** Whether the route is available for immediate use
- **Note:** Can be toggled after creation

### Step 3: Select Communication Channel

#### Communication Channel (Required)
- **Field Type:** Dropdown select
- **Options:** Available channels
  - SMS - Normal
  - SMS - Flash
  - Email
  - USSD - Push
  - USSD - Interactive
  - Push Notification
- **Description:** Which channel this route serves
- **Impact:** Determines what messages flow through this route

### Step 4: Configure Gateway Provider

#### Gateway Provider (Required)
- **Field Type:** Text input or select
- **Description:** The provider handling message delivery
- **Common Providers by Channel:**

**SMS Providers:**
- Effortel
- Twilio
- AWS SNS
- Vonage
- Plivo
- Bandwidth

**Email Providers:**
- AWS SES
- SendGrid
- Mailgun
- SMTP Direct
- Postmark

**USSD Providers:**
- MainProvider
- Zenith
- Huawei
- Mavenir

**Push Providers:**
- Firebase (FCM)
- Apple Push Service (APNS)

#### Provider Credentials (Required)
- **API Key** - Authentication token
- **API Secret** - Secret credential
- **Endpoint URL** - Provider's API endpoint
- **Account ID** - Provider account identifier
- **Custom Fields** - Provider-specific configuration

### Step 5: Configure Route-Specific Settings

#### Rate Limiting (Optional)
- **Messages per Second** - Provider limit
- **Daily Message Limit** - Maximum messages per day
- **Burst Capacity** - Peak throughput

#### Retry Configuration (Optional)
- **Max Retries** - Number of retry attempts
- **Retry Interval** - Wait time between retries
- **Timeout** - Message delivery timeout

#### Priority (Optional)
- **Route Priority** - 1 (highest) to 10 (lowest)
- **Used for load balancing** across multiple routes
- **Affects failover order** when routes fail

### Step 6: Test Provider Connection

Before saving:
1. Click **Test Connection** button
2. System attempts to connect to provider
3. Shows success or error message
4. Fix any connection issues
5. Retry until connection succeeds

### Step 7: Save the Route

1. Review all configuration
2. Verify test connection passed
3. Click the **Save** or **Create** button
4. System validates:
   - Route name is unique
   - Channel is selected
   - Gateway provider is configured
   - Credentials are valid
5. Upon success:
   - Confirmation message appears
   - Modal closes
   - Route appears in the list

## Validation Rules

- **Route name is required** - Cannot create without a name
- **Route name must be unique** - No duplicate route names
- **Communication channel required** - Must select a channel
- **Gateway provider required** - Must specify a provider
- **Valid credentials required** - Provider authentication must work
- **Character limits:**
  - Name: Maximum 100 characters
  - Description: Maximum 500 characters

## Route Configuration by Channel Type

### SMS Routes
Configuration includes:
- SMS gateway provider
- API credentials
- Sender ID settings
- Character encoding
- Long message handling (concatenation)
- Delivery reports configuration

### Email Routes
Configuration includes:
- SMTP server or API endpoint
- Authentication credentials
- Sender email address
- TLS/SSL settings
- Bounce handling
- Template engine

### USSD Routes
Configuration includes:
- USSD gateway provider
- Session timeout
- Menu structure
- Character limits
- Protocol version

### Push Notification Routes
Configuration includes:
- FCM project ID and key
- APNS certificate upload
- Device token management
- Payload limits
- Deep link configuration

## Provider Selection Guide

### SMS Providers

**Effortel**
- **Cost:** Based on volume
- **Coverage:** Africa and Global
- **Features:** SMS, OTP, Flash SMS
- **Integration:** HTTP/SMPP

**Twilio**
- **Cost:** Pay-as-you-go
- **Coverage:** Global
- **Features:** SMS, MMS, Voice
- **Integration:** REST API

**AWS SNS**
- **Cost:** Pay-per-message
- **Coverage:** Global
- **Features:** SMS, SNS
- **Integration:** AWS SDK

### Email Providers

**AWS SES**
- **Cost:** Very affordable
- **Deliverability:** High
- **Volume:** No limits
- **Features:** SMTP, API

**SendGrid**
- **Cost:** Tiered pricing
- **Deliverability:** Industry-leading
- **Volume:** Unlimited
- **Features:** Templates, Analytics

### Push Providers

**Firebase (FCM)**
- **Cost:** Free
- **Platforms:** Android and web
- **Features:** Rich messaging
- **Integration:** Firebase SDK

**Apple (APNS)**
- **Cost:** Free
- **Platforms:** iOS and macOS
- **Features:** Badge, sound, data
- **Integration:** Certificate-based

## Error Handling

Common errors and solutions:

- **"Route name is required"** - Enter a route name
- **"Route name already exists"** - Use a different name
- **"Select a communication channel"** - Choose a channel from dropdown
- **"Enter gateway provider"** - Specify the provider name
- **"Invalid credentials"** - Verify API keys and secrets
- **"Connection failed"** - Test provider connectivity
- **"Name exceeds 100 characters"** - Shorten the route name

## Testing and Validation

### Provider Connectivity
1. Click **Test Connection** before saving
2. Verify successful connection message
3. Fix any authentication errors
4. Retry until connection succeeds

### Delivery Testing
After route creation:
1. Create a test campaign
2. Select the new route
3. Send test message
4. Verify delivery
5. Check delivery logs

### Load Testing
For production routes:
1. Gradually increase message volume
2. Monitor success rates
3. Verify no timeouts
4. Check provider performance
5. Adjust settings as needed

## Best Practices

### Route Creation
- Use descriptive, clear names
- Document the provider and purpose
- Test connectivity before production
- Create backup routes for critical channels
- Set up monitoring from the start

### Provider Credentials
- Store credentials securely
- Rotate credentials regularly
- Use dedicated provider accounts
- Document credential renewal dates
- Implement credential rotation alerts

### Configuration
- Start with provider defaults
- Customize based on requirements
- Test thoroughly before production
- Document all custom configurations
- Review settings quarterly

### Redundancy
- Create multiple routes per channel
- Set appropriate priority levels
- Test failover scenarios
- Monitor all route health
- Have rollback procedures

## Next Steps

After creating a route:
1. [View the route details](./view-route) to verify creation
2. [Edit the route](./edit-route) if you need to adjust settings
3. Create test campaigns using the new route
4. Monitor delivery metrics
5. Optimize configuration based on performance
6. Deploy to production when ready
