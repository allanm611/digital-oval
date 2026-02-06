# Additional Features

## User Management - Access Control & Role Permissions

### What is it?
The system now has role-based access control. Each user is assigned a role, and each role has specific permissions. **System roles** (built-in roles) have restrictions on what can be modified.

### System Roles - What's Restricted?

**System Roles CANNOT:**
- ❌ Edit role details (name, description, hierarchy level)
- ❌ Delete the role
- ❌ Deactivate the role
- ✓ But CAN be cloned to create custom roles based on them

**Default Roles CANNOT:**
- ❌ Deactivate default roles (they're always active)

### User Management Features

**View User Information:**
- All users in the system with their details
- Each user's assigned role
- User's permission list (what they can access/do)
- User's data access level (public, internal, confidential, restricted)
- PII (Personal Identifiable Information) access status - whether they can see customer personal data

**Role & Permission Details:**
- See all roles (system and custom)
- See all permissions and what action they allow (create, read, update, delete, execute, manage)
- Understand permission categories (campaigns, communications, settings, etc.)

### How to Test It

1. **View User Roles:**
   - Go to dashboard/admin area
   - Find user management section
   - Click any user to see their assigned role

2. **Check User Permissions:**
   - Open user details
   - Look for the "Permissions" section
   - See list of all permissions assigned to that user
   - Count total permissions and roles

3. **Test System Role Restrictions:**
   - Go to Roles Management (usually under Settings)
   - Look for system roles (they're marked as "System")
   - Try to edit one - you'll see "Cannot modify system roles" message
   - Try to delete one - same restriction appears
   - Try to deactivate one - you'll see "Cannot deactivate system roles"

4. **Clone a System Role:**
   - Open any system role
   - Click Clone button
   - This creates a new custom role based on the system role
   - The new role CAN be edited/deleted

### Data Access Levels

Each role has a data access level:
- **Public** - Can access all public data
- **Internal** - Can access internal and public data
- **Confidential** - Can access confidential, internal, and public data
- **Restricted** - Can access all data including restricted information

### What's Working

- ✓ View all users and their roles
- ✓ See all permissions each user has
- ✓ View data access levels
- ✓ Check PII access status
- ✓ Identify system vs custom roles
- ✓ See permission categories
- ✓ Clone system roles to create custom ones
- ✓ Edit and delete custom roles
- ✓ Activate/deactivate custom and default roles

### Restrictions (By Design)

- System roles cannot be edited, deleted, or deactivated (protected)
- Default roles cannot be deactivated (always active)
- System roles can only be cloned, not modified

---

## Data Connectors - Connection Types & Fields Guide

### What is it?
Data Connectors allow the system to connect to different external data sources (databases, APIs, files, messaging systems, etc.) to send/receive data. Each connection type has specific configuration fields.

### Connection Types & Field Explanations

#### 1. **API Connection**
Connect to external REST/SOAP APIs to send or receive data.

**Basic Fields:**
- **URL** - The API endpoint address (e.g., `https://api.example.com/endpoint`)
- **Host** - Server hostname or IP address
- **Username** - Optional authentication username
- **Password** - Optional authentication password

**Content & Method:**
- **Content Type** - Data format: JSON, XML, or Query String
- **Method** - HTTP method: POST or GET
- **Enable Proxy** - Checkbox to route requests through a proxy server
- **Proxy URL** - Proxy server address (if proxy enabled)

**Advanced Settings:**
- **Request Headers** - Add custom HTTP headers (name-value pairs)
- **Request Data** - JSON/XML payload to send with POST requests
- **Response Timeout** - How many seconds to wait for API response (1-300)
- **Thread Count** - Number of parallel threads (1-100)
- **Messages Per Second** - Rate limit for sending requests (1-10000)
- **Service Message Throttle** - Throttling multiplier (1-100)
- **Success Response String** - Text/header/status that indicates success
- **Result Code XPATH** - Path to find status code in response (for XML)
- **Result Description XPATH** - Path to find error message in response

---

#### 2. **JDBC (Database Connection)**
Connect to databases: MySQL, PostgreSQL, Microsoft SQL Server, or Oracle.

**Basic Connection:**
- **Database Type** - Choose: MySQL, PostgreSQL, MS SQL Server, or Oracle
- **Host** - Database server address (e.g., `localhost`)
- **Port** - Database port (MySQL=3306, PostgreSQL=5432, MS SQL=1433, Oracle=1521)
- **Database Name** - Name of the database to connect to
- **Username** - Database user
- **Password** - Database password

**Query Settings:**
- **Connection String** - Alternative full JDBC connection URL (overrides above if provided)
- **SQL Query** - The SELECT query to fetch data (e.g., `SELECT * FROM users WHERE status='active'`)
- **Query Timeout** - Max time in milliseconds to wait for query results (default: 17000000ms)

**Security:**
- **Enable SSL Connection** - Checkbox for encrypted database connection

---

#### 3. **WebSocket Connection**
Real-time bidirectional communication with WebSocket servers.

**Connection Details:**
- **Connection Name** - Friendly name for this connection
- **URL** - WebSocket URL (e.g., `ws://localhost:8080`)
- **HTTP Path** - Path on the server (e.g., `/ws`)
- **Username** - Optional authentication username
- **Password** - Optional authentication password

---

#### 4. **Kafka Connection**
Connect to Apache Kafka message broker for streaming data.

**Basic Settings:**
- **Connection Name** - Friendly name for this connection
- **Topic Name** - Kafka topic to publish/subscribe to

**Advanced Settings:**
- **Brokers** - Comma-separated list of Kafka broker addresses (e.g., `localhost:9092, localhost:9093`)
- **Group Identifier** - Consumer group ID for receiving messages
- **Transactional Mode** - 
  - **Disabled** - Regular message delivery
  - **Enabled** - Transactional/atomic delivery (all or nothing)
  - **Auto** - System decides based on setup

---

#### 5. **TCP Connection**
Low-level TCP socket communication.

**Socket Settings:**
- **Buffer Size** - Data buffer size in bytes (1024-1048576)
- **Socket Timeout** - Connection timeout in milliseconds (1000-300000)
- **Decoder** - Decoder type (e.g., "Carriage Return Line Feed")

**Options:**
- **Non-blocking I/O** - Checkbox for asynchronous communication
- **Reverse Lookup** - Checkbox for reverse DNS lookups
- **Direct Buffers** - Checkbox for direct memory buffer usage

---

#### 6. **SMS Inbox Connection**
Connect to SMS providers (MTN, Vodacom, etc.) to receive SMS messages.

**Provider Settings:**
- **Provider** - SMS provider (e.g., MTN, Vodacom)
- **Connection Name** - Friendly identifier
- **Short Code** - The short code where messages are received (e.g., `2112`)

**Filtering:**
- **Filter by Keyword** - Checkbox to filter incoming messages by keywords
- **Keyword Delimiter** - Character separating multiple keywords (e.g., `,`)
- **Keyword Identifier** - What makes a message match this filter
- **Keyword Condition** - Matching rule (equals, contains, starts with, etc.)
- **Keyword Value** - The keyword to match

---

#### 7. **Files Connection**
Read/write files from local system or remote FTP/SFTP servers.

**Basic Settings:**
- **Job Name** - Name of the file processing job
- **Protocol** - File source: Local File System, FTP, or SFTP
- **Connection Name** - Identifier for this file connection

**Paths:**
- **Input Path** - Where to read files from (e.g., `/data/input`)
- **Output Path** - Where to save processed files (e.g., `/data/output`)

**Pattern Matching:**
- **Regex Pattern** - Pattern to match files (e.g., `*.txt` or `*.csv`)
- **Multi-Directory By** - How to organize multi-directory processing

---

#### 8. **Digital Tags Connection**
Track and manage digital tags for analytics/tracking.

**Configuration:**
- **Connection Name** - Identifier for this tag connection
- **Tag Prefix** - Prefix added to all tags (e.g., `campaign_`)
- **Enable Tracking** - Checkbox to activate tag tracking

---

### How to Test Connections

1. **Create a New Connection:**
   - Go to Data Connectors section
   - Click "Add Connection" or "Create New"
   - Choose connection type
   - Fill in required fields (marked with *)

2. **Test the Connection:**
   - After filling fields, look for "Test Connection" button
   - Click it - system will verify the connection works
   - You'll see success ✓ or error ✗ message

3. **Save Connection:**
   - If test passes, click Save
   - Connection is now available for use in campaigns/ETL

---

### Common Errors & What They Mean

| Error | Cause | Fix |
|-------|-------|-----|
| Connection timeout | Server too slow or unreachable | Check URL/host address and internet connection |
| Authentication failed | Wrong username/password | Verify credentials in the system |
| Invalid port | Port number incorrect | Check the right port for your database/service |
| SSL certificate error | HTTPS certificate issue | Enable SSL checkbox if server requires it |
| Database not found | Wrong database name | Verify database name is spelled correctly |

---

---
