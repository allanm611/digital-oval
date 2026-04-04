# Servers List

Servers List is the working page for day-to-day server operations.

## Overview

This is the day-to-day working page for server records.

Use it to quickly see which endpoints are available, which ones are healthy, and which ones need action before they impact integrations.

Use this page for three things:

- operational monitoring: quickly spot unhealthy or disabled records
- configuration hygiene: find duplicates, stale endpoints, or wrong environments
- controlled lifecycle updates: activate, deactivate, deprecate, or restore records safely

![Servers List Table](/img/infrastructure/serversregistrypage.png)

## What You See In The Table

- **Server**: display name
- **Code**: internal identifier
- **Environment**: deployment context
- **Endpoint**: computed from protocol, host, port, and base path
- **Health**: health state badge (healthy/unhealthy/disabled)
- **Status**: active/inactive/deprecated

Together, these columns help answer a simple question fast: "Can this endpoint be used safely right now?"

## Search And Filters

Use search for name/code lookup. Use filters to narrow by scope, environment, protocol, region, status, and server type.

Filter combinations are helpful during incident response. For example, filtering by one environment and unhealthy status makes endpoint issues easier to isolate.

![Servers Filters](/img/infrastructure/serverspagefilters.png)
![Servers Health Filters](/img/infrastructure/serverspagehealthfilters.png)

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

![Servers Bulk Operations](/img/infrastructure/serversregistrybulkoperations.png)
