# Seed List Management

## Overview

Seed List Management allows you to maintain a list of internal test recipients (staff members) who receive campaign copies for testing and quality assurance before sending to actual customers. Seeds lists enable you to validate campaign content, test delivery across channels, verify personalization, and ensure quality standards are met before customer launch.

## Purpose & Benefits

### Why Use Seed Lists?

**Quality Assurance**
- Validate message content before customer delivery
- Verify formatting across devices and email clients
- Test personalization variables
- Catch errors before they reach customers

**Testing & Validation**
- Test email delivery and rendering
- Validate SMS formatting
- Test multi-channel campaigns
- Verify dynamic content insertion

**Risk Management**
- Identify issues early
- Prevent embarrassing mistakes from reaching customers
- Test campaign performance internally first
- Validate all links and CTAs work correctly

**Department-Specific Monitoring**
- Marketing team tests marketing campaigns
- Sales team validates sales content
- Support team verifies service communications
- Organized by department and line of business

### Key Benefits

- **Quality:** Catch errors before customer delivery
- **Validation:** Test all channels and content types
- **Confidence:** Launch campaigns with verified content
- **Organization:** Department-specific testing capabilities
- **Audit Trail:** Track all testing activity

---

## Seed List Concepts

### What is a Seed List Recipient?

A Seed List Recipient is an internal staff member who receives test copies of campaigns before they're sent to customers. Each recipient has:
- Name and contact information (email, phone)
- Department and Line of Business affiliation
- Status (Active or Inactive)
- Audit information (who added them, when)

### When to Use Seed Lists

**Campaign Testing**
- Before launching any campaign
- When testing new content
- When changing templates or design
- When testing personalization

**Channel Validation**
- Test email delivery and rendering
- Validate SMS formatting
- Test multi-channel campaigns
- Verify push notifications

**Quality Gates**
- Establish testing as standard practice
- Include in campaign approval workflow
- Require sign-off from department heads
- Track testing results

---

## Seed List Workflow

### Campaign Testing Workflow

**1. Campaign Creation**
- Prepare campaign content
- Configure audience and channels
- Reach campaign preview step

**2. Seed List Configuration**
- Choose seed list mode:
  - Apply to all segments (single seed list)
  - Apply per segment (different seed lists per segment)
- Select which seed lists to send test to
- Confirm seed list recipient count

**3. Send Test**
- Click "Send Test" button
- Campaign sent to selected seed list recipients
- Track test results (success/failure)
- Review any delivery issues

**4. Validate & Approve**
- Review test messages received by staff
- Verify content, formatting, links
- Confirm personalization worked correctly
- Get approvals from relevant departments

**5. Launch**
- Once validated, launch to customers
- Proceed with confidence
- Monitor initial customer delivery

---

## Managing Seed List Recipients

### Accessing Seed List Management

**Navigation:**
1. Go to Configuration menu
2. Select "Seed List Management"
3. View, add, or manage test recipients

**Route:** `/dashboard/seed-list-management`

---

### Viewing Seed List Recipients

**Table Display:**
- See all seed list recipients
- Filter by department or line of business
- Search by name, email, or phone
- View recipient status (Active/Inactive)
- Track who added each recipient and when

