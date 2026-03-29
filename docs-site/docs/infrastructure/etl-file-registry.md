---
title: ETL File Registry
---

import { EditButton } from '@site/src/components/EditButton';

# ETL File Registry

## Overview

The ETL File Registry displays all files that have been imported into the system. From this page, you can monitor file processing, view detailed file information, and manage file lifecycle.

## Page Layout

### Statistics Cards
Summary of file processing statistics:
- **Total Files** - Count of all registered files
- **Completed Files** - Successfully processed files
- **Pending Files** - Files waiting for processing
- **Failed Files** - Files with processing errors
- **Processing Files** - Currently being processed

### Additional Metrics
- **Total Rows Inserted** - Combined rows from all files
- **Total Rows Failed** - Rows that failed to insert
- **Total Data Size** - Combined size of all files
- **Average Processing Duration** - Mean time per file

## Filtering Files

### Search
- **Type:** Text input
- **Function:** Search by file name
- **Real-time:** Results update as you type

### File Category Filter
- **CDR** - Call Detail Records
- **TDR** - Transaction Detail Records
- **Custom** - User-defined categories
- **All** - Show all categories

### Processing Status Filter
- **Pending** - Waiting for processing
- **Processing** - Currently being processed
- **Completed** - Successfully processed
- **Failed** - Processing encountered errors
- **Skipped** - Skipped (duplicate/invalid)
- **All** - Show all statuses

### Date Range Filter
- **Type:** Date picker range
- **Function:** Filter by creation or update date
- **Options:** Last 7 days, Last 30 days, Custom range

## File List

Each entry displays:
- **File Name** - Name of the imported file
- **Category** - File category (CDR, TDR, etc.)
- **Status** - Processing status (Pending/Processing/Completed/Failed/Skipped)
- **File Size** - Size in bytes or MB
- **Fetch Attempts** - Number of fetch attempts
- **Rows Parsed** - Records extracted from file
- **Rows Inserted** - Records successfully inserted
- **Rows Failed** - Records that failed to insert
- **Processing Duration** - Time taken to process
- **Last Updated** - Most recent update timestamp
- **Action Menu** - Quick actions

## Actions

### Individual File Actions

Click the menu icon (⋮) on any file:

**View Details**
- Open file details page
- See full file metadata
- View processing logs

**Reprocess**
- Reprocess the file
- Useful for files that failed
- Changes status back to pending

**View Error Details**
- See error messages and codes
- Understand processing failures
- Get troubleshooting information

**Delete**
- Remove file record from registry
- Cannot delete if processing
- Irreversible action

### Upload File
- **Icon:** Upload
- **Function:** Manually upload data file
- **Supported:** CDR, TDR, and custom formats
- **Preview:** Shows file preview before processing

## File Details Modal

When viewing file details:

**Basic Information**
- File name and path
- File category
- File format
- File size in bytes

**Processing Information**
- Processing status
- Start and completion timestamps
- Processing duration
- Retry count

**Data Metrics**
- Rows parsed
- Rows inserted
- Rows failed
- Insertion success rate

**Error Information**
- Error code
- Error message
- Failed row details (if applicable)

**Metadata**
- Checksum (for duplicate detection)
- Job execution ID
- Destination table
- Validation status

## Search and Filtering

### Search by File Name
- Type file name or partial match
- Results filter in real-time
- Shows matching files

### Filter by Category
- Select CDR, TDR, or custom category
- Shows only files in that category
- Helps track data by type

### Filter by Status
- Select specific status
- Shows only files with that status
- Helps identify problem files

### Filter by Date
- Select date range
- Shows files created/updated in range
- Defaults to last 30 days

## Sorting

**Available Sort Options**
- File Name (A-Z)
- Created Date (Newest/Oldest)
- Updated Date (Newest/Oldest)
- File Size (Largest/Smallest)
- Status
- Processing Duration
- Rows Inserted

## Pagination

- **15 files per page**
- Navigate between pages
- Total count displayed
- Jump to specific page

## Status Indicators

- 🟡 **Pending** - Waiting for processing
- 🔄 **Processing** - Currently processing
- 🟢 **Completed** - Successfully processed
- 🔴 **Failed** - Processing error
- 🚫 **Skipped** - File skipped

## Common Tasks

### View File Processing Status
1. Open File Registry
2. Look for file in list
3. Check Status column
4. View Last Updated timestamp

### Find Failed Files
1. Click Status Filter
2. Select "Failed"
3. Review error messages
4. Click file for details

### Reprocess Failed Files
1. Find failed file in list
2. Click menu (⋮)
3. Select "Reprocess"
4. File status changes to Pending
5. Processing resumes per schedule

### Upload New File
1. Click "Upload File" button
2. Select file from computer
3. Choose file category
4. Preview file data
5. Confirm upload
6. File added to registry

### Monitor Processing Metrics
1. Check Statistics Cards
2. Review Total Rows Inserted
3. Check Total Rows Failed
4. Monitor Average Duration
5. Track success rate

### Identify Duplicate Files
1. Open file details
2. Check Checksum value
3. Compare with other files
4. System auto-skips duplicates

<EditButton docSlug="infrastructure/etl-file-registry" docTitle="ETL File Registry" />
