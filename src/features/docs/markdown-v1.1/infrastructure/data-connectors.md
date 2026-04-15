# Data Connectors

Data Connectors is the infrastructure area for managing connector definitions used to access external data sources.

## Open The Module

Go to `Infrastructure -> Data Connectors`.

## What Connector Records Usually Capture

- connector identity (name, type)
- connector description and status
- connector-specific configuration values
- linkage to connection profiles where applicable


## Core Field Meaning

- **Name**: human-friendly connector label.
- **Type**: integration category (database/API/file/etc).
- **Status**: whether connector is active for use.
- **Configuration fields**: technical settings required by connector type. The fields shown in the create/edit modal will change depending on the connector type you select.

![Create Data Connector Modal](/img/v1.1/infrastructure/editdataconnector.png)

---

![Data Connector Details Page](/img/v1.1/infrastructure/dataconnectordetailspage.png)

### Type-Specific Fields

Each connector type displays a different set of configuration fields:

- **JDBC (Database)**: Database type, host, port, database name, username, password, connection string, SQL query, SSL option, query timeout.
- **API**: URL, host, username, password, content type, method (GET/POST), proxy settings, request headers, payload template, response timeout, thread count, messages per second, service message throttle, success response, result code, result description, XPath.
- **Kafka**: Connection name, topic name, brokers, group identifier, transactional mode.
- **WebSocket**: Connection name, URL, HTTP path, username, password.
- **TCP**: Buffer size, socket timeout, decoder, non-blocking I/O, reverse lookup, direct buffers.
- **Files**: Job name, protocol (local/FTP/SFTP), input/output path, regex pattern, multi-directory, connection name.
- **SMS Inbox**: Provider, connection name, short code, filter by keyword, keyword delimiter, keyword identifier, keyword condition, keyword value.
- **Digital Tags**: Connection name, tag prefix, enable tracking.

Refer to the modal for the exact fields required for each type. Only the relevant fields for the selected connector type will be shown.

## Related Pages

- `Data Connectors List`
- `Create Data Connector`
- `View Data Connector`
- `Edit Data Connector`
