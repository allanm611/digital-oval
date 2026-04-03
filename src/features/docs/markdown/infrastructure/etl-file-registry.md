# ETL File Registry

## Overview

ETL File Registry is the main ETL operations page at `/dashboard/etl`.

It combines monitoring, filtering, fetch-trigger entry points, and file upload.

## Top Actions

Header actions include:

- Fetch Controls dropdown (opens a modal in immediate, by-time, or by-range mode)
- Upload button (shown through permission gate for `etl.create`)
- Analytics button (navigates to ETL analytics)

## Stats Cards

The page summarizes file counts for:

- Total CDR Files
- Total TDR Files
- Completed CDR
- Completed TDR

## Filters

The file list supports:

- Search by file name/category/status
- Status filter (all, pending, processing, completed, failed)
- Category filter (all, CDR, TDR)

## File Table

Rows show key fields including:

- File name
- File category
- Processing status
- Total rows
- Rows inserted versus parsed, with failed row count when present
- Data size
- Last updated date

## Upload Flow

Upload modal supports `.cdr` and `.tdr` files, with:

- File type validation
- Category selection
- Preview table from parsed file rows

On successful upload, a success toast is shown and registry data refreshes.

## Pagination

The registry list uses paginated API data and page navigation controls.

## Related Topics

- [ETL](/documentation/infrastructure/etl)
- [Fetch Controls](/documentation/infrastructure/etl-fetch-controls)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
