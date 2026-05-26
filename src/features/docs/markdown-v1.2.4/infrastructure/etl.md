# ETL

ETL documentation covers file-ingestion operations and monitoring pages used by platform operations.

## What ETL Means

- **Extraction**: collecting raw source data.
- **Transformation**: processing/normalizing raw data.
- **Loading**: writing transformed data into target structures.

## Open The Module

Go to `Infrastructure -> ETL`.

![ETL List Page](/img/v1.1/infrastructure/ETLlistpage.png)

## ETL Pages

- `ETL File Registry`: manage file intake, processing state, and fetch actions
- `ETL Analytics`: monitor ETL performance indicators

![ETL Analytics Stat Cards](/img/v1.1/infrastructure/etlanalyticsstatcards.png)

## Core Concepts

- **File Category**: file family such as CDR/TDR.
- **Processing Status**: lifecycle state like pending, processing, completed, failed.
- **Fetch Modes**: immediate, by time window, or by range.
- **Job ID**: execution context used for targeted fetch operations.

## Usage Examples

- **Missed hourly ingest**: use fetch controls to rerun the missing time window instead of rerunning the whole day.
- **Backlog recovery**: check File Registry for pending/failed files, process in batches, then verify improvements in Analytics.
- **Post-release validation**: after ETL config changes, compare failure and throughput metrics before and after deployment.

## Why This Matters

ETL pages help control ingestion quality and recover quickly when pipelines need manual intervention.

## Related Pages

- [ETL Overview](/documentation/infrastructure/etloverview)
- [ETL File Registry](/documentation/infrastructure/etl-file-registry)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
