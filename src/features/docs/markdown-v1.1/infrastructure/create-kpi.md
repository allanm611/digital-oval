# Create KPI

KPI creation is done through category-specific forms (Revenue Metrics, Usage Metrics, and System Events).

![Create Revenue Metric - Basic Info and Config](/img/infrastructure/createrevenuemetricbasicinfoand%20config.png)
![Create Revenue Metric - Operators Section](/img/infrastructure/createrevenuemtricoperatorssection.png)

## Required Fields

- **Name**
- **Description**
- **Field Type**
- **Category**
- **Operators** (at least one)
- **Source Table**
- **Data Source**
- **Frequency**

## What The Fields Do

- **Field Type**: defines numeric behavior expected from the metric.
- **Category**: places the KPI in the right business group.
- **Operators**: controls which rule conditions can use this KPI.
- **Source Table**: tells the system where metric data originates.
- **Data Source**: identifies source mode (for example Live or DB).
- **Frequency**: defines update cadence (Per Min, D-1, Monthly).
- **Unit** (optional): display unit when relevant.

## Save Behavior

The form validates required fields before save. After creation, the KPI appears in the relevant list and can be opened in details.

## Related Pages

- [View KPI List](/documentation/infrastructure/kpis-list)
- [Open KPI Details](/documentation/infrastructure/view-kpi)
- [Edit KPI](/documentation/infrastructure/edit-kpi)
