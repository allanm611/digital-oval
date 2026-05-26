# Create Data Connector

## Overview

Create and configure new data connectors to integrate external data sources and services with your system. You can also edit existing connectors using the same form.

## Opening the Create Form

There are two ways to open the create form:

1. **From the List Page**: Click the **Create** button in the top right of the Data Connectors list
2. **Edit Existing**: Click the **Edit** action on any connector in the list

## Form Fields

### Basic Information

**Connector Name** (Required)
- A unique, descriptive name for your connector
- Example: "Production PostgreSQL", "Stripe Payment API"

**Connector Type** (Required)
- Select the type of connector:
  - JDBC (Relational databases)
  - API (HTTP/HTTPS endpoints)
  - TCP (TCP sockets)
  - WebSocket (WebSocket connections)
  - Kafka (Kafka message broker)
  - Files (File systems)
  - SMS Inbox (SMS providers)

**Description** (Optional)
- Additional details about the connector's purpose
- Example: "Main production database for customer data"

**Connection Profile** (Optional)
- Link this data connector to a specific Connection Profile
- The Connection Profile contains the actual connection details, credentials, and type-specific configuration
- If not selected during creation, it can be assigned later

### Create/Edit Modal
![Create Data Connector Modal](/img/v1.2.4/createdataconnectormodal.png)

## Connection Configuration

The Data Connector form only requires the basic information (Name, Type, Description, and optional Connection Profile link). 

**Detailed connection configuration** (such as database credentials, API endpoints, authentication details, performance settings, and type-specific options) is configured in the **Connection Profile**, not in the Data Connector form.

To configure connection details:

1. Create or select a Connection Profile with your desired connection type
2. In the Connection Profile, configure:
   - Connection type-specific settings (JDBC, API, TCP, WebSocket, Kafka, Files, SMS Inbox)
   - Performance and reliability settings (batch size, parallel threads, timeouts, retries)
   - Data governance settings (classification, PII flags, GDPR compliance)
   - Advanced settings (encryption, health checks, metadata)
3. Link the Connection Profile to your Data Connector via the **Connection Profile** field

## Saving the Connector

1. Fill in the required fields (Name and Type marked with *)
2. (Optional) Add a Description to explain the connector's purpose
3. (Optional) Link a Connection Profile if you already have one created
4. Click **Save** to create or update the connector
5. You'll see a success message and the form will close
6. The new connector will appear in the list

## Error Messages

**Validation Errors**
- "This field is required" - Fill in Name and Type
- "Invalid data" - Check your input format

**Save Errors**
- Ensure Name and Type are both provided
- Verify the selected Connection Profile exists (if linking one)

## Tips

- Use descriptive, meaningful names that indicate the connector's purpose or source (e.g., "Production Customer DB", "Stripe Payments API")
- You can create the Data Connector first with just Name and Type, then link a Connection Profile later
- The actual connection details and credentials should be configured in the Connection Profile, not here
- Consider whether you need to create a Connection Profile first before linking it

## Next Steps

After creating a connector, you can:
- Create or link a [Connection Profile](/documentation/infrastructure/create-connection-profile) with the actual connection details
- View its details on the [Connector Details](/documentation/infrastructure/view-data-connector) page
- Edit or delete it from the connector list
- Test the connection once a Connection Profile is linked

## Related Pages

- [Data Connectors Overview](/documentation/infrastructure/data-connectors-overview)
- [Data Connectors List](/documentation/infrastructure/data-connectors-list)
- [View Data Connector Details](/documentation/infrastructure/view-data-connector)
- [Create Connection Profile](/documentation/infrastructure/create-connection-profile)
- [Connection Profiles Overview](/documentation/infrastructure/connection-profiles)
