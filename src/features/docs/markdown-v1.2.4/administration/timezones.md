---
title: Timezones
---

# Timezones

Manage all available timezones in the system. These timezone configurations are used throughout the platform for campaign scheduling, message delivery at appropriate local times, and ensuring communications respect regional time zones. Each timezone includes standard time offsets, Daylight Saving Time (DST) settings, and regional information.

## Accessing Timezones

Navigate to **Administration → Timezones** to view and manage all configured timezones.

## Timezones List

The list displays all available timezones with:

- **Timezone Label** - Display name for the timezone (e.g., "East Africa Time")
- **IANA ID** - Standard timezone identifier (e.g., "Africa/Nairobi")
- **UTC Offset** - Standard time offset from UTC (e.g., "+03:00")
- **Region** - Geographic region (Africa, Americas, Asia, Europe, Oceania)
- **DST** - Whether Daylight Saving Time applies (Yes/No)
- **Status** - Active or Inactive
- **Sort Order** - Display order in timezone dropdowns
- **Actions** - Edit or Delete buttons

### List Features

**Search:**
- Search for timezones by label, IANA ID, or region

**Edit:**
- Click Edit to modify a timezone's details

**Delete:**
- Click Delete to remove a timezone

## Creating a Timezone

Click the **Create** button to add a new timezone configuration.

### Basic Details Section

**Required Fields:**

- **IANA Timezone ID** (required) - The standard IANA timezone identifier (e.g., "Africa/Nairobi", "America/New_York", "Europe/London")
  - Use standardized IANA codes for consistency
  - Examples: Africa/Johannesburg, Asia/Bangkok, Europe/Paris, Americas/Toronto

- **Timezone Label** (required) - Display name shown to users (e.g., "East Africa Time", "Eastern Standard Time")
  - Should be user-friendly and descriptive

- **UTC Offset** (required) - The standard time offset from UTC (e.g., "+03:00", "-05:00", "+09:30")
  - Format: ±HH:MM
  - This is the base offset without DST applied

**Optional Fields:**

- **Abbreviation** - Short code for the timezone (e.g., "EAT" for East Africa Time, "EST" for Eastern Standard Time)

- **Sort Order** - Numeric order for sorting in timezone dropdowns (lower numbers appear first)

- **Windows Timezone ID** - Windows system timezone identifier for compatibility (e.g., "Eastern Standard Time", "UTC+02:00")

- **Description** - Additional details about the timezone or when it's used

### Regional Information Section

Information about the geographic region(s) and countries:

- **Region** (dropdown) - Select the geographic region:
  - Africa
  - Americas
  - Asia
  - Europe
  - Oceania

- **Representative City** - A major city in the timezone (e.g., "Nairobi", "New York", "London")
  - Used to help users identify the timezone

- **Countries** (multi-select) - Countries and territories that use this timezone
  - Searchable dropdown with all world countries
  - Select multiple countries that share this timezone

### Daylight Saving Time (DST) Section

Configure Daylight Saving Time settings if applicable:

- **Uses Daylight Saving Time** (checkbox) - Enable if this timezone observes DST

If DST is enabled, configure:

- **DST Offset** - The offset during daylight saving time (e.g., "-04:00" for EDT when standard is "-05:00")
  - Should reflect the adjusted offset during DST period

- **DST Start Date** - When DST begins (e.g., "Second Sunday in March", "Last Sunday of March")
  - Describe the rule for when DST starts each year

- **DST End Date** - When DST ends (e.g., "First Sunday in November", "Last Sunday of October")
  - Describe the rule for when DST ends each year

Click **Save** to create the timezone. You'll be redirected to the timezones list.

## Editing a Timezone

Click the **Edit** button on any timezone to modify its configuration.

**Editable Fields:**
All fields from the creation form can be edited:
- Timezone label, IANA ID, and UTC offset
- Abbreviation, Sort Order, Windows ID
- Region, Representative City, Countries
- DST settings

Click **Save** to update the timezone.

## Timezone Configuration Details

### UTC Offset Format
Timezone offsets must be in the format `±HH:MM`:
- `+03:00` - 3 hours ahead of UTC (East Africa)
- `-05:00` - 5 hours behind UTC (Eastern Standard Time)
- `+09:30` - 9.5 hours ahead of UTC (Australia Central)
- `±00:00` - UTC (no offset)

### Daylight Saving Time Examples

**Example 1: US Eastern Time**
- IANA ID: America/New_York
- Label: Eastern Time
- Standard UTC Offset: -05:00
- Uses DST: Yes
- DST Offset: -04:00
- DST Start: Second Sunday in March
- DST End: First Sunday in November

**Example 2: Europe/London**
- IANA ID: Europe/London
- Label: British Time
- Standard UTC Offset: +00:00
- Uses DST: Yes
- DST Offset: +01:00
- DST Start: Last Sunday in March
- DST End: Last Sunday in October

**Example 3: Africa/Nairobi (No DST)**
- IANA ID: Africa/Nairobi
- Label: East Africa Time
- Standard UTC Offset: +03:00
- Uses DST: No

## Deleting a Timezone

Click the **Delete** button on any timezone to remove it.

1. Confirm the deletion when prompted
2. The timezone will be permanently deleted
3. You'll return to the timezones list

**Note:** Deletion cannot be undone. Ensure the timezone is not in use in campaigns or scheduled tasks before deleting.

## System Timezone Usage

The configured timezones are used throughout the platform for:

- **Campaign Scheduling** - Set campaign send times in customer timezones
- **Message Delivery** - Deliver messages at appropriate local times based on customer location
- **Report Timestamps** - Display report data in user or customer timezone
- **Activity Logs** - Record timestamps in relevant timezones
- **Time-based Segments** - Create segments based on time conditions in specific timezones

When a user selects a timezone for their profile or a customer belongs to a specific timezone, all scheduled communications and time-based operations respect that timezone's offset and DST rules.

## Best Practices

1. **Use IANA Timezone IDs** - Always use standard IANA timezone identifiers for consistency and automatic DST handling
2. **Include Both Standard and DST Offsets** - For regions that observe DST, always configure both offsets and transition dates
3. **Set Sort Order** - Assign sort order to frequently-used timezones so they appear first in dropdowns
4. **Representative Cities** - Choose major, well-known cities to help users identify timezones
5. **Keep DST Rules Current** - Review and update DST rules if they change (some regions change DST schedules)
