# Communication Endpoints - Connection Status

## 🔗 COMMUNICATION & QUICKLIST INTEGRATION

### How Communications Connect with QuickLists:
Communications use QuickLists as the recipient source through the following integration:

- **Source Type**: `source_type: 'quicklist'`
- **Source ID**: `source_id: number` (QuickList ID)
- **Filters**: Optional `CommunicationFilters` for targeting specific recipients
- **Process**: Manual Broadcast wizard creates audience → uploads to QuickList → sends communication using QuickList as recipient source

**Data Flow:**
```
Manual Broadcast Wizard → QuickList Creation → Communication Send
     ↓                        ↓                      ↓
Step 1 (Audience) → QuickList API → POST /communications/send
Step 2 (Message)  → Stores data  → source_type: 'quicklist'
Step 3 (Test)     → Returns ID   → source_id: quicklist_id
Step 4 (Schedule) → Ready to send
```

---

## 📋 QUICKLISTS: UNDERSTANDING THE RECIPIENT MANAGEMENT SYSTEM

### What are QuickLists?
QuickLists are temporary data containers that store recipient information for Manual Broadcast communications. They serve as the bridge between audience creation and message delivery.

### How QuickLists Work with Manual Broadcasts

#### 1. **Audience Creation → QuickList Storage**
```
Manual Broadcast Step 1 (Target Audience)
        ↓
File Upload or Manual Entry
        ↓
Data Validation & Processing
        ↓
QuickList Created (POST /quicklists)
        ↓
Returns QuickList ID
```

#### 2. **QuickList Structure & Data Types**
QuickLists support different upload types based on data categories:

**Customer Subscription Data (`customer_subscription`)**:
- Purpose: Target customers by subscription status
- Required Columns: `msisdn` (phone), `subscription_id`
- Example Data:
  ```csv
  msisdn,subscription_id,status
  +254700000001,12345,active
  +254700000002,12346,inactive
  ```

**Customer Data (`customer_data`)**:
- Purpose: Target customers by personal information
- Required Columns: `msisdn`, `first_name`, `last_name`
- Example Data:
  ```csv
  msisdn,first_name,last_name,email,age
  +254700000001,John,Doe,john@example.com,25
  +254700000002,Jane,Smith,jane@example.com,30
  ```

#### 3. **Template Variables Integration**
QuickLists automatically generate template variables from column headers:

**Example QuickList with Customer Data:**
```
Columns: msisdn, first_name, last_name, email, age
Variables Available: {{msisdn}}, {{first_name}}, {{last_name}}, {{email}}, {{age}}
```

**Message Template Example:**
```
"Hi {{first_name}} {{last_name}}, your phone {{msisdn}} is registered for our service. Your age group is {{age}}."
```

**Rendered Message:**
```
"Hi John Doe, your phone +254700000001 is registered for our service. Your age group is 25."
```

#### 4. **QuickList Lifecycle in Manual Broadcasts**

**Phase 1: Creation (Step 1)**
- User uploads file or enters data manually
- System validates data format and required columns
- QuickList created via API: `POST /quicklists`
- Response returns `quicklist_id`

**Phase 2: Message Composition (Step 2)**
- System fetches available variables: `GET /communications/template-variables/{quicklist_id}`
- User composes message using template variables
- Variables are validated against QuickList columns

**Phase 3: Communication Send (Step 4)**
- System sends communication: `POST /communications/send`
- Payload includes:
  ```json
  {
    "source_type": "quicklist",
    "source_id": quicklist_id,
    "channels": ["SMS", "EMAIL"],
    "message_template": {
      "subject": "Welcome {{first_name}}",
      "body": "Hi {{first_name}}, welcome to our service!"
    }
  }
  ```

#### 5. **QuickList Management Operations**
- **View Data**: `GET /quicklists/{id}/data` - Paginated recipient list
- **View Logs**: `GET /quicklists/{id}/logs` - Upload processing logs
- **Delete**: `DELETE /quicklists/{id}` - Remove QuickList and data
- **Export**: `GET /quicklists/{id}/export` - Download as CSV

