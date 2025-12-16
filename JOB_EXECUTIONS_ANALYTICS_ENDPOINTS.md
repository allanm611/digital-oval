# Job Executions Analytics Page - Endpoints List

## All Endpoints Called on Analytics Page

| #   | Endpoint Method                                 | Service Method                      | Parameters                    | Status             | Used For                                                | Response Type            |
| --- | ----------------------------------------------- | ----------------------------------- | ----------------------------- | ------------------ | ------------------------------------------------------- | ------------------------ |
| 1   | `GET /job-executions/stats`                     | `getExecutionStatistics()`          | None                          | ✅ Active          | Stat Cards (Total, Successful, Failed, Running, Queued) | Object with counts       |
| 2   | `GET /job-executions/sla-compliance`            | `getSLACompliance()`                | None                          | ✅ Active          | SLA Compliance metrics                                  | Object                   |
| 3   | `GET /job-executions/success-rate`              | `getSuccessRate()`                  | None                          | ✅ Active          | Success Rate stat card                                  | Object with success_rate |
| 4   | `GET /job-executions/average-duration`          | `getAverageDuration()`              | None                          | ✅ Active          | Average Duration metrics                                | Object with duration     |
| 5   | `GET /job-executions/trend-data`                | `getTrendData()`                    | `{ daysBack: 30 }`            | ✅ Active          | Trend Line Chart (30 days)                              | Array                    |
| 6   | `GET /job-executions/error-analysis`            | `getErrorAnalysis()`                | `{ daysBack: 30 }`            | ✅ Active          | Error Analysis Bar Chart                                | Array                    |
| 7   | `GET /job-executions/executions-by-trigger`     | `getExecutionsByTrigger()`          | None                          | ✅ Active          | Trigger Distribution Chart                              | Array                    |
| 8   | `GET /job-executions/resource-utilization`      | `getResourceUtilizationStats()`     | None                          | ✅ Active          | Resource Utilization metrics                            | Object                   |
| 9   | `GET /job-executions/data-quality`              | `getDataQualityMetrics()`           | None                          | ✅ Active          | Data Quality metrics                                    | Object                   |
| 10  | `GET /job-executions/failure-patterns`          | `getFailurePatterns()`              | None                          | ✅ Active          | Failure Patterns analysis                               | Array                    |
| 11  | `GET /job-executions/performance-summary`       | `getPerformanceSummary()`           | `{ daysBack: 30 }`            | ✅ Active          | Performance Summary                                     | Object                   |
| 12  | `GET /job-executions/execution-distribution`    | `getExecutionDistribution()`        | None                          | ⚠️ **SKIPPED**     | Requires `startDate` parameter                          | Array                    |
| 13  | `GET /job-executions/jobs/:jobId/daily-summary` | `getDailySummary()`                 | `{ daysBack: 30 }`            | ⚠️ **SKIPPED**     | Requires `jobId` parameter                              | Array                    |
| 14  | `GET /job-executions/worker-node-stats`         | `getWorkerNodeStats()`              | None                          | ✅ Active          | Worker Node Statistics                                  | Array                    |
| 15  | `GET /job-executions/server-instance-stats`     | `getServerInstanceStats()`          | `{ daysBack: 30 }`            | ✅ Active          | Server Instance Statistics                              | Array                    |
| 16  | `GET /job-executions/step-failure-analysis`     | `getStepFailureAnalysis()`          | `{ daysBack: 30 }`            | ✅ Active          | Step Failure Analysis Chart                             | Array                    |
| 17  | `GET /job-executions/duration-outliers`         | `getDurationOutliers()`             | `{ daysBack: 30 }`            | ✅ Active          | Duration Outliers analysis                              | Array                    |
| 18  | `GET /job-executions/retry-analysis`            | `getRetryAnalysis()`                | `{ daysBack: 30 }`            | ⚠️ **SKIPPED**     | Backend SQL error ("column unnest does not exist")      | Object                   |
| 19  | `GET /job-executions/executions-by-hour`        | `getExecutionsByHour()`             | `{ daysBack: 30 }`            | ✅ Active          | Executions by Hour Chart                                | Array                    |
| 20  | `GET /job-executions/peak-times`                | `getPeakExecutionTimes()`           | None                          | ✅ Active          | Peak Execution Times                                    | Array                    |
| 21  | `GET /job-executions/health-score`              | `getExecutionHealthScore()`         | None                          | ✅ Active          | Execution Health Score                                  | Object                   |
| 22  | `GET /job-executions/slowest`                   | `getSlowestExecutions()`            | `{ limit: 10, daysBack: 30 }` | ✅ Active          | Slowest Executions list                                 | Array                    |
| 23  | `GET /job-executions/resource-issues`           | `getExecutionsWithResourceIssues()` | `{ limit: 10 }`               | ✅ Active          | Resource Issues list                                    | Array                    |
| 24  | `GET /job-executions/jobs/:jobId/comparison`    | `getExecutionComparison()`          | `{ currentPeriodDays: 7 }`    | ⚠️ **CONDITIONAL** | Only called if `jobId` provided                         | Object                   |
| 25  | `GET /job-executions/completion-forecast`       | `getCompletionForecast()`           | `{ jobId }`                   | ⚠️ **CONDITIONAL** | Only called if `jobId` provided                         | Array                    |
| 26  | `GET /job-executions/jobs/:jobId/heatmap`       | `getExecutionHeatmap()`             | None                          | ⚠️ **CONDITIONAL** | Only called if `jobId` provided                         | Object                   |
| 27  | `GET /job-executions/sla-prediction`            | `getSLAPrediction()`                | `{ jobId }`                   | ⚠️ **CONDITIONAL** | Only called if `jobId` provided                         | Object                   |
| 28  | `GET /job-executions/anomaly-detection`         | `getAnomalyDetection()`             | None                          | ✅ Active          | Anomaly Detection analysis                              | Object                   |
| 29  | `GET /job-executions/concurrent-analysis`       | `getConcurrentExecutionAnalysis()`  | None                          | ✅ Active          | Concurrent Execution Analysis                           | Object                   |
| 30  | `GET /job-executions/partitions`                | `getPartitionInformation()`         | None                          | ✅ Active          | Partition Information                                   | Array                    |
| 31  | `GET /job-executions/pending-cleanup`           | `getExecutionsPendingCleanup()`     | `{ retentionDays: 365 }`      | ✅ Active          | Pending Cleanup list                                    | Object                   |
| 32  | `GET /job-executions/trigger-distribution`      | `getTriggerDistribution()`          | `{ daysBack: 30 }`            | ✅ Active          | Trigger Distribution (alternative)                      | Array                    |
| 33  | `GET /job-executions/jobs/:jobId/timeline`      | `getExecutionTimeline()`            | `{ limit: 20 }`               | ⚠️ **CONDITIONAL** | Only called if `jobId` provided                         | Array                    |
| 34  | `GET /job-executions/jobs/:jobId/daily-summary` | `getDailySummary()`                 | `{ daysBack: 30 }`            | ⚠️ **CONDITIONAL** | Only called if `jobId` provided                         | Array                    |

## Summary

- **Total Endpoints**: 34
- **Active (Always Called)**: 24 endpoints
- **Skipped (Not Called)**: 2 endpoints (execution-distribution, retry-analysis)
- **Conditional (Only if jobId)**: 6 endpoints
- **Currently Disabled**: 2 endpoints

## Issues Found

1. **`getExecutionDistribution()`** - Skipped because requires `startDate` parameter
2. **`getRetryAnalysis()`** - Skipped due to backend SQL error ("column unnest does not exist")
3. **`getCompletionForecast()`** - Requires `jobId` parameter (only called conditionally)
4. **`getSLAPrediction()`** - Requires `jobId` parameter (only called conditionally)
5. **`getExecutionHeatmap()`** - Requires `jobId` parameter (only called conditionally)
6. **`getExecutionComparison()`** - Requires `jobId` parameter (only called conditionally)
7. **`getExecutionTimeline()`** - Requires `jobId` parameter (only called conditionally)
8. **`getDailySummary()`** - Requires `jobId` parameter (only called conditionally)

