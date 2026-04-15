# Create a Notification Type

Create a new notification type to define system events that should generate notifications to users.

## Opening the Create Form

From the [Notification Type List](/documentation/configuration/notification-types-list), click the **Create** button in the top right.

A form opens with the title: **Create New Notification Type**

## Notification Type Information

### Notification Type Name

**Required**

- Text input field
- The readable name of the notification type
- Examples: "Campaign Approval Request", "Segment Computation Completed", "Offer Status Changed", "Campaign Execution Started"
- This name is displayed to users in their notification preferences

### Description

**Optional**

- Multi-line text area
- Explain what triggers this notification and why users would care
- Examples: "Sent when a campaign requires approval from a manager", "Sent when a segment has finished computing", "Sent when an offer status changes"

### Message Template

**Required**

- Multi-line text area
- The message content template for notifications of this type
- Can include dynamic variables based on the trigger context
- This message is what users see when they receive the notification

## Notification Configuration

### Table Name

**Required**

- Select the database table that triggers this notification
- Common options: campaigns, segments, offers, products, users, jobs
- Determines what system action generates this notification type

### Action Type

**Required**

- Select the type of action that triggers the notification
- Options:
  - **CREATE** - Notification triggered when a new record is created
  - **UPDATE** - Notification triggered when a record is updated
  - **DELETE** - Notification triggered when a record is deleted
- Example: A "Campaign Created" notification would use "campaigns" table with "CREATE" action

## Modal Actions

**Cancel**
- Closes the form without saving
- Any entered data is lost

**Save**
- Submits the notification type
- Form validates required fields before saving
- Shows success message on successful creation
- Returns to the notification type list

## Validation

The form validates:
- **Notification Type Name** is required
- **Table Name** is required
- **Action Type** is required
- **Message Template** is required

If validation fails, an error message appears. Correct the issues and try again.

## Save Behavior

On successful save:
1. Notification type is created and assigned an ID
2. Status defaults to Active
3. You are returned to the Notification Type List
4. The new notification type appears in the list
5. Users can immediately subscribe/unsubscribe to this notification type in their preferences

## Tips

- Use clear, descriptive names that explain what the notification is about
- Write helpful descriptions so users understand when they'll receive notifications
- Test the message template with sample data to ensure it displays properly
- Create notification types for all important system events
- Consider grouping related notification types by table (e.g., all campaign-related notifications together)
- Keep message templates concise but informative
- Include relevant context in the message template (e.g., campaign name, segment name)
- Coordinate with your user team on which notification types should be created
