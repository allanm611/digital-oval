---
title: Servers List
---

# Servers List

## Overview

The Servers List displays all servers configured in your system. From this page, you can search servers, filter by various criteria, manage individual servers, and perform bulk actions.

---

## Statistics Cards

At the top of the page, you'll see summary cards:
- **Total Servers** - Count of all servers
- **Active Servers** - Number of enabled servers
- **Health Enabled** - Servers with health checks enabled
- **Health Failing** - Servers with failing health checks

---

## Filtering Servers

### Available Filters

**Environment**
- dev
- qa
- uat
- prod

**Protocol**
- HTTP
- HTTPS
- FTP
- FTPS
- SFTP
- TCP
- SMTP
- SMTPS

**Region**
- Filter by region (if configured)

**Status**
- Active - Server is enabled
- Inactive - Server is disabled

**Server Type**
- Filter by custom server type (if configured)

---

## Server List

Each server entry displays:
- **Server Name** - Display name
- **Code** - Unique identifier
- **Environment** - Deployment environment
- **Protocol** - Communication protocol
- **Host** - Hostname/IP address
- **Port** - Port number
- **Status** - Active/Inactive
- **Health Status** - If health checks enabled

---

## Actions

### Individual Server Actions

Click the menu icon on any server:

**View**
- Open server details page

**Edit**
- Modify server settings

**Activate/Deactivate**
- Toggle server operational status

**Health Check**
- Enable/disable health monitoring

**Circuit Breaker**
- Toggle circuit breaker protection

**Archive**
- Mark server as archived

### Bulk Actions

Select multiple servers using checkboxes:
- **Activate Multiple** - Enable several servers at once
- **Deactivate Multiple** - Disable several servers at once

---

## Search and Pagination

**Search**
- Type server name or code
- Results filter in real-time

**Pagination**
- Display 15 servers per page
- Navigate between pages
- View total count

