# Data Connectors

## Overview

Data Connectors allow you to integrate your system with external data sources and services. Whether you need to connect to databases, APIs, Kafka topics, or file systems, Data Connectors provide a centralized way to manage and monitor these integrations.

## Key Features

- **Multiple Connector Types**: Support for TCP, WebSocket, Kafka, JDBC, SMS Inbox, API, and Files
- **Real-Time Testing**: Test connections before saving configurations
- **Connection Monitoring**: Track usage statistics and connection health
- **Advanced Configuration**: Type-specific settings for each connector type
- **Security**: Secure password handling and configuration management

## Supported Connector Types

**JDBC** - Connect to relational databases (PostgreSQL, MySQL, MSSQL, Oracle)

**API** - Connect to HTTP/HTTPS APIs with custom authentication

**TCP** - Low-level TCP socket connections

**WebSocket** - WebSocket protocol connections

**Kafka** - Apache Kafka message broker integration

**Files** - File system integration (local, FTP, SFTP)

**SMS Inbox** - SMS provider integration (MTN, Inbox, Test)

## Getting Started

To create and manage data connectors:

1. Navigate to **Infrastructure** → **Data Connectors**
2. View existing connectors and their status
3. Create new connectors using the create button
4. Test connections to verify configuration
5. Monitor connection statistics and usage

## Common Tasks

- [Create a Data Connector](/documentation/infrastructure/create-data-connector)
- [View Data Connector Details](/documentation/infrastructure/view-data-connector)
- [Browse Data Connector List](/documentation/infrastructure/data-connectors-list)
