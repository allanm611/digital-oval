# Data Connector List

## Overview

The Data Connector List provides a comprehensive view of all connectors in your system. You can search, filter, and manage your connectors from this page.

## Page Layout

### Header Section
- **Title**: Data Connectors
- **Description**: Manage connector configurations and monitor integration health
- **Create Button**: Click to create a new data connector

### Statistics Cards
The page displays four statistics cards showing:
- **Total Connectors**: Total number of data connectors in the system
- **Active**: Number of currently active connectors
- **Total Connections**: Total number of connections using these connectors
- **Connector Types**: Number of different connector types in use

## Search and Filtering

### Search
Use the search box to find connectors by name. The search is performed as you type.

### Filters
Click the **Filters** button to open the filter panel where you can filter by:
- **Status**: All, Active, or Inactive
- **Connector Type**: All, or select a specific type (TCP, WebSocket, Kafka, JDBC, SMS Inbox, API, Files)

Active filters are indicated by a red badge on the Filters button.

### Reset Filters
Click "Reset Filters" in the filter panel to clear all active filters.

## Connector Table

The connector table displays the following information:

**Connector** - Shows the connector name with an icon representing its type

**Status** - Displays Active or Inactive status

**Type** - Shows the type of connector (JDBC, API, TCP, etc.)

**Connections** - Shows the number of active connections using this connector

**Last Used** - Shows the date when the connector was last used

**Actions** - Provides View, Edit, and Delete buttons for each connector

## Actions

### View Details
Click the **View** icon (eye) to open the connector details page to see full configuration and metadata.

### Edit
Click the **Edit** icon (pencil) to modify the connector configuration. This opens the edit form in a modal dialog.

### Delete
Click the **Delete** icon (trash) to remove a connector. You'll be asked to confirm the deletion.

## Pagination

If there are many connectors, the list is paginated with 15 connectors per page. Use the pagination controls at the bottom to navigate between pages.

## Tips

- Use filters to quickly find connectors by type or status
- Search by connector name to find specific connectors
- Check the **Status** column to identify inactive connectors
- Monitor **Connections** to see which connectors are actively in use

## Related Pages

- [Data Connectors Overview](/documentation/infrastructure/data-connectors-overview)
- [Create Data Connector](/documentation/infrastructure/create-data-connector)
- [View Data Connector Details](/documentation/infrastructure/view-data-connector)
