# Sender IDs

## Overview

Sender IDs are identifiers that specify who sends messages to customers across different communication channels. They represent the "From" address, number, or name that appears to customers when they receive SMS, email, or other messages from your campaigns and communications. Sender IDs are crucial for brand consistency, deliverability, regulatory compliance, and customer trust.

## Purpose & Benefits

### Why Use Sender IDs?

**Brand Identity**
- Display your brand name or company name to customers
- Maintain consistent sender identity across campaigns
- Build customer trust through recognizable sender information
- Differentiate from competitors and fraudulent senders

**Multi-Channel Consistency**
- Use different IDs for different channels (SMS, email, etc.)
- Organize senders by department or product line
- Create channel-specific sending identities
- Maintain professionalism across all channels

**Compliance &amp; Deliverability**
- Meet regulatory requirements (e.g., SMS sender registration)
- Improve email deliverability rates
- Reduce spam filtering and bounce rates
- Demonstrate legitimate sender status

**Operational Management**
- Track which sender ID was used for each message
- Organize senders by function or team
- Create sender-specific reporting and analytics
- Manage sender credentials and configurations

### Key Benefits

- **Brand Consistency:** Maintain unified brand identity across channels
- **Compliance:** Meet regulatory sender ID requirements
- **Deliverability:** Improve message delivery and inbox placement
- **Tracking:** Understand which sender ID performs best
- **Customer Trust:** Build recognition through consistent identifiers
- **Flexibility:** Manage multiple senders for different purposes

---

## Types of Sender IDs

Sender IDs vary by communication channel and have different requirements:

### SMS Sender IDs

**Alphanumeric Sender ID (Alpha ID)**
- Text-based identifier (e.g., "CompanyName", "ACME Corp")
- Display in customer's phone as sender name
- 1-11 characters typically
- Required in many regions (e.g., Europe, parts of Africa)
- Example: "OurBrand", "RetailCo"

**Numeric Sender ID (Short Code)**
- 5-6 digit number (e.g., "123456")
- Higher throughput and delivery speed
- More expensive than alphanumeric
- Requires dedicated number from SMS provider
- Example: "100001", "900123"

**Long Code Number**
- Standard 10-digit phone number (e.g., "+1234567890")
- Lower cost than short codes
- Lower throughput (rate-limited)
- Can receive replies (two-way messaging)
- Example: "+447700900123"

### Email Sender IDs

**From Name**
- Display name that appears in "From" field
- Examples: "Customer Support", "Sales Team", "Notifications"
- Can be your company name or department name

**From Email Address**
- Full email address in "From" field
- Examples: "support@company.com", "noreply@company.com", "sales@company.com"
- Must be authenticated (SPF, DKIM, DMARC)

**Reply-To Address**
- Email address where replies are sent
- Can be different from "From" address
- Examples: "support@company.com", "feedback@company.com"

### Other Channel Sender IDs

**Push Notification Sender**
- App name or company name
- Displayed as sender of notifications
- Configured in app settings

**WhatsApp Business Account**
- Business account identifier
- Verified WhatsApp Business number
- Approved messaging templates

**USSD Sender**
- Shortcode or identifier for USSD menus
- Operator-specific requirements
- Example: "*123#" or "123"

**In-App Sender**
- Internal messaging sender identifier
- Can be chatbot or support team name
- Example: "Support Bot", "Customer Service"

---

## Sender ID Properties

### Core Fields

**Name**
- Display name for the sender ID configuration
- Human-readable identifier for management
- Examples: "Primary Marketing", "Customer Support SMS", "Transactional Email"
- Required, 1-255 characters

**Sender Type**
- Channel type for this sender ID
- Options: SMS, Email, Push, WhatsApp, USSD, IVR, InApp, Web
- Determines what fields are available for configuration
- Required

**Channel**
- Specific communication channel
- Examples for SMS: Alphanumeric, Short Code, Long Code
- Examples for Email: Corporate, Transactional, Marketing
- Required

**Sender Value**
- Actual sender identifier to display
- Format depends on sender type and channel
- Examples: "CompanyName", "123456", "support@company.com"
- Required, character limits vary by channel

