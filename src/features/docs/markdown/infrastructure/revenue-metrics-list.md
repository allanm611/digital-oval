# Revenue Metrics List

Revenue Metrics List shows KPI definitions focused on revenue performance.

![Revenue Metrics List](/img/infrastructure/revenuemetricslistpage.png)

## What This Page Is For

- review existing revenue KPIs
- search by name/description
- decide whether to create new metrics or reuse existing ones

## What A Revenue KPI Is

A Revenue KPI is a numeric business measure that represents monetary value attributed to a customer over a defined period.

Typical examples:

- total spend in last 30 days
- average order value
- lifetime revenue
- recharge amount this month

These KPIs are usually used in segmentation conditions such as `Monthly Spend > 1000` or `Lifetime Revenue >= 5000`.

## How Revenue KPI Value Is Determined Per User

Revenue KPI values are usually calculated from transaction-like records tied to a customer identifier.

Common calculation patterns:

- **Sum**: total amount across a time window (for example 30-day spend)
- **Average**: mean transaction value (for example average basket value)
- **Count with amount filter**: number of paid events above a threshold
- **Last value**: most recent billed amount or recharge amount

The final per-user value depends on:

- the selected source table/data source
- the aggregation logic (sum/avg/count/last)
- the time window and frequency configuration
- filters (for example successful transactions only)

## Value Types You Usually See

- **Decimal currency values**: `0.00`, `129.50`, `10234.75`
- **Integer counts** (if metric tracks number of paid transactions): `0`, `3`, `17`
- **Percentage/margin values** when configured as ratio-style KPIs

When explaining this to users, frame it as: "This KPI is the revenue score for one customer, computed from their qualifying transactions in a defined period."

## Typical Columns

- metric name and description
- category and field type
- source/data mapping hints
- status/metadata fields where available

## What The Columns Tell You

- **Name**: the KPI label users will see in segment/rule condition pickers.
- **Description**: quick business context so you know what this KPI actually measures.
- **Field Type**: expected value type (for example numeric/decimal), which affects valid operators.
- **Category**: keeps this KPI grouped under Revenue Metrics in selection flows.
- **Source Table / Data Source**: where the KPI value is pulled from.
- **Frequency**: how often this KPI is expected to refresh.

## Related Pages

- [KPIs Overview](/documentation/infrastructure/kpisoverview)
- [All KPIs List](/documentation/infrastructure/kpis-list)
- [Create Revenue Metric](/documentation/infrastructure/create-revenue-metric)
- [View Revenue Metric Details](/documentation/infrastructure/view-revenue-metric)
