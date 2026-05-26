---
title: Manage Seed List Recipients
---

# Manage Seed List Recipients

## Overview

The Seed List Recipients tab displays all recipients across all seed lists. You can search, filter, and manage individual recipient memberships from this view.

## Accessing Seed List Recipients

1. Go to **Configuration → Seed List Management**
2. Click the **Seed List Recipients** tab to view all seed list recipients

The Seed List Recipients tab displays a list of all recipients with the following information:

![Seed List Recipients Tab](/img/v1.2.4/seedlist-recipinetstablist.png)

**Name** - Recipient's name

**Email** - Email address or phone number

**Seed List** - Which seed list they belong to

**Status** - Recipient status:
- **Active** - Recipient can receive test messages
- **Inactive** - Recipient has been removed
- **Pending** - Recipient addition is waiting to be processed
- **Processing** - Recipient is being added to the system
- **Completed** - Recipient has been successfully added
- **Failed** - Recipient could not be added

**Added Date** - When the recipient was added

## Search and Filtering

### Search

Use the search box to find recipients by name, email, or phone number. The search is performed as you type.

### Filters

Click the filter dropdowns to filter recipients by:

- **Seed List** - Filter by which seed list they belong to
- **Status** - Filter by recipient status (Active, Inactive, Pending, Processing, Completed, Failed)

## Adding Recipients to Seed List

Click the **Add Members** button to add recipients to a seed list.

**Two Ways to Add Recipients:**

### Option 1: Add Existing System Users

![Add Existing User Tab](/img/v1.2.4/addexistingusertabforseedlistrecipient.png)

1. Select **Existing User** mode
2. Select the **Seed List** to add them to
3. Search for users by name or email
4. Select the **Line of Business** (if required)
5. Click checkboxes to select one or more users
6. Already-added users are filtered out to prevent duplicates
7. Click **Add** to add them to the seed list

### Option 2: Add External Recipients

![Add External User Tab](/img/v1.2.4/addexternalusertabforseedlistrecipient.png)

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

## Removing Recipients from Seed List

### Single Removal

Click the **Remove** button on any recipient row to remove them from the seed list.

**What Happens:**
- Status changes from Active to Inactive
- Removal date and time is recorded
- User who removed them is recorded
- Historical record is maintained for audit purposes

## Recipient Status

- **Active** - Recipient is currently in the seed list and can receive test messages. They will be included when you send campaign tests.
- **Inactive** - Recipient was previously in the seed list but has been removed. They will not receive test messages.
- **Pending** - Recipient addition is waiting to be processed by the system.
- **Processing** - Recipient is being added to the system.
- **Completed** - Recipient has been successfully added.
- **Failed** - Recipient could not be added; check for validation errors in name, email, or phone format.

## Tips

- Use search to quickly find specific recipients
- Use filters to focus on active recipients or specific seed lists
- Monitor failed recipients to ensure they were added correctly
- Remove inactive staff and add new team members promptly
- Use external recipients for testing with non-staff users (partners, vendors, etc.)

## Related Pages

- [Seed List Management Overview](/documentation/configuration/seed-list-management-overview)
- [Manage Seed Lists](/documentation/configuration/seed-list-management-lists)
