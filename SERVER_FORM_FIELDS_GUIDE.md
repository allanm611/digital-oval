# Server Creation Form - Field Reference Guide

## Overview

The Server Form in CVM is used to configure network endpoints that CVM connects to. These servers can be:

- **Data Sources** - Where CVM reads/picks data FROM (via Connection Profiles)
- **Data Destinations** - Where CVM writes/sends data TO
- **Intermediary Services** - Gateways or middleware that CVM routes through

This guide explains each field with examples for **MNT (Money Transfer Network)** and **Equity Bank**.

---

## Server Purpose in CVM Architecture

```
CVM Data Flow:
┌──────────────────┐
│  Connection      │
│   Profile        │  (HOW to connect)
├──────────────────┤
│  - Type: api     │
│  - Server ID: 5  │
│  - Batch: 1000   │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  Server (ID: 5)  │
├──────────────────┤
│  - Host: ...     │  (WHERE to connect)
│  - Port: 443     │
│  - Protocol: ... │
└────────┬─────────┘
         │
         ↓
    ┌────────────┐
    │  Endpoint  │
    │ Can be:    │
    │ • Source   │  CVM reads FROM it
    │ • Dest     │  CVM writes TO it
    │ • Gateway  │  CVM routes through it
    └────────────┘
```

**Key Point:** A Server is just the **network endpoint**. Whether CVM reads from it or writes to it depends on:

- The **Connection Profile** configuration
- The **Job** that uses it
- The **ETL Process** being executed

---

### 1. **Name** _(Required)_

**What it is:** Human-readable display name for the server  
**Purpose:** For identification in dashboards and logs  
**Format:** Can contain spaces, letters, numbers

**Examples:**

- ✅ `MNT Payment Gateway - Production`
- ✅ `Equity Bank API - Staging`
- ✅ `Mobile Money Transfer Service`

---

### 2. **Code** _(Required)_

**What it is:** Unique identifier/reference code for the server  
**Purpose:** Used in APIs and configurations for programmatic reference  
**Format:** Usually uppercase, no spaces, snake_case or camelCase

**Examples:**

- ✅ `MNT_PAYMENT_PROD`
- ✅ `EQUITY_BANK_STG`
- ✅ `mnt_api_v1`
- ❌ `MNT Payment` (spaces not ideal)

---

### 3. **Protocol** _(Required)_

**What it is:** Communication protocol to use for connecting to this server  
**Purpose:** Determines how data is transmitted  
**Options:** HTTP, HTTPS, FTP, FTPS, SFTP, TCP, SMTP, SMTPS

**Examples:**

- ✅ `HTTPS` - For MNT: Most secure for payment transactions
- ✅ `HTTPS` - For Equity Bank: Required for banking APIs
- ✅ `SFTP` - If using file-based transfers for batch reconciliation
- ✅ `TCP` - For low-level socket connections (rare)

**When to use:**

- **HTTPS**: Always for financial transactions, APIs, modern web services
- **HTTP**: Only for internal/dev environments (never production)
- **SFTP**: File uploads/downloads for MIS reports, reconciliation files
- **SMTP/SMTPS**: Email notifications, alerts

---

### 4. **Host** _(Required)_

**What it is:** The server's address/domain name or IP  
**Purpose:** Network location where the server is accessible  
**Format:** Domain name, FQDN, or IP address

**Examples:**

- ✅ `api.mnt-gateway.co.ke` - MNT Payment Gateway
- ✅ `10.0.1.45` - Internal Equity Bank server
- ✅ `payments-api.equitybank.co.ke` - Equity Bank production
- ✅ `sandbox-api.mnt.local` - MNT staging environment
- ✅ `192.168.100.50` - Internal IP address

---

### 5. **Environment**

**What it is:** Deployment environment of the target server  
**Purpose:** Helps identify which environment the server belongs to  
**Options:** DEV, STAGING, PRODUCTION, DR (Disaster Recovery)

**Examples:**

- ✅ `PRODUCTION` - Live MNT payment server handling real transactions
- ✅ `STAGING` - Equity Bank test environment for UAT
- ✅ `DEV` - Development/internal testing for MNT
- ✅ `DR` - Disaster recovery backup site

---

### 6. **Region**

**What it is:** Physical or logical geographic location of the server  
**Purpose:** For routing, compliance, redundancy, and monitoring  
**Format:** Free text - country, region, data center name

