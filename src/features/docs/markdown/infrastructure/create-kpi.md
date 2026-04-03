# Create KPI

KPI creation is done through category-specific forms (mainly Revenue Metrics and Usage Metrics), but both follow the same structure.

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
