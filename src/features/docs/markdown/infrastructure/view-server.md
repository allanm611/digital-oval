# View Server Details

Server Details provides a read-focused view of one server configuration and its current operational state.

![Server Details Page](/img/infrastructure/serverdetailspage.png)
![Server Details - Basic and Endpoint Info](/img/infrastructure/serverdetailsbasicandendpointinformation.png)
![Server Details - Reliability and Security](/img/infrastructure/serverdetailsreliabilityandsecurity.png)
![Server Details - Operational and Metadata](/img/infrastructure/serverdetailsoperationalandmetadata.png)

## Typical Sections

- identity and endpoint summary
- health/status indicators
- configuration and reliability settings
- metadata and timestamps

## Key Fields Explained

- **Endpoint**: final URL composed from protocol, host, port, and base path.
- **Health Status**: current monitoring result when health checks are enabled.
- **Status**: whether the server is active, inactive, or deprecated for operations.
- **Created/Updated timestamps**: change tracking for audit and troubleshooting.

## Actions From Details

- **Edit**: open update form
- **Delete**: remove server record (when allowed)
- **State actions**: activate/deactivate or lifecycle actions depending on context
