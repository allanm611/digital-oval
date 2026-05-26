
# View Data Connector Details

## Overview

![Data Connector Details Page](/img/v1.2.4/dataconnectordetailspage.png)

The Data Connector Details page shows comprehensive information about a specific connector, including its configuration, connection status, and usage history.

## Accessing the Details Page

1. Go to **Infrastructure** → **Data Connectors**
2. Click the **View** icon (eye) on any connector in the list
3. Or click the connector name to open its details page

## Page Sections

### Header Section

**Back Button**
- Returns you to the Data Connectors list
- Shows breadcrumb navigation

**Action Buttons**
- **Edit**: Modify the connector configuration
- **Delete**: Remove the connector (confirmation required)

### Overview Card

Displays the connector's basic information:
- **Connector Name**: Name of the connector
- **Description**: Purpose and details about the connector
- **Type Badge**: Connector type (JDBC, API, TCP, WebSocket, Kafka, Files, SMS Inbox)
- **Connector Icon**: Visual representation of the connector type
- **Connection Profile** (if linked): The Connection Profile that provides the actual connection details and configuration


### Information Section

This section displays metadata about the connector:

**Connector ID** - Unique identifier for the connector

**Type** - The type of connector (JDBC, API, TCP, WebSocket, Kafka, Files, SMS Inbox)

**Connector Name** - Descriptive name of the connector

**Description** - Purpose and details of this connector

**Connection Profile** - The linked Connection Profile that provides actual connection configuration and credentials
- Displays the Connection Profile name and ID
- Click to view the Connection Profile details

### Connection Profile Section

Shows the linked Connection Profile details and configuration:

If a Connection Profile is linked:
- **Profile Name** - Name of the Connection Profile
- **Profile Code** - Technical identifier
- **Connection Type** - The actual connection type (Database, API, Kafka, etc.)
- **Environment** - The environment this profile is valid for (Development, Staging, Production)
- **Data Load Method** - How data is loaded (Full, Incremental, Delta, CDC, Merge, Append, Upsert)
- **Configuration Details** - Type-specific settings like database credentials, API endpoints, authentication details

If no Connection Profile is linked:
- Shows a message indicating that no connection profile is currently associated
- Requires editing the connector to link a Connection Profile

### Timeline Section

Shows the connector's history:

**Created**
- Date and time the connector was created

**Last Updated**
- Date and time of the most recent modification

**Last Used** (if applicable)
- Date and time the connector was last actively used
- Only shown if the connector has been used

## Editing a Connector

To modify a connector's configuration:

1. Click the **Edit** button
2. The edit form opens in a modal dialog
3. Modify any configuration fields
4. Click **Save** to update the connector
5. The page will refresh with updated information

## Deleting a Connector

To remove a connector:

1. Click the **Delete** button
2. Confirm the deletion when prompted
3. The connector will be removed from the system
4. You'll be redirected to the Data Connectors list

**Warning**: Deletion cannot be undone. Any integrations using this connector may be affected.

## Connection Status

The status column indicates whether a connector is active:
- **Active** (green badge): The connector is enabled and can be used
- **Inactive** (gray badge): The connector is disabled

Only active connectors can be tested.

## Tips

- Check the timeline to see when the connector was last modified or used
- Monitor the connection count to understand usage patterns
- Keep the connector description up-to-date for team reference
- Delete unused connectors to keep your system clean

## Troubleshooting

**Cannot Edit Connector**
- Ensure you have the necessary permissions
- Contact your administrator if you cannot edit

**Cannot See Connection History**
- The connector hasn't been used yet
- Only shows history for connectors that have been actively used

## Related Pages

- [Data Connectors Overview](/documentation/infrastructure/data-connectors-overview)
- [Data Connectors List](/documentation/infrastructure/data-connectors-list)
- [Create Data Connector](/documentation/infrastructure/create-data-connector)
