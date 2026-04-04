# Connection Profiles

Connection Profiles define how the platform connects to source systems and how those connections are governed over time.

## Open The Module

Go to `Dashboard -> Infrastructure -> Connection Profiles`.

![Connection Profiles List Page](/img/infrastructure/connectionprofileslistpage.png)

## Uses

A profile combines technical connectivity with governance controls. It is where environment context, performance parameters, validity dates, and data-protection flags are set in one record.

## Core Field Meaning

- **Profile Name / Profile Code**: human label and stable identifier.
- **Connection Type**: indicates whether the profile is database, API, file, or another source style.
- **Environment**: operational scope (development, staging, production).
- **Data Classification**: risk/governance class for handled data.
- **PII / GDPR Flags**: compliance indicators for data handling.
- **Validity Window**: active dates for when this profile should be used.
- **Performance Fields**: batch size, thread count, pool size, retry/timeouts.
- **Health Check Fields**: whether and how connection health is evaluated.

## Main Pages

- `Connection Profiles List`
- `Create Connection Profile`
- `View Connection Profile`

## Quick Visual Tour

![Connection Profiles Analytics Overview](/img/infrastructure/connectionprofileslistpage.png)
![Connection Profiles Analytics Cards](/img/infrastructure/connectionprofilesanalytiscsstatcards.png)
![Connection Profiles Analytics Charts](/img/infrastructure/connectionprofileanalyticspiecharts.png)
