# View Data Connector Details

## Overview

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
- **Test Connection**: Verify the connector can connect to the target service
- **Edit**: Modify the connector configuration
- **Delete**: Remove the connector (confirmation required)

### Overview Card

Displays the connector's basic information:
- **Connector Name**: Name of the connector
- **Description**: Purpose and details about the connector
- **Status Badge**: Active or Inactive indicator
- **Type Badge**: Connector type (JDBC, API, TCP, etc.)
- **Connector Icon**: Visual representation of the connector type

### Connection Test Results

When you test a connection, the results are displayed here:
- **Success State**: Shows "Connection Successful" with a green checkmark
- **Failed State**: Shows "Test Failed" with details about the error
- **Response Time**: How long the connection test took (in milliseconds)

### Information Section

This section displays metadata about the connector:

**Connector ID** - Unique identifier for the connector

**Type** - The type of connector (JDBC, API, TCP, etc.)

**Status** - Shows Active or Inactive

**Created By** - Displays the user who created the connector

**Connection Count** - Shows the number of connections using this connector

**Last Connection Test** - Shows the result of the most recent test (Passed, Failed, Not tested yet)

### Configuration Section

Displays the connector's configuration settings in a structured format. The specific fields shown depend on the connector type.

### Timeline Section

Shows the connector's history:

**Created**
- Date and time the connector was created

**Last Updated**
- Date and time of the most recent modification

**Last Used** (if applicable)
- Date and time the connector was last actively used
- Only shown if the connector has been used

## Testing a Connection

To verify that your connector is working properly:

1. Click the **Test Connection** button at the top
2. The system will attempt to establish a connection
3. Results are displayed in the Connection Test Results section
4. For API and TCP connectors, response time is shown
5. Any error details will be displayed if the test fails

**Note**: The test connection button is only enabled for active connectors.

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

- Test your connection regularly to ensure it continues to work
- Check the timeline to see when the connector was last modified or used
- Monitor the connection count to understand usage patterns
- Keep the connector description up-to-date for team reference
- Delete unused connectors to keep your system clean

## Troubleshooting

**Connection Test Failed**
- Verify the target service is running and accessible
- Check network connectivity and firewall rules
- Verify all credentials are correct
- Check the configuration for typos or invalid values

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
