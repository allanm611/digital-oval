# Create Connection Profile

## Overview

Create Connection Profile adds a new profile from the connection profile form.

## Basic Information

Required fields in basic section:

- Profile Name
- Profile Code
- Connection Type
- Environment
- Data Load Method

Optional basic fields:

- Server
- Database Name (database type)
- Database Type (database type)

## Performance Settings

Performance fields include:

- Records Per Batch
- Number of Parallel Tasks
- Minimum Connections
- Maximum Connections
- Connection Wait Time (seconds)
- Idle Disconnect Time (seconds)

## Reliability Settings

Reliability fields include:

- Max Retries
- Retry Backoff Multiplier
- Circuit Breaker Threshold

## Data Governance

Governance fields include:

- Data Classification
- Contains PII
- GDPR Applicable

## Validity Window

Validity fields include:

- Valid From
- Valid To (optional)

## Health Check

Health section includes:

- Health Check Enabled toggle
- Health Check Query (required when health checks are enabled)

## Additional Fields

Additional fields include:

- Encryption Key Version
- Metadata (JSON)

Database sync fields are shown for database-related setup:

- Sync Column Name
- Sync Column Type

## Save

Click Save to create the profile.

On success, the app returns to the connection profiles list.

## Related Topics

- [Connection Profiles List](/documentation/infrastructure/connection-profiles-list)
- [Edit Connection Profile](/documentation/infrastructure/edit-connection-profile)
- [View Connection Profile Details](/documentation/infrastructure/view-connection-profile)
