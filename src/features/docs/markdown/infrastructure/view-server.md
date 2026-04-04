# View Server Details

Server Details provides a read-focused view of one server configuration and its current operational state.

![Server Details - Basic Info and Header](/img/infrastructure/serverdetailsbasicinfoandheaderdropdownimage.png)
![Server Details - Connection and Profiles](/img/infrastructure/serverdetailsconnectionandprofiles.png)
![Server Details - Metadata](/img/infrastructure/serverdetailsmetadata.png)

## Typical Sections

- identity and endpoint summary
- health/status indicators
- connection and limit settings
- health monitoring details
- metadata and timestamps

## Key Fields Explained

- **Endpoint**: final URL composed from protocol, host, port, and base path.
- **Health Status**: current monitoring result when health checks are enabled.
- **Status**: whether the server is active, inactive, or deprecated for operations.
- **Created/Updated timestamps**: change tracking for audit and troubleshooting.

## Actions From Details

- **Edit**: open the shared create/edit form with current values
- **Activate / Deactivate**: switch operational availability
- **Deprecate / Restore**: lifecycle action for traffic control
- **Enable / Disable Health Checks**: toggle monitoring
- **Enable / Disable Circuit Breaker**: toggle failure protection
- **Reset Health Check / Push Health Result**: operational health actions (when health checks are enabled)
