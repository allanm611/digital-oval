# DND Management

## Overview

DND (Do Not Disturb) Management allows you to manage customer communication preferences across multiple channels. It enables customers and administrators to opt-out of specific types of communications (marketing, promotional, transactional, service) on specific channels (SMS, Email, USSD, App Notifications). This ensures compliance with customer preferences and improves engagement by respecting opt-out preferences.

## Purpose & Benefits

### Why Use DND Management?

**Respect Customer Preferences**
- Honor customer opt-out preferences
- Control what types of messages customers receive
- Allow customers to manage their own preferences
- Reduce unwanted communications

**Regulatory Compliance**
- Meet GDPR and privacy regulations
- Document customer preferences
- Maintain audit trails of opt-in/opt-out
- Respect local messaging regulations

**Improve Customer Experience**
- Deliver only relevant messages
- Reduce message fatigue
- Increase engagement rates
- Build customer trust

**Campaign Effectiveness**
- Filter out opted-out customers before sending
- Reduce bounces and complaints
- Focus messages on engaged customers
- Improve campaign ROI

### Key Benefits

- **Preference Control:** Fine-grained channel and message type control
- **Compliance:** Regulatory adherence and audit trails
- **Efficiency:** Automatically exclude opted-out customers from campaigns
- **Trust:** Demonstrate respect for customer preferences
- **Performance:** Improve open rates, click rates, and ROI by excluding unengaged customers

---

## DND Channels

DND Management supports four communication channels:

### SMS (Short Message Service)

**Description:** Text message communication via phone numbers

**Use For:**
- SMS campaigns and promotions
- SMS notifications and alerts
- SMS marketing messages
- Time-sensitive communications

**DND Categories Available:**
- Promotional
- Transactional
- Marketing
- Service
- Other

**Managed By:** Phone numbers (MSISDN format)

---

### Email

**Description:** Email message communication

**Use For:**
- Email campaigns
- Email newsletters
- Email notifications
- Email promotions

**DND Categories Available:**
- Promotional
- Transactional
- Marketing
- Service
- Other

**Managed By:** Email addresses

---

### USSD (Unstructured Supplementary Service Data)

**Description:** Interactive menu-based mobile communication

**Use For:**
- USSD menu interactions
- USSD notifications
- USSD balance queries
- USSD service messages

**DND Categories Available:**
- Promotional
- Transactional
- Marketing
- Service
- Other

**Managed By:** Phone numbers (MSISDN format)

---

### App Notifications

**Description:** In-app push notifications

**Use For:**
- In-app notifications
- App-based promotions
- App engagement messages
- App service alerts

**DND Categories Available:**
- Promotional
- Transactional
- Marketing
- Service
- Other

**Managed By:** User/Customer IDs (within app)

---

## DND Categories

DND is organized into five message type categories:

### Promotional Messages

**Description:** Special offers, discounts, and promotional campaigns

**Examples:**
- Flash sales
- Seasonal promotions
- Discount codes
- Limited-time offers
- Clearance announcements

**Use Case:** Customers can opt-out of promotional content while still receiving service messages

---

### Transactional Messages

**Description:** Order confirmations, receipts, and transaction-related communications

**Examples:**
- Order confirmation
- Payment receipt
- Delivery notification
- Transaction status update
- Invoice

**Use Case:** Critical business communications that should rarely be opted out of

---

### Marketing Messages

**Description:** Marketing campaigns and brand communications

**Examples:**
- Newsletter
- Product recommendations
- Brand announcements
- Campaign invitations
- Marketing automation

**Use Case:** Customers can opt-out of marketing while keeping promotional and transactional messages

---

### Service Messages

**Description:** Service updates, maintenance notifications, and account information

**Examples:**
- Account updates
- Password resets
- Security alerts
- Service status
- System maintenance notice

**Use Case:** Important account and service information

---

### Other Communications

**Description:** Miscellaneous communications that don't fit other categories

**Examples:**
- Feedback requests
- Surveys
- General notifications
- Announcements
- Other communications

**Use Case:** Catch-all category for non-standard communications

---

## DND Status Tracking

### Active Status

