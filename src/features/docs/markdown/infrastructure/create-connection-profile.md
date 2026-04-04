# Create Connection Profile

Create Connection Profile is used to register a new source-connection configuration.

The app uses the same form for both **Create** and **Edit**. So this page is the single field guide for both.

![Create Connection Profile - Basic Information](/img/infrastructure/createconnectionprofilebasicinfo.png)

## Required Fields

- **Profile Name**
- **Profile Code**
- **Connection Type**
- **Environment**
- **Data Classification**
- **Valid From** date

## Field Groups And Meaning

### Basic Information

- **Profile Name / Code**: identifies the profile in list and operations screens.
- **Connection Type**: sets integration pattern and expected connection behavior.
- **Environment**: controls deployment context.

### Governance And Compliance

- **Data Classification**: required governance tier.
- **Contains PII**: indicates presence of personal data.
- **GDPR Applicable**: flags regulatory handling expectations.

![Create Connection Profile - Classification and Metadata](/img/infrastructure/createconnecitonprofiledatagovernnace.png)

### Validity

- **Valid From / Valid To**: period in which profile is considered operationally valid.

### Performance And Reliability

- **Batch Size / Parallel Threads**: throughput tuning.
- **Pool Size (Min/Max)**: connection pool bounds.
- **Connection / Idle Timeouts**: request lifecycle limits.
- **Retries / Backoff / Circuit Threshold**: failure recovery behavior.

![Create Connection Profile - Performance and Reliability](/img/infrastructure/createconnectionprofileperfomancesettings.png)
![Create Connection Profile - Health Checks and Advanced](/img/infrastructure/createconnecitonprofilehealthchecksandadvanced.png)

### Optional Technical Fields

- **Server ID, Database fields, Sync column fields**: source-specific linkage.
- **Health Check Query/Toggle**: monitoring configuration.
- **Encryption Key Version**: encryption metadata.
- **Metadata**: additional context.

## Save Behavior

Save is blocked until required fields are complete.

## Create Vs Edit (What Changes)

- **Same fields**: both flows use the same sections and inputs.
- **Edit is pre-filled**: existing values are loaded first.
- **Save outcome**: create adds a new profile; edit updates the existing profile.
