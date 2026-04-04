# ETL Fetch Controls

ETL Fetch Controls is the manual trigger page for running fetch jobs in controlled modes.

![ETL Fetch Controls Dropdown](/img/infrastructure/etllistpagefetchcontrolsdropdown.png)

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

## Validation Notes

Required fields must be completed before a fetch can start. For range mode, start and end values should represent a valid chronological window.
