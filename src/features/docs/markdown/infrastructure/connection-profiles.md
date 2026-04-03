# Connection Profiles

Connection Profiles define how the platform connects to source systems and how those connections are governed over time.

## Open The Module

Go to `Dashboard -> Infrastructure -> Connection Profiles`.

## Why Teams Use Connection Profiles

A profile combines technical connectivity with governance controls. It is where teams set environment context, performance parameters, validity dates, and data-protection flags in one record.

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
- `Edit Connection Profile`