**Examples - MNT (Money Transfer Network):**

- ✅ `East Africa - Kenya`
- ✅ `KE-Nairobi-DC1`
- ✅ `Africa-Central`
- ✅ `AWS-us-east-1`

**Examples - Equity Bank:**

- ✅ `Kenya - Nairobi HQ`
- ✅ `East Africa`
- ✅ `Kisumu-Branch-DC`
- ✅ `Azure-EU-West`

---

### 7. **Port**

**What it is:** Network port number for connection  
**Purpose:** Specifies which port to communicate through  
**Format:** Number (1-65535)

**Common ports:**

- ✅ `80` - HTTP (unencrypted web)
- ✅ `443` - HTTPS (encrypted web) - **Most common for banking/payments**
- ✅ `8080` - Alternative HTTP
- ✅ `8443` - Alternative HTTPS
- ✅ `22` - SFTP/SSH
- ✅ `25` - SMTP
- ✅ `587` - SMTP (TLS)
- ✅ `465` - SMTPS

**Examples:**

- **MNT HTTPS API:** Port `443`
- **Equity Bank Staging:** Port `8443` (custom HTTPS)
- **Internal API:** Port `8080` or `9000`

---

### 8. **Base Path**

**What it is:** Root path prepended to all API calls to this server  
**Purpose:** Simplifies API endpoint configuration  
**Format:** Starts with `/`, no trailing slash

**Examples - MNT:**

- ✅ `/api/v1` - Calls become `https://api.mnt-gateway.co.ke/api/v1/payments`
- ✅ `/mnt/services` - For specific service routing
- ✅ `/pay` - Short path for payments

**Examples - Equity Bank:**

- ✅ `/api/v2` - Bank's latest API version
- ✅ `/banking/services` - Banking specific services
- ✅ `/equityconnect` - Special service path

**How it works:**

```
Server Config:
  Host: api.mnt-gateway.co.ke
  Base Path: /api/v1

When calling: /payments/send
Actual URL: https://api.mnt-gateway.co.ke/api/v1/payments/send
```

---

### 9. **Server Type**

**What it is:** Categorization of the server's function  
**Purpose:** For organization, monitoring, and routing decisions  
**Format:** Free text classification

**Examples - MNT:**

- ✅ `payment-gateway` - Handles transaction processing
- ✅ `settlement-api` - Fund settlement and reconciliation
- ✅ `notification-service` - SMS/Email notifications
- ✅ `report-generator` - MIS and audit reports
- ✅ `webhook-listener` - Receives callbacks from MNT

**Examples - Equity Bank:**

- ✅ `core-banking` - Account and transaction services
- ✅ `loan-origination` - Loan processing system
- ✅ `card-processor` - Card transaction handling
- ✅ `reconciliation-engine` - Statement matching
- ✅ `audit-trail` - Compliance and audit logging

---

## CONNECTION SETTINGS SECTION

### 10. **Timeout (seconds)**

**What it is:** Maximum time to wait for a response from the server  
**Purpose:** Prevents jobs from hanging indefinitely  
**Format:** Number of seconds

**Default:** 30 seconds

**Examples:**

- ✅ `30` - Good for most APIs
- ✅ `60` - For slower batch operations (MNT reconciliation)
- ✅ `120` - For file uploads to Equity Bank
- ✅ `10` - For fast health checks only
- ❌ `1000` - Too long, could block jobs

**When adjusting:**

- **Increase for:** Large file uploads, batch reconciliations
- **Decrease for:** Real-time payment processing (needs quick response)

---

### 11. **Max Retries**

**What it is:** Number of times to retry a failed request  
**Purpose:** Handle temporary failures, network glitches  
**Format:** Number (0-10 recommended)

**Default:** 3 retries

**Examples:**

- ✅ `3` - Standard: Good balance
- ✅ `5` - For critical operations (payment processing)
- ✅ `1` - For idempotent health checks
- ✅ `0` - For one-time operations that can't be retried

**Retry Strategy:**

```
Attempt 1: Failed → Wait 1 second
Attempt 2: Failed → Wait 2 seconds
Attempt 3: Failed → Wait 4 seconds (exponential backoff)
Attempt 4: Failed → Wait 8 seconds
If still failing → Mark as failed job
```

---

## HEALTH CHECKS SECTION

### 12. **Health Check Enabled**

