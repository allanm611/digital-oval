# Connection Profiles - Complete Field Reference & Implementation Guide

## Overview

Connection Profiles define HOW CVM connects to endpoints. Combined with a Server configuration, they establish a complete connection. The Server specifies WHERE to connect (network endpoint), while the Connection Profile specifies HOW to connect (credentials, settings, data handling).

Connection Profiles can be used for:

- **Data SOURCES** - CVM reads data FROM these endpoints
- **Data DESTINATIONS** - CVM writes data TO these endpoints
- **Webhooks** - CVM sends events TO these endpoints

Each profile references a **Server** (the physical/network endpoint) and contains connection configuration.

---

## Current Issue: Server ID Field

### The Problem

Currently, `server_id` is a **text/number input field**, which means:

- ❌ Users have to manually type server IDs
- ❌ Easy to make typos (invalid IDs)
- ❌ No visibility of available servers
- ❌ No way to know which servers exist
- ❌ Breaks user workflow

### The Solution

Replace with a **HeadlessSelect dropdown** that:

- ✅ Fetches all servers from the servers service
- ✅ Shows server name and ID for clarity
- ✅ User selects from dropdown
- ✅ Sends the server ID to backend
- ✅ Better UX with filtering/search

---

## CONNECTION PROFILE FORM FIELDS

### BASIC INFORMATION SECTION

#### 1. **Profile Name** _(Required)_

**What it is:** Human-readable name for this connection configuration  
**Purpose:** For identification in dashboards and logs  
**Format:** Can contain spaces, descriptive

**Examples - MNT Use Cases:**

- ✅ `MNT Customer Database - Production`
- ✅ `MNT Transaction Log Sync`
- ✅ `MNT Partner API Connection`

**Examples - Equity Bank Use Cases:**

- ✅ `Equity Bank Core Banking DB - Prod`
- ✅ `Equity Bank Customer Portal API`
- ✅ `Equity Bank SFTP Account Export`

---

#### 2. **Profile Code** _(Required)_

**What it is:** Unique identifier/reference code  
**Purpose:** Used programmatically in jobs and APIs  
**Format:** Uppercase, no spaces, snake_case or camelCase

**Examples:**

- ✅ `MNT_CUSTOMER_DB_PROD`
- ✅ `EQUITY_CORE_BANKING_PROD`
- ✅ `equity_customer_api`
- ❌ `MNT Customer DB` (spaces not ideal)

---

#### 3. **Connection Type** _(Required)_

**What it is:** Type of data source being connected to  
**Purpose:** Determines which fields to show and how to connect  
**Options:** database, api, sftp, ftp, s3, azure_blob, kafka, webhook

**Examples:**

| Connection Type | MNT Example       | Equity Bank Example | Best For                          |
| --------------- | ----------------- | ------------------- | --------------------------------- |
| **database**    | MySQL customer DB | Oracle core banking | SQL databases, direct connections |
| **api**         | MNT REST API      | Equity API gateway  | REST/SOAP web services            |
| **sftp**        | SFTP for reports  | SFTP for statements | File transfers, batch data        |
| **ftp**         | Legacy FTP server | -                   | File transfers (unencrypted)      |
| **s3**          | AWS S3 bucket     | AWS S3 backups      | Cloud object storage              |
| **azure_blob**  | -                 | Azure storage       | Azure Blob Storage                |
| **kafka**       | Event stream      | Real-time events    | Message streaming, events         |
| **webhook**     | Webhook listener  | Webhook callbacks   | Push notifications, callbacks     |

---

#### 4. **Server ID** _(Required for most types)_

**What it is:** Reference to the server configuration  
**Current Implementation:** Number input field (problematic)
**Proposed Implementation:** Dropdown select from servers list

**Why it matters:**

- Server contains: host, port, protocol, credentials, timeouts, health checks
- Server ID links this profile to actual network endpoint
- Example: "Connect to server 5" = "Connect to api.mnt-gateway.co.ke:443"

