---
title: Create Connection Profile
---


# Create Connection Profile

## Overview

The Create Connection Profile form allows you to add a new connection to an external data source. Configure connection details, performance settings, security policies, and health monitoring.

## Basic Information

### Profile Name*
**Type:** Text input
**Required:** Yes
- Display name for the profile
- Should be descriptive (e.g., "Production Data Warehouse")
- Used in lists and references

### Profile Code*
**Type:** Text input
**Required:** Yes
- Unique identifier for the profile
- Used in APIs and configurations
- Alphanumeric with underscores allowed

## Connection Settings

### Connection Type*
**Type:** Dropdown select
**Required:** Yes
- **Database** - SQL/NoSQL/warehouses
- **API** - REST/SOAP endpoints
- **File** - FTP/SFTP/cloud storage

### Server*
**Type:** Dropdown select
**Required:** Yes
- Select the server hosting the connection
- Determines network routing
- Must be configured first

### Load Strategy*
**Type:** Dropdown select
**Required:** Yes
- **Full Load** - Complete data sync
- **Incremental Load** - Only new/changed data
- Choose based on data volume and frequency

### Environment*
**Type:** Dropdown select
**Required:** Yes
- **Development** - Dev environment
- **Staging** - Testing environment
- **Production** - Live environment

## Database Settings (if Database type)

### Database Type
**Type:** Text input
- Database system type
- Example: PostgreSQL, MySQL, Oracle

### Database Name
**Type:** Text input
- Name of the database to connect to

### Sync Column Name
**Type:** Text input
- Column name for incremental sync tracking
- Used for identifying new/changed records

### Sync Column Type
**Type:** Text input
- Data type of sync column
- Example: timestamp, datetime, integer

## Performance Settings

### Batch Size*
**Type:** Number input
**Default:** 1000
- Records per batch
- Higher = better performance, more memory
- Range: 100-10000

### Parallel Threads*
**Type:** Number input
**Default:** 4
- Parallel execution threads
- Higher = faster processing, more resources
- Range: 1-32

### Min Pool Size*
**Type:** Number input
**Default:** 2
- Minimum connections in pool
- Ensures available connections
- Range: 1-10

### Max Pool Size*
**Type:** Number input
**Default:** 10
- Maximum connections in pool
- Limits resource usage
- Range: Min Pool Size to 100

### Connection Timeout (seconds)*
**Type:** Number input
**Default:** 30
- Timeout for connection establishment
- Range: 5-300 seconds

### Idle Timeout (seconds)*
**Type:** Number input
**Default:** 600 (10 minutes)
- Timeout for idle connections
- Range: 60-3600 seconds

## Reliability Settings

### Max Retries*
**Type:** Number input
**Default:** 3
- Retry attempts on failure
- Range: 0-10

### Retry Backoff Multiplier*
**Type:** Number input
**Default:** 2
- Multiplier for retry delay
- Example: 1s, 2s, 4s with multiplier=2
- Range: 1-5

### Circuit Breaker Threshold*
**Type:** Number input
**Default:** 5
- Failures before circuit opens
- Range: 1-100

## Data Classification & Compliance

### Data Classification*
**Type:** Dropdown select
**Default:** Internal
- **Public** - Public data
- **Internal** - Internal use only
- **Confidential** - Sensitive data
- **Restricted** - Highly restricted

### Contains PII
**Type:** Toggle
**Default:** Off
- Does data include personal information
- Enables GDPR tracking

### GDPR Applicable
**Type:** Toggle
**Default:** Off
- Is GDPR compliance required
- Enables compliance tracking

## Validity Period

### Valid From*
**Type:** Date picker
**Default:** Today
- Profile activation date
- Profile not usable before this date

### Valid To
**Type:** Date picker
**Optional**
- Profile expiration date
- Leave blank for no expiration

## Health Check Configuration

### Health Check Enabled
**Type:** Toggle
**Default:** Off
- Enable automated health checks
- If enabled, configure query/endpoint

### Health Check Query
**Type:** Text area
**Required:** If health checks enabled
- SQL query or API endpoint
- Tests connection status
- Example: SELECT 1 (SQL), /health (API)

## Encryption

### Encryption Key Version
**Type:** Dropdown select
**Optional**
- Key version for credential encryption
- Leave default if unsure

## Additional Settings

### Metadata
**Type:** Text area
**Optional**
- JSON or free-form metadata
- Custom configuration
- Example:
```json
{
  "team": "data-engineering",
  "cost_center": "data-123",
  "retention_days": 90
}
```

## Form Actions

### Save Profile
- Creates new connection profile
- Validates all required fields
- Shows error messages if validation fails

### Cancel
- Return to profile list
- Discard unsaved changes

## Validation Rules

- **Profile Name** - Required, 1-255 characters
- **Profile Code** - Required, alphanumeric and underscores
- **Server** - Must select valid server
- **Load Strategy** - Required selection
- **Batch Size** - 100-10000
- **Threads** - 1-32
- **Pool Sizes** - Min ≤ Max, 1-100
- **Timeouts** - 5-3600 seconds
- **Retries** - 0-10
- **Health Query** - Required if health checks enabled

## After Creating

After successful creation:
1. Redirected to profile details page
2. Profile appears in list
3. Profile is Active by default
4. Health checks begin (if enabled)
5. Next steps:
   - Test connection
   - Monitor health status
   - Configure data sync
   - View in reports

## Best Practices

### Naming Conventions
- Use descriptive names: "ProductionDataWarehouse"
- Use consistent naming: company_dataset_env
- Make codes readable and searchable

### Performance Tuning
- Start with default batch size, adjust based on memory
- Increase threads for large data volumes
- Monitor connection pool usage

### Security
- Mark profiles with PII appropriately
- Use restrictive data classifications
- Enable health checks for critical connections
- Test connectivity before production use

### Compliance
- Check GDPR applicability for EU data
- Track PII status accurately
- Set appropriate validity dates
- Document in metadata

