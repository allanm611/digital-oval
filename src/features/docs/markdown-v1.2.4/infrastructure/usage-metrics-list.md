# Usage Metrics List

Usage Metrics List shows KPI definitions that track customer or system usage behavior.

![Usage Metrics List](/img/v1.1/infrastructure/usagemetricslistpage.png)

## What This Page Is For

- browse usage-related KPI definitions
- identify reusable metrics for segment conditions
- prepare new metrics when gaps are found

## What A Usage KPI Is

A Usage KPI measures how much or how often a user interacts with a service, product, or channel.

Typical examples:

- sessions in last 7 days
- data consumption in current billing cycle
- number of logins this month
- days active in last 30 days

Usage KPIs are behavior-based, so they are often used to identify engagement level, inactivity risk, or heavy users.

## How Usage KPI Value Is Determined Per User

Usage KPI values are derived from activity logs or usage records linked to a customer.

Common calculation patterns:

- **Count**: number of events/actions in a period
- **Sum**: total consumed units (for example MB, minutes, API calls)
- **Distinct count**: unique active days/channels/features used
- **Rolling window aggregates**: behavior measured over recent N days

The final per-user value depends on:

- source event table and filters (for example successful sessions only)
- aggregation logic (count/sum/distinct)
- time window definition (daily, weekly, monthly)
- refresh frequency

## Value Types You Usually See

- **Integer counts**: `0`, `5`, `42`
- **Volume totals**: `1200 MB`, `340 minutes`, `890 API calls`
- **Rate/ratio values** when usage is normalized (for example average daily sessions)

When explaining this to users, frame it as: "This KPI shows the user's activity intensity over a defined time window."

## What The List Columns Mean

- **Name**: label used by users when they add the KPI to a condition.
- **Description**: short explanation of what usage behavior this KPI captures.
- **Field Type**: value format, which controls allowed comparison operators.
- **Category**: confirms the KPI appears under Usage Metrics.
- **Source Table / Data Source**: where this metric is read from.
- **Frequency**: expected update rhythm for the metric values.

## Related Pages

- [KPIs Overview](/documentation/infrastructure/kpisoverview)
- [All KPIs List](/documentation/infrastructure/kpis-list)
- [Create Usage Metric](/documentation/infrastructure/create-usage-metric)
- [View Usage Metric Details](/documentation/infrastructure/view-usage-metric)