**Table Columns:**
- Name (recipient's name)
- Email (email address for testing)
- Phone (phone number with country code)
- Department (organization department)
- Line of Business (business unit)
- Status (Active/Inactive)
- Added (date recipient was added)
- Added By (user who added them)
- Actions (delete/remove)

---

### Adding Recipients to Seed List

**Step 1: Open Add Recipient Modal**
- From Seed List Management page
- Click "Add Recipient" button (Plus icon)
- Modal opens with form

**Step 2: Enter Recipient Information**

Fill in the required fields:

1. **Name** (Required)
   - Staff member's full name
   - Example: "John Smith"

2. **Email** (Required)
   - Email address for test messages
   - Example: john@company.com
   - Used for EMAIL channel testing

3. **Phone Number** (Required)
   - Phone number with country code
   - Example: +1234567890
   - Used for SMS and WHATSAPP testing

4. **Department** (Required)
   - Staff member's department
   - Select from dropdown
   - Example: "Marketing" or "Sales"

5. **Line of Business** (Required)
   - Business unit or product line
   - Select from dropdown
   - Example: "Retail Banking" or "Corporate Banking"

**Step 3: Save**
- Click "Add Recipient" button
- System validates all fields
- Recipient added with status "Active"
- Confirmation message displays

**System Records:**
- Status: Set to "Active" automatically
- Added Date: Current timestamp
- Added By: Current logged-in user

---

### Removing Recipients from Seed List

**Step 1: Locate Recipient**
- Find recipient in Seed List table
- Use search or filters to locate
- View recipient row in table

**Step 2: Remove Recipient**
- Click "Remove" button (trash icon) for recipient
- Confirmation message appears
- System soft-deletes recipient from list

**Step 3: Track Removal**
- Status changes to "Inactive"
- Removed date is recorded
- Removed by user is recorded
- Historical record is maintained

**System Records:**
- Status: Changed to "Inactive"
- Removed Date: Current timestamp
- Removed By: Current logged-in user
- Original Details: Retained for history

---

### Searching & Filtering Recipients

#### Search Functionality

**Search by Name:**
- Enter recipient's first or last name
- Results update in real-time
- Partial name matches work

**Search by Email:**
- Enter recipient's email address
- Results update as you type
- Supports partial email matches

**Search by Phone:**
- Enter recipient's phone number
- Results update in real-time
- Supports partial number matches

#### Filtering

**By Department:**
- Filter recipients by specific department
- Select from dropdown of departments
- Shows only recipients in selected department
- Combine with search for more precision

**By Line of Business:**
- Filter recipients by business unit
- Select from dropdown of available LOBs
- Shows only recipients in selected LOB
- Example: "Retail Banking", "Corporate Banking"

**By Status:**
- Show Active recipients only
- Show Inactive recipients only
- Show both Active and Inactive
- Track removed recipients separately

**Combining Filters:**
- Use multiple filters together
- Example: Show Active recipients in "Marketing" department
- Example: Search "John" in "Retail Banking" with Active status

---

## Using Seed Lists in Campaigns

### Seed List Mode Configuration

When setting up a campaign audience, you choose how to apply seed lists:

#### Apply to All Segments

**Use When:**
- Single seed list for entire campaign
- All segments use same test recipients
- Simple testing workflow
- Global validation needed

**Configuration:**
- Select "Apply seed list to all segments"
- Choose seed lists to apply
- Same seed list recipients test all segments
- Single test results for campaign

#### Apply Per Segment

**Use When:**
- Different test recipients per segment
- Segment-specific validation needed
- Multiple teams testing different segments
- Complex campaigns with diverse segments

**Configuration:**
- Select "Apply seed list per segment"
- Configure seed lists for each segment separately
- Different recipients test different segments
- Segment-specific test results

---

### Sending Test Messages

**Step 1: Prepare Campaign**
- Create and configure campaign
- Navigate to campaign preview step
- Review campaign configuration

**Step 2: Configure Seed List**
- Confirm seed list mode (all or per-segment)
- Verify seed lists selected
- Check recipient count

**Step 3: Send Test**
- Click "Send Test" button
- Campaign messages sent to seed list recipients
- System shows test progress
- Track delivery status

**Step 4: Review Results**
- See test delivery status (success/failed)
- Review seed list recipients who received test
- Identify any delivery issues
- Verify message content received correctly

**Step 5: Proceed or Fix**
- If successful: Launch campaign to customers
- If issues found: Revise campaign, resend test
- Repeat until satisfied with results

---

## Test Message Content

Seed list test messages include:

**Email Testing:**
- Full email content as it will appear to customers
- Personalization variables populated with test data
- All links and CTAs active
- HTML/plain text rendering
- Mobile rendering preview

**SMS Testing:**
- Full SMS message text
- Character count and segments
- Personalization variables populated
- Message timing and delivery

**Multi-Channel:**
- Each channel tested independently
- Verify channel-specific formatting
- Test dynamic content per channel
- Validate channel-specific personalization

---

## Best Practices

### Building Your Seed List

**Representative Coverage**
- Include team members from each department
- Cover different roles and levels
- Represent key business units
- Include both power users and casual users

**Diverse Devices**
- Include different email clients
- Test on different devices/OS
- Cover mobile and desktop
- Test on various platforms

**Contact Information**
- Maintain accurate and current contact info
- Update phone numbers with country codes
- Keep email addresses active
- Verify accessibility for testing

**Organization**
- Group by department/team
- Maintain by line of business
- Remove inactive staff
- Regularly audit and update

### Testing Practices

**Systematic Approach**
- Test all campaigns before launch
- Don't skip seed list step
- Include in approval workflow
- Document test results

**Comprehensive Validation**
- Check content accuracy
- Verify all links work
- Test personalization
- Validate formatting
- Check for broken images

**Review Process**
- Have department heads review
- Get multiple perspectives
- Document any issues found
- Require fixes before customer send

**Documentation**
- Track test send dates
- Record any issues found
- Note approvals
- Maintain audit trail

---

## Common Use Cases

### Use Case 1: Campaign Pre-Launch Testing

**Scenario:** Marketing campaign ready for customer deployment

**Workflow:**
1. Prepare campaign with content, audience, channels
2. Select Marketing and Sales staff as seed list
3. Send test to ~10 staff members
4. Marketing director reviews email content
5. Sales team reviews SMS formatting
6. Both approve in Slack
7. Launch to 50,000 customers with confidence

**Benefit:** Catch typos, broken links, formatting issues before customer delivery

---

### Use Case 2: Template Validation

**Scenario:** New email template first use

**Workflow:**
1. Create campaign using new template
2. Send test to diverse seed list recipients
3. Collect feedback on rendering across devices
4. Note issues in Gmail, Outlook, Apple Mail, etc.
5. Fix template issues
6. Resend test to verify fixes
7. Approve template for broader use

**Benefit:** Validate template works across all major clients before use in campaigns

---

### Use Case 3: Personalization Verification

**Scenario:** Campaign with complex personalization variables

**Workflow:**
1\. Build campaign with personalization (`{first_name}`, `{product_name}`, etc.)
2\. Send test with multiple seed recipients
3\. Verify each variable populated correctly
4\. Check for edge cases (missing data, special characters)
5\. Verify conditional logic works
6\. Confirm all branches of logic tested

**Benefit:** Ensure personalization variables work correctly before reaching customers

---

### Use Case 4: Multi-Channel Consistency

**Scenario:** Omnichannel campaign across Email, SMS, and Push

**Workflow:**
1. Prepare campaign with Email, SMS, Push versions
2. Send test to seed list
3. Verify Email formatting and content
4. Verify SMS text length and formatting
5. Verify Push notification display
6. Ensure consistent branding across channels
7. Verify cross-channel personalization

**Benefit:** Ensure consistent experience across all channels

---

## Troubleshooting

### Cannot Find Recipient to Add

**Issue:** Staff member doesn't appear when adding
- **Cause:** May need to create staff record first
- **Solution:** Verify staff member exists in system
- **Check:** Confirm department and LOB assignments
- **Alternative:** Add staff member to system first

### Seed List Recipients Not Receiving Tests

**Issue:** Test messages not delivered to seed recipients
- **Cause:** Email/SMS delivery issues, invalid contact info, inactive status
- **Solution:** Verify contact information is correct
- **Check:** Ensure recipient status is "Active"
- **Verify:** Test with single recipient first to isolate issue
- **Investigation:** Check delivery logs for bounces/failures

### Recipient Status Shows Inactive

**Issue:** Previously active recipient now shows inactive
- **Cause:** Recipient was removed or marked inactive
- **Solution:** Check if recipient was removed
- **Action:** Re-add recipient if needed
- **Prevention:** Review seed list regularly and re-add removed staff

### Test Messages Not Matching Campaign

**Issue:** Test message content differs from what was sent
- **Cause:** Campaign configuration changed after test, caching issue
- **Solution:** Resend test after confirming campaign config
- **Check:** Clear any cached content
- **Prevention:** Resend test immediately before customer launch

### Wrong Recipients Receiving Tests

**Issue:** Unexpected people received test messages
- **Cause:** Seed list included unintended recipients, configuration error
- **Solution:** Review seed list assignments
- **Check:** Verify correct seed list selected for campaign
- **Prevention:** Review seed list before sending test

---

## Related Documentation

- [Campaigns](../campaigns/campaigns-list) - Campaign creation with seed list testing
- [Campaign Reports](../analytics/campaign-reports) - Campaign performance tracking
- [Manual Communications](../manual-actions/manual-communications) - Testing manual broadcasts
- [Communication Policies](./campaign-communication-policy) - Policy framework for communications
