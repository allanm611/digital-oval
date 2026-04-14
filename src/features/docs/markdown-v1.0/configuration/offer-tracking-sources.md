# Offer Tracking Sources Overview

Offer Tracking Sources define how offer performance is measured and tracked. Each tracking source captures different types of data to understand how customers interact with your offers, helping you measure effectiveness and make data-driven decisions about your promotional strategies.

![Offer Tracking Sources List](/img/v1.0/configuration/offertrackingsourceslist.png)

## What are Tracking Sources?

Tracking Sources allow you to:

- **Measure Offer Performance** - Track how customers interact with and respond to offers
- **Capture Metrics** - Define what data to collect from offer interactions
- **Understand Impact** - Use the tracked data to measure offer effectiveness
- **Guide Strategy** - Use performance data to optimize future offers

## Tracking Source Types

Tracking sources capture different aspects of offer performance:

**Recharge** - Track recharge activities, transaction amounts, and payment methods

**Usage Metric** - Track customer consumption like data usage, voice minutes, SMS sent

**Engagement** - Track delivery, opens, clicks, and other engagement metrics

**Redemption** - Track offer redemption rates and discount utilization

**Churn Prevention** - Track if offers successfully retain customers

**Custom** - Create custom tracking sources for your specific needs

## Managing Tracking Sources

Navigate to **Configuration → Offer Tracking Sources** to manage all tracking sources.

### Viewing Tracking Sources List

The tracking sources list displays all configured sources with:

- **Name** - Tracking source identifier
- **Description** - Details about what this source tracks
- **Type** - The category of tracking (Recharge, Usage, Engagement, etc.)
- **Data Source** - Where the data comes from (CDR File, Usage Logs, Delivery Logs, Redemption Database, Subscriber Activity, Custom API)

You can:

- **Search** - Find tracking sources by name or description

### Create Tracking Source

Click the **Create** button to add a new tracking source.

![Create Offer Tracking Source](/img/v1.0/configuration/createoffertrackingimage1.png)

![Tracking Type Dropdown](/img/v1.0/configuration/createoffertrackingtypedropdown.png)

![Tracking Source Dropdown](/img/v1.0/configuration/createoffertrackingimagedropdownsource.png)

**Required Fields:**

- **Tracking Source Name** - The name of the tracking source (max 120 characters)
- **Type** - Select the type of tracking:
  - Recharge
  - Usage
  - Engagement
  - Redemption
  - Churn Prevention
  - Custom
- **Data Source** - Select where the data comes from:
  - CDR File
  - Usage Logs
  - Delivery Logs
  - Redemption Database
  - Subscriber Activity
  - Custom API

**Optional Fields:**

- **Description** - Explain what this tracking source measures (max 600 characters)

Click **Save** to create the tracking source.

### Edit Tracking Source

Click **Edit** on any tracking source to update:

- Tracking Source Name
- Description
- Type
- Data Source

Click **Save** to apply changes.

### Delete Tracking Source

Click **Delete** to remove a tracking source. The tracking source will be permanently removed.

## Using Tracking Sources in Offers

When creating or editing an offer, you can assign a tracking source to measure how that offer performs using the metrics defined by that tracking source.
