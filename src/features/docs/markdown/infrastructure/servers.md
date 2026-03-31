---
title: Servers
---


# Servers

## Overview

The Servers section allows you to manage and monitor all servers used by the Sentra CVM platform. Each server can be configured with specific settings, health checks, and circuit breaker policies to ensure optimal performance and reliability.

## Key Features

### Server Management
- Create and manage multiple servers
- Configure server properties (protocol, host, port, environment)
- Monitor server health status
- Activate or deactivate servers as needed

### Health Monitoring
- Enable health checks on servers
- Configure health check URLs and intervals
- Monitor real-time health status
- View health check history

### Circuit Breaker Protection
- Enable circuit breaker protection
- Configure failure thresholds
- Automatic failure handling

### Server Filtering
Filter servers by:
- Health status (enabled, failing, due for check)
- Environment (development, staging, production)
- Protocol (HTTP, HTTPS, etc.)
- Region
- Status (active, inactive)

## Server States

### Active
Server is operational and ready to handle requests.

### Inactive
Server is deactivated and will not process requests.

### Health Check Status
- **Enabled** - Health check is active and monitoring
- **Failing** - Health check indicates server issues
- **Due** - Health check is due to run

## Available Actions

- **View Details** - See complete server information
- **Create Server** - Add a new server
- **Edit Server** - Modify server configuration
- **Activate** - Enable server operations
- **Deactivate** - Disable server operations
- **Health Check** - Toggle health monitoring
- **Test Health** - Run an immediate health check
- **Circuit Breaker** - Toggle circuit breaker protection

