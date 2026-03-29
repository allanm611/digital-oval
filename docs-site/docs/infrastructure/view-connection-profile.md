---
title: View Connection Profile Details
---

import { EditButton } from '@site/src/components/EditButton';

# View Connection Profile Details

## Overview

The Connection Profile Details page displays complete information about a specific connection profile. From here, you can view all configuration details, monitor health status, and perform various profile management actions.

## Page Layout

### Header
- **Profile Name** - Display name
- **Status Badge** - Active/Inactive/Expired indicator
- **Action Menu** - Additional options

## Information Sections

### Basic Information

**Name**
- Display name of the connection profile

**Code**
- Unique profile identifier
- Used in APIs and references

**Status**
- Active - Profile is operational
- Inactive - Profile is disabled
- Expired - Profile has passed valid date

**Environment**
- Development, Staging, or Production

### Connection Settings

**Connection Type**
- Database, API, or File

**Server**
- Server used for this connection
- Shows server name and code

**Load Strategy**
- Full Load - Complete data synchronization
- Incremental Load - Only new/changed records

### Performance Settings

**Batch Size**
- Records processed per batch
- Range: 100-10000
- Default: 1000

**Parallel Threads**
- Number of parallel execution threads
- Range: 1-32
- Default: 4

**Min Pool Size**
- Minimum connections in pool
- Range: 1-10
- Default: 2

**Max Pool Size**
- Maximum connections in pool
- Range: Min Pool Size to 100
- Default: 10

**Connection Timeout (seconds)**
- Timeout for connection establishment
- Range: 5-300 seconds
- Default: 30

**Idle Timeout (seconds)**
- Timeout for idle connections
- Range: 60-3600 seconds
- Default: 600 (10 minutes)

### Reliability Settings

**Max Retries**
- Retry attempts on failure
- Range: 0-10
- Default: 3

**Retry Backoff Multiplier**
- Multiplier for exponential backoff
- Example: 1s, 2s, 4s with multiplier=2
- Range: 1-5
- Default: 2

**Circuit Breaker Threshold**
- Failures before circuit opens
- Range: 1-100
- Default: 5

### Database Settings (if Database type)

**Database Type**
- Database system type
- Example: PostgreSQL, MySQL, Oracle

**Database Name**
- Name of the database

**Sync Column Name**
- Column used for incremental sync
- Identifies new/changed records

**Sync Column Type**
- Data type of sync column
- Example: timestamp, datetime, integer

### Health Check Configuration

**Health Check Enabled**
- Yes/No indicator

**Health Check Query**
- SQL query or API endpoint
- Only shown if health checks enabled
- Example: SELECT 1 (SQL), /health (API)

**Health Status**
- Current health status (Healthy/Failing/Unknown)

**Last Health Check**
- Date and time of most recent check

### Data Classification & Compliance

**Data Classification**
- Public - Public data
- Internal - Internal use only
- Confidential - Sensitive data
- Restricted - Highly restricted

**Contains PII**
- Yes/No indicator
- Identifies profiles with personal information

**GDPR Applicable**
- Yes/No indicator
- GDPR compliance required

### Validity Period

**Valid From**
- Profile activation date
- Profile not usable before this date

**Valid To**
- Profile expiration date (if set)
- Profile becomes inactive after this date

### Encryption & Metadata

**Encryption Key Version**
- Key version for credential encryption
- Optional field

**Metadata**
- Custom JSON or configuration data
- Example:
```json
{
  "team": "data-engineering",
  "cost_center": "data-123",
  "retention_days": 90
}
```

### Additional Information

**Created**
- Date and time profile was created

**Modified**
- Date and time of last modification

## Actions

### Edit
- **Icon:** Pencil
- **Function:** Open edit form
- **Allows:** Modify all profile settings

### Activate/Deactivate
- **Icon:** Power
- **Function:** Toggle profile operational status
- **Active state:** Shows Deactivate button
- **Inactive state:** Shows Activate button

### Health Check Actions (if enabled)

**Push Health**
- **Icon:** Zap
- **Function:** Run immediate health check
- **Result:** Shows health status modal with details
- **Health Modal displays:**
  - Status: Healthy or Unhealthy
  - Response details
  - Status code
  - Response time
  - Last check timestamp

**Reset Health**
- **Icon:** RotateCcw
- **Function:** Clear health check history
- **Use:** After fixing connection issues

### Test Connection
- **Icon:** Plug
- **Function:** Verify connectivity and credentials
- **Shows:** Connection status and any error messages

### More Menu
- **Archive** - Mark profile as archived
- **View Logs** - See operation logs (if available)
- **View Reports** - Analytics and usage metrics
- **Delete** - Remove profile (with confirmation)

## Health Status Details

### Healthy Status
- Green indicator
- Connection responding normally
- All health checks passing
- Last check: recent timestamp

### Failing Status
- Red indicator
- Connection not responding
- Health checks failing
- Consecutive failures shown

### Unknown Status
- Gray indicator
- Health status not yet determined
- Health checks not yet run
- Or health checks disabled

## Status Change Confirmation

When performing actions that change profile state, a confirmation dialog appears:

**Activate Profile**
- Title: "Activate Profile"
- Message: Confirm activation
- Buttons: Activate, Cancel

**Deactivate Profile**
- Title: "Deactivate Profile"
- Message: Warn about service interruption
- Buttons: Deactivate, Cancel

**Archive Profile**
- Title: "Archive Profile"
- Message: Confirm archival
- Note: Profile can be restored later
- Buttons: Archive, Cancel

## Metrics & History

**Health Check History** (if available)
- Timeline of health checks
- Success/failure indicators
- Response times
- Status codes

**Usage Statistics** (if available)
- Data sync frequency
- Last sync timestamp
- Records processed
- Data volumes

## Related Actions

**Edit Profile**
- Modify settings
- Opens profile edit form

**Back to List**
- Return to profiles list
- Preserves filter and sort settings

**View Other Profiles**
- Navigate using breadcrumbs
- Quick navigation menu

## Common Tasks

### Check Profile Health
1. Open profile details
2. Look for Health Status indicator
3. Click "Push Health" to test immediately
4. View results in modal dialog

### Deactivate Profile for Maintenance
1. Open profile details
2. Click Deactivate button
3. Confirm in dialog
4. Profile is now inactive

### Update Profile Configuration
1. Open profile details
2. Click Edit button
3. Modify desired settings
4. Save changes
5. Return to details view

### Monitor Sync Performance
1. Look at Usage Statistics section
2. See Last Sync timestamp
3. Check Records Processed count
4. Monitor Data Volume trends

### Verify Data Classifications
1. Check Data Classification level
2. Verify PII indicator
3. Confirm GDPR Applicable status
4. Review Validity Period dates

<EditButton docSlug="infrastructure/view-connection-profile" docTitle="View Connection Profile Details" />
