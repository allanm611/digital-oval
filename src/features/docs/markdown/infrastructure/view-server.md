# View Server Details

## Overview

Server Details shows server identity, endpoint/configuration, health state, and operational controls.

## Access Path

1. Open Servers List.
2. Select a server name or use the view action.

## Header Actions

Top actions include:

- Activate or Deactivate
- Edit
- More menu

More menu provides:

- Enable or disable health checks
- Deprecate or restore server
- Enable or disable circuit breaker
- Reset health check (when health checks are enabled)
- Push health result (when health checks are enabled)

## Summary Area

The summary section displays:

- Server name and code
- Active/Inactive status badge
- Deprecated badge (when applicable)
- Environment and Region
- Protocol and TLS
- Computed endpoint

## Connection & Limits

Connection and limits section includes:

- Host
- Port
- Timeout
- Max retries
- Circuit breaker state
- Circuit threshold
- Base path
- Authentication type

## Health Monitoring

Health monitoring section includes:

- Health checks enabled/disabled
- Health URL
- Interval (seconds)
- Last status
- Last checked time
- Consecutive failures

## Metadata

When metadata exists, the page renders metadata entries in a dedicated section.

## Related Topics

- [Servers List](/documentation/infrastructure/servers-list)
- [Create Server](/documentation/infrastructure/create-server)
- [Edit Server](/documentation/infrastructure/edit-server)
