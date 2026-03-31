---
title: ETL Fetch Controls
---


# ETL Fetch Controls

## Overview

The ETL Fetch Controls page allows you to trigger data file fetches from remote sources. You can fetch files immediately, for specific time periods, or within date ranges.

## Fetch Modes

### Mode Selection
- Choose how you want to fetch data
- Different modes support different use cases
- Switch between modes in the interface

## Fetch Mode 1: Immediate Fetch

### Purpose
Immediately fetch files associated with a specific job without waiting for scheduled runs.

### Parameters

**Job ID***
- **Type:** Text input
- **Required:** Yes
- **Description:** Numeric ID of the job to fetch files for
- **Example:** 123, 456

**Force Reprocess**
- **Type:** Toggle
- **Default:** Off
- **Description:** Reprocess files even if already processed
- **Use case:** When you need to re-import data

### How It Works
1. System identifies files for the specified job
2. Fetches files from remote source
3. Validates file format
4. Processes into destination tables
5. Returns execution summary

### Result Information
After triggering immediate fetch:
- Execution ID assigned
- Files processed count
- Rows inserted count
- Processing duration
- Any errors encountered

## Fetch Mode 2: Fetch by Time Slot

### Purpose
Fetch files for a specific date and time (hour-level granularity).

### Parameters

**File Category***
- **Type:** Dropdown select
- **Required:** Yes
- **Options:** CDR, TDR, Custom categories
- **Description:** Type of file to fetch

**Month***
- **Type:** Number input
- **Required:** Yes
- **Range:** 1-12
- **Description:** Month (1=January, 12=December)

**Day***
- **Type:** Number input
- **Required:** Yes
- **Range:** 1-31
- **Description:** Day of month

**Hour***
- **Type:** Number input
- **Required:** Yes
- **Range:** 0-23
- **Description:** Hour in 24-hour format (0=midnight, 23=11pm)

**Job ID** (Optional)
- **Type:** Text input
- **Optional**
- **Description:** Specific job to use
- **Leave blank:** For automatic job selection

### How It Works
1. Specify exact time slot (month/day/hour)
2. System searches for files for that period
3. Identifies all files matching category
4. Fetches and processes files
5. Returns execution ID for tracking

### Example Usage
- Fetch CDR files for January 15, 2024 at 3:00 AM
- Reprocess TDR files for specific time
- Fill in missing historical data

## Fetch Mode 3: Fetch by Date Range

### Purpose
Fetch all files within a specified date and time range.

### Parameters

**Job ID***
- **Type:** Text input
- **Required:** Yes
- **Description:** Numeric ID of the job

**Start Time**
- **Month (Start)*** - Month (1-12)
- **Day (Start)*** - Day (1-31)
- **Hour (Start)*** - Hour (0-23)

**End Time**
- **Month (End)*** - Month (1-12)
- **Day (End)*** - Day (1-31)
- **Hour (End)*** - Hour (0-23)

**Force Reprocess**
- **Type:** Toggle
- **Default:** Off
- **Description:** Reprocess all files in range

### How It Works
1. Specify start and end times
2. System calculates all hour slots in range
3. Triggers fetch for each hour slot
4. Processes all files in range
5. Returns summary of all executions

### Result Information
After triggering range fetch:
- List of execution IDs triggered
- Any failed time slots with errors
- Total files processed across range
- Combined processing metrics

### Important Notes
- Larger ranges may take longer to process
- Each hour slot processed independently
- Failed slots reported separately
- Can combine with force reprocess flag

## Common Fetch Scenarios

### Scenario 1: Immediate Job Processing
1. Select "Immediate Fetch" mode
2. Enter job ID
3. Leave Force Reprocess OFF
4. Click "Fetch Now"
5. System processes job's files

### Scenario 2: Reprocessing Failed Files
1. Select "Immediate Fetch" mode
2. Enter job ID
3. Toggle Force Reprocess ON
4. Click "Fetch Now"
5. Files reprocessed regardless of status

### Scenario 3: Fetching Specific Hour
1. Select "Fetch by Time" mode
2. Choose file category
3. Enter date and hour
4. Click "Fetch Now"
5. System retrieves files for that hour

### Scenario 4: Filling Historical Gap
1. Select "Fetch by Date Range" mode
2. Enter job ID
3. Set start date/time
4. Set end date/time
5. Click "Fetch Now"
6. All hours in range processed

## Fetch Process

### What Happens During Fetch
1. **Identification** - System finds files matching criteria
2. **Validation** - Files checked for format and validity
3. **Download** - Files retrieved from source
4. **Parsing** - Data extracted from file format
5. **Transformation** - Data converted to target schema
6. **Loading** - Data inserted into database
7. **Completion** - Metadata updated, results logged

### Duration
- Depends on file count and size
- Network speed affects download time
- Processing time varies by data volume
- Can monitor progress via File Registry

## Success Feedback

When fetch succeeds:
- Execution ID displayed
- Number of files processed shown
- Rows inserted count displayed
- Processing duration shown
- Toast notification confirms success

## Error Handling

### Validation Errors
- **Missing Job ID** - Enter numeric job ID
- **Invalid Time Range** - Start time must be before end time
- **Invalid Time Values** - Ensure months 1-12, days 1-31, hours 0-23

### Processing Errors
- **File Not Found** - No files available for specified criteria
- **Fetch Failed** - Connection or download error
- **Parse Error** - File format unreadable
- **Insert Error** - Data doesn't match schema

### Error Recovery
1. Check error message for details
2. Verify source availability
3. Retry fetch if temporary issue
4. Review File Registry for details
5. Check error logs for more information

## Tips

- **Test with recent files first** - Verify fetch works before large ranges
- **Monitor File Registry** - Check progress of long-running fetches
- **Use Force Reprocess carefully** - Re-importing large volumes takes time
- **Check time zones** - Ensure hour values match source timezone
- **Start small** - Fetch single hour before entire range
- **Review results** - Always check metrics after fetch completes
- **Document schedule** - Note when and why manual fetches were triggered

