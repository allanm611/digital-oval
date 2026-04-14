# Campaign Broadcasts

## Overview

Campaign Broadcasts are execution records of campaigns. Each broadcast represents an instance of sending a campaign to its target audience. Broadcasts track delivery across channels (email, SMS, push), engagement metrics (opens, clicks), and conversion data.

![Campaign Broadcasts List](/img/v1.0/campaign-images/campaignbroadcastslist.png)


## What is a Broadcast?

A broadcast is a record of a campaign execution:
- **Unique instance** of campaign delivery
- **Linked to a campaign** with campaign ID and name
- **Tracks engagement** (delivered, opened, clicked, conversions, failed, unsubscribed)
- **Records execution details** (status, channels used, recipients)
- **Captures metadata** (when sent, who created it)


## Broadcast Fields & Metrics

### Core Information
- **Broadcast ID** - Unique identifier for this broadcast instance
- **Campaign ID** - Associated campaign
- **Campaign Name** - Name of the campaign that was broadcast
- **Created By** - User who ran the broadcast

### Execution Details
- **Status** - Current broadcast status:
  - **Scheduled** - Waiting for execution time
  - **In Progress** - Currently sending messages
  - **Completed** - All messages sent
  - **Sent** - Successfully completed
  - **Failed** - Encountered errors during execution
  - **Paused** - Temporarily stopped

- **Sent At** - Timestamp when broadcast was ran
- **Channels** - Delivery channels used (email, SMS, push)

### Delivery Metrics
- **Total Recipients** - Target audience size
- **Delivered** - Messages successfully delivered
- **Opened** - Messages opened by recipients
- **Clicked** - Recipients who clicked a link
- **Conversions** - Customers who converted
- **Failed** - Messages that failed to send
- **Unsubscribed** - Customers who unsubscribed


## Broadcast Statistics

### Summary Cards

The Broadcasts page displays key aggregate metrics:

- **Total Broadcasts** - Count of all broadcast records
- **Total Sent** - Number of completed/sent broadcasts
- **Total Recipients** - Sum of all recipients across broadcasts
- **Total Conversions** - Sum of conversions across all broadcasts


## Viewing Broadcasts

### Broadcasts List

View all broadcast records with:
- Campaign name linked to each broadcast
- Broadcast status indicator
- Delivery and engagement metrics
- Click on any broadcast to view details

### Search & Filter

- **Search** - Find broadcasts by campaign name or creator
- **Filter by Status** - View broadcasts by execution status (Scheduled, In Progress, Completed, Failed, etc.)


## Broadcast Status States

**Scheduled** - Broadcast is scheduled but hasn't started yet

**In Progress** - Currently sending messages

**Completed** - All messages successfully sent

**Sent** - Same as completed - broadcast finished

**Failed** - Errors occurred during execution

**Paused** - Execution was temporarily stopped


## Broadcast Engagement Rates

### Calculating Engagement

Broadcasts show engagement based on delivered messages:
- **Open Rate** = Opened / Delivered × 100%
- **Click Rate** = Clicked / Delivered × 100%
- **Conversion Rate** = Conversions / Delivered × 100%


## Broadcast Details Page

Click on any broadcast to view its complete details including metrics breakdown and channels used.

### Performance Metrics (Header)

Quick overview with 4 metric cards:
- **Total Recipients** - Target audience size
- **Delivered** - Count delivered + delivery rate %
- **Opened** - Count opened + engagement rate %
- **Conversions** - Count converted + conversion rate %

![Broadcast Details - Stat Cards](/img/v1.0/campaign-images/campaignbroadcastsdetailstatcards.png)

### Delivery & Engagement Breakdown

Detailed breakdown of message delivery and engagement:

**Delivery:**
- **Delivered** - Successfully sent messages
- **Failed** - Messages that failed
- **Unsubscribed** - Recipients who unsubscribed

**Engagement:**
- **Opened** - Messages opened
- **Clicked** - Links clicked
- **Conversions** - Conversion actions completed

![Delivery & Engagement Breakdown](/img/v1.0/campaign-images/campaignbroadcatsdetaildelivery&engagementbreakdown.png)

### Broadcast Information

Core broadcast details:
- **Name** - Campaign name
- **Broadcast ID** - Unique broadcast identifier
- **Status** - Current status (Scheduled, In Progress, Completed, Failed, Paused)
- **Campaign ID** - Associated campaign ID

![Broadcast Information](/img/v1.0/campaign-images/campaignbroadcastdetail-broadcatsinfo.png)

### Audit Trail

Broadcast execution metadata:
- **Created By** - User who ran the broadcast
- **Created At** - Timestamp when broadcast was sent

![Audit Trail](/img/v1.0/campaign-images/camapignbroadcatsdetail-audittrail.png)

### Channels Used

Shows which delivery channels were used:
- **Email** - Email channel
- **SMS** - Text message channel
- **Push** - Push notification channel

![Channels Used](/img/v1.0/campaign-images/campaignbroadcatsdetailschannelsused.png)

