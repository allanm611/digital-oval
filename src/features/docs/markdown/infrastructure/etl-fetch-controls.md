---
title: ETL Fetch Controls
---

# ETL Fetch Controls

## Overview

Trigger data file fetches from remote sources. Choose from immediate, by-time, or by-range modes.

---

## Fetch Mode: Immediate

Fetch files immediately for a specific job.

### Parameters

**Job ID***
- Numeric ID of the job

**Force Reprocess**
- Reprocess already processed files (optional)

---

## Fetch Mode: By Time

Fetch files for a specific date and time.

### Parameters

**File Category***
- CDR or TDR

**Month***
- Month (1-12)

**Day***
- Day of month (1-31)

**Hour***
- Hour (0-23)

---

## Fetch Mode: By Range

Fetch files within a date range.

### Parameters

**Job ID***
- Numeric ID of the job

**Start Date***
- Month, Day, Hour

**End Date***
- Month, Day, Hour

---

## Result

After triggering a fetch:
- Execution ID assigned
- Files processed count
- Rows inserted count
- Processing duration
