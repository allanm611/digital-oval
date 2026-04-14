# Servers List

## Overview

This page lists all server records configured in the platform, including their endpoint identity, environment, lifecycle status, and health-check state.

It is the main operations view for:

- operational monitoring: quickly spot unhealthy or disabled records
- configuration hygiene: find duplicates, stale endpoints, or wrong environments
- controlled lifecycle updates: activate, deactivate, deprecate, or restore records safely


![Servers List Table](/img/v1.0/infrastructure/serversregistrypage.png)

## What You See In The Table

- **Server**: display name
- **Code**: internal identifier
- **Environment**: deployment context
- **Endpoint**: computed from protocol, host, port, and base path
- **Health**: health state badge (healthy/unhealthy/disabled)
- **Status**: active/inactive/deprecated

## Status Meanings

- **Active**: the server is operationally enabled and can be used by integrations.
- **Inactive**: the server exists but is not available for normal operational use.
- **Deprecated**: the server is being phased out; avoid new usage and migrate existing dependencies.

## Health Status Meanings

- **Healthy**: health checks are enabled and recent checks indicate the endpoint is reachable and responding as expected.
- **Unhealthy**: health checks are enabled, and recent checks detected failures (for example timeout, connection error, or invalid health response).
- **Disabled**: health checks are turned off for this server, so no automated health result is being produced.

## Search And Filters

Use search for name/code lookup. Use filters to narrow by scope, environment, protocol, region, status, and server type.

Filter combinations are helpful during incident response. For example, filtering by one environment and unhealthy status makes endpoint issues easier to isolate.

![Servers Filters](/img/v1.0/infrastructure/serverspagefilters.png)
![Servers Health Filters](/img/v1.0/infrastructure/serverspagehealthfilters.png)

## Actions On The List

- **Create**: add a new server
- **View**: open full details
- **Edit**: update configuration
- **Activate / Deactivate**: change operational availability
- **Deprecate / Restore**: lifecycle control for old endpoints
- **Health Toggle**: enable or disable health checks

Use **View** when investigating an issue and **Edit** when changing behavior. Treat lifecycle actions as controlled changes so active integrations are not disrupted by mistake.

## Bulk Operations

When selection mode is enabled, you can select multiple servers and run bulk activate/deactivate actions.

![Servers Bulk Operations](/img/v1.0/infrastructure/serversregistrybulkoperations.png)

## Related Pages

- [Servers Overview](/documentation/infrastructure/servers)
- [Create Server](/documentation/infrastructure/create-server)
- [View Server](/documentation/infrastructure/view-server)
