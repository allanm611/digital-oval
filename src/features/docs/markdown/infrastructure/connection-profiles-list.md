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

## Search And Filters

Use search for name/code lookup. Use filters to narrow by connection type, environment, classification, status, PII, and health-check state.

![Connection Profiles Filters](/img/infrastructure/filterconnectionprofiles.png)
![Connection Profiles Filter Panel](/img/infrastructure/filterconnectionprofilesdropdown.png)

## Actions

- **Create**: add a new profile
- **View**: open full profile details
- **Edit**: update profile settings
- **Activate / Deactivate**: lifecycle toggle
- **Health/Validity actions**: operational updates where exposed

## Bulk Operations

Where selection mode is available, profiles can be activated or managed in batch.

![Connection Profiles Bulk Operations](/img/infrastructure/connectionprofileslistbulkoperations.png)
