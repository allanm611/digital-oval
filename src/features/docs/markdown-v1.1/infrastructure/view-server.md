# View Server Details

Server Details provides a read-focused view of one server configuration and its current operational state.

![Server Details - Basic Info and Header](/img/v1.1/infrastructure/serverdetailsbasicinfoandheaderdropdownimage.png)
![Server Details - Connection and Profiles](/img/v1.1/infrastructure/serverdetailsconnectionandprofiles.png)
![Server Details - Metadata](/img/v1.1/infrastructure/serverdetailsmetadata.png)

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

## How To Interpret This Record

- If **Status=active** but **Health Status=unhealthy**, keep the record visible but treat it as incident priority.
- If the **Endpoint** looks valid but failures continue, inspect timeout/retry and authentication settings next.
- If repeated failures occur, verify whether circuit breaker is enabled and whether threshold values are too high.

## Actions From Details

- **Edit**: open the shared create/edit form with current values
- **Activate / Deactivate**: switch operational availability
- **Deprecate / Restore**: lifecycle action for traffic control
- **Enable / Disable Health Checks**: toggle monitoring
- **Enable / Disable Circuit Breaker**: toggle failure protection
- **Reset Health Check / Push Health Result**: operational health actions (when health checks are enabled)

## Dropdown Menu Features (What Each One Does)

The details page includes a dropdown for operational actions. Available options can change based on current server state.

- **Activate**: makes an inactive server available for operational use again.
- **Deactivate**: temporarily removes the server from normal use without deleting its configuration.
- **Deprecate**: marks the server as legacy so new integrations should not use it.
- **Restore**: returns a deprecated server to active lifecycle use.
- **Enable Health Checks**: starts automated health polling using the configured health-check settings.
- **Disable Health Checks**: stops automated health polling when monitoring should be paused.
- **Enable Circuit Breaker**: allows automatic protection against repeated failures.
- **Disable Circuit Breaker**: turns off failure cut-off behavior when you need direct request flow.
- **Reset Health Check**: clears/refreshes health state so a new monitoring cycle can re-evaluate status.
- **Push Health Result**: manually records a health state update when operations needs to override or sync status.

## When To Use Dropdown Actions

- Use **Deactivate** during incidents to stop traffic to a failing endpoint.
- Use **Deprecate** when migrating from an old endpoint to a replacement.
- Use **Reset Health Check** after fixing connectivity, so monitoring can reflect recovery quickly.
- Use **Push Health Result** when health status must be updated immediately for operations visibility.

<!-- ## Usage Examples

- **Emergency disable**: use `Deactivate` during a partner outage to prevent repeated failed traffic.
- **Recovery verification**: after service restoration, run health actions and confirm status before reactivating.
- **Controlled retirement**: use `Deprecate` first, monitor references, then remove the endpoint after migration. -->

## Related Pages

- [Servers Overview](/documentation/infrastructure/servers)
- [Servers List](/documentation/infrastructure/servers-list)
- [Create Server](/documentation/infrastructure/create-server)