**Relationship:**

```
Connection Profile:
  ├─ Server ID: 5 (references Server "MNT_PAYMENT_PROD")
  ├─ Database Name: "customer_db"
  ├─ Batch Size: 1000
  └─ ...other config

Server (ID 5):
  ├─ Name: MNT Payment Gateway - Production
  ├─ Host: api.mnt-gateway.co.ke
  ├─ Port: 443
  ├─ Protocol: HTTPS
  ├─ Timeout: 45 seconds
  └─ Circuit Breaker: Enabled
```

**When to set:**

- ✅ Database connection: Link to database server
- ✅ API connection: Link to API server
- ✅ SFTP connection: Link to SFTP server
- ✅ File-based (S3, Azure): Optional (cloud endpoints)

---

### IMPLEMENTATION: SERVER ID DROPDOWN

**Current Code (Problem):**

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700">Server ID</label>
  <input
    type="number"
    value={formData.server_id || ""}
    onChange={(e) =>
      setFormData({
        ...formData,
        server_id: e.target.value ? Number(e.target.value) : undefined,
      })
    }
  />
</div>
```

**Proposed Code (Solution):**

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700">Server</label>
  <p className="text-xs text-gray-500 mb-2">
    Select the server endpoint for this connection.
  </p>
  <HeadlessSelect
    options={servers.map((server) => ({
      value: String(server.id),
      label: `${server.name} (${server.host}:${server.port || "default"})`,
    }))}
    value={String(formData.server_id || "")}
    onChange={(value) =>
      setFormData({
        ...formData,
        server_id: value ? Number(value) : undefined,
      })
    }
    placeholder="Select a server"
  />
</div>
```

**What needs to be added:**

1. Import server service
2. State to hold servers list
3. useEffect to fetch servers on mount
4. Loading/error handling

---

### OPERATION & LOAD STRATEGY SECTION

#### 5. **Load Strategy** _(Required)_

**What it is:** How data is extracted from the source  
**Purpose:** Determines extraction pattern and data handling  
**Options:** full, incremental, delta, cdc, merge, append, upsert

**Understanding Each:**

| Strategy        | Meaning                         | MNT Example                     | Equity Example        | Best For             |
| --------------- | ------------------------------- | ------------------------------- | --------------------- | -------------------- |
| **full**        | Extract all data each time      | Daily full customer export      | Nightly full sync     | Complete refresh     |
| **incremental** | Extract only new records        | New transactions since last run | New account openings  | Adding only new rows |
| **delta**       | Extract changed records         | Updated customer profiles       | Modified accounts     | Changed rows only    |
| **cdc**         | Change Data Capture (real-time) | Stream transaction changes      | Real-time event feed  | Live data streaming  |
| **merge**       | Combine with existing data      | Merge with previous export      | Merge with last sync  | Smart combining      |
| **append**      | Add to existing dataset         | Append new transactions         | Append new records    | Cumulative data      |
| **upsert**      | Update or insert                | Update if exists, insert if new | Sync customer records | Idempotent updates   |

**When to use:**

- **full:** First load, periodic reconciliation (weekly/monthly)
  - Example: `Full customer export every Sunday`
- **incremental:** Frequent updates, new records only
  - Example: `MNT: Daily transactions since yesterday`
  - Example: `Equity: New customer acquisitions`
- **delta:** Frequent updates including modifications
  - Example: `Account status changes, profile updates`
- **cdc:** Real-time requirements, continuous streaming
  - Example: `Live transaction stream for real-time fraud detection`
- **upsert:** When duplicates are possible
  - Example: `Customer records that may update multiple times`

---

#### 6. **Environment** _(Required)_

**What it is:** Deployment environment of the data source  
**Purpose:** Separate configurations for dev/test/production  
**Options:** development, staging, production, uat

**Examples:**

