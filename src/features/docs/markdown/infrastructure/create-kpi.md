# Create KPI

## Overview

KPI creation is implemented for:

- Revenue Metrics
- Usage Metrics

There is no create flow for System Events.

## Where Create Is Available

Create buttons are available on:

- `/dashboard/kpis/revenue-metrics`
- `/dashboard/kpis/usage-metrics`

## Create Form Structure

Both create forms use the same section structure:

- Basic Information
- Data Source Configuration
- Supported Operators
- Additional Configuration

## Required Fields

Required inputs include:

- Metric Name
- Description
- Category
- Field Type
- Source Table
- Data Source
- Frequency
- At least one operator

## Save Behavior

On successful create:

- Success toast is shown
- User is redirected back to the respective metrics list

## Related Topics

- [KPI List](/documentation/infrastructure/kpis-list)
- [Edit KPI](/documentation/infrastructure/edit-kpi)
- [View KPI Details](/documentation/infrastructure/view-kpi)
