---
title: Connection Profiles
---


# Connection Profiles

## Overview

Connection Profiles manage secure connections to external data sources including databases, APIs, and file systems. Each profile defines connection parameters, performance settings, security policies, and health monitoring for reliable data integration.

## Key Features

### Connection Management
- Create and manage multiple connection profiles
- Support for databases, APIs, files, and custom sources
- Secure credential storage with encryption
- Connection pooling and performance optimization

### Load Strategies
- **Full Load** - Complete data synchronization
- **Incremental Load** - Only new/changed data
- Configurable batch sizes and parallelization

### Performance Optimization
- Connection pooling (min/max connections)
- Batch processing for bulk data
- Parallel thread configuration
- Timeout and retry settings
- Circuit breaker protection

### Data Security & Compliance
- Data classification (public/internal/confidential/restricted)
- PII (Personally Identifiable Information) detection
- GDPR compliance tracking
- Encryption key management
- Valid date ranges

### Health Monitoring
- Automated health checks
- Custom health check queries
- Connection status monitoring

## Connection Types

### Database
- SQL databases (MySQL, PostgreSQL, etc.)
- NoSQL databases
- Data warehouses
- Connection pooling and query optimization

### API
- REST/SOAP endpoints
- Authentication configuration
- Rate limiting and throttling
- Request/response mapping

### File
- FTP/SFTP connections
- Cloud storage (S3, Azure, GCS)
- Local file systems
- File format handling

## Reliability Features

### Retry Logic
- Configurable retry attempts
- Exponential backoff multiplier
- Automatic failure recovery

### Circuit Breaker
- Prevent cascading failures
- Configurable failure threshold
- Automatic recovery

### Connection Pooling
- Minimize connection overhead
- Configure pool size
- Idle timeout handling

## Data Security

### Encryption
- TLS for data in transit
- Encrypted credential storage
- Encryption key versioning

### Compliance
- GDPR applicability tracking
- Data classification
- PII identification
- Audit logging

## Available Actions

- **View Details** - See profile configuration
- **Create Profile** - Add new connection
- **Edit Profile** - Modify settings
- **Test Connection** - Verify connectivity
- **View Health** - Monitor connection status
- **View Reports** - Analytics and usage metrics
- **Deactivate** - Disable profile temporarily
- **Delete** - Remove profile