- ✅ `production` - MNT production customer data
- ✅ `staging` - Equity Bank UAT for testing
- ✅ `development` - Internal test database
- ✅ `uat` - User acceptance testing

---

### CONNECTION PARAMETERS SECTION

#### 7. **Batch Size**

**What it is:** Number of records to fetch at once  
**Purpose:** Control memory usage and processing speed  
**Format:** Number, typical range: 100-10000

**Considerations:**

- Larger batch = faster but uses more memory
- Smaller batch = slower but uses less memory

**Examples:**

- ✅ `1000` - Standard, good balance
- ✅ `500` - For large records (heavy data)
- ✅ `5000` - For small/lightweight records
- ✅ `100` - For real-time, low latency
- ❌ `50000` - Too large, memory issues
- ❌ `10` - Too small, very slow

**MNT Real-world:**

```
Customer Sync: 1000 records per batch
Transaction Log: 5000 records per batch (lightweight)
Account Export: 500 records per batch (heavy data)
```

**Equity Bank Real-world:**

```
Account Sync: 1000 records per batch
Transaction History: 2000 records per batch
Loan Portfolio: 500 records per batch (heavy processing)
```

---

#### 8. **Parallel Threads**

**What it is:** Number of concurrent connections/processors  
**Purpose:** Speed up processing by working in parallel  
**Format:** Number (typically 1-16 for most systems)

**Trade-offs:**

- More threads = faster but higher database load
- Fewer threads = slower but less server stress

**Examples:**

- ✅ `4` - Standard, good parallel processing
- ✅ `2` - Conservative, low database impact
- ✅ `8` - Aggressive, for powerful systems
- ✅ `1` - Serial processing, no parallelism
- ❌ `32` - Too many, likely to throttle/block

**MNT Configuration:**

- Payment processing: 2-4 (careful with concurrency)
- Report generation: 8-12 (CPU intensive)
- Data export: 4-8 (balanced)

**Equity Bank Configuration:**

- Core banking: 2-4 (sensitive, low concurrency)
- Report generation: 8-16 (heavy processing)
- Customer data: 4-8 (balanced)

---

#### 9. **Connection Pool Settings**

**Min Pool Size:**

- **What:** Minimum persistent connections to keep open
- **Examples:** 2-5 typically
- ✅ `2` - Standard
- ✅ `5` - For high-traffic systems

**Max Pool Size:**

- **What:** Maximum connections allowed
- **Examples:** 10-50 typically
- ✅ `10` - Standard
- ✅ `20` - For high concurrency
- ✅ `50` - For very busy systems

**How it works:**

```
System Start:
  ├─ Create min connections (2)
  └─ Ready to handle requests

Heavy Load:
  ├─ Use 2 existing connections
  ├─ Create 3 more (now 5 total)
  ├─ Create 5 more (now 10 total - at max)
  └─ Requests queue if above max

Idle Period:
  ├─ Eventually reduce back to min (2)
  └─ Saves database resources
```

**Recommendations:**

- MNT: min_pool=2, max_pool=10 (normal traffic)
- Equity Bank: min_pool=5, max_pool=20 (high volume banking)

---

#### 10. **Connection Timeout (seconds)**

**What it is:** Max time to wait establishing a connection  
**Purpose:** Prevent hanging on unavailable servers  
**Format:** Number of seconds

**Examples:**

- ✅ `30` - Standard
- ✅ `10` - For quick-fail on network issues
- ✅ `60` - For slow/distant servers
- ❌ `5` - Too aggressive, false failures
- ❌ `300` - Too long, jobs hang

**When to adjust:**

- Increase if: Server is geographically distant, slow network
- Decrease if: You want fast failure detection

---

#### 11. **Idle Timeout (seconds)**

**What it is:** How long to keep unused connections alive  
**Purpose:** Balance between resource usage and reconnection speed  
**Default:** 600 seconds (10 minutes)

**Typical:** 300-900 seconds

**Examples:**

