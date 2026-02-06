# Data Connectors Feature - Implementation Guide

## Overview
This feature provides a comprehensive data connector management system with support for 7 connector types: TCP, WebSocket, Kafka, JDBC, SMS Inbox, API, and Files. The implementation includes robust configuration fields, real-time connection testing, advanced validation, and enterprise-grade security features.

## Backend Integration Status ✅

Your backend implementation is excellent! It includes:
- ✅ Real connection testing for all connector types
- ✅ Comprehensive validation
- ✅ Type-specific configuration handling
- ✅ Support for multiple database types (PostgreSQL, MySQL, MSSQL, Oracle)
- ✅ Advanced API configuration (proxy, rate limiting, payload templates)
- ✅ File protocol support (local, FTP, SFTP)
- ✅ SMS provider integration (Twilio, MTN, etc.)

## Frontend Implementation

### Components Created

1. **DataConnectorFormEnhanced.tsx** (NEW)
   - Comprehensive form with all configuration fields
   - Type-specific field rendering
   - Real-time connection testing using `/test-connection-config` endpoint
   - Validation and error handling
   - Support for all 7 connector types

2. **DataConnectorCard.tsx**
   - Visual card representation
   - Connection testing
   - Edit/Delete actions

3. **DataConnectorsGrid.tsx**
   - Responsive grid layout
   - Loading states
   - Empty state handling

### Services

- **dataConnectorService.ts**
  - `fetchDataConnectors()` - List connectors with filtering
  - `fetchDataConnectorById()` - Get single connector
  - `createDataConnector()` - Create new connector
  - `updateDataConnector()` - Update existing connector
  - `deleteDataConnector()` - Delete connector
  - `testDataConnectorConnection()` - Test saved connector
  - `testConnectionConfig()` - Test configuration before saving (NEW)
  - `getDataConnectorStatistics()` - Get statistics
  - `getAvailableConnectorTypes()` - Get available types

### Types

Updated `types/index.ts` to include:
- All backend configuration fields
- Database types (mysql, postgres, mssql, oracle)
- Transactional modes for Kafka
- File protocols (local, ftp, sftp)
- API content types and methods
- Comprehensive configuration interface

## Configuration Fields by Connector Type

### 1. JDBC
- **database_type**: Select (mysql, postgres, etc.)
- **host**: Text (Server Hostname)
- **username**: Text
- **password**: Password
- **database**: Text (Database Name)
- **queries_timemill**: Number (17000000 – likely timeout in ms)
- **select_query**: Text

### 2. API
- **url**: API endpoint URL
- **host**: API server hostname
- **username**: Authentication username
- **password**: Authentication password
- **content_type**: JSON | XML | Query String
- **method**: POST | GET
- **enable_proxy**: Enable Proxy (checkbox)
- **response_timeout**: Response Timeout (sec, default: 10)
- **thread_count**: Thread Count (default: 1)
- **messages_per_second**: Messages Per Second (default: 10)
- **service_message_throttle**: Service Message Throttle (default: 1)
- **request_headers**: Request Headers (key-value pairs)
- **success_response**: Success Response String/Header/Status
- **result_code**: Central API Response Result/Code
- **result_description**: Central API Response Result/Description
- **xpath**: Central API Response XPATH

### 3. TCP
- **buffer_size**: Buffer size for TCP connections
- **decoder**: Message decoder (e.g., "Carnage Returned Line Feed")
- **non_blocking_io**: Non Blocking I/O (checkbox)
- **reverse_lookup**: Reverse DNS lookup (checkbox)
- **socket_timeout**: Socket timeout (default: 120000)
- **direct_buffers**: Direct Buffers (checkbox)

### 4. WebSocket
- **http_path**: Text
- **username**: Text
- **password**: Password

### 5. Kafka
- **topic_name**: Topic name (e.g., MOMO-topic)
- **brokers**: Brokers (comma-separated host:port list)
- **group_identifier**: Group identifier for consumer
- **transactional_mode**: Transactional mode (disabled, enabled, auto)

### 6. Files
- **protocol**: Select (local, ftp, sftp)
- **recharge_event**: Text (e.g., Recharge Event)
- **input_path**: Text
- **output_path**: Text
- **regex_pattern**: Text (e.g., vou_*)
- **ssl_enabled**: Enable SSL (for SFTP)

