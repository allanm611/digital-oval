# View Manual Communication Details

## Overview

The Manual Communication details page shows complete information about a communication execution, including summary metrics, execution details, and delivery logs.

## How to Access

**From Communications List**
1. Navigate to **Manual Actions → Manual Communications**
2. Click the communication name or **View** button
3. Details page loads

**From Search Results**
1. Search for communication
2. Click on matching result
3. Details page opens

## Details Page

![View Communication Details](/img/manual-actions/detailscommunicationpage.png)

## Summary Metrics

Four cards display key metrics at the top:

**Total Recipients**
- Total number of customers targeted for this communication

**Messages Sent**
- Number of messages successfully delivered

**Messages Failed**
- Number of messages that failed to deliver

**Success Rate**
- Percentage: (Messages Sent / Total Recipients) × 100
- Shows delivery success percentage

## Execution Information

Displays detailed information about the communication execution:

**Source Type**
- How audience was provided: file, quicklist, or manual entry

**Source Name**
- Name/identifier of the audience source

**Source ID**
- System ID of the source

**Execution Time**
- Duration of the execution in milliseconds

**Created At**
- Date and time the communication was created

## Recent Logs

A table showing delivery details for each recipient:

**Recipient**
- Customer identifier/contact info

**Channel**
- Communication method used (Email, SMS, WhatsApp, Push)

**Status**
- Delivery status: sent, failed, or pending

**Error Code**
- Error code if delivery failed (blank if successful)

**Created At**
- Date and time of the delivery attempt

<!-- ## Available Actions

From the details page, you can:

- **Edit** - Modify scheduled communication (if not yet executed)
- **Retry Failed** - Retry failed deliveries
- **Duplicate** - Create a copy of this communication
- **Delete** - Permanently remove this communication
- **Download Report** - Export detailed metrics and logs
 -->