- ✅ `300` - 5 minutes (aggressive cleanup)
- ✅ `600` - 10 minutes (standard)
- ✅ `900` - 15 minutes (keep more connections)

**Scenario:**

```
Connection created and used for query
└─ Idle for 5 minutes
  └─ If idle_timeout = 300, close it
  └─ If idle_timeout = 900, keep it open

Next query arrives:
└─ If connection was closed: create new (slower)
└─ If connection still open: reuse (faster)
```

---

### RELIABILITY SETTINGS SECTION

#### 12. **Max Retries**

**What it is:** How many times to retry failed operations  
**Purpose:** Handle temporary failures (network glitches)  
**Format:** Number (0-10 recommended)

**Examples:**

- ✅ `3` - Standard
- ✅ `5` - For critical operations
- ✅ `1` - For operations that shouldn't retry
- ✅ `0` - Fail immediately, no retry

**With exponential backoff:**

```
Attempt 1: Failed → Wait 1 second
Attempt 2: Failed → Wait 2 seconds
Attempt 3: Failed → Wait 4 seconds
If still failed → Mark as failed
```

---

#### 13. **Retry Backoff Multiplier**

**What it is:** How much to increase wait time between retries  
**Purpose:** Prevent overwhelming recovering server  
**Format:** Decimal number (typically 1.5-3.0)

**How it works:**

```
Multiplier = 2.0
Base wait = 1 second

Retry 1: 1 second
Retry 2: 1 × 2 = 2 seconds
Retry 3: 2 × 2 = 4 seconds
Retry 4: 4 × 2 = 8 seconds
Retry 5: 8 × 2 = 16 seconds
Total wait: 31 seconds

Multiplier = 1.5
Retry 1: 1 second
Retry 2: 1 × 1.5 = 1.5 seconds
Retry 3: 1.5 × 1.5 = 2.25 seconds
Retry 4: 2.25 × 1.5 = 3.375 seconds
Total wait: ~8 seconds
```

**Recommendations:**

- **MNT:** 2.0 (standard exponential backoff)
- **Equity Bank:** 1.5 (less aggressive)

---

#### 14. **Circuit Breaker Threshold**

**What it is:** Failures before stopping attempts  
**Purpose:** Prevent wasting time on clearly broken connections  
**Format:** Number (3-10 typical)

**Same concept as servers:**

```
After 5 consecutive failures:
  → Circuit "opens"
  → Stop trying for 60 seconds
  → Fail fast instead of timing out
  → Saves resources and job time
```

---

### HEALTH & MONITORING SECTION

#### 15. **Health Check Enabled**

**What it is:** Toggle to monitor connection availability  
**Purpose:** Detect problems early  
**Default:** Disabled

**When to enable:**

- ✅ For production databases
- ✅ For critical APIs
- ✅ For remote/unreliable sources

**When to disable:**

- ❌ For local/internal databases
- ❌ For dev/test environments

---

#### 16. **Health Check Query**

**What it is:** SQL/API call to verify connectivity  
**Purpose:** Test if connection is working  
**Format:** Depends on connection type

**Examples:**

For **Database** connections:

- ✅ `SELECT 1` - Simple connectivity test
- ✅ `SELECT COUNT(*) FROM customers` - Verify table exists
- ✅ `SELECT CURRENT_TIMESTAMP` - Check DB clock

For **API** connections:

- ✅ `/api/v1/health` - Health endpoint
- ✅ `/api/v1/status` - Status check
- ✅ `/api/v1/ping` - Ping endpoint

For **SFTP** connections:

- ✅ `ls /` - List root directory
- ✅ `pwd` - Print working directory

**MNT Examples:**

```
Database: SELECT 1
API: GET /api/v1/health
SFTP: ls /incoming/
```

**Equity Bank Examples:**

```
Database: SELECT COUNT(*) FROM accounts
API: GET /api/v2/health
SFTP: ls /exports/
```

---

### DATA GOVERNANCE SECTION