**Credentials / API Key**
- Authentication credentials for sender (if applicable)
- For SMS: Provider API key or account identifier
- For Email: SMTP credentials or API keys
- Optional, varies by configuration

**Status**
- Active or Inactive
- Determines if sender ID can be used in campaigns
- Inactive senders cannot be assigned to new campaigns
- Active by default

**Description**
- Optional explanation of sender ID purpose
- Helps team identify appropriate sender for each campaign
- Examples: "Used for promotional campaigns only", "Customer support team sender"
- Optional, up to 500 characters

**Created At**
- Timestamp when sender ID was created
- System-generated, read-only
- Useful for audit trails

**Last Used**
- Date/time of most recent usage
- Helps identify stale sender IDs
- System-generated, read-only

### Channel-Specific Fields

**For SMS Senders:**
- Sender ID Code (alphanumeric or numeric value)
- Provider Name (carrier/provider offering this sender ID)
- Coverage Area (countries/regions)
- Message Template (if required by provider)
- Delivery Speed (throughput capacity)

**For Email Senders:**
- From Name
- From Email Address
- Reply-To Address
- SPF Record (for authentication)
- DKIM Record (for authentication)
- DMARC Policy

**For WhatsApp:**
- Business Account ID
- Phone Number
- Verification Status
- API Key

---

## Creating Sender IDs

### Step-by-Step Guide

**Step 1: Access Sender IDs**
- Navigate to Configuration
- Select "Sender IDs" from the configuration menu
- Click "Create Sender ID" button

![Create Sender ID](/img/configuration/createsenderid.png)

**Step 2: Select Sender Type**
- Choose the channel type (SMS, Email, Push, WhatsApp, etc.)
- System displays appropriate fields for selected type
- Each channel has different configuration requirements

**Step 3: Enter Basic Information**

Fill in the following fields:

1. **Name** (Required)
   - Enter a descriptive name for this sender ID
   - Example: "Primary Marketing SMS"

2. **Channel** (Required)
   - Select the specific channel variant
   - For SMS: Choose Alphanumeric, Short Code, or Long Code
   - For Email: Choose Corporate, Transactional, or Marketing

3. **Sender Value** (Required)
   - Enter the actual sender identifier
   - For SMS Alpha: "CompanyName" (max 11 chars)
   - For Email: "support@company.com"
   - Format requirements vary by channel

**Step 4: Add Credentials (if required)**
- Enter authentication credentials
- Varies by sender type and provider
- Examples: API keys, SMTP credentials, account IDs
- Some channels may not require credentials

**Step 5: Configure Settings**

1. **Status** (Default: Active)
   - Set to Active to enable for campaigns
   - Set to Inactive to disable

2. **Description** (Optional)
   - Add notes about this sender ID's purpose
   - Example: "Used only for promotional campaign communications"

**Step 6: Verify Configuration**
- Review all entered information
- Ensure sender value matches channel format
- Confirm credentials are valid

**Step 7: Save**
- Click "Create Sender ID" button
- System validates configuration
- New sender ID available for use in campaigns

### Validation Rules

**SMS Alphanumeric IDs:**
- 1-11 characters
- Letters and numbers only
- No special characters
- Cannot be only numbers

**Email Addresses:**
- Valid email format required
- SPF/DKIM records should be configured
- Domain should match company domain if possible

**Short Codes:**
- 5-6 digits
- Numeric only
- Registered with SMS provider
- Coverage area specified

**Credentials:**
- API keys must be valid
- Credentials tested on save
- Invalid credentials result in error message

---

## Managing Sender IDs

### Viewing Sender IDs

**Sender IDs List**
- Access main Sender IDs page to see all configured senders
- View summary: Name, Channel Type, Sender Value, Status, Last Used
- Filter by type, status, or channel
- Search by name or sender value

![Sender IDs List](/img/configuration/senderid.png)

**Filtering &amp; Search**
- Filter by sender type (SMS, Email, Push, etc.)
- Filter by status (Active, Inactive)
- Search by name or sender value
- Results update as you type

**Statistics**
- **Total Sender IDs:** Count of all configured senders
- **Active Senders:** Count of enabled senders
- **By Channel:** Breakdown of senders by type

### Editing Sender IDs