**What it is:** Toggle to automatically monitor server availability  
**Purpose:** Detect outages before jobs fail, trigger alerts  
**Default:** Disabled (Unchecked)

**When to enable:**

- ✅ For production servers (MNT payment gateway)
- ✅ For critical banking APIs (Equity Bank core services)
- ✅ For SLAs with guaranteed uptime requirements

**When to disable:**

- ❌ For internal dev/test environments
- ❌ For one-time data dumps
- ❌ For servers behind firewalls with no direct access

---

### 13. **Health Check URL**

**What it is:** Endpoint to check if the server is up  
**Purpose:** Periodic ping to verify connectivity  
**Format:** Full path or endpoint that returns 200 OK

**Examples - MNT:**

- ✅ `/api/v1/health` - Dedicated health endpoint
- ✅ `/api/v1/status` - General status check
- ✅ `/api/v1/ping` - Simple ping endpoint
- ✅ `/payments/health` - Service-specific health

**Examples - Equity Bank:**

- ✅ `/api/v2/health` - Core banking health
- ✅ `/banking/status` - Overall service status
- ✅ `/equityconnect/ping` - EquityConnect service
- ✅ `/core/heartbeat` - Core system check

**How it works:**

```
Full URL constructed:
  Protocol: https
  Host: api.mnt-gateway.co.ke
  Base Path: /api/v1
  Health Check URL: /health

Result: https://api.mnt-gateway.co.ke/api/v1/health

Every 5 minutes → GET request
Response 200 OK → Server is UP ✓
Response 500 or timeout → Server is DOWN ✗
```

---

### 14. **Health Check Interval (seconds)**

**What it is:** How often to check server health  
**Purpose:** Balance between detection speed and system load  
**Format:** Number of seconds

**Default:** 300 seconds (5 minutes)

**Examples:**

- ✅ `60` - Every 1 minute (for critical payment systems)
- ✅ `300` - Every 5 minutes (standard)
- ✅ `600` - Every 10 minutes (for less critical systems)
- ✅ `1800` - Every 30 minutes (for internal non-critical)
- ❌ `10` - Too frequent, causes excessive load

**Recommendations:**

- **MNT Payment Gateway:** 60-120 seconds (needs quick detection)
- **Equity Bank APIs:** 60-300 seconds (depends on SLA)
- **Batch/Report Server:** 300-600 seconds (not real-time critical)

---

## CIRCUIT BREAKER SECTION

### 15. **Circuit Breaker Enabled**

**What it is:** Toggle to prevent cascading failures  
**Purpose:** Stop sending requests to failing servers automatically  
**Default:** Disabled (Unchecked)

**When to enable:**

- ✅ For production environments
- ✅ For external APIs (MNT, Equity Bank)
- ✅ To prevent system overload when dependencies fail

**How it works:**

```
State 1: CLOSED (normal)
  → All requests go through ✓

State 2: OPEN (broken)
  → After 5 failures in a row
  → Stop sending requests (fail fast)
  → Block new requests for 60 seconds

State 3: HALF-OPEN (testing recovery)
  → After waiting period, try 1 request
  → If OK → Go back to CLOSED
  → If fails → Go back to OPEN
```

---

### 16. **Failure Threshold**

**What it is:** Number of consecutive failures before "opening" the circuit  
**Purpose:** How many failures before stopping requests  
**Format:** Number (1-20 recommended)

**Default:** 5 failures

**Examples:**

- ✅ `3` - Aggressive: Stop after 3 consecutive failures (MNT: sensitive)
- ✅ `5` - Standard: Good balance
- ✅ `10` - Tolerant: Allow more failures before stopping (internal systems)

**Example scenario - MNT Payment Gateway:**

```
Attempt 1: Connection timeout → Failures: 1
Attempt 2: 500 error → Failures: 2
Attempt 3: Network error → Failures: 3

If threshold = 3:
  Circuit opens → BLOCK all new requests
  Reason: Detected likely outage, prevent wasting time

Jobs using this server now fail fast:
  Instead of waiting 30s timeout × 5 retries = 150s
  They fail immediately after circuit opens
```

---

## ADVANCED SETTINGS SECTION

### 17. **Metadata**

**What it is:** Additional custom information stored as JSON  
**Purpose:** Store configuration, notes, or system-specific data  
**Format:** Valid JSON object

**Examples - MNT:**

