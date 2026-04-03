---
title: Create Data Connector
---

# Create Data Connector

## Overview

Create a new data connector for TCP, WebSocket, Kafka, JDBC, SMS Inbox, API, Files, or Digital Tags sources.

---

## Connector Configuration

Configuration fields vary by connector type:

### TCP Connector
- Queue Name
- Socket Timeout
- Non-blocking IO
- Reverse Lookup
- Direct Buffers
- Buffer Size
- Decoder

### WebSocket Connector
- HTTP Path
- URL

### Kafka Connector
- Brokers
- Topic Name
- Group Identifier
- Transactional Mode

### JDBC Connector
- Database Type
- Host, Port
- Database Name
- Username, Password
- Connection String
- SELECT Query
- Query Timeout

### SMS Inbox Connector
- Inbox ID
- Filter by Keyword
- Keyword Condition, Value
- Provider

### API Connector
- Method (GET/POST)
- Content Type (XML/JSON/QUERY_STRING)
- Request Headers
- Payload Template
- Enable Proxy
- Proxy URL, Username, Password
- Response Timeout
- Thread Count
- Messages Per Second
- Success Response
- Result Code/Description
- XPATH
- API Key

### Files Connector
- Input Path
- Output Path
- Regex Pattern
- Protocol (local/ftp/sftp)
- Connection Name

### Digital Tags Connector
- Type-specific configuration

---

## Common Settings

- Processor
- Scalability Factor
- SSL Enabled
- Timeout
- Retry Count
- Additional Configuration

---

## Save

Click **Save** to create the connector.