Indicates a customer is currently in the DND list for a specific message type on a specific channel.

**Details Tracked:**
- Added Date: When the customer was added to DND
- Added By: User who added the customer
- Current Status: Active

**Behavior:** Messages of this type will not be sent to this customer on this channel

---

### Removed Status

Indicates a customer was previously in DND but has been removed (soft delete).

**Details Tracked:**
- Added Date: When originally added to DND
- Added By: User who added the customer
- Removed Date: When removed from DND
- Removed By: User who removed the customer
- Previous Status: Removed

**Behavior:** Customer is no longer in DND for this message type on this channel

**Note:** Removed records are kept for audit and historical purposes

---

## Managing DND Lists

### Accessing DND Management

**Navigation:**
1. Go to Configuration menu
2. Select "DND Management"
3. Choose desired communication channel (SMS, Email, USSD, App)
4. View and manage DND list for that channel

**Route:** `/dashboard/dnd-management`

### View Communication Policies

Navigate to **Configuration → Communication Policies** to manage DND and other communication policies.

![Communication Policies List](/img/configuration/communicaitonpolicylist.png)

### Create Policy

Click the **Create** button to add a new policy.

![Create Policy](/img/configuration/createpolicy.png)

**Policy Types:**

**DND Policy:**

![DND Policy Configuration](/img/configuration/createpolicy-dnd.png)

**Maximum Frequency Policy:**

![Maximum Frequency Policy](/img/configuration/createpolicy-maximum.png)

**VIP Policy:**

![VIP Policy Configuration](/img/configuration/createpolicy-vip.png)

**Policy Type Dropdown:**

![Policy Type Selection](/img/configuration/createpolicy-policydropdown.png)

---

### Channel-Specific Management

Once you select a channel, you can:

**Add Customers to DND**
- Search for customer by name, email, or phone
- Select specific DND category (message type)
- Set status to active immediately
- System logs who added and when

**Remove Customers from DND**
- Search in active DND list
- Select customer and message type
- Mark as removed (soft delete)
- System logs removal details

**View DND List**
- See all active DND entries
- Filter by DND type
- Search by customer details
- View metadata (added/removed dates and users)

**Track Changes**
- See who added each entry
- View removal history
- Audit trail of all changes
- Timestamps for compliance

---

### Adding Customer to DND

#### SMS/USSD DND (Phone-Based)

**Step 1: Search Customer**
- Enter customer name, email, or phone number
- System searches customer database
- Select matching customer from results
- Debounced search for performance

**Step 2: Select DND Category**
- Choose message type to opt-out of:
  - Promotional
  - Transactional
  - Marketing
  - Service
  - Other
- Select "Add to DND"
- System records addition

#### Email DND

**Step 1: Search Customer**
- Enter customer name, email, or phone number
- System searches customer database
- Select matching customer from results

**Step 2: Add to DND**
- Email DND doesn't distinguish by category
- Add entire email to DND
- System records addition

---

### Removing Customer from DND

**Step 1: Locate Customer in DND List**
- Search by customer details
- Filter by DND type if needed
- View list of active DND entries

**Step 2: Select Customer & Category**
- Choose customer to remove
- Confirm category to remove (SMS/USSD only)

**Step 3: Confirm Removal**
- Confirm removal action
- System soft-deletes the record
- Records removal details (date, user)

**Note:** Removed records are kept for audit purposes but customer is no longer in active DND

---

## Integration with Campaigns

### Campaign Execution Flow

When a campaign is prepared to send messages:

**1. Message Preparation**
- System prepares message list for sending
- Identifies message category (promotional, transactional, etc.)
- Identifies target channel (SMS, Email, etc.)

**2. DND Filtering**
- System checks recipient list against DND data
- For each recipient:
  - Is customer in DND for this message type on this channel?
  - Yes → Exclude from send
  - No → Include in send

**3. Final Send**
- Only non-DND customers receive message
- Campaign reports show exclusions
- Audit trail records DND filtering

### Campaign Reporting

**Exclusion Tracking:**
- Number of messages excluded due to DND
- Percentage of audience excluded
- DND exclusions per channel
- DND exclusions by type

