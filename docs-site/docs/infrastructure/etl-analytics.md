---
title: ETL Analytics
---

import { EditButton } from '@site/src/components/EditButton';

# ETL Analytics

## Overview

The ETL Analytics dashboard provides comprehensive insights into file processing performance, data quality metrics, and system health. Monitor trends, identify bottlenecks, and optimize your ETL operations.

## Key Metrics

### Overall File Statistics
- **Total Files** - Count of all files ever imported
- **Completed Files** - Successfully processed files
- **Pending Files** - Awaiting processing
- **Failed Files** - Encountered errors during processing
- **Processing Files** - Currently being processed

### Data Volume Metrics
- **Total Rows Parsed** - Total records extracted from files
- **Total Rows Inserted** - Records successfully stored
- **Total Rows Failed** - Records that couldn't be inserted
- **Insertion Rate** - Percentage of successful insertions
- **Failure Rate** - Percentage of failed insertions

### Performance Metrics
- **Total Data Size** - Combined size of all files
- **Average File Size** - Mean file size across all files
- **Average Processing Duration** - Mean time to process files
- **Average Fetch Duration** - Mean time to download files
- **Average Fetch Attempts** - Mean retry count per file

## Analytics Sections

### File Category Distribution
**Chart Type:** Pie or Bar chart

Breakdown of files by category:
- Shows percentage of total for each category
- Displays file count per category
- Average file size per category
- Processing metrics by category

**Use Cases:**
- Understand data composition
- Identify high-volume categories
- Plan resource allocation

### Processing Status Distribution
**Chart Type:** Pie or Bar chart

Files grouped by processing status:
- Pending - Files waiting to be processed
- Processing - Currently being processed
- Completed - Successfully processed
- Failed - Encountered errors
- Skipped - Duplicate or invalid files

**Use Cases:**
- Monitor processing pipeline
- Identify processing backlog
- Track completion rates

### File Format Distribution
**Chart Type:** Bar chart

Breakdown by file format:
- CSV files
- Excel files
- JSON files
- Custom formats
- Other formats

**Use Cases:**
- Understand data formats
- Identify format compatibility issues
- Plan format migrations

### Fetch Duration Analytics
**Metrics Displayed:**
- Average fetch time in milliseconds
- Average fetch attempts per file
- Files with fetch errors (count)

**Insights:**
- Network performance assessment
- Source availability tracking
- Retry pattern analysis

### Processing Duration Analytics
**Metrics Displayed:**
- Average processing time per file
- Average batches total
- Average batches processed
- Processing speed trends

**Insights:**
- Identify slow-processing files
- Optimize batch sizes
- Plan processing windows

### Row-Level Metrics
**Metrics Displayed:**
- Total rows parsed
- Total rows inserted
- Total rows failed
- Rows per second (throughput)
- Success vs failure ratio

**Visual:** Line chart showing trends over time

**Insights:**
- Data quality assessment
- Processing efficiency
- Throughput monitoring

### Checksum Analysis
**Metrics Displayed:**
- Files with checksum validation
- Unique checksums found
- Duplicate files detected

**Insights:**
- Data integrity verification
- Duplicate file identification
- Processing redundancy prevention

### Trend Analysis
**Time Periods:**
- Daily trends
- Weekly trends
- Monthly trends

**Metrics Tracked:**
- Files created over time
- Files fetched per period
- Files processed per period
- Rows inserted per period
- Failures per period

**Use Cases:**
- Identify seasonal patterns
- Plan capacity
- Detect anomalies
- Track system growth

### Retry Analysis
**Metrics Displayed:**
- Files requiring retries (count)
- Average retry count
- Maximum retry count
- Recent retries (last 7 days)

**Use Cases:**
- Identify problematic sources
- Plan retry strategies
- Assess reliability

### Data Size Analytics
**Distribution Ranges:**
- 0-1 MB files
- 1-10 MB files
- 10-100 MB files
- 100+ MB files

**Metrics:**
- Total data size in MB
- Average file size
- Size distribution chart

**Use Cases:**
- Storage planning
- Performance optimization
- Identify unusual file sizes

### Error Message Distribution
**Display:**
- Top error messages
- Error frequency count
- Error percentage

**Insights:**
- Common failure reasons
- Priority issues to fix
- Error pattern analysis

## Date Range Filtering

### Filter Options
- Last 7 days
- Last 30 days
- Last 90 days
- Last year
- Custom date range

### How Filtering Works
1. Select date range
2. Analytics recalculate for range
3. Charts and metrics update
4. Trends show for selected period

## Comparative Analysis

### Compare Time Periods
- Previous period comparison
- Year-over-year comparison
- Month-over-month comparison

### Key Comparisons
- File volume trends
- Processing efficiency changes
- Error rate changes
- Data throughput changes

## Alerts and Thresholds

### Performance Alerts
- High failure rate detected
- Processing time exceeding threshold
- High retry count warning
- Fetch errors increasing

### Data Quality Alerts
- Duplicate files detected
- Checksum mismatches
- Parse errors exceeding threshold
- Insertion failures spike

## Exporting Analytics

### Export Options
- Export as PDF report
- Export as CSV data
- Email scheduled reports

### Report Contents
- Summary statistics
- Charts and visualizations
- Trend analysis
- Period comparison

## Common Analysis Tasks

### Task 1: Monitor Overall Health
1. Open ETL Analytics
2. Review Overall File Statistics
3. Check Processing Status Distribution
4. Look for any failed files
5. Verify completion rate is healthy

### Task 2: Identify Problem Areas
1. Review Error Message Distribution
2. Check Retry Analysis
3. Look at Processing Duration
4. Compare against historical average
5. Investigate root causes

### Task 3: Plan Capacity
1. Review Trend Analysis
2. Check Data Size Analytics
3. Look at processing volume growth
4. Plan resource allocation
5. Schedule optimization efforts

### Task 4: Assess Data Quality
1. Check Row-Level Metrics
2. Review insertion vs failure rates
3. Analyze Checksum Analysis
4. Look for duplicate files
5. Verify data consistency

### Task 5: Optimize Performance
1. Review Processing Duration Analytics
2. Identify slow files/categories
3. Check Fetch Duration Analytics
4. Look for network issues
5. Plan optimization strategies

### Task 6: Track Changes Over Time
1. Select custom date range
2. Review Trend Analysis
3. Compare with previous periods
4. Identify anomalies
5. Take corrective action if needed

## Tips & Best Practices

- **Monitor regularly** - Check analytics weekly to catch issues early
- **Set baselines** - Establish normal performance metrics for comparison
- **Document changes** - Note when system or processes change
- **Investigate anomalies** - Unusual metrics often indicate problems
- **Plan capacity** - Use trends to predict future needs
- **Optimize batch sizes** - Adjust based on processing duration metrics
- **Retry tuning** - Adjust retry logic based on retry analysis
- **Storage planning** - Use data size analytics to plan storage needs
- **Quality checks** - Monitor row-level metrics for quality issues
- **Share reports** - Use exports to communicate with stakeholders

<EditButton docSlug="infrastructure/etl-analytics" docTitle="ETL Analytics" />
