# Connection Profiles

Connection Profiles define how the platform connects to source systems and how those connections are governed over time.

## Open The Module

Go to `Infrastructure -> Connection Profiles`.

![Connection Profiles List Page](/img/v1.1/infrastructure/connectionprofileslistpage.png)

## Uses

A profile combines technical connectivity with governance controls. It is where environment context, performance parameters, validity dates, and data-protection flags are set in one record.

## Core Field Meaning

- **Profile Name**: what users see in operations lists and selectors.
- **Profile Code**: stable reference key used by downstream jobs/config mappings.
- **Connection Type**: defines the integration model and expected technical inputs.
- **Environment**: prevents cross-environment misuse of connection settings.
- **Data Classification**: determines governance strictness and review expectations.
- **PII / GDPR Flags**: indicate whether regulated data handling rules must be enforced.
- **Validity Window**: time boundaries for when this profile should be considered usable.
- **Performance Fields**: throughput and stability controls (batching, concurrency, retries, timeouts).
- **Health Check Fields**: proactive connection monitoring configuration.

## Why Incorrect Values Matter

- Wrong **Environment** can cause production jobs to hit non-production sources.
- Wrong **Classification/PII flags** can create governance and audit risk.
- Aggressive **threads/batch size** can overload source systems.
- Missing **validity limits** can keep temporary profiles active longer than intended.

## Usage Examples

- **Register a production database profile**: set connection type to database, choose `production` environment, and define strict timeout/retry values.
- **Govern sensitive data access**: mark `Contains PII` and `GDPR Applicable` so downstream handling follows compliance controls.
- **Time-box a temporary integration**: set `Valid From` and `Valid To` so expired profiles are not used accidentally.
- **Tune ingestion throughput**: increase batch size and thread count when source systems can safely handle higher load.

## Main Pages

- `Connection Profiles List`
- `Create Connection Profile`
- `View Connection Profile`

## Quick Visual Tour

![Connection Profiles Analytics Overview](/img/v1.1/infrastructure/connectionprofileslistpage.png)
![Connection Profiles Analytics Cards](/img/v1.1/infrastructure/connectionprofilesanalytiscsstatcards.png)
![Connection Profiles Analytics Charts](/img/v1.1/infrastructure/connectionprofileanalyticspiecharts.png)

## Related Pages

- [Connection Profiles List](/documentation/infrastructure/connection-profiles-list)
- [Create Connection Profile](/documentation/infrastructure/create-connection-profile)
- [View Connection Profile](/documentation/infrastructure/view-connection-profile)
