# ETL Overview

## Overview

ETL means **Extraction, Transformation, and Loading**.

- **Extraction**: collect raw data from source files/systems.
- **Transformation**: clean, map, and shape the data into the expected structure.
- **Loading**: store the transformed data where the platform can use it.

In this module, you track incoming files, trigger controlled fetch/reprocess actions, and monitor pipeline health. This is especially important during incidents, backlog cleanup, and post-change validation.

![ETL Registry](/img/v1.0/infrastructure/ETLlistpage.png)

## What ETL Covers

- File intake visibility through the registry.
- Manual fetch execution in immediate/time/range modes from File Registry.
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
- Use File Registry fetch controls to trigger the exact reprocessing scope needed.
- Confirm result patterns in Analytics before closing an incident.

## Usage Examples

- **One failed hour in CDR pipeline**: use by-time fetch for that hour only, then verify completion in analytics.
- **Weekend backlog**: process failed/pending files in controlled ranges, checking queue trend after each run.
- **Schema fix deployed**: force reprocess affected job scope and watch failure metrics return to baseline.

## Related Pages

- [ETL File Registry](/documentation/infrastructure/etl-file-registry)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
