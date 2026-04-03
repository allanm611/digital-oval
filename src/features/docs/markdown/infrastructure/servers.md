# Servers

Servers in Infrastructure represent outbound or integration endpoints the platform depends on. Teams use this module to register endpoints, control health checks, and manage server lifecycle status.

## Open The Module

Go to `Dashboard -> Infrastructure -> Servers`.

## Why It Matters

A server record is more than a host name. It combines endpoint identity, retry/timeouts, health monitoring, and security flags so operations teams can manage reliability in one place.

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