**Performance Impact:**
- Reduced bounces (excluded invalid addresses)
- Better engagement (only engaged customers)
- Compliance assurance (respects preferences)

---

## Best Practices

### DND Management

**Regular Maintenance**
- Periodically review DND lists
- Remove entries for inactive customers
- Clean up old removed records
- Archive historical data

**Accuracy**
- Verify customer details before adding to DND
- Use correct channel and category
- Document reasons for additions
- Maintain audit trail

**Customer Communication**
- Notify customers of DND addition
- Confirm email/SMS preferences
- Provide easy preference management
- Allow customer-initiated changes

### Campaign Considerations

**Pre-Campaign Review**
- Check estimated DND exclusions
- Review impact on reach
- Document exclusion rates
- Plan messaging strategy

**Message Categorization**
- Correctly categorize all messages
- Use appropriate category for message type
- Maintain consistency across campaigns
- Train team on categorization

**Compliance**
- Respect all DND preferences
- Don't attempt workarounds
- Maintain audit trail
- Document compliance measures
- Review regularly for violations

### Customer Experience

**Preference Management**
- Make DND easy to manage
- Offer customer self-service options
- Provide clear opt-in/opt-out
- Confirm preference changes

**Relevant Messaging**
- Focus on engaged customers
- Reduce message frequency
- Personalize remaining messages
- Honor all preferences

---

## Common Scenarios

### Scenario 1: Customer Wants to Stop Marketing Emails

**Process:**
1. Customer indicates preference not to receive marketing
2. Administrator searches for customer email
3. Adds email to Email DND for "Marketing" category
4. Next marketing email campaign automatically excludes this customer
5. Transactional and service emails continue to be sent

**Result:** Customer receives only transactional and service emails, not marketing

---

### Scenario 2: Opting Out of All SMS Promotional

**Process:**
1. Customer sends "STOP" SMS or opts out via app
2. Administrator or automation adds phone to SMS DND for "Promotional" category
3. All future promotional SMS are excluded
4. Transactional SMS (order confirmations, etc.) continue

**Result:** Customer receives only non-promotional SMS messages

---

### Scenario 3: Channel-Specific Preferences

**Process:**
1. Customer wants SMS but not Email for promotional offers
2. Add email to Email DND for "Promotional"
3. Keep phone OUT of SMS DND
4. Promotional campaigns send SMS to customer, exclude from Email
5. Customer receives promotional SMS but not promotional Email

**Result:** Respects channel-specific customer preferences

---

### Scenario 4: Service Messages Exception

**Process:**
1. Customer is in DND for transactional messages
2. Critical service update needs to be sent
3. Evaluate: Is this truly transactional? Should it be an exception?
4. If exception approved: Send to customer despite DND
5. Document exception and reason in audit log

**Result:** Critical messages can be sent while maintaining DND compliance

---

## Troubleshooting

### Cannot Find Customer to Add to DND

**Issue:** Customer doesn't appear in search results
- **Cause:** Customer not in system, incorrect name/email/phone, typo
- **Solution:** Verify customer details in customer database first
- **Check:** Make sure customer record exists and is active
- **Alternative:** Add DND by exact email or phone if customer exists but search fails

### Customer Not Appearing in Active DND List

**Issue:** Added customer doesn't show in DND list
- **Cause:** May be in "removed" status, different channel, different category
- **Solution:** Check filters and status selection
- **Check:** Make sure viewing correct channel (SMS, Email, etc.)
- **Filter:** Try searching with fewer filters to locate customer

### Messages Still Being Sent Despite DND

**Issue:** Campaign sent message to customer in DND
- **Cause:** Campaign used wrong category, wrong channel, or bypassed DND check
- **Solution:** Verify campaign message categorization
- **Investigation:** Check if DND was active at time of sending
- **Prevention:** Enable DND filtering validation in campaign setup
- **Review:** Audit campaign configuration and DND records

### Removed Records Taking Up Space

**Issue:** Too many removed DND records in system
- **Cause:** Removed records kept for audit trail
- **Solution:** Archive or bulk-delete very old removed records
- **Policy:** Define retention policy for removed records
- **Automation:** Consider automated archival of old records

---