#### 6. **Current Status: Part of Manual Broadcasts**
QuickLists are currently integrated as part of the Manual Broadcast workflow:
- Not accessible as standalone feature (sidebar commented out)
- Created automatically during Manual Broadcast Step 1
- Used immediately for communication sending
- Can be made independent by uncommenting sidebar navigation

#### 7. **Future Independent QuickList Feature**
When QuickLists become standalone:
- Dedicated page: `/dashboard/quicklists`
- CRUD operations for data management
- Reusable across multiple campaigns
- Advanced filtering and segmentation
- Data import/export capabilities

---

## ✅ FULLY CONNECTED & WORKING

### 1. POST /communications/send
- **Status**: ✅ **Connected**
- **Usage**: Manual Broadcast Wizard, CreateCommunicationPage
- **Purpose**: Send communications to recipients via QuickList
- **Parameters**: source_type, source_id, channels, message_template, filters, batch_size
- **Integration**: Uses QuickList as recipient source (`source_type: 'quicklist'`)
- **Implementation**: `sendCommunication()` method in communicationService.ts

### 2. GET /communications/executions
- **Status**: ✅ **Connected**
- **Usage**: CommunicationAnalyticsPage
- **Purpose**: Get list of communication executions with filtering
- **Parameters**: limit, offset, start_date, end_date, channel, source_type
- **Filtering**: Can filter by `source_type: 'quicklist'` to see broadcast executions
- **Implementation**: `getExecutions()` method in communicationService.ts

### 3. GET /communications/logs
- **Status**: ✅ **Connected**
- **Usage**: CommunicationAnalyticsPage
- **Purpose**: Get detailed delivery logs for communications
- **Parameters**: limit, offset, execution_id, channel, status, start_date, end_date
- **Integration**: Shows delivery status for messages sent to QuickList recipients
- **Implementation**: `getLogs()` method in communicationService.ts

### 4. GET /communications/executions/{id}
- **Status**: ✅ **Implemented but Not Connected**
- **Purpose**: Get detailed information about specific execution
- **Usage**: Could show detailed broadcast execution info
- **Implementation**: `getExecutionById()` method exists in communicationService.ts
- **Missing**: No UI component/page to display detailed execution data

---

## 🎯 MANUAL BROADCAST STEPPER FLOW

The Manual Broadcast wizard uses a 4-step process with the following flow:

### Step 1: Target Audience (`TargetAudienceStep`)
- **Purpose**: Define recipient audience
- **UI**: `AudienceCreator` component with file upload/manual entry
- **Integration**: Creates QuickList for recipient storage
- **Data**: audienceFile, audienceName, uploadType, subscriptionIdColumn
- **Navigation**: Next → Step 2

### Step 2: Define Communication (`DefineCommunicationStep`)
- **Purpose**: Compose message and select channels
- **UI**: Message template editor with channel selection
- **Integration**: Uses template variables from QuickList columns
- **Data**: channels, message_template, subject, body
- **Navigation**: Next → Step 3

### Step 3: Test Broadcast (`TestBroadcastStep`)
- **Purpose**: Send test communication before full broadcast
- **UI**: Test recipient input and send test button
- **Integration**: Sends to test recipients using same channels
- **Data**: testRecipients, testResults
- **Navigation**: Next → Step 4

### Step 4: Schedule (`ScheduleStep`)
- **Purpose**: Configure when to send the broadcast
- **UI**: Date/time picker with send now/later options
- **Integration**: Calls POST /communications/send with QuickList data
- **Data**: scheduleType, scheduleDate, scheduleTime
- **Navigation**: Send → Success (redirect to QuickLists page)

**Stepper Component**: Uses `ProgressStepper` with clickable navigation, visual progress indicators, and step validation.

---

## ⚠️ IMPLEMENTED BUT ISSUES

