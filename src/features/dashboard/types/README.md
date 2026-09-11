# Reports & Analytics API Documentation

This directory contains comprehensive TypeScript type definitions for all Reports & Analytics endpoints.

## 📁 Files

- **`ReportsAPI.ts`** - Complete TypeScript definitions for all report data structures, API endpoints, and chart specifications

## 🎯 Purpose

This documentation is designed to help backend developers create API endpoints that match exactly what the frontend expects. All data structures, field names, types, and formats are specified here.

## 📊 Report Pages Covered

1. **Customer Profile Reports** (`/dashboard/reports/customer-profiles`)

   - Value Matrix (scatter/bubble chart)
   - Lifecycle Distribution (6-bar chart)
   - CLV Distribution (bar + line chart)
   - Cohort Retention (multi-line chart)
   - Customer table with search/filter

2. **Customer Search Results** (`/dashboard/reports/customer-profiles/search`)

   - Individual customer details
   - Segments, offers, events, subscribed lists
   - Event distribution (pie chart)
   - Activity timeline (bar chart)

3. **Offer Reports** (`/dashboard/reports/offers`)

   - Redemption funnel (bar chart)
   - Redemption timeline (bar + line chart)
   - Offer type comparison (multi-bar chart)
   - Offer table

4. **Campaign Reports** (`/dashboard/reports/campaigns`)

   - Channel reach (bar chart)
   - Conversion funnel (bar chart)
   - Performance trend (multi-line chart)
   - Revenue trend (line chart)
   - Campaign table

5. **SMS Delivery Reports** (`/dashboard/reports/delivery/sms`)

   - Delivery timeline (bar chart)
   - SMS log table

6. **Email Delivery Reports** (`/dashboard/reports/delivery/email`)

   - Delivery timeline (bar chart)
   - Email log table

7. **Overall Dashboard Performance** (`/dashboard/reports/overall-performance`)
   - KPI snapshot
   - Channel performance breakdown
   - SMS delivery snapshot
   - Time series performance

## 🎨 Chart Color Palette

All charts use a standardized 6-color palette:

- **color1**: `#00505C` (Dark teal)
- **color2**: `#C38BFB` (Purple)
- **color3**: `#92A6B0` (Light gray-blue)
- **color4**: `#4FDFF3` (Cyan/light blue)
- **color5**: `#FC9C9C` (Light pink/coral) - Used for lifecycle distribution (dormant)
- **color6**: `#F7B430` (Orange/amber) - Used for lifecycle distribution (churned)

**Note**: Backend doesn't need to return colors - the frontend applies them based on chart type.

## 📝 Key Requirements

### Date Formats

- All dates should be in ISO 8601 format
- Date-only: `YYYY-MM-DD` (e.g., `"2024-01-15"`)
- Date-time: `YYYY-MM-DDTHH:mm:ssZ` (e.g., `"2024-01-15T10:30:00Z"`)

### Number Formats

- All numeric values should be numbers (not strings)
- Percentages should be numbers (e.g., `3.4` for 3.4%, not `"3.4%"`)
- Currency values should be numbers (e.g., `1250.50` for $1,250.50)

### Query Parameters

All report endpoints support:

- `range`: `"7d" | "30d" | "90d"` (default: `"30d"`)
- `startDate`: Custom start date (ISO 8601 format)
- `endDate`: Custom end date (ISO 8601 format)
- `page`: Page number for pagination (default: 1)
- `pageSize`: Items per page (default: 50)
- `sortBy`: Field to sort by
- `sortOrder`: `"asc" | "desc"`

### Pagination

All table data should include:

- `totalCount`: Total number of items (for pagination)
- Array of items for current page

## 🔍 Example API Response

```typescript
// GET /monitoring/reporting/subscribers/portfolio?range=30d&page=1&pageSize=50
// (frontend contract; also exposed as split /kpis /value-matrix /lifecycle /clv-distribution /cohort-retention /customers)

{
  "heroMetrics": {
    "activeCustomers": 1284200,
    "avgClv": 1540,
    "avgOrderValue": 128,
    "purchaseFrequency": 3.4,
    "engagementScore": 72,
    "churnRate": 8.3
  },
  "valueMatrix": [
    {
      "segment": "Champions",
      "recency": 10,
      "valueScore": 92,
      "customers": 2400,
      "lifecycle": "Active"
    },
    // ... more segments
  ],
  "lifecycleDistribution": [
    {
      "month": "Jun",
      "new": 120,
      "active": 420,
      "atRisk": 180,
      "dormant": 140,
      "churned": 95,
      "reactivated": 65
    },
    // ... more months
  ],
  "clvDistribution": [
    {
      "range": "< $250",
      "customers": 420000,
      "revenueShare": 12
    },
    // ... more ranges
  ],
  "cohortRetention": [
    {
      "month": 0,
      "cohort": "Jan 2024",
      "retention": 100
    },
    // ... more data points
  ],
  "customers": [
    {
      "id": "CUST-001",
      "name": "John Doe",
      "segment": "Champions",
      "lifetimeValue": 4500,
      "clv": 92,
      "orders": 15,
      "aov": 300,
      "lastPurchase": "2 days ago",
      "lastInteractionDate": "2024-01-13",
      "engagementScore": 87,
      "churnRisk": 15,
      "preferredChannel": "Email",
      "location": "New York, NY"
    },
    // ... more customers
  ],
  "totalCustomers": 1250
}
```

## 📚 Next Steps for Backend

1. Review `ReportsAPI.ts` for complete type definitions
2. Implement endpoints matching the specified structure
3. Ensure all date/number formats match specifications
4. Add pagination support for all table endpoints
5. Implement filtering and sorting as specified
6. Test with frontend to ensure data structure matches exactly

## ❓ Questions?

If you have questions about any data structure or requirement, refer to:

- The TypeScript types in `ReportsAPI.ts` (they are self-documenting)
- The frontend components in `/src/features/dashboard/pages/` for usage examples
- The chart specifications in `ReportsAPI.ts` for chart data requirements
