---
title: Seed List Management
---

# Seed List Management

Seed List Management allows you to maintain a list of internal and external recipients who receive test copies of campaigns for quality assurance before sending to actual customers. This enables you to validate content, test delivery, and verify personalization before customer launch.

## What are Seed Lists?

Seed Lists allow you to:

- **Test Campaigns** - Send test messages to staff before customer launch
- **Validate Content** - Verify message formatting, content, and personalization
- **Test Delivery** - Confirm messages deliver correctly across channels
- **Add Recipients** - Include both system users and external email/phone contacts
- **Organize Recipients** - Group recipients by seed list for different testing needs

## Accessing Seed List Management

Navigate to **Configuration → Seed List Management** to manage all seed lists and recipients.

The interface has two tabs:
- **Seed Lists** - Create and manage seed lists
- **Seed List Recipients** - Manage recipients and view their details

## Managing Seed List Recipients

## Seed Lists Tab

The Seed Lists tab displays all your seed lists with the following information:

**List Name** - Name of the seed list

**Description** - Optional description of the seed list's purpose

**Recipient Count** - Number of recipients in this seed list (clickable to view members)

**Status** - Processing status:
- **Pending** - List creation is queued
- **Processing** - List operations are in progress
- **Completed** - List operations finished successfully
- **Failed** - List operations encountered errors

### Creating a Seed List

Click the **Create List** button:

1. A modal opens with form fields
2. Enter the **List Name** (required)
3. Enter an optional **Description**
4. Click **Create** to add the seed list

### Viewing List Members

Click on the **recipient count** for any seed list to open a modal displaying all members in that list:

1. The modal shows all recipients in the selected seed list
2. View recipient details and status
3. Click **Remove** on any recipient to remove them from the list
4. Close the modal to return to the lists view

### Deleting a Seed List

Click the **Delete** button (trash icon) on any seed list row:

1. Confirm the deletion when prompted
2. The seed list and its recipients will be removed
3. Deletion cannot be undone

## Seed List Recipients Tab

The Seed List Recipients tab displays all recipients across all seed lists:

**Name** - Recipient's name

**Email** - Email address or phone number

**Seed List** - Which seed list they belong to

**Status** - Recipient status:
- **Active** - Recipient can receive test messages
- **Inactive** - Recipient has been removed
- **Pending** - Recipient addition is in progress
- **Processing** - Recipient record is being processed
- **Completed** - Recipient successfully added
- **Failed** - Recipient could not be added

**Added Date** - When the recipient was added

### Searching and Filtering Recipients

You can:

- **Search** by name, email, or phone number
- **Filter by Seed List** - Show recipients in a specific list
- **Filter by Status** - Filter by recipient status

## Adding Recipients to Seed List

Click the **Add Members** button to add recipients to a seed list.

**Two Ways to Add Recipients:**

### Option 1: Add Existing System Users

1. Select **Existing User** mode
2. Select the **Seed List** to add them to
3. Search for users by name or email
4. Select the **Line of Business** (if required)
5. Click checkboxes to select one or more users
6. Already-added users are filtered out to prevent duplicates
7. Click **Add** to add them to the seed list

### Option 2: Add External Recipients

1. Select **External Recipient** mode
2. Select the **Seed List** to add them to
3. Enter the **Name** (recipient's name)
4. Enter the **Email** address
5. Enter the **Phone Number** (optional, MSISDN format)
6. Click **Add** to add them to the seed list

**After Adding:**

The system will:
- Set status to Active
- Record the current date and time
- Record the user who added them
- Track the recipient in the system

### Removing Recipients from Seed List

**From Recipients Tab:**
Click **Remove** on any recipient row to remove them from the seed list.

**From List Members Modal:**
Open a seed list, click **Remove** on any member to remove them.

**What Happens:**
- Status changes from Active to Inactive
- Removal date and time is recorded
- User who removed them is recorded
- Historical record is maintained for audit purposes

## Recipient Status Overview

- **Active** - Recipient can receive test messages. They will be included when you send campaign tests.
- **Inactive** - Recipient has been removed from the seed list. They will not receive test messages.
- **Pending** - Recipient addition is waiting to be processed.
- **Processing** - Recipient is being added to the system.
- **Completed** - Recipient has been successfully added.
- **Failed** - Recipient could not be added; check for validation errors in name, email, or phone format.

## Using Seed Lists in Campaigns

When creating or editing a campaign, you can select seed lists to send test messages to before launching to actual customers. This allows you to:

- Preview how campaigns will appear to recipients
- Validate all personalization variables
- Test delivery across different channels
- Ensure content and formatting are correct
- Confirm sender IDs and reply URLs work properly

## Tips for Effective Seed List Management

- **Keep Lists Organized** - Create separate seed lists for different teams or testing purposes
- **External Recipients** - Use external recipient option for non-staff testing (partners, vendors, etc.)
- **Regular Updates** - Remove inactive staff and add new team members promptly
- **Multiple Seeds** - Include diverse recipients to test different scenarios
- **Monitor Status** - Check failed recipients to ensure they were added correctly
- **Active Recipients** - Periodically review and maintain your active recipient lists
