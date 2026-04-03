---
title: Create Connection Profile
---

# Create Connection Profile

## Overview

Add a new connection to an external data source with connection details, performance settings, and health monitoring.

---

## Basic Information

### Profile Name*
- Display name for the profile

### Profile Code*
- Unique identifier

---

## Connection Settings

### Connection Type*
- Database
- API
- SFTP
- FTP
- S3
- Azure Blob
- Kafka
- Webhook

### Load Strategy*
- full
- incremental
- delta
- cdc
- merge
- append
- upsert

### Environment*
- development
- staging
- production
- uat

### Server
- Select the server for this connection

---

## Database Settings

### Database Type
- Database system type (optional)

### Database Name
- Name of the database (optional)

### Sync Column Name
- Column name for incremental sync (optional)

### Sync Column Type
- Data type of sync column (optional)

---

## Performance Settings

### Batch Size*
**Default:** 1000
- Records per batch

### Parallel Threads*
**Default:** 4
- Parallel execution threads

### Min Pool Size*
**Default:** 2
- Minimum connections in pool

### Max Pool Size*
**Default:** 10
- Maximum connections in pool

### Connection Timeout (seconds)*
**Default:** 30

### Idle Timeout (seconds)*
**Default:** 600

---

## Reliability Settings

### Max Retries*
**Default:** 3

### Retry Backoff Multiplier*
**Default:** 2

### Circuit Breaker Threshold*
**Default:** 5

---

## Data Classification & Compliance

### Data Classification*
- public
- internal
- confidential
- restricted

### Contains PII
- Toggle to indicate personal data

### GDPR Applicable
- Toggle for GDPR compliance

---

## Validity Period

### Valid From*
- Profile activation date

### Valid To
- Profile expiration date (optional)

---

## Health Check Configuration

### Health Check Enabled
- Enable/disable health checks

### Health Check Query
- SQL query or API endpoint (if enabled)

---

## Additional Settings

### Encryption Key Version
- Optional key version

### Metadata
- Optional JSON metadata

---

## Save

Click **Save** to create the profile. You'll be redirected to the profile details page.
