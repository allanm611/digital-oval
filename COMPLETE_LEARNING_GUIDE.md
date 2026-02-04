# Complete Learning Guide: Sentra CVM, Telecommunications, Banking & Data Engineering

> **Date:** February 4, 2026
> **Project:** Sentra CVM (Customer Value Management)
> **Topics Covered:** CVM Systems, Data Engineering, Mobile Networks, Banking, Encryption

---

# Table of Contents

1. [Sentra CVM Project Overview](#1-sentra-cvm-project-overview)
2. [How Telecoms Use CVM (MTN Example)](#2-how-telecoms-use-cvm-mtn-example)
3. [Data Engineering Concepts](#3-data-engineering-concepts)
   - ETL Process
   - Data Connectors
   - Data Lake
   - Data Lakehouse
   - ACID Properties
   - Clusters, Nodes, Workers
   - Data Mining
4. [SQL GROUP BY Explained](#4-sql-group-by-explained)
5. [Apache Hadoop & Spark](#5-apache-hadoop--spark)
6. [Digital Ocean](#6-digital-ocean)
7. [Mobile Money (How Money Moves)](#7-mobile-money-how-money-moves)
   - Same Network Transfers
   - Cross-Network Transfers
   - Net Settlement
   - What is a Switch
   - EFT Explained
   - Bank of Uganda Regulation
8. [Agent Systems](#8-agent-systems)
   - How Agents Work
   - Withdrawal Codes
   - Agent Rebalancing
9. [Mobile Networks (SMS, Voice, Data)](#9-mobile-networks-sms-voice-data)
   - Network Architecture
   - How SMS Works
   - How Voice Calls Work
   - How Mobile Data Works
10. [Privacy & What Telecoms Can See](#10-privacy--what-telecoms-can-see)
11. [Encryption Deep Dive](#11-encryption-deep-dive)
    - Symmetric Encryption
    - Asymmetric Encryption (Public/Private Keys)
    - End-to-End Encryption
12. [Key Management](#12-key-management)
    - Phone Stolen Scenarios
    - Number Change Scenarios
    - Account Deletion

---

# 1. Sentra CVM Project Overview

## What is Sentra CVM?

**Sentra CVM (Customer Value Management)** is a comprehensive enterprise platform designed to help telecommunications companies, banks, and other large organizations manage customer relationships and marketing campaigns.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18.3** | UI Framework |
| **TypeScript 5.5** | Type Safety |
| **Vite 5.4** | Build Tool |
| **Tailwind CSS** | Styling |
| **MUI (Material UI)** | Component Library |
| **React Router v7** | Navigation |
| **Recharts** | Data Visualization |

## Project Structure

```
/src/
├── main.tsx              # Application entry point
├── App.tsx               # Root component with context providers
├── contexts/             # Global state management
│   ├── AuthContext.tsx
│   ├── ToastContext.tsx
│   ├── ThemeContext.tsx
│   └── ...
├── shared/               # Reusable components & utilities
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
└── features/             # Feature modules (29 directories)
    ├── campaigns/        # Campaign management
    ├── segments/         # Customer segmentation
    ├── offers/           # Offer management
    ├── customers360/     # Customer profiles
    ├── etl/              # ETL processing
    ├── data-connectors/  # Data source connections
    ├── jobs/             # Job scheduling & execution
    ├── kpis/             # Key Performance Indicators
    └── ...
```

## Core Features

| Feature | Description |
|---------|-------------|
| **Campaign Management** | Create, approve, and execute marketing campaigns |
| **Customer Segmentation** | Group customers based on behavior and attributes |
| **Offer Management** | Create and track promotional offers |
| **Customer 360** | Unified customer profiles |
| **ETL Processing** | Extract, Transform, Load data pipelines |
| **Multi-Channel Communication** | SMS, Email, Push, USSD |
| **Job Scheduling** | Automated workflow execution |
| **Reports & Analytics** | Performance tracking and KPIs |

---

# 2. How Telecoms Use CVM (MTN Example)

## The Problem

A telecom like MTN has **millions of customers** with different behaviors:
- High spenders vs low spenders
- Customers about to churn (leave)
- Inactive customers
- Data-heavy vs voice-only users

**Goal:** Send the **right offer** to the **right customer** at the **right time** through the **right channel**.

## Step-by-Step Usage

### Step 1: Data Integration (ETL & Data Connectors)

Connect data sources to the platform:

| Data Source | What It Provides |
|-------------|------------------|
| Billing System | Recharge history, ARPU, balance |
| Network/CDR | Call patterns, data usage, location |
| CRM | Customer profile, complaints, preferences |
| Mobile Money | Transaction history |

### Step 2: Customer Segmentation

Create customer groups based on rules:

| Segment | Rule Example |
|---------|--------------|
| "High Value Churners" | ARPU > $50 AND last_recharge > 14 days |
| "Data Heavy Users" | data_usage > 5GB/month |
| "Dormant Customers" | no_activity > 30 days |
| "New Subscribers" | tenure < 30 days |

### Step 3: Create Offers

Define what to give customers:

| Offer | Description |
|-------|-------------|
| "Win Back Bundle" | 2GB + 100 mins for $5 (for churners) |
| "Data Booster" | 50% extra data on next purchase |
| "Loyalty Reward" | Free 500MB for high-value customers |

### Step 4: Build Campaigns

Combine segments + offers + channels:

```
Campaign: "February Churn Prevention"
├── Target: "High Value Churners" segment (50,000 customers)
├── Offer: "Win Back Bundle"
├── Channel: SMS + Push Notification
├── Schedule: Send Monday 10 AM
└── Control Group: 10% receive nothing (to measure impact)
```

### Step 5: Execute via Jobs

The Jobs feature schedules and runs the campaign:
- Pulls the segment list
- Applies communication policies (don't SMS at night, respect DND)
- Sends messages through SMS gateway
- Tracks delivery status

### Step 6: Measure Results (Reports & KPIs)

| KPI | Example Result |
|-----|----------------|
| Delivery Rate | 94% SMS delivered |
| Redemption Rate | 12% took the offer |
| Revenue Impact | $45,000 incremental revenue |
| Churn Reduction | 8% fewer churners vs control group |

---

# 3. Data Engineering Concepts

## ETL (Extract-Transform-Load) Process

ETL is the pipeline that moves data from source systems into your platform.

```
EXTRACT                 TRANSFORM                 LOAD
────────                ─────────                 ────

MTN Billing  ──┐
System         │        ┌─────────────┐        ┌──────────────┐
               │        │             │        │              │
Network CDR  ──┼──────► │  Validate   │──────► │  Customer    │
Files          │        │  Clean      │        │  Data        │
               │        │  Enrich     │        │  Warehouse   │
CRM System  ───┤        │  Aggregate  │        │              │
               │        │             │        │  (Segments,  │
Mobile Money ──┘        └─────────────┘        │   Profiles)  │
                                               └──────────────┘
```

### ETL in Sentra CVM

**Location:** `src/features/etl/`

| Phase | Code | What Happens |
|-------|------|--------------|
| Extract | `fetchFiles()`, `fetchByTime()` | Pull CDR files, billing data from SFTP/API |
| Track | `EtlFileRegistryRowType` | Track: rows_parsed, rows_inserted, rows_failed |
| Status | `processing_status` | pending → processing → completed/failed |

---

## Data Connectors

Data connectors are bridges that connect your platform to external data sources.

### Connector Types in Sentra CVM

```typescript
type DataConnectorType =
  | "jdbc"          // Database connections (PostgreSQL, Oracle, MySQL)
  | "files"         // SFTP, FTP, S3, Azure Blob
  | "kafka"         // Real-time message streaming
  | "api"           // REST APIs
  | "tcp"           // Network socket connections
  | "websocket"     // Real-time bidirectional
  | "sms_inbox"     // SMS gateway inbox
```

### Example Configurations

**JDBC (Database):**
```typescript
{
  hostname: "db.mtn.co.ug",
  port: 5432,
  database: "billing",
  username: "etl_user",
  password: "****"
}
```

**Kafka (Real-time Events):**
```typescript
{
  brokers: ["kafka-1:9092", "kafka-2:9092"],
  topics: ["recharges", "calls", "data_usage"],
  groupId: "cvm-consumer"
}
```

---

## Data Lake

**What it is:** A massive storage repository that holds raw data in its native format until needed.

Think of it like a **massive folder on steroids**. You dump everything there without organizing it much.

```
DATA LAKE (Just Storage - Like a Giant Hard Drive)

/mtn-data-lake/
├── cdr/
│   ├── 2026-02-01-calls.csv       (10 GB)
│   ├── 2026-02-01-sms.csv         (2 GB)
│   └── 2026-02-02-calls.csv       (10 GB)
├── billing/
│   ├── subscribers_dump.json      (50 GB)
│   └── transactions_raw.parquet   (100 GB)
├── network/
│   └── cell_tower_logs.txt        (500 GB)
└── social/
    └── facebook_ads_responses.json (1 GB)
```

### Data Lake Products

| Product | Company | Description |
|---------|---------|-------------|
| **Amazon S3** | AWS | Cloud storage buckets |
| **Azure Data Lake Storage** | Microsoft | Cloud storage for big data |
| **Google Cloud Storage** | Google | Cloud file storage |
| **HDFS** | Apache Hadoop | Distributed file system |
| **MinIO** | Open Source | S3-compatible self-hosted |

---

## Data Lakehouse

**What it is:** Combines Data Lake (cheap storage) + Data Warehouse (fast queries). Best of both worlds.

Same files as Data Lake, but now you can **query it like a database** with SQL.

### Key Difference

| Data Lake | Data Lakehouse |
|-----------|----------------|
| Just storage | Storage + Query Engine |
| Need code to read files | Use SQL directly |
| Can't UPDATE rows | Can UPDATE/DELETE rows |
| No transactions | Full ACID transactions |
| Corrupt data possible | Always consistent |

### Data Lakehouse Products

| Product | Company | Description |
|---------|---------|-------------|
| **Databricks** | Databricks | Delta Lake + Spark engine |
| **Delta Lake** | Linux Foundation | ACID transactions on data lake |
| **Apache Iceberg** | Apache | Table format with time travel |
| **Snowflake** | Snowflake | Cloud data warehouse |
| **AWS Lake Formation** | AWS | Managed lakehouse on S3 |
| **Azure Synapse** | Microsoft | Lakehouse on Azure |

---

## ACID Properties

ACID is a set of rules that ensure your data stays **correct and consistent**, even when things go wrong.

### A - Atomicity (All or Nothing)

```
SCENARIO: Transfer $100 from Account A to Account B

STEPS:
1. Subtract $100 from Account A
2. Add $100 to Account B

WITHOUT ATOMICITY (BAD):
- Step 1 succeeds: Account A = $400
- System crashes before Step 2
- Account B still = $200
- $100 DISAPPEARED!

WITH ATOMICITY (GOOD):
- If Step 2 fails, Step 1 is automatically ROLLED BACK
- Account A goes back to $500
- No money lost
```

### C - Consistency (Rules Always Followed)

```
SCENARIO: Customer balance cannot be negative

WITHOUT CONSISTENCY (BAD):
- Customer has $50 balance
- Two transactions happen at same time: -$40 and -$30
- Both check "is $50 >= $40?" → YES
- Both succeed
- Balance = $50 - $40 - $30 = -$20 (INVALID!)

WITH CONSISTENCY (GOOD):
- Database enforces rule: balance >= 0
- Second transaction is REJECTED
- Balance = $50 - $40 = $10 ✓
```

### I - Isolation (No Interference)

```
SCENARIO: Two jobs updating same customer at same time

Job 1: Update customer churn_score = 0.8
Job 2: Update customer arpu = $45

WITHOUT ISOLATION (BAD):
- Job 1 reads customer: {churn: 0.5, arpu: $40}
- Job 2 reads customer: {churn: 0.5, arpu: $40}
- Job 1 writes: {churn: 0.8, arpu: $40}
- Job 2 writes: {churn: 0.5, arpu: $45}  ← Overwrites Job 1!

WITH ISOLATION (GOOD):
- Job 1 locks the row while updating
- Job 2 waits for Job 1 to finish
- Final result: {churn: 0.8, arpu: $45} ✓
```

### D - Durability (Changes Stick)

```
SCENARIO: You insert 1 million customer records

WITHOUT DURABILITY (BAD):
- Insert completes, system says "SUCCESS"
- Power goes out 1 second later
- System restarts
- Data is GONE

WITH DURABILITY (GOOD):
- Insert completes, written to disk
- System says "SUCCESS"
- Power goes out
- System restarts
- All 1 million records are still there ✓
```

---

## Clusters, Nodes, and Workers

**What they are:** The distributed computing infrastructure that processes data at scale.

```
DISTRIBUTED PROCESSING CLUSTER

┌─────────────────────────────────────────────────────────────┐
│                     MASTER NODE                              │
│                    (Coordinator)                             │
│                                                              │
│   • Receives job requests                                   │
│   • Divides work into tasks                                 │
│   • Assigns tasks to workers                                │
│   • Tracks progress & failures                              │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │  WORKER 1    │ │  WORKER 2    │ │  WORKER 3    │
   │  (Node)      │ │  (Node)      │ │  (Node)      │
   │              │ │              │ │              │
   │ Process      │ │ Process      │ │ Process      │
   │ customers    │ │ customers    │ │ customers    │
   │ A-H          │ │ I-P          │ │ Q-Z          │
   └──────────────┘ └──────────────┘ └──────────────┘

CLUSTER = Master + All Workers
```

---

## Data Mining

**What it is:** Discovering patterns, correlations, and insights from large datasets.

| Raw Data | Mined Insight |
|----------|---------------|
| Call Records (1 billion rows) | "Customers who call after 9pm are 3x more likely to churn" |
| Recharge History (500M transactions) | "Customers recharge on Fridays respond better to weekend offers" |
| Data Usage (Daily snapshots) | "High data users who suddenly drop usage will churn in 14 days" |

### Data Mining → Segments

| Mining Algorithm | Segment Created |
|------------------|-----------------|
| Churn Prediction Model | "High Churn Risk" |
| RFM Analysis | "High Value Customers" |
| Clustering (K-means) | "Data Heavy Users", "Voice Only Users" |
| Association Rules | "Bundle Propensity" |

---

# 4. SQL GROUP BY Explained

**What it does:** Combines rows that have the same value into summary rows.

## Example

### Without GROUP BY (Raw Data):

```
customer_id  |  amount  |  date
─────────────┼──────────┼────────────
  C001       |   $10    |  2026-01-01
  C001       |   $25    |  2026-01-05
  C001       |   $15    |  2026-01-10
  C002       |   $50    |  2026-01-02
  C002       |   $30    |  2026-01-08
  C003       |   $100   |  2026-01-03

6 rows - one per transaction
```

### With GROUP BY (Summarized):

```sql
SELECT customer_id, SUM(amount) as total_spent
FROM transactions
GROUP BY customer_id
```

**Result:**
```
customer_id  |  total_spent
─────────────┼──────────────
  C001       |     $50        ← (10 + 25 + 15)
  C002       |     $80        ← (50 + 30)
  C003       |     $100

3 rows - one per customer
```

## Common GROUP BY Functions

| Function | What It Does | Example |
|----------|--------------|---------|
| `SUM()` | Add up values | Total spent |
| `COUNT()` | Count rows | Number of transactions |
| `AVG()` | Average | Average transaction size |
| `MAX()` | Largest value | Biggest purchase |
| `MIN()` | Smallest value | Smallest purchase |

## Use Cases

```sql
-- 1. Total recharges per customer
SELECT customer_id, SUM(recharge_amount) as total
FROM recharges
GROUP BY customer_id

-- 2. Count calls per day
SELECT date, COUNT(*) as call_count
FROM cdr
GROUP BY date

-- 3. Average data usage per segment
SELECT segment_name, AVG(data_usage_gb) as avg_usage
FROM customers
GROUP BY segment_name

-- 4. Revenue per region per month
SELECT region, month, SUM(revenue) as total_revenue
FROM sales
GROUP BY region, month
```

---

# 5. Apache Hadoop & Spark

## The Problem They Solve

```
SCENARIO: MTN has 500 GB of call records to process daily

SINGLE COMPUTER:
├── Read 500 GB: 2 hours
├── Process data: 4 hours
├── Write results: 1 hour
└── TOTAL: 7 hours

TOO SLOW! What if we use 100 computers?
```

## Apache Hadoop (2006)

A system that lets you store and process huge files across many computers.

**Components:**
- **HDFS (Hadoop Distributed File System):** Stores files across many servers
- **MapReduce:** Processing engine (slow, disk-based)

## Apache Spark (2014)

Same idea as Hadoop, but keeps data in **MEMORY (RAM)** instead of disk. **100x faster.**

### Comparison

| Feature | Hadoop MapReduce | Apache Spark |
|---------|------------------|--------------|
| Speed | Slow (disk-based) | **100x faster** (in-memory) |
| Ease of Use | Complex Java code | Simple Python/SQL |
| Real-time | No (batch only) | Yes (streaming) |
| Machine Learning | Limited | Built-in (MLlib) |
| SQL Support | Needs Hive | Built-in (Spark SQL) |

### Spark Example

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("MTN-ARPU").getOrCreate()

# Read 500 GB of billing data (distributed across 100 workers)
billing = spark.read.parquet("s3://mtn-datalake/billing/")

# Calculate ARPU per customer (runs in parallel)
arpu = billing \
    .groupBy("customer_id") \
    .agg({"amount": "sum", "transaction_id": "count"}) \
    .withColumnRenamed("sum(amount)", "total_revenue")

# Write results
arpu.write.parquet("s3://mtn-datalake/arpu_results/")

# This processes 500 GB in ~5 minutes instead of 7 hours!
```

---

# 6. Digital Ocean

**What it is:** A cloud computing company (like AWS or Azure, but simpler and cheaper).

## Services

| Service | Description |
|---------|-------------|
| **Droplets** | Virtual servers ($5-$100/month) |
| **Databases** | Managed PostgreSQL, MySQL, Redis |
| **Spaces** | Object storage (like S3) |
| **Kubernetes** | Container orchestration |

## Comparison

| Provider | Best For | Complexity | Price |
|----------|----------|------------|-------|
| **Digital Ocean** | Startups, small apps | Simple | Cheap |
| **AWS** | Enterprise, everything | Complex | Expensive |
| **Azure** | Microsoft shops | Medium | Expensive |
| **Google Cloud** | AI/ML, Big Data | Medium | Medium |

---

# 7. Mobile Money (How Money Moves)

## Trust Account Concept

**Your MoMo balance is just a database record** showing your share of the trust account.

```
TRUST ACCOUNT AT STANBIC BANK

Total in Trust Account: 500,000,000,000 UGX

This belongs to ALL MTN MoMo users:

MTN's Database:
┌────────────────┬─────────────────────────────┐
│ Phone Number   │ Balance (Their portion)     │
├────────────────┼─────────────────────────────┤
│ 0770-111-111   │ 1,500,000 UGX               │
│ 0770-222-222   │   250,000 UGX               │
│ 0770-333-333   │ 5,000,000 UGX               │
│ 0770-444-444   │    50,000 UGX  ← This is YOU│
│ ... millions   │ ...                         │
├────────────────┼─────────────────────────────┤
│ TOTAL          │ 500,000,000,000 UGX         │
└────────────────┴─────────────────────────────┘

The actual cash sits in Stanbic Bank, not in your phone!
```

## Same Network Transfer (MTN to MTN)

```
Alice (MTN) sends 50,000 UGX to Bob (MTN)

MTN's Database Transaction:

BEGIN TRANSACTION;

  -- Debit Alice's wallet
  UPDATE wallets SET balance = balance - 51000  -- (50000 + 1000 fee)
  WHERE phone = '0770123456';

  -- Credit Bob's wallet
  UPDATE wallets SET balance = balance + 50000
  WHERE phone = '0770789012';

  -- Credit MTN's fee account
  UPDATE wallets SET balance = balance + 1000
  WHERE account = 'MTN_FEES';

COMMIT;

No real money moves! Just database records change.
```

## Cross-Network Transfer (Airtel to MTN)

Different networks have **separate trust accounts** at different banks.

### The Solution: Interoperability Switch

```
AIRTEL ──────► INTERSWITCH ──────► MTN
              (Central Hub)

The switch:
• Routes messages between networks
• Logs all transactions
• Calculates net settlement
```

### Process Flow

1. **Alice (Airtel) initiates transfer**
2. **Airtel debits Alice immediately** (database update)
3. **Airtel sends request to Switch**
4. **Switch validates and forwards to MTN**
5. **MTN credits Bob** (database update)
6. **End of day: Net Settlement** (real money moves between trust accounts)

---

## Net Settlement Explained

**Net Settlement** = Instead of moving money for EVERY transaction, calculate the TOTAL difference and move that once.

### Example

```
Today's transactions between Airtel and MTN:

Transaction 1: Alice (Airtel) → Bob (MTN)      =  50,000 UGX
Transaction 2: Carol (Airtel) → Dave (MTN)     = 100,000 UGX
Transaction 3: Eve (MTN) → Frank (Airtel)      =  30,000 UGX
Transaction 4: Grace (Airtel) → Henry (MTN)    =  70,000 UGX
Transaction 5: Ivan (MTN) → Jane (Airtel)      =  50,000 UGX

CALCULATION:
Airtel → MTN total:  50,000 + 100,000 + 70,000 = 220,000 UGX
MTN → Airtel total:  30,000 + 50,000           =  80,000 UGX

NET DIFFERENCE:  220,000 - 80,000 = 140,000 UGX

RESULT: Airtel owes MTN 140,000 UGX
SINGLE BANK TRANSFER: Airtel Trust Account → MTN Trust Account: 140,000 UGX

Instead of 5 transfers, just 1!
```

---

## What is a Switch?

A **switch** is like a **traffic controller** for money transactions between different systems.

### Without Switch (Direct connections)
```
MTN ──── Airtel
 │ \    / │
 │  \  /  │     5 companies = 10 connections
 │   \/   │     10 companies = 45 connections
 │   /\   │     20 companies = 190 connections
 │  /  \  │
Stanbic ── DFCU
```

### With Switch (Central hub)
```
     MTN ─────┐
              │
   Airtel ────┤
              │      ┌─────────────┐
  Stanbic ────┼─────►│   SWITCH    │
              │      └─────────────┘
    DFCU ─────┤
              │
 Centenary ───┘

5 companies = 5 connections
```

### Switch Functions

1. **Message Routing** - Forward transactions to correct destination
2. **Protocol Translation** - Convert between different message formats
3. **Transaction Logging** - Keep records for settlement
4. **Validation** - Check authorization, limits, formats

---

## EFT (Electronic Funds Transfer)

**EFT** = A system for transferring money between bank accounts in **BATCHES**.

### Example: Receiving Salary

```
Your employer (Stanbic) → Uganda Payment Switch → Your bank (Absa)

EFT FILE (What Company Sends):
┌────────────────────────────────────────────────────────────┐
│  Employee 1: Absa 123456, Amount: 2,000,000                │
│  Employee 2: DFCU 789012, Amount: 1,500,000                │
│  Employee 3: Stanbic 345678, Amount: 3,000,000             │
│  ... 500 more employees ...                                │
└────────────────────────────────────────────────────────────┘

Switch processes ALL at once (batch), not one by one.
```

### EFT vs RTGS

| Feature | EFT | RTGS |
|---------|-----|------|
| Processing | BATCH (many at once) | INSTANT (one at a time) |
| Speed | Same day or next day | Within 2 hours |
| Cost | Cheap (1,000 - 5,000 UGX) | Expensive (15,000 - 50,000 UGX) |
| Use Case | Salaries, small transfers | Large payments, urgent transfers |

---

## Bank of Uganda Regulation

Bank of Uganda (BoU) is the **Central Bank** - the "government of money."

### Roles

| Role | Description |
|------|-------------|
| **Print Money** | Only BoU can print Uganda Shillings |
| **Banker to Banks** | Every bank has an account AT Bank of Uganda |
| **Operate Payment Systems** | RTGS, EFT clearing |
| **Regulate & License** | Issue banking licenses, set rules, audit |
| **Set Interest Rates** | Central Bank Rate (CBR) affects all loans |
| **Protect Depositors** | Deposit Protection Fund |

### Mobile Money Regulations

| Rule | Description |
|------|-------------|
| **Trust Account Requirement** | All customer funds must be in trust account |
| **Transaction Limits** | Per transaction: 7,000,000 UGX |
| **KYC Requirements** | Verify customer identity |
| **Reporting** | Daily transaction reports to BoU |
| **Interoperability** | Must connect to other networks |

---

# 8. Agent Systems

## Agent Hierarchy

```
MTN UGANDA (HQ)
      │
      ▼
MASTER AGENTS (Big distributors - billions in float)
      │
      ▼
SUPER AGENTS (Medium - 10-100 million float)
      │
      ▼
REGULAR AGENTS (Small shops - 500K-5M float)
      │
      ▼
CUSTOMERS (You)
```

## How Cash-In Works

```
You want to deposit 100,000 UGX

BEFORE:
Your Wallet: 50,000 | Agent Wallet: 2,000,000
Your Pocket: 100,000 | Agent Cash: 500,000

TRANSACTION:
1. You give 100,000 CASH to agent
2. Agent's system transfers 100,000 E-MONEY to you

AFTER:
Your Wallet: 150,000 | Agent Wallet: 1,900,000
Your Pocket: 0       | Agent Cash: 600,000

Total money unchanged - just exchanged form!
```

## How Withdrawal Codes Work

### Why Codes Exist (Security)

```
WITHOUT CODE (BAD):
Criminal: "I want to withdraw from 0770-123-456"
Agent: "OK, how much?"
Problem: Anyone who knows your number can steal money!

WITH CODE (GOOD):
Criminal: "I want to withdraw 50,000"
Agent: "What's your code?"
Criminal: "Uhh... I don't have it"
Agent: "Sorry, can't help you"

The code proves:
✓ You initiated the withdrawal (you have the code)
✓ You know your PIN (needed to generate code)
✓ You authorized this specific amount
```

### Code Generation Process

1. You request withdrawal: `*165*2*2*50000#`
2. System verifies your PIN and balance
3. System generates random 6-digit code
4. System stores code hash in database with expiry time
5. System LOCKS your amount (can't spend it)
6. System sends code to your phone via SMS
7. You tell agent the code
8. Agent enters code to verify
9. System matches code, executes transfer
10. Agent gives you cash

---

## Agent Rebalancing

### Problem: Too Many Withdrawals

```
After 20 withdrawals:

Agent's E-Float: 3,000,000 UGX ↑ (gained e-money)
Agent's Cash:            0 UGX ↓ (gave out cash)

Customer: "I want to withdraw 50,000"
Agent: "Sorry, I don't have cash"
```

### Solution: Go to Super Agent

```
Agent gives Super Agent: 2,000,000 E-FLOAT
Super Agent gives Agent: 2,000,000 CASH

Now agent can do withdrawals again!
```

---

# 9. Mobile Networks (SMS, Voice, Data)

## Network Architecture

```
YOUR PHONE ─────► CELL TOWER ─────► MTN CORE NETWORK ─────► Internet/Other phones
   📱              🗼                    🏢

Radio waves     Fiber/Microwave        Connects to:
(wireless)      (wired)                • Internet
                                       • Other phones
                                       • SMS center
```

## Core Network Components

| Component | Function |
|-----------|----------|
| **MSC** (Mobile Switching Center) | Handles voice calls |
| **SMSC** (SMS Center) | Stores and forwards SMS |
| **PGW/GGSN** (Packet Gateway) | Connects to internet |
| **HSS** (Home Subscriber Server) | Customer database |

---

## How SMS Works

### Step-by-Step Flow

1. **Alice types message** "Hello" to Bob
2. **Phone creates SMS packet** with sender, receiver, message, timestamp
3. **Radio signal to cell tower**
4. **Tower forwards to SMSC** (SMS Center)
5. **SMSC stores message in database** (full content!)
6. **SMSC queries HSS:** "Where is Bob?"
7. **HSS responds:** "Connected to Tower #45 in Jinja"
8. **SMSC sends to Bob's tower**
9. **Tower sends to Bob's phone**
10. **Bob's phone acknowledges receipt**
11. **SMSC marks as delivered**

### Store and Forward

If Bob's phone is OFF:
- SMSC stores message (up to 72 hours)
- When Bob turns phone on, HSS notifies SMSC
- SMSC delivers stored messages

---

## How Voice Calls Work

### Call Setup

1. Alice dials Bob's number
2. Request goes to MSC
3. MSC verifies Alice can make calls
4. MSC queries HSS for Bob's location
5. MSC sends RING signal to Bob
6. Bob answers
7. Voice channel established

### Voice Encoding

```
YOUR VOICE (Analog) → SAMPLING (8000x/sec) → COMPRESSION (AMR codec) → DIGITAL PACKETS

Original: 64,000 bits/second
Compressed: 12,200 bits/second (5x smaller!)

50 packets per second sent during call
```

---

## How Mobile Data Works

### Connection Process

1. You open browser, type "google.com"
2. Phone requests data connection
3. PGW (Packet Gateway) checks your account
4. PGW assigns IP address to your phone
5. PGW creates "tunnel" for your data
6. Your request goes: Phone → Tower → PGW → Internet → Google
7. Google's response comes back same path
8. PGW tracks all bytes for billing

### Network Generations

| Generation | Speed | What You Can Do |
|------------|-------|-----------------|
| 2G (GSM) | 50-100 Kbps | SMS, basic web |
| 3G (UMTS) | 1-5 Mbps | Video calls, YouTube (low quality) |
| 4G (LTE) | 10-100 Mbps | HD video, fast downloads |
| 5G | 100-1000 Mbps | 4K video, VR/AR, instant gaming |

---

# 10. Privacy & What Telecoms Can See

## Summary Table

| Service | Metadata (Who/When/Where) | Content |
|---------|---------------------------|---------|
| **Phone Call** | ✅ Full details | ⚠️ CAN listen (with capability) |
| **SMS** | ✅ Full details | ✅ **FULL MESSAGE READABLE** |
| **HTTP website** | ✅ Which site | ✅ **EVERYTHING READABLE** |
| **HTTPS website** | ✅ Domain only | ❌ Encrypted |
| **WhatsApp/Signal** | ✅ App usage, data amount | ❌ End-to-end encrypted |
| **Location** | ✅ Always tracked via towers | N/A |

## Key Insights

### SMS is NOT Private
- MTN can read EVERY SMS you send/receive
- Messages stored for years (legal requirement)
- Never send passwords or secrets via SMS!

### HTTPS Protects Content
- MTN sees you visited google.com
- MTN CANNOT see what you searched

### End-to-End Encryption is Most Secure
- WhatsApp, Signal messages
- MTN cannot read
- Even WhatsApp cannot read
- Only your phone and recipient's phone can read

### Your Location is Always Known
- Cell towers track which tower you're connected to
- Your approximate location known at all times
- Unless phone is off or in airplane mode

---

# 11. Encryption Deep Dive

## The Basic Concept

```
WITHOUT ENCRYPTION (Like SMS):
You write letter → Give to postman → Postman can READ it!

WITH ENCRYPTION (Like WhatsApp):
You put letter in LOCKED BOX → Postman carries box → Only friend has KEY
Postman carries the box but CANNOT open it!
```

---

## Symmetric Encryption (Same Key)

Same key is used to LOCK (encrypt) and UNLOCK (decrypt).

```
ORIGINAL MESSAGE:     "Hello Bob"
KEY:                  "secretkey123"

ENCRYPTION:
"Hello Bob" + "secretkey123" = "Ajqwp Pfu"  (scrambled!)

DECRYPTION:
"Ajqwp Pfu" + "secretkey123" = "Hello Bob"  (readable!)
```

### Problem
If Alice and Bob both need the SAME key, how does Alice send the key to Bob securely?

---

## Asymmetric Encryption (Public + Private Keys)

Every person has TWO keys that are mathematically linked:

| Public Key | Private Key |
|------------|-------------|
| Can be shared with EVERYONE | Must be kept SECRET |
| Used to ENCRYPT (lock) | Used to DECRYPT (unlock) |
| Like a padlock anyone can close | Like the key that only you have |

### The Magic

- What PUBLIC key encrypts, ONLY PRIVATE key can decrypt
- What PRIVATE key encrypts, ONLY PUBLIC key can decrypt
- You CANNOT figure out the private key from the public key

### How It Works

1. **Bob shares his PUBLIC KEY** with everyone (even MTN can see it)
2. **Alice encrypts message** with Bob's PUBLIC KEY
3. **Encrypted message travels** through network (looks like random garbage)
4. **Bob decrypts with his PRIVATE KEY** (only he has it)

```
Alice's message: "Meet me at 5pm"
     +
Bob's Public Key
     ↓
Encrypted: "x7Kj2mN8pL0qR3sT5uW7yA9..."

MTN sees: "x7Kj2mN8pL0qR3sT5uW7yA9..." (CANNOT read!)

Bob's phone receives: "x7Kj2mN8pL0qR3sT5uW7yA9..."
     +
Bob's Private Key
     ↓
Decrypted: "Meet me at 5pm"
```

---

## End-to-End Encryption (WhatsApp)

### When You Install WhatsApp

Your phone generates a unique key pair:
- **Private Key:** Stored ONLY on your phone, NEVER sent anywhere
- **Public Key:** Sent to WhatsApp servers, associated with your phone number

### Why WhatsApp Cannot Read Messages

WhatsApp servers have:
- ✓ Your phone number
- ✓ Your public key
- ✓ Encrypted messages passing through

WhatsApp servers DON'T have:
- ✗ Your private key (only on YOUR phone)
- ✗ Anyone's private key

**To decrypt a message, you need the PRIVATE key. WhatsApp doesn't have it. Therefore, WhatsApp CANNOT decrypt messages.**

---

## The Math Behind It

The security comes from a math problem that's EASY one way, but IMPOSSIBLE to reverse.

```
EASY: Multiply two big prime numbers
P = 61, Q = 53
P × Q = 3233  ← Done in microseconds

HARD: Factor a big number into primes
Given: 3233
Find: Which two primes multiply to give 3233?
(Need to try thousands of combinations)

With numbers that have 600+ DIGITS:
World's fastest computer would take: millions of years
```

---

# 12. Key Management

## Scenario: Phone Stolen, New Phone, Same Number

### What Happens

1. **Old phone had:** Private key (stored locally), Public key (on WhatsApp server)
2. **Phone stolen:** Old private key is on stolen phone
3. **New phone:** Install WhatsApp, verify same number
4. **Result:**
   - NEW Private Key generated (different from old!)
   - NEW Public Key generated (replaces old on server)
   - Old keys are GONE (were on stolen phone)
   - Chat history LOST (unless backed up)

### What Friends See

```
⚠️ SECURITY ALERT
Alice's security code has changed.
This could mean:
• They reinstalled WhatsApp
• They changed phones
• Someone might be trying to intercept messages
```

### What Thief Can Do

- ✅ Read OLD messages (stored on stolen phone)
- ❌ Read NEW messages (encrypted with new keys)
- ❌ Continue using your WhatsApp (gets logged out when you verify on new phone)

---

## Scenario: Change Phone Number

### Option A: Use WhatsApp "Change Number" Feature

- Keys stay the SAME (same device)
- Chat history STAYS
- Profile info transferred
- Friends notified

### Option B: Delete & Reinstall with New Number

- NEW keys generated
- Chat history LOST (unless backed up)
- Like a completely new account

---

## Scenario: Delete WhatsApp Account

### What Gets Deleted

**On Your Phone:**
- ✓ Private Key DELETED
- ✓ All chat history DELETED
- ✓ All media DELETED

**On WhatsApp Servers:**
- ✓ Public Key DELETED
- ✓ Account info DELETED
- ✓ Profile photo DELETED

**On Friends' Phones:**
- ⚠️ Your messages to them STILL EXIST
- You cannot delete messages from OTHER people's phones

**On Google Drive/iCloud:**
- ⚠️ Backup NOT automatically deleted
- Must manually delete backup

---

## Summary Table

| Scenario | Private Key | Public Key | Chat History |
|----------|-------------|------------|--------------|
| Phone stolen, new phone, same number | NEW generated | NEW generated | LOST (unless backup) |
| Change number (WhatsApp feature) | SAME | SAME (remapped) | KEPT |
| Change number (delete & reinstall) | NEW generated | NEW generated | LOST |
| Delete account | DELETED | DELETED | DELETED (not from friends) |
| Reinstall after deleting | NEW generated | NEW generated | EMPTY |

---

## Protection Tips

1. **Enable phone lock** (PIN, fingerprint, face)
2. **Enable WhatsApp fingerprint/face lock**
3. **Enable 2-step verification** in WhatsApp
4. **Register new phone IMMEDIATELY** after theft (kicks thief out)
5. **Use encrypted apps** (WhatsApp, Signal) for sensitive info
6. **Never send passwords via SMS**

---

# Conclusion

This guide covered:

1. **Sentra CVM** - A customer value management platform for telecoms and banks
2. **Data Engineering** - ETL, Data Lakes, Data Lakehouses, ACID, Clusters
3. **SQL** - GROUP BY for aggregations
4. **Big Data** - Hadoop and Spark for distributed processing
5. **Mobile Money** - How money moves between accounts and networks
6. **Banking** - Switches, EFT, Net Settlement, Bank of Uganda regulation
7. **Agents** - How mobile money agents work
8. **Mobile Networks** - How SMS, voice calls, and data actually work
9. **Privacy** - What telecoms can and cannot see
10. **Encryption** - How your messages are protected
11. **Key Management** - What happens in various scenarios

---

*Generated from conversation on February 4, 2026*
