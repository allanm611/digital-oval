# View Connection Profile Details

## Overview

Connection Profile Details shows profile configuration and exposes operational actions.

## What The Page Displays

Main details area shows:

- Basic Information (profile code, status, connection type, environment, load strategy, server id if set, database name if set, last used)
- Performance Settings (batch size, parallel threads, pool sizes, connection timeout, idle timeout)

Sidebar shows:

- Data Governance (classification, PII flag, GDPR flag)
- Health Check card (only when health checks are enabled)
- Validity Period (valid from and optional valid to)

## Top Actions

Available actions:

- Activate or Deactivate
- Edit
- More menu

More menu includes:

- Mark Used
- Update Health
- Adjust Validity

## Modals

### Update Health

Lets you set health status to healthy or unhealthy and save.

### Adjust Validity Window

Lets you update valid from and optional valid to dates.

## Not Found State

If the profile does not exist, the page shows Connection Profile Not Found and a back action to the list.

## Related Topics

- [Connection Profiles List](/documentation/infrastructure/connection-profiles-list)
- [Edit Connection Profile](/documentation/infrastructure/edit-connection-profile)
- [Create Connection Profile](/documentation/infrastructure/create-connection-profile)
