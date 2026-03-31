# Create Campaign

## Overview

The campaign creation process is a guided workflow that walks you through all the necessary steps to set up a complete campaign. You'll configure campaign details, select your target audience, set up offer configuration, schedule execution, and preview before launch.


## Campaign Creation Flow

The campaign creation consists of **5 steps**:

### Step 1: Definition

Configure all basic campaign details, goals, organizational structure, and timeline.


**Campaign Name** (Required)
- A descriptive name for your campaign
- Used to identify the campaign throughout the system

**Campaign Catalog** (Required)
- Select which catalog this campaign belongs to
- Catalogs organize campaigns by category or type
- See [Campaign Catalogs](./documentation/configuration/campaign-catalogs) for more information


**Line of Business** (Optional)
- Assign the campaign to a specific line of business
- Helps organize campaigns by business unit

**Department** (Optional)
- Assign the campaign to a specific department
- Allows department-level tracking and management


**Campaign Tags** (Optional)
- Add custom tags to categorize and organize campaigns
- Press Enter or click the + button to add tags
- Useful for filtering and grouping related campaigns


**Program** (Optional)
- Associate the campaign with a specific program
- Programs group related campaigns together
- Searchable list of available programs

**Primary Objective** (Required)
- Define the main goal of your campaign
- See [Campaign Objectives](./documentation/configuration/campaign-objectives) for available objective types


**Campaign Priority** (Optional)
- Set the priority level: Low, Medium, High, or Critical
- Helps determine resource allocation and execution order

**Priority Rank** (Appears when Priority is set)
- Rank this campaign relative to others at the same priority level (1-5)
- Rank 1 is highest within the priority level


**Communication Policy** (Optional)
- Select a communication policy that defines how and when customers are contacted
- Policies control frequency caps, opt-out rules, and channel preferences
- Option to customize the selected policy inline


**Campaign Description** (Optional)
- Detailed description of campaign goals and objectives
- Internal notes and context for team members

**Budget Allocated** (Optional)
- Total budget for running this campaign
- Displayed with currency symbol based on system settings
- Must be positive if campaign will be submitted for approval


**Start Date** (Required)
- Date and time when the campaign should begin

**End Date** (Optional)
- Date and time when the campaign should end
- Automatically set to be after the start date

![Step 1 - Basic Details](/img/campaign-images/step1-creation.png)

![Step 1 - Campaign Configuration](/img/campaign-images/step1.1-creation.png)



### Step 2: Audience Configuration

Select your target audience segments and configure how they interact with your campaign.

#### Campaign Type (Required)

**Campaign Type** - Choose how your audience segments will be structured:

- **Multiple Target Group** - Send the same campaign to multiple independent segments
- **Champion Challenger** - Designate one "champion" segment and test "challenger" variants against it
- **A/B Testing** - Compare exactly 2 campaign variants with different segments
- **Round Robin** - Deliver different offers sequentially to a single segment
- **Multiple Level** - Apply conditional logic to deliver different offers based on criteria

*For more information about campaign types, see [Campaign Types](./documentation/configuration/campaign-types-list)*

#### Segment Selection

Based on your selected campaign type, the system will display different segment selection options:

**Add Segment Button**
- Click to select existing segments from your segment library
- Behavior depends on campaign type:
  - **Multiple Target Group**: Add as many segments as needed
  - **Champion Challenger**: Add champion first, then add challengers
  - **A/B Testing**: Add exactly 2 variants
  - **Round Robin/Multiple Level**: Add 1 segment only

**Create New Segment Button**
- Create a brand new segment directly during campaign creation
- The newly created segment is automatically added to your campaign

#### Segment Configuration (When Multiple Segments)

**Mutually Exclusive Segments** (Checkbox - appears when 2+ segments selected)
- Ensures each customer appears in only ONE segment
- Prevents a single customer from receiving multiple variants of the campaign
- Useful for A/B testing and variant campaigns

#### Control Group Configuration

Configure whether to exclude a portion of your audience as a control group:

**Use Shared Control Group for All Segments** (Checkbox)
- Apply the same control group configuration to all segments
- Settings button appears when checked to configure the shared control group
- Control group can exclude:
  - Fixed percentage of audience
  - Fixed number of customers
  - Advanced selection criteria

**Configure Control Group Per Segment** (Checkbox)
- Set different control group configurations for each segment
- Each segment can have its own exclusion settings
- Useful when segments have different sizes or requirements

#### Seed List Configuration

Seed lists are special contact lists used for quality assurance and testing:

**Apply Seed List to All Segments** (Checkbox)
- Use the same seed lists across all segments
- Plus button appears to select which seed lists to include
- Seed lists receive the campaign to verify content before full launch

**Apply Seed List Per Segment** (Checkbox)
- Configure different seed lists for each segment
- Each segment can have its own test contacts
- Allows segment-specific quality testing

**Screenshot:**
[Insert screenshot of audience configuration step]

**Important:**
- Campaign type selection determines segment behavior and limits
- Control groups help measure true campaign impact vs. natural customer behavior
- Seed lists ensure message quality before sending to full audience
- Mutually exclusive segments prevent audience overlap


### Step 3: Offer Configuration

Configure which offers are delivered to each segment and how they are presented to customers.

#### Offer Assignment Per Segment

For each segment in your campaign, you can assign different offers:

**Offer Creative** (Optional - shown at top for selected segment)
- Choose a creative template for how the offer is presented
- Available creatives can be customized based on your offers
- Applied to the selected segment's offers

#### Segment Offer Configuration

For each segment, configure:

**Select Offers Button**
- Click to add offers to this segment from your offer library
- Create new offers directly during campaign setup if needed
- Offers appear in the "Assigned Offers" list once selected

