---
title: View Server Details
---

import { EditButton } from '@site/src/components/EditButton';

# View Server Details

## Overview

The Server Details page displays complete information about a specific server. From here, you can view all configuration details, monitor health status, and perform various server management actions.

## Page Layout

### Header
- **Server Name** - Display name
- **Status Badge** - Active/Inactive indicator
- **Action Menu** - Additional options

## Information Sections

### Basic Information

**Name**
- Display name of the server

**Code**
- Unique server identifier

**Status**
- Active - Server is operational
- Inactive - Server is disabled

**Environment**
- Development, Staging, or Production

### Connection Settings

**Protocol**
- HTTP, HTTPS, or custom protocol

**Host**
- Server hostname or IP address

**Port**
- Server port number

**Base Path**
- Optional path prefix for requests

**Region**
- Geographic region or data center

**Server Type**
- Classification or type of server

### Performance Settings

**Timeout (seconds)**
- Request timeout duration

**Max Retries**
- Number of retry attempts on failure

### Health Check Configuration

**Health Check Enabled**
- Yes/No indicator

**Health Check URL**
- Endpoint used for health checks
- Only shown if health checks enabled

**Health Check Interval**
- Frequency of health checks in seconds

**Last Health Check**
- Date and time of most recent check

**Health Status**
- Current health status (Healthy/Failing/Unknown)

### Circuit Breaker

**Circuit Breaker Enabled**
- Yes/No indicator

**Circuit Breaker Threshold**
- Number of failures before opening

**Circuit Breaker Status**
- Current status (Open/Closed/Half-Open)

### Security

**TLS Enabled**
- Yes/No indicator

**Authentication Type**
- Type of authentication configured

### Additional Information

**Metadata**
- Custom JSON or configuration data

**Created**
- Date and time server was created

**Modified**
- Date and time of last modification

## Actions

### Edit
- **Icon:** Pencil
- **Function:** Open edit form
- **Allows:** Modify all server settings

### Activate/Deactivate
- **Icon:** Power
- **Function:** Toggle server operational status
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
- **Use:** After fixing server issues

### Circuit Breaker Actions

**Toggle Circuit Breaker**
- **Function:** Enable/Disable circuit breaker
- **Open state:** Protects from failed requests
- **Closed state:** Normal operation

### More Menu
- **Archive** - Mark server as archived
- **View Logs** - See operation logs (if available)
- **Delete** - Remove server (with confirmation)

## Health Status Details

### Healthy Status
- Green indicator
- Server responding normally
- All health checks passing
- Last check: recent timestamp

### Failing Status
- Red indicator
- Server not responding
- Health checks failing
- Consecutive failures shown

### Unknown Status
- Gray indicator
- Health status not yet determined
- Health checks not yet run
- Or health checks disabled

## Status Change Confirmation

When performing actions that change server state, a confirmation dialog appears:

**Activate Server**
- Title: "Activate Server"
- Message: Confirm activation
- Buttons: Activate, Cancel

**Deactivate Server**
- Title: "Deactivate Server"
- Message: Warn about service interruption
- Buttons: Deactivate, Cancel

**Archive Server**
- Title: "Archive Server"
- Message: Confirm archival
- Note: Server can be restored later
- Buttons: Archive, Cancel

## Metrics & History

**Health Check History** (if available)
- Timeline of health checks
- Success/failure indicators
- Response times
- Status codes

**Request Statistics** (if available)
- Average response time
- Error rates
- Request volume
- Availability percentage

## Related Actions

**Edit Server**
- Modify settings
- Opens server edit form

**Back to List**
- Return to server list
- Preserves filter and sort settings

**View Other Servers**
- Navigate using breadcrumbs
- Quick navigation menu

## Common Tasks

### Check Server Health
1. Open server details
2. Look for Health Status indicator
3. Click "Push Health" to test immediately
4. View results in modal dialog

### Deactivate Server for Maintenance
1. Open server details
2. Click Deactivate button
3. Confirm in dialog
4. Server is now inactive

### Update Server Configuration
1. Open server details
2. Click Edit button
3. Modify desired settings
4. Save changes
5. Return to details view

### View Health History
1. Look at Health Check section
2. See Last Health Check timestamp
3. Click "Push Health" for current status
4. View health history timeline

<EditButton docSlug="infrastructure/view-server" docTitle="View Server Details" />