```json
{
  "merchant_id": "MNT-1234",
  "api_version": "v1.5",
  "supported_currencies": ["KES", "UGX", "TZS"],
  "rate_limit": "1000 requests/minute",
  "webhook_secret": "secret_key_here",
  "notes": "Primary payment gateway for East Africa"
}
```

**Examples - Equity Bank:**

```json
{
  "bank_code": "123456",
  "swift_code": "EQBLKEXX",
  "branch_id": "NAI001",
  "supported_services": ["deposits", "withdrawals", "transfers"],
  "batch_processing_time": "02:00",
  "notes": "Corporate banking integration"
}
```

**Use cases:**

- Store API keys or secret identifiers
- Document service limitations
- Track version compatibility
- Record contact information
- Mark special requirements

---

## TLS & AUTHENTICATION SECTION

### 18. **TLS Enabled**

**What it is:** Require secure encryption for all connections  
**Purpose:** Protect data in transit with SSL/TLS encryption  
**Default:** Disabled (Unchecked)

**When to enable:**

- ✅ **ALWAYS for production banking/payments**
- ✅ MNT payment gateway
- ✅ Equity Bank APIs
- ✅ Any server handling sensitive data

**When to disable:**

- ❌ Never disable for production
- ✅ Only acceptable for internal dev environments

**How it works:**

```
TLS Enabled = Protocol is HTTPS
TLS Disabled = Protocol is HTTP (no encryption)

HTTPS Encryption Process:
1. Client requests connection
2. Server sends certificate
3. Client verifies certificate
4. Encrypted tunnel established
5. Data travels encrypted
```

---

### 19. **Authentication Type**

**What it is:** Method used to authenticate to the server  
**Purpose:** Secure access control  
**Format:** Free text describing authentication method

**Examples - MNT:**

- ✅ `api_key` - MNT provides API key, sent in headers
- ✅ `oauth2` - OAuth 2.0 token-based authentication
- ✅ `bearer_token` - Bearer token in Authorization header
- ✅ `basic_auth` - Username:password in Authorization header
- ✅ `mtls` - Mutual TLS (certificate-based)
- ✅ `hmac_signature` - HMAC signature for request validation
- ✅ `custom_header` - Custom authentication header

**Examples - Equity Bank:**

- ✅ `certificate` - Client certificate authentication (mTLS)
- ✅ `corporate_id` - Corporate ID + password
- ✅ `saml` - SAML assertion
- ✅ `ldap` - LDAP authentication
- ✅ `oauth2_service_account` - OAuth2 with service account
- ✅ `ip_whitelist` - IP-based authentication (implied)

**Real-world configuration:**

```
MNT Payment Gateway:
  Authentication Type: "api_key"
  API Key: stored securely in system secrets
  Header Format: Authorization: Bearer {api_key}

Equity Bank:
  Authentication Type: "certificate"
  Certificate: stored in keystore
  Connection: mTLS (client cert verified by server)
```

---

## COMPREHENSIVE EXAMPLES

### Example 1: MNT Money Transfer Network (Production)

```
BASIC INFORMATION:
  Name: MNT Payment Gateway - Production
  Code: MNT_PAYMENT_PROD
  Protocol: HTTPS
  Host: api.mnt-gateway.co.ke
  Environment: PRODUCTION
  Region: East Africa - Kenya
  Port: 443
  Base Path: /api/v1
  Server Type: payment-gateway

CONNECTION SETTINGS:
  Timeout: 45 seconds (payment processing needs reasonable response time)
  Max Retries: 5 (critical operation, retry multiple times)

HEALTH CHECKS:
  Enabled: ✓ YES (production critical)
  Health Check URL: /health
  Interval: 60 seconds (need fast detection)

CIRCUIT BREAKER:
  Enabled: ✓ YES
  Failure Threshold: 3 (aggressive - stop fast on failures)

ADVANCED:
  Metadata: {
    "merchant_id": "MNT-SENTRA-2024",
    "rate_limit": "10000 req/min",
    "webhook_secret": "***",
    "settlement_frequency": "T+1"
  }
  TLS: ✓ ENABLED (required for payments)
  Authentication: api_key (Bearer token in Authorization header)
```

---

### Example 2: Equity Bank APIs (Staging)

