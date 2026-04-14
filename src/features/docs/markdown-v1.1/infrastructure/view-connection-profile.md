# View Connection Profile Details

Connection Profile Details gives a full read view of one profile, including technical, governance, and lifecycle settings.

![Connection Profile Details](/img/v1.1/infrastructure/connectionprofiledetailspage.png)

## What The Page Shows

- profile identity (name, code, type)
- environment and classification context
- compliance indicators (PII/GDPR)
- performance and connection settings
- validity period and status
- metadata and timestamps

## Key Fields Explained

- **Profile Code**: the stable identifier jobs/configs rely on.
- **Connection Type**: integration model that determines expected field set.
- **Environment**: where this profile is intended to run.
- **Data Classification**: governance level expected for this source.
- **PII / GDPR flags**: compliance obligations tied to this profile.
- **Valid From / Valid To**: lifecycle boundaries that determine profile validity.
- **Performance values**: batch/concurrency/retry/timeout settings that affect runtime behavior.
- **Health fields**: monitoring enablement and latest health context.

## How To Interpret This Record

- If validity dates are out of range, treat the profile as operationally unsafe even if status is still active.
- If classification/PII flags do not match real data sensitivity, update governance settings before reuse.
- If health is unstable, review retry/timeouts and upstream connectivity before scaling workload.
- If Profile Code changed unexpectedly, verify downstream references because jobs may no longer resolve this profile.
- If environment and source endpoint context do not match, pause rollout and correct mapping before execution.

## Actions

The details page has direct buttons and a **More** dropdown.

- **Activate / Deactivate**: toggles whether the profile is active for use.
- **Edit**: opens the profile form with existing values loaded.

### More Dropdown Options

- **Mark Used**: updates the profile usage marker/timestamp so operations can track recent usage.
- **Update Health**: opens a modal to record the latest health result (`healthy` or `unhealthy`).
- **Adjust Validity**: opens a modal to change `valid_from` and `valid_to` without leaving the details page.

## Usage Examples

- **Post-incident stabilization**: use `Update Health` after corrective changes to confirm the latest state.
- **Planned decommission**: shorten validity window and deactivate after dependent jobs migrate.
- **Usage audit**: `Mark Used` helps operations identify actively used profiles vs stale records.

## Related Pages

- [Connection Profiles Overview](/documentation/infrastructure/connection-profiles)
- [Connection Profiles List](/documentation/infrastructure/connection-profiles-list)
- [Create Connection Profile](/documentation/infrastructure/create-connection-profile)
