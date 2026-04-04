# Servers List

Servers List is the working page for day-to-day server operations.

![Servers List Table](/img/infrastructure/serversregistrypage.png)

## What You See In The Table

- **Server**: display name
- **Code**: internal identifier
- **Environment**: deployment context
- **Endpoint**: computed from protocol, host, port, and base path
- **Health**: health state badge (healthy/unhealthy/disabled)
- **Status**: active/inactive/deprecated

## Search And Filters

Use search for name/code lookup. Use filters to narrow by scope, environment, protocol, region, status, and server type.

![Servers Filters](/img/infrastructure/serverspagefilters.png)
![Servers Health Filters](/img/infrastructure/serverspagehealthfilters.png)

## Actions On The List

- **Create**: add a new server
- **View**: open full details
- **Edit**: update configuration
- **Activate / Deactivate**: change operational availability
- **Deprecate / Restore**: lifecycle control for old endpoints
- **Health Toggle**: enable or disable health checks

## Bulk Operations

When selection mode is enabled, you can select multiple servers and run bulk activate/deactivate actions.

![Servers Bulk Operations](/img/infrastructure/serversregistrybulkoperations.png)
