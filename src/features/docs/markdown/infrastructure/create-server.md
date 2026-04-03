---
title: Create Server
---

# Create Server

## Overview

Add a new server to your infrastructure with connection details, health monitoring, and circuit breaker settings.

---

## Basic Information

### Server Name*
**Required:** Yes
- Display name for the server
- Example: "Production API Server"

### Server Code*
**Required:** Yes
- Unique identifier for the server
- Used in configurations

---

## Connection Settings

### Protocol*
**Required:** Yes
- HTTP
- HTTPS
- FTP
- FTPS
- SFTP
- TCP
- SMTP
- SMTPS

### Host*
**Required:** Yes
- Hostname or IP address
- Example: api.example.com or 192.168.1.1

### Port
- Port number the server listens on
- Example: 80, 443, 8080

### Base Path
- Optional path prefix for requests
- Example: /api/v1

---

## Environment & Classification

### Environment*
**Required:** Yes
- dev
- qa
- uat
- prod

### Region
- Geographic region or location (optional)

### Server Type
- Custom server classification (optional)

---

## Reliability Settings

### Timeout (seconds)
**Default:** 30
- Request timeout in seconds

### Max Retries
**Default:** 3
- Maximum retry attempts

### Circuit Breaker Enabled
**Default:** Enabled
- Enable/disable circuit breaker protection

### Circuit Breaker Threshold
**Default:** 5
- Number of failures before opening circuit

---

## Health Check Configuration

### Health Check Enabled
**Default:** Enabled
- Toggle health monitoring on/off

### Health Check URL
- Endpoint for health checks
- Example: /health or /status

### Health Check Interval (seconds)
**Default:** 300
- How often to check health

---

## Security

### TLS Enabled
**Default:** Disabled
- Enable TLS/SSL encryption

### Authentication Type
- Type of auth (optional)
- Example: Basic, Bearer, API Key

---

## Metadata

**Optional:** JSON metadata for custom configuration

```json
{
  "team": "backend",
  "cost_center": "ops-123"
}
```

---

## Save

Click **Save** to create the server. You'll be redirected to the Servers List.

