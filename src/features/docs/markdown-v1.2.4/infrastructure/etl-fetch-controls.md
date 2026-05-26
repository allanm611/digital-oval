# ETL Fetch Controls

ETL Fetch Controls is the manual trigger page for running fetch jobs in controlled modes.

![ETL Fetch Controls Dropdown](/img/v1.1/infrastructure/etllistpagefetchcontrolsdropdown.png)

## Fetch Modes

### Immediate Fetch

Use this when you need to trigger processing now.

- **Job ID** (required): identifies which ETL job to run.
- **Force Reprocess**: reruns processing even when data was already fetched.

### By-Time Fetch

Use this for a specific point-in-time bucket.

- **File Category** (required): category such as CDR or TDR.
- **Month / Day / Hour** (required): exact time target for fetch.

### By-Range Fetch

Use this for a bounded interval.

- **Job ID** (required)
- **Start Month/Day/Hour** (required)
- **End Month/Day/Hour** (required)

## Field Meaning Notes

- **Job ID** links the request to a defined ETL pipeline job.
- **Category** narrows which file family is fetched.
- **Time inputs** define the fetch scope precisely.

## Field Behavior In Practice

- **Force Reprocess** should be used carefully because it can re-run already handled data.
- **By-Time mode** is best when one exact time bucket failed.
- **By-Range mode** is best for contiguous outages where multiple hours or days are missing.
- **Wrong Job ID** can trigger the wrong pipeline and create confusion in incident response.

## Validation Notes

Required fields must be completed before a fetch can start. For range mode, start and end values should represent a valid chronological window.

## Usage Examples

- **Single-hour recovery**: choose by-time fetch with category + exact hour for minimal reprocessing.
- **Two-day outage recovery**: use by-range fetch from outage start to outage end and monitor queue impact.
- **Known bad transformation logic fixed**: run immediate fetch with force reprocess for the affected job after fix deployment.

## Related Pages

- [ETL Overview](/documentation/infrastructure/etloverview)
- [ETL File Registry](/documentation/infrastructure/etl-file-registry)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
