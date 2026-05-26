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
