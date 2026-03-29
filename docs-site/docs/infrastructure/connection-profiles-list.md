---
title: Connection Profiles List
---

import { EditButton } from '@site/src/components/EditButton';

# Connection Profiles List

## Overview

The Connection Profiles List displays all configured connections to external data sources. From this page, you can filter profiles, view statistics, manage connections, and access detailed profile information.

## Page Layout

### Statistics Cards
Summary of connection profile statistics:
- **Total Profiles** - Count of all profiles
- **Active Profiles** - Enabled and operational
- **Profiles with PII** - Contain sensitive data
- **Health Enabled** - Have health checks configured

### Connection Type Distribution
Bar chart showing breakdown by:
- Database connections
- API connections
- File connections
- Other sources

### Environment Distribution
Statistics by environment:
- Development (dev)
- Staging
- Production

## Filtering Profiles

### Search
- **Type:** Text input
- **Function:** Search by profile name or code
- **Real-time:** Results update as you type

### Connection Type Filter
- **Database** - SQL, NoSQL, warehouses
- **API** - REST, SOAP endpoints
- **File** - FTP, cloud storage
- **All** - Show all types

### Environment Filter
- **Development** - Dev environment
- **Staging** - Staging environment
- **Production** - Production environment
- **All** - Show all environments

### Classification Filter
- **Public** - Public data
- **Internal** - Internal use
- **Confidential** - Sensitive data
- **Restricted** - Highly restricted
- **All** - Show all classifications

### Status Filter
- **Active** - Enabled profiles
- **Inactive** - Disabled profiles
- **Expired** - Past expiration date
- **All** - Show all statuses

### PII Filter
- **With PII** - Contains personal data
- **Without PII** - No personal data
- **All** - Show all profiles

### Health Check Filter
- **Enabled** - Health checks active
- **Disabled** - No health checks
- **All** - Show all profiles

## Server Filter
- **Type:** Dropdown select
- **Function:** Filter by connected server
- **Usage:** Show only profiles using specific server

## Profile List

Each entry displays:
- **Profile Name** - Connection name
- **Profile Code** - Unique identifier
- **Type** - Connection type (Database/API/File)
- **Environment** - Dev/Staging/Prod
- **Status** - Active/Inactive/Expired
- **Classification** - Data classification level
- **PII Indicator** - Shows if contains personal data
- **Health Status** - Connection health
- **Action Menu** - Quick actions

## Actions

### Individual Profile Actions

Click the menu icon (⋮) on any profile:

**View Details**
- Open profile details page
- See full configuration

**Edit**
- Modify profile settings
- Update connection parameters

**Test Connection**
- Verify connectivity
- Test credentials
- Show connection status

**View Health**
- Check health status
- View last check timestamp
- Review health history

**View Reports**
- See analytics and metrics
- View usage statistics
- Check performance data

**Deactivate/Activate**
- Toggle profile status
- Disable/enable without deleting

**Delete**
- Remove profile (with confirmation)
- Irreversible action

### Bulk Actions

Select multiple profiles to:
- **Activate Multiple** - Enable several profiles
- **Deactivate Multiple** - Disable several profiles
- **Delete Multiple** - Remove multiple profiles

## Selection Mode

**Header Checkbox**
- Select all visible profiles
- Deselect all profiles
- Toggle selection

**Individual Checkboxes**
- Select specific profiles
- Bulk actions appear when selected

## Search and Server Filter

### Search Profiles
- Type profile name or code
- Results filter in real-time
- Shows matching profiles

### Filter by Server
- Select connected server
- Shows only profiles using that server
- Helps track server dependencies

## Sorting

**Available Sort Options**
- Name (A-Z)
- Created date
- Modified date
- Status
- Environment
- Type

## Pagination

- **15 profiles per page**
- Navigate between pages
- Total count displayed

## Profile Status Indicators

- 🟢 **Active** - Ready and operational
- 🔴 **Inactive** - Disabled profile
- ⚠️ **Expired** - Past valid date
- 🔵 **Unknown** - Status not determined

## Data Classification Colors

- **Public** - Green
- **Internal** - Blue
- **Confidential** - Orange
- **Restricted** - Red

## PII Indicator

- 🔒 **Has PII** - Contains personal data
- 🔓 **No PII** - No personal data

## Common Tasks

### Find Profiles Using a Server
1. Select server from Server Filter dropdown
2. View all profiles connected to that server
3. Monitor dependencies

### Filter by Classification
1. Click Classification Filter
2. Select desired level
3. View profiles matching criteria

### Check Production Connections
1. Click Environment Filter
2. Select "Production"
3. Review active connections

### Find PII Profiles
1. Click PII Filter
2. Select "With PII"
3. Ensure GDPR compliance

<EditButton docSlug="infrastructure/connection-profiles-list" docTitle="Connection Profiles List" />
