# Create Usage Metric

Use this page to define usage-focused KPI records.

![Create Usage Metric - Form Section 1](/img/infrastructure/createusagemetricimage1.png)


![Create Usage Metric - Form Section 2](/img/infrastructure/createusagemetricimage2.png)

## Required Inputs

- Name
- Description
- Field Type
- Category
- Operators
- Source Table
- Data Source
- Frequency

## Field Meaning

- **Name**: appears directly in condition builders, so it should identify the behavior clearly.
- **Description**: explains how to interpret this metric and when to use it.
- **Field Type**: determines value behavior and available operators at condition time.
- **Category**: keeps the KPI discoverable under Usage Metrics.
- **Operators**: defines which condition checks are allowed for this metric.
- **Source Table**: stores raw or aggregated usage values.
- **Data Source**: identifies the integration that provides that table.
- **Frequency**: sets expectation for how quickly usage changes appear in targeting.

## Practical Example

- If a KPI tracks app sessions as numeric, users can set `App Sessions >= 5`.
- If Frequency is daily, the segment reflects daily snapshots rather than immediate session changes.

## Related Pages

- [Usage Metrics List](/documentation/infrastructure/usage-metrics-list)
- [View Usage Metric Details](/documentation/infrastructure/view-usage-metric)
- [All KPIs List](/documentation/infrastructure/kpis-list)
