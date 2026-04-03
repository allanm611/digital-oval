# ETL Fetch Controls

## Overview

ETL Fetch Controls is available at `/dashboard/etl/fetch` and also inside the File Registry fetch modal.

It supports three fetch modes.

## Modes

### Immediate

Immediate mode requires Job ID and optionally allows Force Reprocess.

### By Time

By Time mode uses:

- Category (CDR or TDR)
- Month
- Day
- Hour

### By Range

By Range mode uses:

- Job ID
- Start time (month/day/hour)
- End time (month/day/hour)

## Validation

Immediate and By Range require Job ID before submission.

## Results

On success, the UI shows a toast with response details such as execution id or number of scheduled hourly jobs.

## Related Topics

- [ETL](/documentation/infrastructure/etl)
- [File Registry](/documentation/infrastructure/etl-file-registry)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
