# Control Groups Overview

Control Groups are customer segments that do not receive a campaign message, used as a baseline to measure the true impact of your campaigns.

![Control Groups List](/img/v1.1/configuration/universalcontrolgroupslist.png)

## What are Control Groups?

Control Groups allow you to:

- **Create Baseline Audiences** - Define customer groups that receive no message
- **Measure Campaign Impact** - Compare treatment group results against control group baseline
- **Track Metrics** - Monitor member count and generation schedules

## Managing Control Groups

Navigate to **Configuration → Control Groups** to manage all control groups.

### View Control Groups List

The control groups list displays all configured groups with:

- **Name** - Control group identifier
- **Status** - Active, Inactive, or Expired badge
- **Generation Time** - When the group was created
- **Percentage** - Percentage of audience in the group
- **Member Count** - Number of customers in the group
- **Customer Base** - Source: Active Subscribers, All Customers, or Saved Segments
- **Recurrence** - One-time, Daily, Weekly, or Monthly

You can:

- **Search** - Find control groups by name or description
- **Filter by Status** - Show all, active, inactive, or expired groups

### Create Control Group

Click the **Create Control Group** button to add a new control group.

![Create Control Group - Step 1](/img/v1.1/configuration/createcontrolgroupstep1image1.png)

![Create Control Group - Step 1 Saved Segments](/img/v1.1/configuration/createcontrolgroupstep1savedsegemnts.png)

![Create Control Group - Step 2](/img/v1.1/configuration/createcontrolgroupstep2image2.png)

![Create Control Group - Step 3](/img/v1.1/configuration/createcontrolgroupstep3.png)

**Step 1: Customer Base**

- **Name** (required) - Enter the control group name
- **Customer Base** (required) - Select source:
  - Active Subscribers - Current active customers only
  - All Customers - All customers in the database
  - Saved Segments - Use segment conditions to define which customers are included in the control group
    - When you select "Saved Segments", the segment conditions builder appears
    - Use the same condition groups as in Create Segment (360 Profile conditions, segments, quicklists, system events, KPIs)
    - Pass these condition groups to filter exactly which customers should be in this control group
    - Example: Create conditions to include only customers from a specific segment or with certain profile attributes

**Step 2: Metrics**

- **Percentage** (required) - Set the percentage of audience (1-100%)

**Step 3: Scheduling**

- **Recurrence** (required) - Select generation frequency:
  - One-time - Generate once, no repeat
  - Daily - Regenerate every day
  - Weekly - Regenerate every week
  - Monthly - Regenerate every month

Click **Save** to create the control group.

### Edit Control Group

Click **Edit** on any control group to update:

- Name
- Customer Base
- Percentage
- Recurrence

Click **Save** to apply changes.

### Delete Control Group

Click **Delete** to remove a control group. The control group will be permanently removed.

## Control Group Status

Control groups can have the following statuses:

- **Active** - Control group is currently in use
- **Inactive** - Control group exists but is not in use
- **Expired** - Control group has passed its end date
