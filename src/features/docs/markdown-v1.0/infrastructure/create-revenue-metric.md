# Create Revenue Metric

Use this page to create KPI definitions that measure revenue outcomes.

![Create Revenue Metric - Basic Info and Config](/img/v1.0/infrastructure/createrevenuemetricbasicinfoand%20config.png)
![Create Revenue Metric - Operators](/img/v1.0/infrastructure/createrevenuemtricoperatorssection.png)

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

- **Name**: this is the metric label shown in condition builders. Keep it specific so users can choose it correctly.
- **Description**: explains metric intent and calculation context; users rely on this when two KPIs have similar names.
- **Field Type**: defines value type and valid operators. Numeric types support threshold comparisons; non-numeric types are limited to matching operators.
- **Category**: controls grouping in KPI selectors. For this page, keep it aligned to Revenue Metrics.
- **Operators**: determines how users can test this KPI in conditions (for example greater than, less than, equals).
- **Source Table**: the table where the metric value is read from.
- **Data Source**: the connection/profile that owns the source table.
- **Frequency**: expected refresh cadence, so users understand whether conditions evaluate near real-time or on delayed snapshots.

## Example Condition Outcome

- A numeric revenue KPI with operator `>` can be used as `Monthly Spend > 1000`.
- If Field Type or Operators are configured incorrectly, users may not be able to build the condition they need.

## Related Pages

- [Revenue Metrics List](/documentation/infrastructure/revenue-metrics-list)
- [View Revenue Metric Details](/documentation/infrastructure/view-revenue-metric)
- [All KPIs List](/documentation/infrastructure/kpis-list)