### 7. SMS Inbox
- **provider**: Provider (MTN, Inbox, Test)
- **inbox_id**: Inbox ID (e.g., 2112)
- **filter_by_keyword**: Filter messages based on keyword (checkbox)
- **keyword_identifier**: Delimiter to Identify Keyword (e.g., "Comma")
- **keyword_condition**: Condition on keyword
- **keyword_value**: Keyword value

## Enhanced Features

### 🔒 Security Features
- **Password Visibility Toggles**: Secure password fields with show/hide functionality
- **SSL/TLS Support**: Comprehensive SSL configuration with certificate validation
- **Multiple Authentication Methods**: Basic Auth, Bearer Token, API Key authentication
- **Proxy Support**: HTTP/S proxy configuration with authentication

### ✅ Advanced Validation
- **Real-time Validation**: Immediate feedback on configuration errors
- **Type-specific Validation**: Custom validation rules for each connector type
- **URL Format Validation**: Proper URL format checking
- **Port Range Validation**: Ensures ports are within valid ranges (1-65535)
- **Required Field Validation**: Context-aware required field checking

### 🧪 Connection Testing
- **Pre-save Testing**: Test connections before saving configurations
- **Timeout Handling**: 30-second timeout with clear error messages
- **Detailed Error Messages**: Specific error types (network, auth, timeout, etc.)
- **Response Time Monitoring**: Performance metrics for connection tests
- **Validation Checks**: Configuration validation before testing

### 🎯 Enterprise Features
- **Retry Policies**: Configurable retry counts and strategies
- **Rate Limiting**: Messages per second and batch size controls
- **Custom Headers**: Flexible header configuration for APIs
- **Thread Pool Management**: Concurrency control
- **Scalability Factors**: Performance tuning options

## Usage Examples

### Creating a New Connector

```typescript
import { createDataConnector } from './services';

// JDBC Example
const jdbcConnector = await createDataConnector({
  name: "Production PostgreSQL",
  type: "jdbc",
  description: "Main production database",
  configuration: {
    database_type: "postgres",
    host: "db.example.com",
    port: 5432,
    database: "production",
    username: "app_user",
    password: "secure_password",
    ssl_enabled: true
  }
});

// API Example
const apiConnector = await createDataConnector({
  name: "Payment Gateway API",
  type: "api",
  description: "Stripe payment processing",
  configuration: {
    url: "https://api.stripe.com/v1/charges",
    method: "POST",
    content_type: "JSON",
    username: "sk_live_xxx",
    password: "",
    payload_template: '{"amount": "{{amount}}", "currency": "{{currency}}"}',
    response_timeout_seconds: 30,
    thread_count: 5
  }
});

// Kafka Example
const kafkaConnector = await createDataConnector({
  name: "Event Stream",
  type: "kafka",
  description: "Real-time event processing",
  configuration: {
    brokers: ["kafka-1:9092", "kafka-2:9092"],
    topic_name: "events",
    group_identifier: "cvm-processors",
    transactional_mode: "enabled"
  }
});
```

### Testing Connection Before Saving

```typescript
import { testConnectionConfig } from './services';

// Enhanced connection testing with validation
const config = {
  database_type: "postgres",
  host: "localhost",
  port: 5432,
  database: "test_db",
  username: "test_user",
  password: "test_pass",
  ssl_enabled: true,
  ssl_verify_cert: true
};

// Test the configuration
const result = await testConnectionConfig("jdbc", config);

if (result.success) {
  console.log("✅ Connection successful!");
  console.log(`⚡ Response time: ${result.response_time_ms}ms`);

  // Color-coded response time indicator
  if (result.response_time_ms < 100) {
    console.log("🚀 Excellent performance!");
  } else if (result.response_time_ms < 500) {
    console.log("👍 Good performance");
  } else {
    console.log("⚠️  Consider optimizing connection");
  }
} else {
  console.error("❌ Connection failed:", result.message);

  // Detailed error analysis
  if (result.error_details) {
    console.error("🔍 Error details:", result.error_details);

    if (result.error_details.includes("authentication")) {
      console.log("💡 Check your credentials");
    } else if (result.error_details.includes("timeout")) {
      console.log("💡 Check network connectivity and firewall rules");
    } else if (result.error_details.includes("not found")) {
      console.log("💡 Verify host and port configuration");
    }
  }
}
```

### Advanced API Configuration Example

