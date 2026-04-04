# ETL Analytics

ETL Analytics is the monitoring page for ETL health, throughput, and outcome trends.

![ETL Analytics Overview](/img/infrastructure/etlanalyticsstatcards.png)

## What The Page Focuses On

- baseline ETL processing metrics
- status distribution (success, pending, failed)
- operational trend indicators over time
- queue and processing behavior visibility

![ETL Analytics File Count by Status](/img/infrastructure/etlanalyticsfilecountbystatus.png)
![ETL Analytics Pie Chart](/img/infrastructure/etlanalyticspiechartimage.png)

## How To Use It

- check pipeline health before/after fetch operations
- identify unusual failure spikes
- compare current processing behavior with recent trends
- support incident triage with a quick operational view

## Key Metric Meaning

- **Throughput metrics**: how much data/files are processed in a period.
- **Failure metrics**: where and how often processing breaks.
- **Pending/Queue metrics**: work waiting to be processed.
- **Completion metrics**: successful ETL outcomes in scope.

## Related Pages

- [ETL Overview](/documentation/infrastructure/etloverview)
- [ETL File Registry](/documentation/infrastructure/etl-file-registry)
- [ETL Fetch Controls](/documentation/infrastructure/etl-fetch-controls)
