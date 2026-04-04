# View Connection Profile Details

Connection Profile Details gives a full read view of one profile, including technical, governance, and lifecycle settings.

![Connection Profile Details](/img/infrastructure/connectionprofiledetailspage.png)

## What The Page Shows

- profile identity (name, code, type)
- environment and classification context
- compliance indicators (PII/GDPR)
- performance and connection settings
- validity period and status
- metadata and timestamps

## Key Fields Explained

- **Connection Type**: integration category used by this profile.
- **Data Classification**: governance level for the profile's data.
- **PII / GDPR flags**: compliance state indicators.
- **Valid From / Valid To**: profile validity window.
- **Health fields**: monitoring enablement and checks.

## Actions

The details page has direct buttons and a **More** dropdown.

- **Activate / Deactivate**: toggles whether the profile is active for use.
- **Edit**: opens the profile form with existing values loaded.

### More Dropdown Options

- **Mark Used**: updates the profile usage marker/timestamp so operations can track recent usage.
- **Update Health**: opens a modal to record the latest health result (`healthy` or `unhealthy`).
- **Adjust Validity**: opens a modal to change `valid_from` and `valid_to` without leaving the details page.
