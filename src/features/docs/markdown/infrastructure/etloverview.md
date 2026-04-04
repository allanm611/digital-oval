# ETL Overview

## Overview

ETL means **Extraction, Transformation, and Loading**.

- **Extraction**: collect raw data from source files/systems.
- **Transformation**: clean, map, and shape the data into the expected structure.
- **Loading**: store the transformed data where the platform can use it.

In this module, you track incoming files, trigger controlled fetch/reprocess actions, and monitor pipeline health. This is especially important during incidents, backlog cleanup, and post-change validation.

![ETL Registry](/img/infrastructure/ETLlistpage.png)

## What ETL Covers

- File intake visibility through the registry.
- Manual fetch execution in immediate/time/range modes.
- Analytics visibility for throughput, queue state, and failures.

## Operational Intent

Use these pages to:

- Confirm whether expected files arrived.
- Identify where processing stalled or failed.
- Trigger fetch jobs with precise scope.
- Verify recovery by checking analytics after intervention.

## Core Concepts

- File category: ingestion family such as CDR or TDR.
- Status lifecycle: pending, processing, completed, failed.
- Fetch scope: immediate, exact time bucket, or date-time range.
- Job ID: execution context for targeted pipeline actions.

## Typical Navigation

- Start in File Registry to inspect backlog and status distribution.
- Use Fetch Controls to trigger the exact reprocessing scope needed.
- Confirm result patterns in Analytics before closing an incident.

## Related Pages

- [ETL File Registry](/documentation/infrastructure/etl-file-registry)
- [ETL Fetch Controls](/documentation/infrastructure/etl-fetch-controls)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
