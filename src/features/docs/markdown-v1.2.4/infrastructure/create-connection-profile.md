# Create Connection Profile

Create Connection Profile is used to register a new source-connection configuration.

The system uses the same form for both **Create** and **Edit**. So this page is the single field guide for both.

![Create Connection Profile - Basic Information](/img/v1.1/infrastructure/createconnectionprofilebasicinfo.png)

## Required Fields

- **Profile Name**: display label users see in lists and selectors.
- **Profile Code**: stable technical identifier used by jobs/config references.
- **Connection Type**: determines which source model this profile follows (API, DB, file, etc).
- **Environment**: isolates where the profile is valid (dev/staging/production).
- **Data Classification**: governance level for handling and controls.
- **Valid From** date: earliest date this profile is considered valid for operations.

## Field Groups And Meaning

### Basic Information

- **Profile Name**: human-readable label for operations and troubleshooting.
- **Profile Code**: machine-friendly key that should not change after onboarding.
- **Connection Type**: controls expected connection properties and validation paths.
- **Environment**: prevents accidental use of non-production profiles in production operations.

### Governance And Compliance

- **Data Classification**: defines required governance controls and review expectations.
- **Contains PII**: marks that personal data is present and stricter handling is required.
- **GDPR Applicable**: flags records that must follow GDPR processes such as retention and access handling.

![Create Connection Profile - Classification and Metadata](/img/v1.1/infrastructure/createconnecitonprofiledatagovernnace.png)

### Validity

- **Valid From**: profile should not be considered active before this date.
- **Valid To**: optional end date for controlled expiry.
- Together, these dates reduce accidental reuse of retired or temporary connection settings.

### Performance And Reliability

- **Batch Size**: how many records are handled per processing chunk.
- **Parallel Threads**: how much concurrent processing is allowed.
- **Pool Size (Min/Max)**: lower and upper limits for reusable connection resources.
- **Connection Timeout**: how long to wait when establishing connectivity.
- **Idle Timeout**: how long inactive connections stay open.
- **Retries**: number of retry attempts before hard failure.
- **Backoff**: wait strategy between retries to reduce pressure during failure.
- **Circuit Threshold**: failure count that triggers protective cut-off behavior.

![Create Connection Profile - Performance and Reliability](/img/v1.1/infrastructure/createconnectionprofileperfomancesettings.png)


![Create Connection Profile - Health Checks and Advanced](/img/v1.1/infrastructure/createconnecitonprofilehealthchecksandadvanced.png)

### Optional Technical Fields

- **Server ID**: links this profile to a managed server record.
- **Database fields**: identify host/schema/table-level context when source is database-driven.
- **Sync column fields**: define incremental extraction logic (what marks new/updated records).
- **Health Check Query/Toggle**: enables active connection validation and specifies the probe/check.
- **Encryption Key Version**: tracks which key generation protects sensitive values.
- **Metadata**: free-form technical notes for operations context.

<!-- ## Field Meaning In Practice

- **Profile Code** should remain stable after creation so references in jobs/configs do not break.
- **Connection Type** affects which technical fields are relevant (for example database settings vs file-based settings).
- **Valid From / Valid To** act as operational guardrails; profiles outside this window should not be treated as current.
- **Batch Size / Parallel Threads / Pool Size** set throughput limits. Over-tuning can overload source systems.
- **Timeouts + Retries + Backoff** define failure behavior and recovery pace.
- **Health Check Query/Toggle** controls proactive validation instead of waiting for runtime failures. -->

<!-- ## Practical Field Examples

- If `Environment=production` but credentials point to staging, jobs can run against the wrong data source.
- If `Batch Size` is too high, source systems may throttle or connections may time out.
- If `Valid To` is not maintained for temporary integrations, old connectors can remain active unintentionally.
- If `Sync Column` is misconfigured, incremental loads can miss updates or duplicate records. -->

<!-- ## Usage Examples

- **Nightly batch source**: use larger batch size with moderate thread count to improve throughput while avoiding source saturation.
- **Sensitive customer data source**: mark PII and GDPR flags, then enforce validity windows for controlled access.
- **New integration rollout**: create profile in staging first, validate health and performance, then replicate to production with reviewed values. -->

## Save Behavior

Save is blocked until required fields are complete.

## Create Vs Edit (What Changes)

- **Same fields**: both flows use the same sections and inputs.
- **Edit is pre-filled**: existing values are loaded first.
- **Save outcome**: create adds a new profile; edit updates the existing profile.

## Related Pages

- [Connection Profiles Overview](/documentation/infrastructure/connection-profiles)
- [Connection Profiles List](/documentation/infrastructure/connection-profiles-list)
- [View Connection Profile](/documentation/infrastructure/view-connection-profile)
