# ETL

ETL documentation covers file-ingestion operations and monitoring pages used by operations teams.

## Open The Module

Go to `Dashboard -> Infrastructure -> ETL`.

![ETL List Page](/img/infrastructure/ETLlistpage.png)

## ETL Pages

- `ETL File Registry`: manage file intake and processing state
- `ETL Fetch Controls`: trigger fetch jobs in different modes
- `ETL Analytics`: monitor ETL performance indicators

![ETL Analytics Page](/img/infrastructure/etlanalyticspage.png)

## Core Concepts

- **File Category**: file family such as CDR/TDR.
- **Processing Status**: lifecycle state like pending, processing, completed, failed.
- **Fetch Modes**: immediate, by time window, or by range.
- **Job ID**: execution context used for targeted fetch operations.

## Why This Matters

ETL pages help teams control ingestion quality and recover quickly when pipelines need manual intervention.
