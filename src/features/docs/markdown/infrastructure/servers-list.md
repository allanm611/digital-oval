---
title: Servers List
---


# Server List

## Overview

The Server List page displays all servers configured in your system. From this page, you can view server statistics, filter servers, perform bulk actions, and access individual server management options.

## Page Layout

### Statistics Cards
At the top of the page, you'll see summary statistics:
- **Total Servers** - Count of all servers
- **Active Servers** - Number of active/enabled servers
- **Health Enabled** - Servers with health checks enabled
- **Health Failing** - Servers with failing health checks

### Scope Filter
Filter the list by health status:
- **All** - Show all servers
- **Health Enabled** - Show servers with health checks enabled
- **Health Failing** - Show servers with failing health checks
- **Health Due** - Show servers pending health check

## Filtering Servers

### Available Filters

**Environment**
- Development (dev)
- Staging
- Production (prod)
- Testing

**Protocol**
- HTTP
- HTTPS
- Custom protocols

**Region**
- Filter by geographic region
- View servers in specific locations

**Status**
- Active - Server is enabled
- Inactive - Server is disabled

**Server Type**
- Filter by configured server type

## Server List

Each server entry shows:
- **Server Name** - Display name of the server
- **Status Icon** - Visual indicator of server state
- **Health Status** - Current health check status (if enabled)
- **Environment** - Deployment environment
- **Protocol** - Communication protocol
- **Host** - Server hostname/IP
- **Port** - Server port number
- **Action Menu** - Quick actions for the server

## Actions

### Individual Server Actions

Click the menu icon (⋮) on any server to access:

**View**
- Open server details page
- See complete configuration

**Edit**
- Modify server settings
- Update configuration

**Activate/Deactivate**
- Enable or disable the server
- Toggle server operational status

**Health Check**
- Enable health monitoring
- Disable health monitoring

**Health Actions** (if enabled)
- Test Health - Run immediate health check
- Reset Health - Clear health status

**Circuit Breaker**
- Toggle circuit breaker protection

**Archive**
- Mark server as archived

### Bulk Actions

Select multiple servers using checkboxes to:
- **Activate multiple servers** - Enable several servers at once
- **Deactivate multiple servers** - Disable several servers at once

## Selection Mode

Click the checkbox in the header to:
- **Select all visible servers** - Check all servers on current page
- **Deselect all** - Uncheck all servers
- **Toggle selection** - Switch between select all/deselect all

Once servers are selected, bulk action buttons appear at the top of the list.

## Search and Pagination

**Search**
- Type server name or code to filter results
- Results update as you type

**Pagination**
- Display 15 servers per page
- Navigate between pages
- View total server count

## Health Status Indicators

- **Healthy** - Server responding normally
- **Failing** - Server not responding
- **Unknown** - Health status unknown or not checked
- **Not Monitored** - Health check disabled

