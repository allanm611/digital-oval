# Create Control Group

## Overview

Create and configure new control groups to establish baseline audience segments for campaign measurement. You can also edit existing control groups using the same form.

## Opening the Create Form

There are two ways to open the create form:

1. **From the List Page**: Click the **Create Control Group** button in the top right of the Universal Control Groups list
2. **Edit Existing**: Click the **Edit** action on any control group in the list

## Form Steps

The control group creation process uses a multi-step form to organize the configuration.

![Create Control Group - Step 1](/img/v1.1/configuration/createcontrolgroupstep1image1.png)


![Create Control Group - Step 2](/img/v1.1/configuration/createcontrolgroupstep2image2.png)


### Step 1: Basic Info

**Control Group Code** (Required)
- Unique identifier for the control group
- System-generated code for reference

**Control Group Name** (Required)
- A descriptive name for your control group
- Example: "Email Treatment Baseline", "SMS Control Q1"

**Description** (Optional)
- Additional details about the control group's purpose
- Example: "Baseline for Q1 2024 campaign measurement"

**Customer Base** (Required)
- Select the source of control group members:
  - **Active Subscribers** - Use only currently active customers
  - **All Customers** - Include all customers in the database
  - **Custom Conditions** - Define custom conditions to select specific customers
    - When you select "Custom Conditions", the segment conditions builder appears
    - Use the same condition groups as in Create Segment (360 Profile conditions, segments, quicklists, system events, KPIs)
    - Example: Create conditions to include only customers from a specific region or with certain attributes

### Step 2: Configuration

![Create Control Group - Step 2](/img/v1.1/configuration/createcontrolgroupstep2.png)

**Percentage** (Required)
- Set the percentage of audience to be in the control group
- Range: 1-100%
- Example: Enter 10 for a 10% control group

**Generation Method** (Required)
- Choose how members are selected:
  - **Random** - Randomly select members from the customer base
  - **Stratified** - Select members proportionally from population strata

### Step 3: Scheduling

![Create Control Group - Step 3](/img/v1.1/configuration/createcontrolgroupstep3.png)

**Recurrence** (Required)
- Select how often the control group members are regenerated:
  - **One-time** - Generate members once, no regeneration
  - **Daily** - Regenerate members every day
  - **Weekly** - Regenerate members every week
  - **Monthly** - Regenerate members every month

**Start Date and Time** (Optional)
- Set when the control group generation should begin
- Select timezone for scheduling

**End Date** (Optional)
- Set when the control group should expire
- Leave blank for no expiration

### Step 4: Preview

![Create Control Group - Step 4](/img/v1.1/configuration/createcontrolgroupstep4.png)

Review all the control group settings before creating:
- Verify all configuration details
- Review customer base settings
- Confirm percentage and generation method
- Check scheduling settings
- Click **Save** to create the control group

## Additional Options

**Control Group Type: Standard vs Universal**

When creating a control group, you can choose whether it should be **Standard** or **Universal** by toggling the "Mark as Universal Control Group" checkbox:

- **Standard Control Group** - A control group for specific use cases or campaigns. Check the box to unmark it as universal, making it available only for targeted purposes.
- **Universal Control Group** - A control group available system-wide across all campaigns and use cases. When the "Mark as Universal Control Group" checkbox is **checked**, the control group becomes universal and can be reused across your entire system.

You can see the type (Standard or Universal) in the control groups list table and filter control groups by type.

**Status**
- Toggle to set the control group as Active or Inactive
- Only active control groups can be used in campaigns

## Saving the Control Group

1. Complete all required fields (marked with *) in each step
2. Use the step navigation to move between steps
3. On Step 4 (Preview), review all settings
4. Click **Save** to create or update the control group
5. You'll see a success message and the form will close
6. The control group will appear in the list

## Error Messages

**Validation Errors**
- "This field is required" - Fill in all required fields
- "Invalid format" - Check the field format

**Save Errors**
- Check that all required fields are filled in
- Ensure percentage is between 1-100
- Verify the customer base selection

## Tips

- Use descriptive names that indicate the control group's purpose
- Start with a baseline of 10-20% for campaign measurement
- Choose the appropriate generation method based on your audience
- For Saved Segments, ensure your conditions accurately capture the target audience
- Set appropriate recurrence for your campaign frequency
- Mark global control groups as universal for easy discovery

## Next Steps

After creating a control group, you can:
- View its details and members on the [Control Group Details](/documentation/configuration/view-control-group) page
- Edit or delete it from the control group list
- Add members manually from the details page

## Related Pages

- [Control Groups Overview](/documentation/configuration/control-groups-overview)
- [Control Group List](/documentation/configuration/control-groups-list)
- [View Control Group Details](/documentation/configuration/view-control-group)
