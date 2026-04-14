# ETL Analytics

ETL Analytics is the monitoring page for ETL health, throughput, and outcome trends.

![ETL Analytics Overview](/img/v1.1/infrastructure/etlanalyticsstatcards.png)

## What The Page Focuses On

- baseline ETL processing metrics
- status distribution (success, pending, failed)
- operational trend indicators over time
- queue and processing behavior visibility

![ETL Analytics File Count by Status](/img/v1.1/infrastructure/etlanalyticsfilecountbystatus.png)


![ETL Analytics Pie Chart](/img/v1.1/infrastructure/etlanalyticspiechartimage.png)

## Stat Cards Explained

- **Total Files**: all files currently tracked in ETL scope for the selected filters/time range.
- **Completed**: files that finished processing successfully.
- **Pending/Processing**: files waiting in queue or currently being processed.
- **Failed**: files that ended in an error state and usually require intervention.

Use the cards first for quick health checks, then use charts to identify where the change is happening.

## Chart Explanations

- **File Count by Status (bar/column chart)**:
	shows absolute counts for each state (`pending`, `processing`, `completed`, `failed`).
	Use this chart to see which status is dominant and where backlog is growing.
- **Status Distribution (pie chart)**:
	shows percentage share by status.
	Use this chart to quickly judge processing quality, for example whether `failed` is unusually large compared with `completed`.
- **Trend line/period views (when present)**:
	shows movement over time, useful for spotting regressions after releases or infrastructure changes.

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

## How To Interpret Metrics

- Rising **pending/queue** with flat throughput usually means ingestion demand exceeds processing capacity.
- Rising **failure metrics** after a release can indicate transformation or schema compatibility regressions.
- Stable completion with low failures usually confirms fetch and processing controls are aligned.
- High **failed share** in the pie chart with stable input volume usually indicates pipeline quality issues, not demand spikes.
- High **pending** in cards plus high **pending bars** in chart indicates backlog accumulation that may need tuning or reruns.

## Usage Examples

- **After manual fetch**: validate that completion rises and pending declines within expected time.
- **Release monitoring**: compare failure rate trend before and after deployment.
- **Capacity planning**: use sustained queue buildup as evidence for tuning threads, batch size, or infrastructure.

## Related Pages

- [ETL Overview](/documentation/infrastructure/etloverview)
- [ETL File Registry](/documentation/infrastructure/etl-file-registry)