**Assigned Offers Section**
- Displays all offers currently assigned to the segment
- Remove button (X) to unassign offers from this segment
- Shows offer names and details

#### Offer Delivery Settings

**Wait Interval (hours)** (Per Segment)
- Number of hours to wait between delivering offers to the same customer
- Prevents offer fatigue from multiple offers too quickly
- Set to 0 for immediate delivery

**Bucket Allocation** (Only for A/B Test & Champion Challenger campaigns)
- Defines how offer variants are distributed to customers
- Example formats:
  - A/B Test: "50-50" (equal split between variants)
  - Champion Challenger: "70-30" (70% champion, 30% challenger)
- Allocation percentages must sum to 100

#### Conversion Tracking

- Displays tracking configuration for each assigned offer
- Shows tracking type and parameters
- Allows validation of offer tracking setup before campaign runs

**Screenshot:**
[Insert screenshot of offer configuration step]

**Important:**
- All segments must have at least one offer assigned
<!-- - Wait intervals prevent rapid successive offers to the same customer -->
<!-- - Bucket allocations for testing should match your hypothesis -->
<!-- - Offer creative must be compatible with delivery channel -->


### Step 4: Scheduling

Define when and how often your campaign will run, including delivery windows and frequency.

#### Campaign Start

**Start Date/Time** (Radio button option)
- Set a specific date and time for campaign launch
- Picker includes both date and time selection
- Default starts at 08:00 on the selected date

**Starts When Previous Broadcast Aborts** (Radio button option)
- Campaign automatically starts when a previous broadcast ends
- Useful for sequential or dependent campaigns
- Overrides manual start date if selected

#### Campaign End

**Never** (Radio button option)
- Campaign runs indefinitely until manually paused
- No end date is set

**At Specific Date/Time** (Radio button option)
- Campaign automatically stops at the specified date and time
- Default stops at 23:59 on the selected date

#### Timezone Configuration

**Timezone Selection** (Dropdown)
- Choose the timezone for campaign execution
- Ensures offers are sent at the right time for your customers
- Displayed in format: (GMT±HH:MM) Location

#### Scheduling Type

**Scheduling Type Options:**
- **Scheduled** - Run one time at the specified start date/time
- **Recurring** - Run multiple times on a repeating schedule

**For Recurring Campaigns:**
- **Recurrence Pattern** - Days, Weeks, or Months
- **Recurrence Interval** - How often (every 1, 2, 3... days/weeks/months)
- **Specific Days of Week** - Choose which days campaign runs (Mon-Sat by default)
- **Start Time** - Time of day campaign begins
- **End Time** - Time of day campaign stops delivering

#### Delivery Timing

**Target Render Time**
- **Real Time** - Send offers immediately when conditions are met
- **Pre-render** - Prepare offers in advance for faster delivery

**Tip:** Consider customer timezone preferences for better engagement. Set start/end times to match peak customer activity periods.

**Screenshot:**
[Insert screenshot of scheduling step]


### Step 5: Preview & Launch

Review all campaign details, validate setup, and launch or save the campaign.

#### Campaign Summary

**Quick Stats Display:**
- **Total Audience Size** - Total number of customers across all segments
- **Offers** - Number of unique offers included in campaign
- **Segments** - Number of target segments
- **Schedule** - Campaign start and end dates/times

#### Campaign Details Review

**Audience Segments Section**
- Lists all segments included in the campaign
- Shows segment names and customer counts
- Displays any special configuration (Champion, Challenger, Variant, etc.)

**Selected Offers Section**
- Lists all offers assigned across segments
- Shows offer names and descriptions
- Confirms all offers are properly configured

**Schedule Overview**
- Start date and time
- End date and time (if set)
- Recurrence pattern (if applicable)
- Timezone

**Segment-Offer Mapping**
- Visual representation of which offers go to which segments
- Shows control group exclusions
- Displays seed list configuration

#### Validation Checklist

**Readiness Checks** (Pre-submission validation)
The system displays checks for:
- Campaign name provided
- Segments configured
- Offers assigned
- Schedule defined
- All required fields completed

All items must be completed before campaign can be submitted for approval.

#### Testing

**Send Test to Seed Lists Button**
- Before submitting to live audience, send campaign to seed lists
- Validates message content and delivery
- Tests offer presentation and tracking
- Confirms all creatives render correctly
- Reports success/failure for each seed list

#### Campaign Actions

**Save as Draft**
- Automatically saves your progress during creation
- Continue working on campaign later
- Campaign status remains "Draft"

**Edit Steps**
- Navigate back to any previous step to modify details
- All changes are captured in the draft

**Submit for Approval**
- Submits completed campaign for review by approvers
- Campaign moves to "Pending Approval" status
- Required for campaigns going to live audience
- Cannot submit with validation errors

**Screenshot:**
[Insert screenshot of preview step]

**Important:**
- All validation checks must pass before submission
- Always test with seed lists before submitting
- Double-check audience size to avoid unexpected reach
- Verify offers are correctly mapped to segments


## Navigation

- **Next Button** - Move to the next step (validates current step)
- **Back Button** - Return to previous step
- **Step Indicators** - Click on any completed step to jump back and edit


## Saving Progress

Your campaign progress is automatically saved as a draft. You can:
- **Close and Return Later** - Your progress is saved automatically
- **Submit for Approval** - When ready to launch
- **Make Edits** - Return to any step to modify details before submission

<!-- --- -->

<!-- ## After Creation

Once you've created your campaign:

1. **Approval Process** - Campaign goes to approval queue
2. **Approver Review** - Assigned approvers review and approve/reject
3. **Ready to Execute** - Once approved, you can run the campaign
4. **Monitor Performance** - Track results on the [Campaign Reports](/documentation/campaign-reports) page -->


