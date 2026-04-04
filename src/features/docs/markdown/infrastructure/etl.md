# ETL

ETL documentation covers file-ingestion operations and monitoring pages used by platform operations.

## What ETL Means

- **Extraction**: collecting raw source data.
- **Transformation**: processing/normalizing raw data.
- **Loading**: writing transformed data into target structures.

## Open The Module

Go to `Dashboard -> Infrastructure -> ETL`.

![ETL List Page](/img/infrastructure/ETLlistpage.png)

## ETL Pages

- `ETL File Registry`: manage file intake and processing state
- `ETL Fetch Controls`: trigger fetch jobs in different modes
- `ETL Analytics`: monitor ETL performance indicators

![ETL Analytics Stat Cards](/img/infrastructure/etlanalyticsstatcards.png)

## Core Concepts

- **File Category**: file family such as CDR/TDR.
- **Processing Status**: lifecycle state like pending, processing, completed, failed.
- **Fetch Modes**: immediate, by time window, or by range.
- **Job ID**: execution context used for targeted fetch operations.

## Why This Matters

ETL pages help control ingestion quality and recover quickly when pipelines need manual intervention.

## Related Pages

- [ETL Overview](/documentation/infrastructure/etloverview)
- [ETL File Registry](/documentation/infrastructure/etl-file-registry)
- [ETL Fetch Controls](/documentation/infrastructure/etl-fetch-controls)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
