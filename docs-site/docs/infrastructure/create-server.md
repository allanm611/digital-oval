---
title: Create Server
---

import { EditButton } from '@site/src/components/EditButton';

# Create Server

## Overview

The Create Server form allows you to add a new server to your infrastructure. You'll configure essential settings including connection details, health monitoring, and circuit breaker policies.

## Basic Information

### Server Name*
**Type:** Text input
**Required:** Yes
- Display name for the server
- Should be descriptive (e.g., "Production API Server")
- Used in lists and dashboards

### Server Code*
**Type:** Text input
**Required:** Yes
- Unique identifier for the server
- Used in APIs and configurations
- Can contain letters, numbers, and underscores

## Connection Settings

### Protocol*
**Type:** Dropdown select
**Required:** Yes
- HTTP - Standard web protocol
- HTTPS - Encrypted web protocol
- Custom - Other protocols

### Host*
**Type:** Text input
**Required:** Yes
- Server hostname or IP address
- Example: api.example.com or 192.168.1.100

### Port*
**Type:** Text input
**Required:** Yes
- Port number the server listens on
- Example: 80 for HTTP, 443 for HTTPS

### Base Path
**Type:** Text input
**Required:** No
- Optional path prefix for requests
- Example: /api/v1
- Defaults to root path if empty

## Environment & Region

### Environment*
**Type:** Dropdown select
**Required:** Yes
- **dev** - Development environment
- **staging** - Staging/test environment
- **prod** - Production environment
- **test** - Testing environment

### Region
**Type:** Text input
**Required:** No
- Geographic region or data center location
- Example: US-EAST, EU-WEST, APAC

### Server Type
**Type:** Text input
**Required:** No
- Classification of the server
- Example: API, Database, Cache, Load Balancer

## Performance & Reliability

### Timeout (seconds)*
**Type:** Number input
**Required:** Yes
**Default:** 30
- Request timeout in seconds
- Range: 1-300 seconds
- How long to wait before aborting request

### Max Retries*
**Type:** Number input
**Required:** Yes
**Default:** 3
- Maximum number of retry attempts
- Range: 0-10
- Applied on connection failure

## Health Check Configuration

### Health Check Enabled
**Type:** Toggle
**Default:** Enabled
- Enable/disable server health monitoring
- If enabled, configures health check endpoint

### Health Check URL
**Type:** Text input
**Required:** If health check enabled
- Endpoint to use for health checks
- Example: /health, /api/health, /status
- Must be accessible without authentication

### Health Check Interval (seconds)
**Type:** Number input
**Default:** 300 (5 minutes)
- How often to perform health checks
- Range: 30-3600 seconds
- Minimum 30 seconds recommended

## Circuit Breaker

### Circuit Breaker Enabled
**Type:** Toggle
**Default:** Enabled
- Enable/disable circuit breaker protection
- Prevents cascading failures

### Circuit Breaker Threshold
**Type:** Number input
**Default:** 5
- Number of failures before opening circuit
- Range: 1-100
- Higher = more tolerant to failures

## Security

### TLS Enabled
**Type:** Toggle
**Default:** Disabled
- Enable TLS/SSL encryption
- Recommended for production servers

### Authentication Type
**Type:** Text input
**Required:** No
- Type of authentication required
- Examples: Basic, Bearer, OAuth, API Key
- Leave blank if no authentication needed

## Additional Settings

### Metadata
**Type:** Text area
**Required:** No
- Additional JSON or free-form metadata
- Used for custom configuration
- Example:
```json
{
  "team": "backend",
  "cost_center": "ops-123",
  "sla": "99.9%"
}
```

## Form Actions

### Save Server
- **Validation:** All required fields must be filled
- **Success:** Server is created and list is updated
- **Error:** Check error messages and correct invalid fields

### Cancel
- Return to server list without saving
- Any unsaved changes are discarded

## Validation Rules

- **Server Name** - Required, 1-255 characters
- **Server Code** - Required, alphanumeric and underscores only
- **Host** - Required, valid hostname or IP
- **Port** - Required, 1-65535
- **Timeout** - Required, 1-300 seconds
- **Max Retries** - Required, 0-10
- **Health Check URL** - Required if health check enabled
- **Health Check Interval** - 30-3600 seconds
- **Circuit Breaker Threshold** - 1-100

## After Creating

After successfully creating a server:
1. You'll be redirected to the server list
2. The new server appears in the list
3. By default, the server is **Active**
4. Health checks begin if enabled
5. You can now:
   - View server details
   - Edit configuration
   - Monitor health status
   - Perform health checks

<EditButton docSlug="infrastructure/create-server" docTitle="Create Server" />