#### 17. **Data Classification** _(Required)_

**What it is:** Sensitivity level of data  
**Purpose:** Compliance, encryption, audit requirements  
**Options:** public, internal, confidential, restricted

**Definitions:**

| Level            | Sensitivity       | Examples                       | Protection                                   |
| ---------------- | ----------------- | ------------------------------ | -------------------------------------------- |
| **public**       | No restrictions   | Industry reports, public docs  | Standard logging                             |
| **internal**     | Company use only  | Org structure, policies        | Standard encryption                          |
| **confidential** | Restricted access | Financial data, customer lists | Strong encryption, audit logs                |
| **restricted**   | Maximum security  | Passwords, crypto keys, PII    | Max encryption, limited access, strict audit |

**For MNT:**

- `public` - Service announcements
- `internal` - Merchant list, rates
- `confidential` - Transaction volumes, revenue
- `restricted` - Payment card data, customer PII

**For Equity Bank:**

- `public` - Interest rates, branches
- `internal` - Employee data, policies
- `confidential` - Account balances, customer profiles
- `restricted` - SSN, account numbers, payment cards

---

#### 18. **Contains PII** _(Checkbox)_

**What it is:** Does this data contain Personally Identifiable Information?  
**Purpose:** Compliance, GDPR requirements  
**Examples of PII:**

- Names, phone numbers, emails
- National IDs, passport numbers
- Home addresses
- Financial account information
- Health information

**MNT Examples:**

- ✅ `true` - Customer names, phone numbers
- ✅ `true` - Transaction histories with customer details
- ✅ `false` - Aggregate transaction statistics

**Equity Bank Examples:**

- ✅ `true` - Customer names, accounts, balances
- ✅ `true` - Loan applications with SSN
- ✅ `false` - Interest rate schedules

---

#### 19. **GDPR Applicable** _(Checkbox)_

**What it is:** Is EU/GDPR regulation applicable?  
**Purpose:** Data residency, retention, deletion  
**When true:**

- ✅ Data may be in EU
- ✅ May be EU residents' data
- ✅ Must follow deletion requests
- ✅ Must track data lineage

**MNT Examples:**

- ✅ `true` - If processing EU customer data
- ✅ `false` - If only African customers

**Equity Bank Examples:**

- ✅ `true` - If international banking (EU operations)
- ✅ `false` - If Kenya operations only

---

### DATABASE-SPECIFIC SECTION _(Only when connection_type = "database")_

#### 20. **Database Name**

**What it is:** Name of the database to connect to  
**Examples:**

- ✅ `mnt_production` - MNT main database
- ✅ `customer_db` - Customer database
- ✅ `equity_core` - Equity core banking

---

#### 21. **Database Type**

**What it is:** Database system type  
**Options:** MySQL, PostgreSQL, Oracle, MSSQL, MongoDB, Snowflake, Redshift, BigQuery, etc.

**Examples:**

- ✅ `PostgreSQL` - Open source (MNT common)
- ✅ `Oracle` - Enterprise (Equity Bank common)
- ✅ `MySQL` - Web applications
- ✅ `MongoDB` - NoSQL document storage

---

#### 22. **Sync Column Name**

**What it is:** Column to track changes (for incremental sync)  
**Purpose:** Identify new/updated records  
**Format:** Column name

**Examples:**

- ✅ `updated_at` - Timestamp of last update
- ✅ `created_at` - Creation timestamp
- ✅ `modified_date` - Change tracking date
- ✅ `version` - Version number

**How it works:**

```
Last sync: 2024-02-01 10:00:00
Sync column: updated_at
Query: SELECT * FROM customers WHERE updated_at > '2024-02-01 10:00:00'

This only gets records changed since last run
```

**For MNT:**

- Transactions table: `transaction_date`
- Customer updates: `updated_at`
- Account changes: `modified_on`

**For Equity Bank:**

- Accounts: `last_modified`
- Loans: `status_changed_at`
- Customers: `updated_timestamp`

