# Edit Connection Profile

Edit Connection Profile uses the same structure as create, but pre-fills current values.

## What Teams Usually Edit

- connection and environment context
- governance flags (classification, PII, GDPR)
- validity dates
- performance/retry settings
- health check configuration

## Field Meaning Reminder

- **Validity dates** control when profile usage is expected to be allowed.
- **Performance fields** tune throughput versus resource use.
- **Retry/backoff/circuit fields** control failure handling.
- **Governance fields** help enforce correct data handling.

## Save Behavior

Updated values are validated and saved back to the existing profile.
