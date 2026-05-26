# Servers Overview

## Overview

Use this page to manage the endpoints your integrations call.

Think of it as the source of truth for server details and runtime behavior. Instead of hardcoding hosts and retry rules in different places, you keep them here and reuse them.

Use this page to answer questions like:

- Which endpoint should this integration use in this environment?
- Is this server currently healthy and allowed for traffic?
- What retry/timeout policy is configured for failures?
- Is transport/security configuration aligned with production standards?

## Where It Sits In Workflow

Server setup usually happens before, or together with, connection profile setup.

- Server records define the actual endpoint target.
- Connection profiles define how those endpoints are used (governance + performance).
- ETL and integration jobs rely on these records, so endpoint values are not scattered around.

## What The Module Controls

- Endpoint identity: name, code, host, protocol, port, base path.
- Environment context: development, staging, production style separation.
- Reliability controls: timeouts, retries, circuit breaker thresholds.
- Health monitoring: health-check toggle, URL, and polling interval.
- Security context: TLS and authentication-related settings.
- Lifecycle state: active, inactive, deprecated.

## Operational Guidance

Use this module when you are adding a new service, replacing an old host, tuning retries/timeouts, or temporarily isolating a failing endpoint.

If a managed server record exists, avoid putting ad-hoc endpoint values directly in jobs or runbooks. Centralizing it here makes troubleshooting much easier.

## Usage Examples

- **Add a new SMS gateway**: create a server with HTTPS endpoint, health checks, and retry policy before wiring it into campaigns.
- **Handle partner outage**: deactivate the affected server to stop failing calls, then reactivate after health returns.
- **Move to new host**: create new server record, validate health in staging/production, then deprecate the previous endpoint.

## Related Pages

- [Servers List](/documentation/infrastructure/servers-list)
- [Create Server (also used for Edit)](/documentation/infrastructure/create-server)
- [View Server](/documentation/infrastructure/view-server)
