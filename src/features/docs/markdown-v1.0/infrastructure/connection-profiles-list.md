# Connection Profiles List

Connection Profiles List is the operations page for browsing and maintaining profile records.

![Connection Profiles Table](/img/infrastructure/connectionprofileslistpage.png)

## Table Fields And What They Mean

- **Profile Name**: primary profile label
- **Profile Code**: unique identifier used across operations
- **Connection Type**: source integration type
- **Environment**: deployment context for this profile
- **Data Classification**: governance classification level
- **PII**: whether profile data includes personally identifiable information
- **Health Check**: whether profile monitoring is enabled
- **Status**: active/inactive/expired style lifecycle state

## How To Read The Table Quickly

- **Active + invalid dates** suggests a lifecycle mismatch that should be corrected.
- **PII enabled + missing governance expectations** should trigger compliance review.
- **Health disabled on critical profiles** can hide failures until jobs start breaking.

## Search And Filters

Use search for name/code lookup. Use filters to narrow by connection type, environment, classification, status, PII, and health-check state.

![Connection Profiles Filters](/img/infrastructure/filterconnectionprofiles.png)
![Connection Profiles Filter Panel](/img/infrastructure/filterconnectionprofilesimage2.png)

## Actions

- **Create**: add a new profile
- **View**: open full profile details
- **Edit**: update profile settings
- **Activate / Deactivate**: lifecycle toggle
- **Health/Validity actions**: operational updates where exposed

## Usage Examples

- **Compliance review**: filter profiles with `PII=true` and confirm classification and validity settings are correct.
- **Environment audit**: filter `production` profiles and check health + status before major releases.
- **Profile cleanup**: filter expired/inactive records and verify whether integrations still reference them.

## Bulk Operations

Where selection mode is available, profiles can be activated or managed in batch.

![Connection Profiles Bulk Operations](/img/infrastructure/connectionprofileslistbulkoperations.png)

## Related Pages

- [Connection Profiles Overview](/documentation/infrastructure/connection-profiles)
- [Create Connection Profile](/documentation/infrastructure/create-connection-profile)
- [View Connection Profile](/documentation/infrastructure/view-connection-profile)
