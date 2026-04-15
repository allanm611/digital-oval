# Seed List Management Overview

Seed List Management allows you to maintain a list of internal staff members who receive test copies of campaigns for quality assurance before sending to actual customers. This enables you to validate content, test delivery, and verify personalization before customer launch.

![Seed List Management Page](/img/v1.1/configuration/seedlistmanagementpage.png)

## What are Seed Lists?

Seed Lists allow you to:

- **Test Campaigns** - Send test messages to internal staff before customer launch
- **Validate Content** - Verify message formatting, content, and personalization
- **Test Delivery** - Confirm messages deliver correctly across channels
- **Track Staff** - Organize test recipients by department and line of business

## Managing Seed List Recipients

Navigate to **Configuration → Seed List Management** to manage all test recipients.

### Viewing Seed List Recipients

The seed list displays all test recipients with:

- **Name** - Staff member's name
- **Email** - Email address for email testing
- **Phone** - Phone number with country code for SMS/USSD testing
- **Department** - Staff member's department
- **Line of Business** - Business unit affiliation
- **Status** - Active (can receive tests) or Inactive (removed)
- **Added Date** - When the recipient was added
- **Added By** - User who added them

You can:

- **Search** - Find recipients by name, email, or phone number
- **Filter by Department** - Filter by department assignment
- **Filter by Line of Business** - Filter by business unit
- **Filter by Status** - Show active, inactive, or all recipients

### Adding Members to Seed List

Click the **Add Members** button to add users to the seed list.

![Add Seed List Members Modal - Part 1](/img/v1.1/configuration/addseedlistmodalimage1.png)

![Add Seed List Members Modal - Part 2](/img/v1.1/configuration/addseedlistmodalimage2.png)

**How to Add Members:**

1. Use the search box to find users by name, email, or phone number (pulled from the system users list).
2. Filter users by department, line of business, or status.
3. Select one or more users using the checkboxes (multi-select supported).
4. Already-added users are filtered out to prevent duplicates.
5. Click **Save** to add the selected users to the seed list.

The system will:

- Set status to Active
- Record the current date and time
- Record the user who added them

### Removing Recipient from Seed List

Click **Remove** on any recipient to remove them from the seed list.

The system will:

- Change status from Active to Inactive
- Record the removal date and time
- Record the user who removed them
- Keep the historical record for tracking purposes

## Recipient Status

**Active Status** - Recipient can receive test messages. Include them when sending campaign tests.

**Inactive Status** - Recipient is no longer active. They will not be sent test messages. Historical records are kept for audit purposes.

## Using Seed List in Campaigns

When creating a campaign, you can send test messages to seed list recipients to validate the campaign before sending to customers.
