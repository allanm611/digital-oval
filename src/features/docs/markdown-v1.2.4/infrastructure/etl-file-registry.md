# ETL File Registry

ETL File Registry is the operations page for tracking ingested files and their processing lifecycle.

![ETL File Registry](/img/v1.1/infrastructure/ETLlistpage.png)

## What You See In The Table

- **File Name**: source file identifier
- **Category**: file type (for example CDR/TDR)
- **Status**: pending, processing, completed, failed
- **Record Count**: ingestion volume for the file
- **Upload Date / Last Modified**: processing timeline context

## How To Interpret Registry Fields

- **Status=failed** means processing stopped and needs investigation before data can be trusted.
- **High record count + long processing status** can indicate throughput bottlenecks.
- **Category** helps route ownership to the correct pipeline/domain.

## Search And Filters

- search by file name
- filter by status
- filter by category
- paginate results for larger volumes

## Main Actions

- **Upload File**: add new ETL input files
- **Fetch actions**: open controls for manual fetch workflows
- **View/Download actions**: inspect or retrieve file-related data where available

![ETL Upload Modal](/img/v1.1/infrastructure/etluplaodmodal.png)
![ETL Fetch Controls Dropdown](/img/v1.1/infrastructure/etllistpagefetchcontrolsdropdown.png)

## Fetch Controls (From This Page)

The fetch dropdown on this page lets operations trigger ETL processing without leaving File Registry.

- **Immediate Fetch**: run the selected ETL job now.
- **By-Time Fetch**: fetch one exact time bucket (month/day/hour) for a category.
- **By-Range Fetch**: fetch a continuous interval between start and end time.

## Fetch Fields Explained

- **Job ID**: target ETL job that should run.
- **File Category**: file family to fetch (for example CDR or TDR).
- **Month / Day / Hour**: exact time scope for by-time mode.
- **Start/End Month-Day-Hour**: interval boundaries for by-range mode.
- **Force Reprocess**: reruns processing even if the data was already handled.

## When To Use Each Fetch Mode

- Use **Immediate Fetch** after restoring a pipeline dependency and you need processing to resume now.
- Use **By-Time Fetch** when one known hour/day failed and you want minimal reprocessing.
- Use **By-Range Fetch** for outages covering multiple buckets.
- Use **Force Reprocess** only when you intentionally need to recalculate previously processed scope.

## Why This Page Matters

This page is the first stop for checking whether files entered the pipeline correctly and where failures happened.

## Usage Examples

- **File did not load into dashboards**: locate by file name, confirm status, then trigger targeted re-fetch.
- **Spike in failed files**: filter by category to see if one pipeline family is affected.
- **Late-arriving files**: compare upload timestamp and processing progression to quantify delay impact.

## Related Pages

- [ETL Overview](/documentation/infrastructure/etloverview)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
