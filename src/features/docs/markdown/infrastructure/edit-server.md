# Edit Server

Edit Server uses the same structure as Create Server, but pre-fills existing values.

## What You Usually Update

- endpoint properties (protocol, host, port, base path)
- environment or region tagging
- timeout/retry tuning
- health check and circuit-breaker settings
- security/authentication flags
- server status context fields

## Field Meaning Reminder

- **Timeout + Retries** tune reliability and failure handling.
- **Health Check settings** control if and how the server is monitored.
- **Circuit Breaker settings** protect dependent flows during repeated failures.

## Save Behavior

Changes apply to the current server record after successful validation and save.
