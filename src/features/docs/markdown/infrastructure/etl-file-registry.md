# ETL File Registry

ETL File Registry is the operations page for tracking ingested files and their processing lifecycle.

![ETL File Registry](/img/infrastructure/ETLlistpage.png)

## What You See In The Table

- **File Name**: source file identifier
- **Category**: file type (for example CDR/TDR)
- **Status**: pending, processing, completed, failed
- **Record Count**: ingestion volume for the file
- **Upload Date / Last Modified**: processing timeline context

## Search And Filters

- search by file name
- filter by status
- filter by category
- paginate results for larger volumes

## Main Actions

- **Upload File**: add new ETL input files
- **Fetch actions**: open controls for manual fetch workflows
- **View/Download actions**: inspect or retrieve file-related data where available

![ETL Upload Modal](/img/infrastructure/etluplaodmodal.png)
![ETL Fetch Controls Dropdown](/img/infrastructure/etllistpagefetchcontrolsdropdown.png)

## Why This Page Matters

This page is the first stop for checking whether files entered the pipeline correctly and where failures happened.

## Related Pages

- [ETL Overview](/documentation/infrastructure/etloverview)
- [ETL Fetch Controls](/documentation/infrastructure/etl-fetch-controls)
- [ETL Analytics](/documentation/infrastructure/etl-analytics)