---

#### 23. **Sync Column Type**

**What it is:** Data type of the sync column  
**Options:** timestamp, date, datetime, integer, bigint

**Examples:**

- ✅ `timestamp` - Full date and time with timezone
- ✅ `datetime` - Date and time
- ✅ `date` - Date only
- ✅ `bigint` - Unix timestamp (milliseconds)
- ✅ `integer` - Version number

**Match to database:**

- PostgreSQL: `timestamp`, `date`
- Oracle: `TIMESTAMP`, `DATE`
- MySQL: `DATETIME`, `TIMESTAMP`
- MongoDB: `ISODate`

---

### ADVANCED SETTINGS SECTION

#### 24. **Validity Window** (valid_from, valid_to)

**What it is:** When this profile is active  
**Purpose:** Schedule profile activation/deactivation  
**Format:** Date (YYYY-MM-DD)

**Use cases:**

- Activate new profile at specific date
- Deactivate old profile
- Maintain multiple profiles for gradual migration

**Examples:**

```
MNT Migration:
  Old Profile valid_to: 2024-02-28
  New Profile valid_from: 2024-03-01
  (Switchover on specific date)

Equity Bank Seasonal:
  Profile valid_from: 2024-Q1
  Profile valid_to: 2024-Q1
  (Only active during Q1)
```

---

#### 25. **Encryption Key Version**

**What it is:** Which encryption key to use for sensitive fields  
**Purpose:** Support key rotation  
**Format:** Number (key version ID)

**How it works:**

```
Key Versions:
  v1: Old key (deprecated)
  v2: Current key (active)
  v3: New key (testing)

Profile uses: v2
When key is rotated: Update to v3
No need to change profile name/code
```

---

#### 26. **Metadata**

**What it is:** Custom JSON data  
**Purpose:** Store additional configuration  
**Format:** Valid JSON object

**Examples - MNT:**

```json
{
  "service_owner": "payments-team",
  "slack_channel": "#mnt-integration",
  "backup_schedule": "daily at 2am",
  "sla_hours": 24,
  "notes": "Primary production connection"
}
```

**Examples - Equity Bank:**

```json
{
  "bank_code": "123456",
  "service_owner": "data-integration",
  "support_email": "support@equitybank.co.ke",
  "backup_schedule": "every 4 hours",
  "failover_profile": "equity_dr_database"
}
```

---

## COMPREHENSIVE EXAMPLES

### Example 1: MNT Customer Database (Production)

```
Profile Name: MNT Customer Database - Production
Profile Code: MNT_CUSTOMER_DB_PROD
Connection Type: database
Server: [Dropdown] MNT Core DB Server - Production (10.0.1.20:3306)
Environment: production
Load Strategy: incremental
Batch Size: 1000
Parallel Threads: 4
Min Pool: 5
Max Pool: 20
Connection Timeout: 30 seconds
Idle Timeout: 600 seconds
Max Retries: 5
Retry Multiplier: 2.0
Circuit Breaker Threshold: 5
Health Check Enabled: ✓ YES
Health Check Query: SELECT 1
Database Name: mnt_production
Database Type: MySQL
Sync Column: updated_at
Sync Column Type: timestamp
Data Classification: confidential
Contains PII: ✓ YES
GDPR Applicable: ✓ YES (EU customers)
Valid From: 2024-01-01
Valid To: (empty - indefinite)
Encryption Key: v2
Metadata: {
  "service_owner": "payments-platform",
  "sla_hours": 4,
  "backup_schedule": "daily 3am"
}
```

---

### Example 2: Equity Bank Loan Origination API (Staging)