### 5. GET /communications/stats
- **Status**: ❌ **Backend Error (500)**
- **Issue**: Database function `cvm.get_communication_stats` doesn't exist
- **Purpose**: Get communication statistics/metrics for charts
- **Implementation**: `getStats()` method exists in communicationService.ts
- **Current State**: Returns 500 error when called

### 6. GET /communications/executions/{id}
- **Status**: ✅ **Implemented but Not Connected**
- **Purpose**: Get detailed information about specific execution
- **Implementation**: `getExecutionById()` method exists in communicationService.ts
- **Missing**: No UI component/page to display detailed execution data

---

## ❌ NOT IMPLEMENTED

### 7. Communication Templates API
- **Status**: ❌ **Not Implemented**
- **Purpose**: Backend storage and management of message templates
- **Needed Endpoints**:
  - `GET /communications/templates` - Get all templates
  - `POST /communications/templates` - Create template
  - `PUT /communications/templates/:id` - Update template
  - `DELETE /communications/templates/:id` - Delete template
- **Current State**: Templates stored in localStorage only (frontend)
- **Impact**: Templates not shared across users/devices

### 8. Communication Details/Historical View
- **Status**: ❌ **Not Implemented**
- **Purpose**: Detailed view of individual communication executions
- **Needed Endpoints**:
  - `GET /communications/executions/:id/details` - Full execution details
  - `GET /communications/executions/:id/recipients` - Recipient list for execution
  - `GET /communications/executions/:id/metrics` - Performance metrics
- **Current State**: Only basic execution list available (uses existing `getExecutionById`)

### 9. Communication Scheduling
- **Status**: ❌ **Not Implemented**
- **Purpose**: Schedule communications for future sending
- **Needed Endpoints**:
  - `POST /communications/schedule` - Schedule communication
  - `GET /communications/scheduled` - Get scheduled communications
  - `PUT /communications/scheduled/:id` - Update scheduled communication
  - `DELETE /communications/scheduled/:id` - Cancel scheduled communication
- **Current State**: Only immediate sending supported (Step 4 handles basic scheduling UI)

### 10. CreateCommunicationPage Routing
- **Status**: ❌ **Page exists but not routed**
- **Issue**: CreateCommunicationPage.tsx exists but not connected to navigation
- **Route Needed**: `/communications/create/:quicklistId`
- **Current State**: Page can only be accessed directly via URL

### 11. Communication Templates UI Integration
- **Status**: ❌ **Components exist but not integrated**
- **Issue**: TemplateSelector, MessageEditor, RichTextEditor components exist but not used
- **Purpose**: Rich message composition with templates
- **Current State**: Manual broadcast uses basic text input only

### 12. Bulk Communication Operations
- **Status**: ❌ **Not Implemented**
- **Purpose**: Bulk operations on communications
- **Needed Endpoints**:
  - `DELETE /communications/executions/:id` - Cancel/delete execution
  - `POST /communications/executions/:id/resend` - Resend failed messages
  - `POST /communications/bulk-send` - Send to multiple QuickLists
- **Current State**: Individual operations only

---

## 📊 SUMMARY

**Total Endpoints Identified**: 12
**Fully Connected**: 4 (33%)
**Implemented but Issues**: 1 (8%)
**Not Implemented**: 7 (58%)

### Current Integration Status:
- ✅ **Manual Broadcast Wizard** - Fully functional 4-step process
- ✅ **QuickList Integration** - Communications use QuickLists as recipient sources
- ✅ **Analytics & Monitoring** - Execution tracking and delivery logs
- ✅ **ProgressStepper** - Visual step navigation with validation

### Priority Order for Implementation:
1. **Fix Stats Endpoint** - Enable charts in analytics (critical for monitoring)
2. **Communication Details View** - Use existing `getExecutionById` endpoint
3. **CreateCommunicationPage Routing** - Connect standalone communication page
4. **Communication Templates API** - Move from localStorage to backend
5. **Communication Scheduling** - Advanced scheduling features
6. **Bulk Operations** - Administrative bulk actions

---

*Last Updated: December 2024 - Added QuickList integration details and Manual Broadcast stepper documentation*