```typescript
const apiConnector = await createDataConnector({
  name: "Stripe Payment API",
  type: "api",
  description: "Secure payment processing",
  configuration: {
    url: "https://api.stripe.com/v1/charges",
    method: "POST",
    auth_type: "bearer",
    password: "sk_live_xxx", // Bearer token
    content_type: "JSON",
    headers: {
      "Idempotency-Key": "{{idempotency_key}}",
      "Stripe-Version": "2023-10-16"
    },
    payload_template: '{"amount": "{{amount}}", "currency": "{{currency}}"}',
    proxy_enabled: true,
    proxy_url: "http://proxy.company.com:8080",
    response_timeout_seconds: 30,
    retry_count: 3,
    messages_per_second: 100
  }
});
```

## Recommendations

### 1. Environment Configuration
Create a `.env.local` file:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### 2. Update Your Main Page
If you're using a different DataConnectors page implementation, update it to use `DataConnectorForm`:

```typescript
import { DataConnectorForm } from "../components";

// In your component
<DataConnectorForm
  connector={editingConnector}
  isOpen={showForm}
  onClose={handleCloseForm}
  onSave={handleSaveConnector}
  loading={saving}
/>
```

### 3. Backend Dependencies
Ensure your backend has these npm packages:
```bash
npm install pg mysql2 ws kafkajs twilio ssh2-sftp-client basic-ftp
```

### 4. Security Considerations
- ⚠️ **Never log passwords** in production
- ✅ Use environment variables for sensitive credentials
- ✅ Implement proper authentication/authorization
- ✅ Encrypt passwords before storing in database
- ✅ Use HTTPS for all API communications
- ✅ Implement rate limiting on connection test endpoints

### 5. Testing Strategy
1. **Unit Tests**: Test each connector type's configuration validation
2. **Integration Tests**: Test actual connections to real services
3. **E2E Tests**: Test full create/update/delete flows
4. **Load Tests**: Test concurrent connection attempts

### 6. Error Handling
The implementation includes comprehensive error handling:
- Network errors
- Timeout errors
- Authentication failures
- Configuration validation errors
- Connection refused errors

### 7. Performance Optimization
- Connection pooling for JDBC
- Rate limiting for API connectors
- Caching for frequently accessed connectors
- Lazy loading for large connector lists

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data-connectors` | List all connectors |
| GET | `/api/data-connectors/:id` | Get single connector |
| GET | `/api/data-connectors/statistics` | Get statistics |
| GET | `/api/data-connectors/types` | Get available types |
| POST | `/api/data-connectors/create` | Create connector |
| PUT | `/api/data-connectors/update/:id` | Update connector |
| DELETE | `/api/data-connectors/delete/:id` | Delete connector |
| POST | `/api/data-connectors/:id/test-connection` | Test saved connector |
| POST | `/api/data-connectors/test-connection-config` | Test config before saving |

## Database Schema

Your PostgreSQL schema is well-designed:
- ✅ UUID primary keys
- ✅ JSONB for flexible configuration
- ✅ Proper indexes for performance
- ✅ Audit fields (created_at, updated_at, created_by, updated_by)
- ✅ Connection tracking (last_used, connection_count)

## Next Steps

1. **Replace Old Form**: Update your main DataConnectors page to use `DataConnectorFormEnhanced`
2. **Add Update Functionality**: The update endpoint is ready on backend, just needs frontend integration
3. **Add Filtering**: Implement filter UI for connector type, status, etc.
4. **Add Bulk Operations**: Implement bulk activate/deactivate
5. **Add Export/Import**: Allow exporting connector configurations
6. **Add Connection History**: Track connection test history
7. **Add Notifications**: Real-time notifications for connection failures

## Troubleshooting

### Connection Test Fails
1. Check backend logs for detailed error messages
2. Verify network connectivity from backend to target service
3. Check firewall rules
4. Verify credentials
5. Test with curl/postman first

### Form Not Showing Configuration Fields
1. Ensure connector type is selected
2. Check browser console for errors
3. Verify types are imported correctly

### API Calls Failing
1. Check CORS configuration
2. Verify API_BASE_URL environment variable
3. Check network tab in browser dev tools
4. Verify backend server is running

## Support

For issues or questions:
1. Check backend logs: Look for `[Service]`, `[Controller]`, `[Repo]` prefixes
2. Check frontend console: Look for error messages
3. Review this documentation
4. Check the backend validation messages - they're very descriptive

## License

This implementation follows your project's license.
