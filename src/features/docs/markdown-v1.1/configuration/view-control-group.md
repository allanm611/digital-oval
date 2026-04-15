# View Control Group Details

## Overview

The Control Group Details page shows comprehensive information about a specific control group, including its configuration and member management.

## Accessing the Details Page

1. Go to **Configuration** → **Universal Control Groups**
2. Click the **View** icon (eye) on any control group in the list
3. Or click the control group name to open its details page

## Page Sections

### Header Section

**Back Button**
- Returns you to the Control Groups list
- Shows breadcrumb navigation

**Action Buttons**
- **Edit**: Modify the control group configuration
- **Delete**: Remove the control group (confirmation required)

### Overview Card

Displays the control group's basic information:
- **Control Group Name**: Name of the control group
- **Customer Base**: Source type (Active Subscribers, All Customers, or Custom Conditions)
- **Status Badge**: Active or Inactive indicator
- **Percentage**: Percentage of audience in the group
- **Member Count**: Total number of members

### Information Section

This section displays metadata about the control group:

**Control Group Code** - Unique identifier for the control group

**Name** - The control group's display name

**Description** - Purpose and details about the control group

**Status** - Shows Active or Inactive

**Customer Base** - Source: Active Subscribers, All Customers, or Custom Conditions

**Percentage** - Percentage of audience in the group

**Generation Method** - Random or Stratified selection method

**Is Universal** - Whether the group is available system-wide

**Recurrence** - Generation frequency (One-time, Daily, Weekly, Monthly)

### Timeline Section

Shows the control group's history:

**Created**
- Date and time the control group was created

**Last Updated**
- Date and time of the most recent modification

## Members Management

### Members List

Displays paginated list of members in the control group with:
- **Member Information** - Subscriber details
- **Actions** - Remove member button

Pagination shows 10 members per page. Use pagination controls to navigate between pages.

### Add Members

Click the **Add Members** button to manually add customers to the control group:

1. A modal opens showing available subscribers
2. Select the subscribers to add
3. Click **Save** to add them to the group
4. The members list will be updated

**Note**: When adding members, already-included members are filtered out to prevent duplicates.

### Remove Members

Click the **Remove** button on any member to remove them from the group:

1. Confirm the removal when prompted
2. The member will be removed from the control group
3. The members count will be updated

## Editing a Control Group

To modify a control group's configuration:

1. Click the **Edit** button
2. The edit form opens with current settings
3. Modify any configuration fields
4. Click **Save** to update the control group
5. The page will refresh with updated information

## Deleting a Control Group

To remove a control group:

1. Click the **Delete** button
2. Confirm the deletion when prompted
3. The control group will be removed from the system
4. You'll be redirected to the Control Groups list

**Warning**: Deletion cannot be undone. Any campaigns using this control group may be affected.

## Control Group Status

The status indicator shows the current state of the control group:
- **Active**: The control group is enabled and can be used in campaigns
- **Inactive**: The control group is disabled

## Tips

- Regularly review member counts to ensure the control group maintains desired size
- Add or remove members manually if automated generation needs adjustment
- Check the timeline to see when the control group was last updated
- Use the customer base information to understand how members were selected
- Monitor the generation method to understand member selection behavior

## Related Pages

- [Control Groups Overview](/documentation/configuration/control-groups-overview)
- [Control Group List](/documentation/configuration/control-groups-list)
- [Create Control Group](/documentation/configuration/create-control-group)
