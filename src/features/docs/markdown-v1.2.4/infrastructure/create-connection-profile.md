# Create Connection Profile

Create Connection Profile is used to register a new source-connection configuration.

The system uses the same form for both **Create** and **Edit**. So this page is the single field guide for both.

![Create Connection Profile](/img/v1.2.4/createconnectionprofile.png)

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
- **Connection Type**: controls expected connection properties and validation paths. Determines which configuration fields are available.
- **Environment**: prevents accidental use of non-production profiles in production operations. Choose: Development, Staging, or Production.
- **Data Load Method**: defines how data is brought in from the source. Options:
  - **Full** - Load all data in a single operation
  - **Incremental** - Load only new/updated records since last sync
  - **Delta** - Load only changed records (requires sync column)
  - **CDC** - Change Data Capture for real-time change tracking
  - **Merge** - Merge new data with existing records
  - **Append** - Add new data without removing existing
  - **Upsert** - Insert new or update existing records
- **Server**: optional selection of a managed server endpoint for this connection profile.

### Governance And Compliance

- **Data Classification**: defines required governance controls and review expectations.
- **Contains PII**: marks that personal data is present and stricter handling is required.
- **GDPR Applicable**: flags records that must follow GDPR processes such as retention and access handling.

### Sync Settings

This section appears only when **Data Load Method** is set to Incremental, Delta, or CDC. Configure incremental sync settings for detecting changes:

- **Sync Column Name**: the column used for tracking changes (e.g., modified_at, updated_at, id). This column helps identify new or updated records.
- **Sync Column Type**: the data type of the sync column (e.g., timestamp, bigint, datetime).

### Validity

- **Valid From**: profile should not be considered active before this date.
- **Valid To**: optional end date for controlled expiry.
- Together, these dates reduce accidental reuse of retired or temporary connection settings.

### Performance And Reliability

- **Records Per Batch**: how many records are handled per processing chunk.
- **Number of Parallel Tasks**: number of concurrent tasks allowed during processing. Higher values improve throughput but may impact source systems.
- **Minimum Connections**: smallest number of connections to keep open to the service (lower bound of connection pool).
- **Maximum Connections**: largest number of connections allowed at once (upper bound of connection pool).
- **Connection Wait Time (seconds)**: how long to wait for a connection before timing out.
- **Idle Disconnect Time (seconds)**: how long inactive connections can remain open before closing.
- **Max Retries**: number of retry attempts before hard failure.
- **Retry Backoff Multiplier**: exponential backoff multiplier for retry delays (reduces pressure during repeated failures).
- **Circuit Breaker Threshold**: number of failures before the circuit breaker opens and stops attempts.

### Connection Type Configuration

When you select certain connection types, additional configuration fields appear for that specific type:

- **API**: URL, authentication, content type, headers, rate limiting
- **JDBC**: database type, host, port, credentials, database name
- **Kafka**: brokers, topic, consumer group, transactional mode
- **WebSocket**: endpoint configuration, authentication
- **TCP**: buffer size, decoder, socket timeout, I/O settings
- **Files**: protocol (local/FTP/SFTP), file paths, patterns
- **SMS Inbox**: provider selection, inbox ID, keyword filtering

These configuration fields are stored in the **Metadata** field as JSON.

### Health Checks

- **Health Check Enabled**: toggle to enable periodic connection validation.
- **Health Check Query**: SQL query or command to run for validation (e.g., `SELECT 1`). Only appears when health check is enabled.

### Optional Technical Fields

- **Encryption Key Version**: tracks which key generation protects sensitive values.
- **Metadata**: free-form JSON for additional technical configuration and notes.

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