```
BASIC INFORMATION:
  Name: Equity Bank API - Staging
  Code: EQUITY_BANK_STG
  Protocol: HTTPS
  Host: sandbox-api.equitybank.co.ke
  Environment: STAGING
  Region: Kenya - Nairobi
  Port: 8443 (custom staging port)
  Base Path: /api/v2
  Server Type: core-banking

CONNECTION SETTINGS:
  Timeout: 60 seconds (banking APIs can be slower)
  Max Retries: 3 (standard for external APIs)

HEALTH CHECKS:
  Enabled: ✓ YES (important for UAT)
  Health Check URL: /health
  Interval: 300 seconds (5 minutes, staging doesn't need constant checks)

CIRCUIT BREAKER:
  Enabled: ✓ YES
  Failure Threshold: 5 (moderate - allow some tolerance)

ADVANCED:
  Metadata: {
    "bank_code": "123456",
    "swift_code": "EQBLKEXX",
    "batch_time": "02:00 EAT",
    "settlement_account": "1234567890"
  }
  TLS: ✓ ENABLED (banking requirement)
  Authentication: certificate (mTLS with client certificate)
```

---

### Example 3: Internal Reconciliation Service (Dev)

```
BASIC INFORMATION:
  Name: Reconciliation Engine - Dev
  Code: RECON_ENGINE_DEV
  Protocol: HTTP
  Host: 192.168.1.50
  Environment: DEV
  Region: Internal
  Port: 8080
  Base Path: /recon
  Server Type: reconciliation-engine

CONNECTION SETTINGS:
  Timeout: 120 seconds (batch operations, can be slow)
  Max Retries: 1 (dev environment, not critical)

HEALTH CHECKS:
  Enabled: ✗ NO (internal dev, direct access)

CIRCUIT BREAKER:
  Enabled: ✗ NO (dev environment)

ADVANCED:
  Metadata: {
    "note": "Dev environment only",
    "batch_size": "10000 records",
    "schedule": "Daily 3am"
  }
  TLS: ✗ DISABLED (internal only)
  Authentication: none (no auth needed)
```

---

## QUICK DECISION TREE

```
Setting up a new server? Follow this:

1. Is it for PRODUCTION?
   ├─ YES → Use HTTPS, enable Health Checks, enable Circuit Breaker
   └─ NO → Use HTTP for dev/staging, health checks optional

2. Is it a BANKING/PAYMENT service?
   ├─ YES → TLS REQUIRED, authentication type, circuit breaker
   └─ NO → Consider based on sensitivity

3. Is it EXTERNAL (outside company)?
   ├─ YES → Robust settings: retries=5, health checks=every 60s
   └─ NO → Relaxed settings: retries=1-3, health checks optional

4. Is it CRITICAL for business?
   ├─ YES → Lower circuit breaker threshold (3-5), frequent health checks
   └─ NO → Higher threshold (10+), less frequent checks

5. Expected RESPONSE TIME?
   ├─ FAST (< 5 seconds) → Timeout: 10-30 seconds
   ├─ MEDIUM (5-30 seconds) → Timeout: 30-60 seconds
   └─ SLOW (> 30 seconds) → Timeout: 60-120 seconds
```

---

## Key Takeaways

| Aspect              | What to Remember                                         |
| ------------------- | -------------------------------------------------------- |
| **Name & Code**     | Name is readable, Code is for APIs                       |
| **Host**            | Domain or IP where the server lives                      |
| **Port**            | 443 for HTTPS, 80 for HTTP, others for special protocols |
| **Base Path**       | Reduces duplication in API endpoint configs              |
| **Timeouts**        | Higher for batch/file ops, lower for real-time           |
| **Retries**         | More for critical, less for idempotent operations        |
| **Health Checks**   | Detect outages early, enable for production              |
| **Circuit Breaker** | Prevent cascading failures, use in production            |
| **TLS**             | ALWAYS enable for production banking/payments            |
| **Authentication**  | Match the server's required method                       |

---

## Common Mistakes to Avoid

❌ **DON'T:**

- Use HTTP for production banking systems
- Set timeout too high (jobs hang)
- Set timeout too low (false failures)
- Forget to enable health checks for production
- Leave authentication type blank for secured APIs
- Use invalid JSON in metadata field
- Set circuit breaker threshold too high for critical services

✅ **DO:**

- Use HTTPS for all external/production connections
- Document the base path clearly
- Test health check URL before saving
- Set authentication type to match your API
- Enable circuit breaker for production
- Keep timeouts reasonable (30-120 seconds)
- Document metadata for future reference
