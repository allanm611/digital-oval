# Connection Profiles Overview

## Overview

Connection Profiles are where you define how a source should be connected and managed over time.

After servers are set up, profiles add the operating rules around those connections: environment, governance flags, validity dates, and performance settings.

## Uses

- Connectivity: source type, environment, and technical parameters.
- Governance: data classification and compliance flags.
- Reliability: retries, timeouts, pool settings, and health-check behavior.

This keeps setup cleaner across environments and makes audits easier.

## What A Profile Represents

A profile is a reusable connection definition for a source pattern, for example API, database, or file source. Other processes can reference it instead of redefining the same settings repeatedly.

## Lifecycle And Controls

- Profiles are created with a validity window.
- They can be activated/deactivated based on operational state.
- Health settings can be adjusted as source reliability changes.
- Performance tuning can be updated as data volumes grow.

## Usage Examples

- **API source onboarding**: create a profile with API type, production environment, and health checks to monitor reliability.
- **Regulated data source**: enable PII/GDPR flags and set strict validity window to enforce governed usage.
- **High-volume ingestion profile**: increase thread/batch settings gradually while monitoring source load and failure rate.

## Field Groups To Understand

- Identity: profile name and code.
- Context: connection type and environment.
- Governance: classification, PII, GDPR flags.
- Validity: valid-from and valid-to dates.
- Performance: batch, thread, pool, timeout, retry controls.
- Monitoring: health-check toggle and query/conditions.

## Related Pages

- [Connection Profiles List](/documentation/infrastructure/connection-profiles-list)
- [Create Connection Profile (also used for Edit)](/documentation/infrastructure/create-connection-profile)
- [View Connection Profile](/documentation/infrastructure/view-connection-profile)
