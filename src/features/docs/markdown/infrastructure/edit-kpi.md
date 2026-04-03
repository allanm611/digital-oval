# Edit KPI

## Overview

KPI edit is implemented for:

- Revenue Metrics
- Usage Metrics

The edit form is the same structure as create, pre-filled with the selected metric values.

## Open Edit

You can open edit from a metric list row action or from the metric details page.

## Validation

Before save, forms validate required fields including operator selection.

If validation fails, inline messages are shown and submission is blocked.

## Save Behavior

On successful update:

- Success toast is shown
- User is redirected to the relevant list page

## Related Topics

- [Create KPI](/documentation/infrastructure/create-kpi)
- [View KPI Details](/documentation/infrastructure/view-kpi)
- [KPI List](/documentation/infrastructure/kpis-list)
