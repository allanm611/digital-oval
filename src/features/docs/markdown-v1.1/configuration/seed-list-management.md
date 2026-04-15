# Seed List Management Overview

Seed List Management allows you to maintain a list of internal staff members who receive test copies of campaigns for quality assurance before sending to actual customers. This enables you to validate content, test delivery, and verify personalization before customer launch.

## What are Seed Lists?

Seed Lists allow you to:

- **Test Campaigns** - Send test messages to internal staff before customer launch
- **Validate Content** - Verify message formatting, content, and personalization
- **Test Delivery** - Confirm messages deliver correctly across channels
- **Track Staff** - Organize test recipients by department and line of business

## Managing Seed List Recipients

### Creating a Seed List

To create a new seed list, use the create list option:

![seedlisttabimage](/img/v1.1/configuration/seedlisttabimage.png)

![seedlisttabimage](/img/v1.1/configuration/createtestseedlist.png)


Navigate to **Configuration → Seed List Management** to manage all test recipients.

![recipienttablistseedlist](/img/v1.1/configuration/recipienttablistseedlist.png)

### Viewing Seed List Recipients

The seed list table displays these columns:

![Recipient Tab List](/img/v1.1/configuration/recipienttablistseedlist.png)

- **Name** – Staff member's name
- **Email** – Email address for test messages
- **Test List** – The list/group the staff belongs to
- **Status** – Active or Inactive
- **Actions** – Remove or delete recipient

You can:

- **Search** by name or email
- **Filter** by test list or status

### Adding Members to Seed List

To add a recipient to a seed list, use the add member modal:

![Create Seed List Modal](/img/v1.1/configuration/createrecipientseedlist.png)

Click the **Add Members** button to add users to the seed list.

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
