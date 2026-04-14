# View QuickList Details

## Overview

The QuickList Details page displays complete information about a specific QuickList including its metadata, member data, import history, and actions you can take. This page provides a comprehensive view of your QuickList and allows you to manage its usage.

![QuickList Details Page](/img/segments-img/quicklistdetailsoverviewtab.png)

## Page Header and Actions

The top of the page includes navigation and action buttons:

**Back Button**
- Returns you to the QuickList List or previous location
- Shows breadcrumb navigation

**Edit QuickList**
- Opens a modal to update the QuickList name and description
- Only the name and description can be edited
- Requires appropriate permissions

**Send Communication**
- Opens a modal to send SMS, email, or other communications to all members of this QuickList
- Allows you to select communication type and template
- Useful for bulk messaging to a specific customer group

**More Menu** (⋯)
- Additional actions including:
  - **Download Members** - Export the list of all members as a CSV file
  - **Delete QuickList** - Permanently removes the QuickList from the system (requires confirmation)

## Basic Information Section

Contains core QuickList metadata:

**QuickList Name**
- The name you gave this list
- Used for identification in lists, segments, and campaigns

**Description**
- Summary of the list's purpose and usage
- May be empty if no description was provided

**Total Members**
- Count of how many customers are in this QuickList
- Displayed prominently for quick reference
- Updated when the list is imported or modified

**Upload Type**
- The format type used when importing this list
- Determines how the file was parsed (Generic, Standard, Custom, etc.)
- Cannot be changed after creation

**Created Date**
- When the QuickList was first created
- Formatted with full date and time

**Last Updated**
- When the QuickList was last modified
- Includes both data updates and metadata changes

---

## Tabs/Sections

The QuickList Details page is organized into different sections/tabs:

### Overview Tab

Displays the basic information above plus a summary of the list:
- List metadata (name, description, member count)
- Upload information (type, creation date)
- Quick action buttons
- Upload configuration details

**Upload Configuration Details (Display Only):**
- **Subscriber ID Column:** The original column name used for matching customers
- **Field Mapping:** How the column maps to your customer identity fields
- **File Delimiter:** The delimiter used in the original upload (comma, tab, etc.)
- **List Headers:** All column headers from the original file

### Data Tab

![QuickList Data Tab](/img/segments-img/quicklistdetaildatatab.png)

Displays a paginated table of all members in the QuickList:

**Member Data Table**
- Shows rows of customer data from your uploaded file
- Columns depend on what was in your original file
- Typically includes customer identifier and additional fields
- Pagination controls at bottom for navigating large lists

**Pagination Controls**
- Shows current page and total count
- "Previous" and "Next" buttons for navigation
- Jump to specific page
- Change rows per page (10, 25, 50, etc.)

**Viewing Data:**
1. Click on the **Data** tab
2. The system loads the first page of members
3. Scroll right to see additional columns if needed
4. Use pagination to browse through members
5. Click a member row for more details (if available)

**Export Data:**
- Click "Download Members" button to export as CSV
- Exported file contains all members in your original format
- Useful for external analysis or sharing

### Import Logs Tab

![Import Logs Tab](/img/segments-img/quicklistsdetailimportlogstab.png)

Displays the history of imports and updates for this QuickList:

**Log Entries**
- Shows each time the list was imported or updated
- Columns typically include:
  - **Date** - When the import occurred
  - **Status** - Success, Failed, or In Progress
  - **Rows Imported** - How many customer records were added
  - **Rows Failed** - How many rows had errors (if any)
  - **Message** - Details about the import result

**Interpreting Logs:**
- **Green/Success:** All rows imported successfully
- **Yellow/Partial:** Some rows imported, others had errors
- **Red/Failed:** Import failed completely

**Using Logs for Troubleshooting:**
1. Check if the latest import was successful
2. See how many members were added
3. Identify any import errors from previous attempts
4. Verify the import date matches when you uploaded the file

## Actions and Features

### Send Communication to QuickList

![Send Communication to QuickList](/img/segments-img/quicklistdetailsendcommunicaiton.png)

Send a bulk message (SMS, Email, Push Notification) to all members of this QuickList.

**Steps:**
1. Click **Send Communication** button
2. Select communication type (SMS, Email, Push, etc.)
3. Select a message template or create a custom message
4. Configure delivery options:
   - Schedule for later or send immediately
   - Personalization fields (insert customer name, etc.)
   - Language selection
5. Review recipient count (all members in list)
6. Click **Send** to execute

**Use Cases:**
- Send exclusive offers to a VIP list
- Send follow-up messages after an event
- Send important notifications to opted-in customers
- Send promotional content to a specific audience

### Edit QuickList Metadata

Update the QuickList name and description without changing the underlying data.

**Steps:**
1. Click **Edit QuickList** button
2. Modify Name and/or Description
3. Click **Save Changes**
4. Metadata is updated immediately

### Download Members

Export all members in your QuickList as a CSV file for external use.

**Steps:**
1. Click "More" menu (⋯)
2. Select **Download Members**
3. CSV file downloads automatically
4. Contains all columns from your original file
5. All members are included

**Uses:**
- Import into another system
- Share with external partners
- Backup your data
- Analyze in Excel or other tools

### Delete QuickList

Permanently remove this QuickList from the system.

<!-- **Important:**
- This action cannot be undone
- Segments and campaigns referencing this list will no longer function properly
- Check what's using this list before deleting
- Consider archiving instead of deleting if you might need it later -->

<!-- **Steps:**
1. Click "More" menu (⋯)
2. Select **Delete QuickList**
3. Confirm deletion in the dialog
4. QuickList is permanently removed
5. All members are deleted -->

<!-- **Before Deleting:**
1. Check if any segments use this list
2. Check if any campaigns reference this list
3. Consider renaming to "ARCHIVED" instead
4. Download members first if you need a backup -->