**Update Existing Sender ID**

1. Locate the sender ID in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Name can be changed freely
   - Description can be added or updated
   - Status can be changed (Active/Inactive)
   - Some fields (like Sender Value) may be locked to prevent breaking existing usage
4. Click "Save" to update

**What Can Be Changed:**
- Name (display name)
- Description (purpose explanation)
- Status (Active/Inactive)
- Some credentials (varies by type)

**What May Not Be Changed:**
- Sender Value (to prevent breaking campaigns using this sender)
- Sender Type/Channel (to maintain consistency)

### Deactivating Sender IDs

**Deactivate Instead of Delete**
- Set status to "Inactive" instead of deleting
- Preserves historical record of messages sent
- Prevents accidental deletion of in-use senders
- Can be reactivated if needed

**When to Deactivate:**
- Sender ID no longer in use
- Provider relationship ended
- Moving to new sender ID
- Temporary suspension needed

### Deleting Sender IDs

**Delete Sender ID**

1. Locate the sender ID in the list
2. Click the "Delete" action button
3. Confirm deletion in the confirmation dialog
4. Sender ID is removed from the system

**Deletion Rules:**
- Can only delete inactive sender IDs
- Active senders cannot be deleted (deactivate first)
- System prevents deletion of senders with recent usage
- Historical messages remain intact (sender reference preserved)

**Before Deleting:**
- Ensure sender ID is not used in any active campaigns
- Deactivate first if sender is currently active
- Ensure historical tracking needs are met

---

## Using Sender IDs in Campaigns

### Assigning Sender IDs to Campaigns

**During Campaign Creation**
1. When creating a new campaign
2. Select the target channel (SMS, Email, etc.)
3. Choose appropriate sender ID from dropdown
4. Sender ID appears in campaign configuration
5. Messages will display this sender to customers

**During Campaign Editing**
- Change sender ID if needed
- Select different sender for different segments (optional)
- Effective for next send

### Sender ID Selection Guidelines

**For SMS:**
- Choose based on message type (promotional vs. transactional)
- Short codes for high-volume campaigns (better delivery)
- Alphanumeric for brand-compliant messages
- Long codes for two-way messaging needs

**For Email:**
- Use consistent "From" name and address per campaign type
- Use transactional sender for system messages
- Use marketing sender for promotional campaigns
- Configure Reply-To for customer feedback

**For Push Notifications:**
- Choose sender that represents your app/brand
- Consistent sender builds recognition
- Especially important for retention campaigns

### Multi-Channel Campaign Sender Selection

**Cross-Channel Campaigns**
- Select appropriate sender ID for each channel
- SMS sender ID for SMS leg
- Email sender ID for email leg
- Maintain brand consistency across channels

**Example:**
- Campaign: "Flash Sale"
- SMS Sender: "YourBrand"
- Email Sender: "Sales Team &lt;sales@company.com&gt;"
- Push Sender: "YourBrand App"

---

## Best Practices

### SMS Sender ID Best Practices

**Alphanumeric Selection**
- Use recognizable brand name
- Keep consistent across campaigns
- Ensure customer can identify your company
- Example: "ACME" not "ACMECOMPANYNAME123"

**Compliance Considerations**
- Register sender IDs in regulated markets
- Follow local SMS regulations
- Document approval status
- Examples: TCCCNRF (India), OFCOM (UK)

**Short Code Management**
- Dedicated short codes for high-volume senders
- Better deliverability and speed
- More expensive - reserve for important campaigns
- Document allocation across teams

### Email Sender Best Practices

**Authentication Setup**
- Configure SPF records (Send Policy Framework)
- Configure DKIM (DomainKeys Identified Mail)
- Implement DMARC (Domain-based Message Authentication)
- Improves deliverability significantly

**From Name Standards**
- Use company name or recognizable team name
- Avoid vague names like "Notifications"
- Example: "Sales Team" not "ST"
- Be consistent with brand identity

**Reply-To Configuration**
- Set appropriate Reply-To address
- Enables customer responses
- Route to appropriate department
- Examples: support@, sales@, feedback@

### General Best Practices

