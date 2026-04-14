# Servers

Servers in Infrastructure represent outbound or integration endpoints the platform depends on. Use this module to register endpoints, control health checks, and manage server lifecycle status.

## Open The Module

Go to `Infrastructure -> Servers`.

![Servers Registry Page](/img/v1.1/infrastructure/serversregistrypage.png)

## Why It Matters

A server record is more than a host name. It combines endpoint identity, retry/timeouts, health monitoring, and security flags so reliability can be managed in one place.

## Main Pages

- `Servers List`: browse and filter all servers
- `Create Server`: add a new server record
- `View Server`: inspect configuration and health metadata
- `Edit Server`: update existing configuration

## Core Field Meaning

- **Name**: Human-friendly label used across operations screens.
- **Code**: Stable internal identifier for references and filtering.
- **Protocol + Host + Port + Base Path**: Builds the final endpoint.
- **Environment**: Deployment context, like dev/staging/production.
- **Health Check Settings**: Controls whether the platform monitors service availability.
- **Timeout / Retries**: Defines request resilience behavior.
- **Status**: Operational state such as active, inactive, or deprecated.

## Usage Examples

- **Register a production endpoint**: set `Protocol=https`, `Host=api.partner.com`, `Port=443`, and `Base Path=/v1/messages`.
- **Protect workflows from slow dependencies**: set a strict `Timeout Seconds` and controlled `Max Retries` so requests fail fast instead of hanging.
- **Monitor a critical endpoint**: enable health checks with a lightweight `Health Check URL` and short interval.
- **Retire an old endpoint safely**: mark the server as deprecated before full removal so users stop selecting it for new integrations.

## Related Pages

- [Servers List](/documentation/infrastructure/servers-list)
- [Create Server](/documentation/infrastructure/create-server)
- [View Server](/documentation/infrastructure/view-server)
