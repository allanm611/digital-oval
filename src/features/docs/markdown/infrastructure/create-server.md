# Create Server

## Overview

Create Server adds a new server record from the server form page.

## Basic Information

Required fields:

- Name
- Code
- Protocol
- Host

Optional fields in this section:

- Environment
- Region
- Port
- Base Path
- Server Type

## Connection Settings

Connection settings include:

- Timeout (seconds)
- Max Retries

## Health Checks

Health check section supports:

- Enable/disable toggle
- Health Check URL
- Interval (seconds)

## Circuit Breaker

Circuit breaker section supports:

- Enable/disable toggle
- Failure Threshold

## Advanced Settings

Advanced settings include:

- Metadata (JSON text)

## TLS And Authentication

This section includes:

- TLS enable toggle
- Authentication Type

## Save

Click **Create Server** to save.

On success, the app returns to the servers list.

## Validation

Create mode validates required fields:

- Name
- Code
- Host
- Protocol

## Related Topics

- [Servers List](/documentation/infrastructure/servers-list)
- [Edit Server](/documentation/infrastructure/edit-server)
- [View Server Details](/documentation/infrastructure/view-server)
