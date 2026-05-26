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


### Create/Edit Modal
![Create Data Connector Modal](/img/v1.1/infrastructure/createdataconnector.png)

Configuration fields vary based on the selected connector type. The form will show relevant fields once you select a type.

#### JDBC Configuration
- **Database Type**: Select (MySQL, PostgreSQL, MSSQL, Oracle)
- **Host**: Database server hostname
- **Port**: Database port (optional)
- **Username**: Database user
- **Password**: Database password
- **Database**: Database name
- **Query Timeout (ms)**: Timeout for queries
- **Select Query**: Sample query to validate the connection

#### API Configuration
- **URL**: API endpoint URL
- **Host**: API server hostname
- **Method**: POST or GET
- **Username**: Authentication username (optional)
- **Password**: Authentication password/token (optional)
- **Content Type**: JSON, XML, or Query String
- **Response Timeout (sec)**: How long to wait for response
- **Thread Count**: Number of concurrent threads
- **Messages Per Second**: Rate limiting setting
- **Request Headers**: Custom headers for API calls

#### TCP Configuration
- **Buffer Size**: Size of the buffer
- **Decoder**: Message decoder type
- **Socket Timeout (ms)**: Connection timeout
- **Non Blocking I/O**: Enable non-blocking I/O
- **Reverse Lookup**: Enable reverse DNS lookup
- **Direct Buffers**: Use direct buffers

#### WebSocket Configuration
- **HTTP Path**: WebSocket endpoint path
- **Username**: Authentication username (optional)
- **Password**: Authentication password (optional)

#### Kafka Configuration
- **Brokers**: Comma-separated list of broker addresses (e.g., kafka-1:9092,kafka-2:9092)
- **Topic Name**: Kafka topic to subscribe to
- **Group Identifier**: Consumer group identifier
- **Transactional Mode**: Disabled, Enabled, or Auto

#### Files Configuration
- **Protocol**: local, ftp, or sftp
- **Input Path**: Source file path
- **Output Path**: Destination file path
- **Regex Pattern**: Pattern to match files (e.g., vou_*)
- **Recharge Event**: Event identifier
- **SSL Enabled**: Enable SSL for SFTP connections

#### SMS Inbox Configuration
- **Provider**: SMS provider (MTN, Inbox, Test)
- **Inbox ID**: Provider inbox identifier
- **Filter by Keyword**: Enable keyword filtering
- **Keyword Identifier**: Delimiter for keyword identification
- **Keyword Condition**: Condition to match on keyword
- **Keyword Value**: Value to match

## Saving the Connector

1. Fill in all required fields (marked with *)
2. Click **Save** to create or update the connector
3. You'll see a success message and the form will close
4. The new connector will appear in the list

## Error Messages

**Validation Errors**
- "This field is required" - Fill in all required fields
- "Invalid format" - Check the field format (e.g., URL format, port number)

**Save Errors**
- Check that all required fields are filled in
- Ensure configuration values are in the correct format

## Tips

- Start with the basic information (name and type) before entering configuration details
- Use descriptive names that indicate the connector's purpose
- For database connectors, ensure network access to the database server
- For API connectors, verify the endpoint URL is correct
- Save a copy of connection configuration details in a secure location for future reference

## Next Steps

After creating a connector, you can:
- View its details on the [Connector Details](/documentation/infrastructure/view-data-connector) page
- Edit or delete it from the connector list
- Test the connection on the details page

## Related Pages

- [Data Connectors Overview](/documentation/infrastructure/data-connectors-overview)
- [Data Connectors List](/documentation/infrastructure/data-connectors-list)
- [View Data Connector Details](/documentation/infrastructure/view-data-connector)