**Sender ID Organization**
- Create meaningful, descriptive names
- Group by function or department
- Document purpose in description
- Example: "Marketing Promotional SMS", "Support Transactional Email"

**Status Management**
- Deactivate unused sender IDs instead of deleting
- Maintain audit trail of sender ID usage
- Review periodically for stale senders
- Clean up old, unused sender IDs

**Compliance &amp; Documentation**
- Document purpose of each sender ID
- Keep credentials secure and updated
- Maintain records of approvals
- Regular audits of active senders

**Testing**
- Test new sender IDs before production use
- Verify sender value displays correctly
- Check deliverability rates
- Monitor bounce rates and complaints

---

## Common Use Cases

### Use Case 1: Multi-Department SMS Program

**Scenario:** Organization with multiple teams sending SMS

**Sender IDs Created:**
- `marketing_promo` - Marketing promotional campaigns (Alphanumeric)
- `support_alerts` - Customer support alerts (Long Code for 2-way)
- `transactions_confirm` - Order confirmations (Short Code)
- `transactional_otp` - OTP/security codes (Short Code)

**Benefit:** Easy tracking of which department's message customers receive

### Use Case 2: Compliant Email Program

**Scenario:** Company with strict email compliance requirements

**Sender IDs Created:**
- `corporate_communications@company.com` - Main corporate sender
- `noreply@company.com` - System notifications
- `support@company.com` - Customer support (with Reply-To)
- `marketing@company.com` - Marketing campaigns

**Benefit:** All emails authenticated and routable appropriately

### Use Case 3: Multi-Brand Organization

**Scenario:** Holding company with multiple brands

**Sender IDs Created:**
- Brand A SMS and Email senders
- Brand B SMS and Email senders
- Brand C SMS and Email senders
- Shared corporate sender for internal communications

**Benefit:** Each brand maintains identity while using same system

### Use Case 4: Channel-Specific Senders

**Scenario:** Omnichannel campaign program

**Sender IDs Created:**
- SMS: "RetailCorp"
- Email: "RetailCorp Sales &lt;sales@retailcorp.com&gt;"
- Push: "RetailCorp App"
- WhatsApp: "RetailCorp Support"

**Benefit:** Consistent brand across all customer touchpoints

---

## Troubleshooting

### Cannot Create Sender ID

**Error: "Sender value already exists"**
- Cause: Duplicate sender ID configured
- Solution: Use unique sender identifier
- Check: Search for existing sender IDs with similar values

**Error: "Invalid sender format"**
- Cause: Sender value doesn't match channel requirements
- Solution: Check format requirements for your channel type
- Example: SMS alpha ID must be 1-11 alphanumeric characters

**Error: "Invalid credentials"**
- Cause: API key or authentication credentials invalid
- Solution: Verify credentials with provider
- Check: Credentials are correct and not expired

**Error: "Channel not supported"**
- Cause: Selected channel not available in system
- Solution: Choose available channel type
- Check: Verify channel is enabled in your configuration

### Cannot Delete Sender ID

**Error: "Cannot delete active sender ID"**
- Cause: Sender ID is still active/enabled
- Solution: Deactivate sender ID first
- Steps:
  1. Click "Edit" on sender ID
  2. Change status to "Inactive"
  3. Click "Save"
  4. Then delete

**Error: "Cannot delete sender with recent usage"**
- Cause: Sender ID used in campaigns recently
- Solution: Wait period or choose another sender for campaigns
- Prevention: Deactivate before deleting

### Deliverability Issues

**Issue: Email messages going to spam**
- Cause: Authentication not configured
- Solution: Configure SPF, DKIM, DMARC records
- Check: Verify DNS records are published
- Prevention: Set up authentication before first use

**Issue: SMS messages not delivering**
- Cause: Sender ID not registered or incorrect format
- Solution: Verify sender ID format and registration
- Check: Confirm SMS provider accepts sender ID
- Prevention: Test with new sender before production use

### Sender ID Not Available in Campaign

**Issue: Cannot select sender ID for campaign**
- Cause: Sender status is Inactive or wrong channel type
- Solution: Activate sender ID
- Steps:
  1. Go to Sender IDs configuration
  2. Find sender ID
  3. Change status to Active
  4. Refresh campaign creation page

---