```
Profile Name: Equity Bank Loan API - Staging
Profile Code: EQUITY_LOAN_API_STG
Connection Type: api
Server: [Dropdown] Equity Bank API Server - Staging (sandbox-api.equitybank.co.ke:8443)
Environment: staging
Load Strategy: upsert
Batch Size: 500 (heavier data)
Parallel Threads: 2 (API may throttle)
Min Pool: 2
Max Pool: 10
Connection Timeout: 60 seconds
Idle Timeout: 900 seconds
Max Retries: 3
Retry Multiplier: 1.5
Circuit Breaker Threshold: 5
Health Check Enabled: ✓ YES
Health Check Query: /api/v2/health
Data Classification: confidential
Contains PII: ✓ YES
GDPR Applicable: ✓ YES
Valid From: 2024-02-01
Encryption Key: v2
Metadata: {
  "api_version": "v2",
  "rate_limit": "100 req/min",
  "webhook_enabled": true
}
```

---

### Example 3: Internal Reconciliation DB (Dev)

```
Profile Name: Reconciliation Engine - Dev
Profile Code: RECON_ENGINE_DEV
Connection Type: database
Server: [Dropdown] Internal DB Server - Dev (192.168.1.50:5432)
Environment: development
Load Strategy: full
Batch Size: 5000 (internal, fast)
Parallel Threads: 8 (powerful server)
Min Pool: 2
Max Pool: 10
Connection Timeout: 30 seconds
Idle Timeout: 300 seconds
Max Retries: 1 (dev, not critical)
Retry Multiplier: 2.0
Circuit Breaker Threshold: 10
Health Check Enabled: ✗ NO
Database Name: reconciliation_db
Database Type: PostgreSQL
Data Classification: internal
Contains PII: ✗ NO
GDPR Applicable: ✗ NO
Encryption Key: v1
```

---

## IMPLEMENTATION CHECKLIST

### To Implement Server ID Dropdown:

- [ ] Import server service: `import { serverService } from "../../servers/services/serverService";`
- [ ] Add state for servers: `const [servers, setServers] = useState<ServerType[]>([]);`
- [ ] Add useEffect to fetch servers on mount
- [ ] Add loading state while fetching
- [ ] Replace number input with HeadlessSelect
- [ ] Map server options: `{ value: String(id), label: `${name} (${host}:${port})` }`
- [ ] Test with dropdown selection
- [ ] Verify server ID is sent correctly to backend

### Code Location:

File: `/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/connection-profiles/pages/ConnectionProfileFormPage.tsx`
Lines: ~360-375

---

## Key Takeaways

| Concept                 | What to Remember                                              |
| ----------------------- | ------------------------------------------------------------- |
| **Connection Profile**  | Configuration for connecting to ONE data source               |
| **Server**              | Network endpoint (host, port, protocol, timeouts)             |
| **Server ID**           | Links profile to server configuration                         |
| **Load Strategy**       | How to extract data (full, incremental, delta, etc.)          |
| **Batch Size**          | Records per fetch (larger = faster but more memory)           |
| **Retries**             | How many times to retry on failure                            |
| **Health Check**        | Verify connection is working periodically                     |
| **Circuit Breaker**     | Stop trying after repeated failures                           |
| **Data Classification** | Compliance level (public, internal, confidential, restricted) |
| **PII/GDPR**            | Legal/compliance requirements                                 |

---

## Quick Reference: When to Set Each Option

**For Real-time, High-volume (MNT payments):**

- Load Strategy: delta or cdc
- Batch Size: 1000-2000
- Parallel Threads: 4-8
- Max Retries: 5
- Health Check: Every 60 seconds
- Circuit Breaker: Threshold 3-5

**For Batch Processing (Daily reconciliation):**

- Load Strategy: full or incremental
- Batch Size: 5000+ (faster)
- Parallel Threads: 8-12
- Max Retries: 3
- Health Check: Every 5-10 minutes
- Circuit Breaker: Threshold 5-10

**For Internal/Dev Systems:**

- Load Strategy: full
- Batch Size: 5000+
- Parallel Threads: 1-2
- Max Retries: 1
- Health Check: Disabled
- Circuit Breaker: Disabled
