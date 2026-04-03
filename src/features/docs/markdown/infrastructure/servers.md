# Servers

## Overview

Servers are managed from the Servers module in Infrastructure.

This module provides:

- Server list and filtering
- Server creation and editing
- Server details and operational actions
- Health check and circuit breaker controls

## Access Paths

Main routes in the system:

- `Dashboard > Servers` for the list page
- `Dashboard > Servers > Add Server` for create
- `Dashboard > Servers > Edit Server` for update
- `Dashboard > Servers > Server Details` for details and actions

## Main Pages

Use these pages for detailed instructions:

- [Servers List](/documentation/infrastructure/servers-list)
- [Create Server](/documentation/infrastructure/create-server)
- [Edit Server](/documentation/infrastructure/edit-server)
- [View Server Details](/documentation/infrastructure/view-server)

## What You Can Manage

Server records include:

- Identity and endpoint fields (name, code, protocol, host, port, base path)
- Classification fields (environment, region, server type)
- Connection limits (timeout, max retries)
- Health checks
- Circuit breaker
- TLS and authentication type
- Optional metadata

Operational actions include:

- Activate or deactivate server
- Enable or disable health checks
- Deprecate or restore server
- Enable or disable circuit breaker
- Reset health check
- Push manual health result

## Related Topics

- [Connection Profiles](/documentation/infrastructure/connection-profiles)
- [Data Connectors](/documentation/infrastructure/data-connectors)
- [KPIs](/documentation/infrastructure/kpis)
- [ETL](/documentation/infrastructure/etl)
