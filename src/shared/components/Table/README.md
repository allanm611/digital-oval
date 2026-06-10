# Reusable Table Component

A flexible, feature-rich table component built for reusability across the application.

## Features

- ✅ **Column Management** — Show/hide columns, reorder via drag-and-drop
- ✅ **Expandable Rows** — Toggle detailed content for each row
- ✅ **Custom Cell Rendering** — Render any content in cells (components, formatted values, etc.)
- ✅ **Pagination** — Built-in pagination with smart page number display
- ✅ **Local Storage Persistence** — Column preferences saved automatically
- ✅ **Responsive** — Works on all screen sizes
- ✅ **Type-Safe** — Full TypeScript support

## Basic Usage

```tsx
import { Table, useTable } from "@/shared/components/Table";

function MyCampaignPage() {
  const {
    columns,
    currentPage,
    pageSize,
    handlePageChange,
    expandedRowId,
    setExpandedRowId,
    toggleColumn,
    reorderColumns,
  } = useTable({
    tableId: "my-campaigns-table",
    defaultColumns: [
      { id: "name", label: "Campaign Name", visible: true },
      { id: "status", label: "Status", visible: true },
      { id: "offers", label: "Offers", visible: true },
    ],
    defaultPageSize: 15,
    persistToLocalStorage: true,
  });

  return (
    <Table
      columns={columns}
      data={campaigns}
      totalItems={totalCampaigns}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      expandedRowId={expandedRowId}
      onExpandChange={setExpandedRowId}
      expandedContent={(row) => <CampaignDetailPanel campaign={row} />}
    />
  );
}
```

## useTable Hook

Manages table state: columns, pagination, row expansion.

```tsx
const {
  // Column management
  columns,              // All columns with visibility/order
  toggleColumn,         // Toggle visibility of a column
  reorderColumns,       // Update column order
  resetToDefaults,      // Reset to default columns
  getVisibleColumns,    // Get only visible columns

  // Row expansion
  expandedRowId,        // Current expanded row ID
  setExpandedRowId,     // Expand/collapse a row
  toggleRowExpansion,   // Toggle expansion of a row

  // Pagination
  currentPage,          // Current page (1-based)
  pageSize,             // Items per page
  handlePageChange,     // Change page
  resetPage,            // Reset to page 1
} = useTable({
  tableId: "unique-table-id",
  defaultColumns: [
    { id: "name", label: "Name", visible: true },
    { id: "status", label: "Status", visible: true },
  ],
  defaultPageSize: 15,
  persistToLocalStorage: true, // Default: true
});
```

## Column Configuration

```tsx
const columns: TableColumn[] = [
  {
    id: "name",
    label: "Campaign Name",
    visible: true,
    render: (value, row) => (
      <span className="font-bold">{value}</span>
    ),
  },
  {
    id: "status",
    label: "Status",
    visible: true,
    render: (value) => <StatusBadge status={value} />,
  },
  {
    id: "offers",
    label: "Offers",
    visible: true,
    // If no render function, displays raw value
  },
];
```

### Column Options

- `id` (string) — Unique column identifier, maps to data property
- `label` (string) — Display name in header
- `visible` (boolean) — Show/hide column
- `render?` (function) — Custom render function: `(value, row) => ReactNode`
- `width?` (string) — Optional column width (e.g., "200px", "20%")

## Table Props

```tsx
<Table
  columns={columns}
  data={data}
  totalItems={100}
  currentPage={1}
  pageSize={15}
  isLoading={false}
  expandedContent={(row) => <Details row={row} />}
  expandedRowId={expandedRowId}
  onExpandChange={setExpandedRowId}
  onPageChange={handlePageChange}
  getRowId={(row) => row.id}
/>
```

### Props

- `columns` — Array of TableColumn
- `data` — Array of row data
- `totalItems` — Total number of items (for pagination)
- `currentPage` — Current page number (1-based)
- `pageSize` — Items per page
- `isLoading?` — Show loading state (default: false)
- `expandedContent?` — Function to render row details
- `expandedRowId?` — ID of expanded row
- `onExpandChange?` — Callback when row expand state changes
- `onPageChange?` — Callback when page changes
- `getRowId?` — Function to get row ID (default: `row.id`)
- `rowClassName?` — CSS classes for `<tr>`
- `headerClassName?` — CSS classes for `<th>`
- `tableClassName?` — CSS classes for `<table>`

## ColumnPicker Component

Manage column visibility and order with drag-and-drop.

```tsx
import { ColumnPicker } from "@/shared/components/Table";

<ColumnPicker
  isOpen={showColumnPicker}
  columns={columns}
  onClose={() => setShowColumnPicker(false)}
  onToggleColumn={toggleColumn}
  onReorderColumns={reorderColumns}
  onResetToDefaults={resetToDefaults}
/>
```

## localStorage Persistence

Column preferences are automatically saved to localStorage using the `tableId` as the key.

Stored format:
```json
{
  "id": "column-id",
  "visible": true
}
```

To disable persistence, pass `persistToLocalStorage: false` to `useTable`:

```tsx
useTable({
  tableId: "my-table",
  defaultColumns: [...],
  persistToLocalStorage: false,
})
```

## Expandable Rows

Pass an `expandedContent` function to make rows expandable:

```tsx
<Table
  {...props}
  expandedContent={(row) => (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3>{row.name} Details</h3>
      {/* Custom content */}
    </div>
  )}
  expandedRowId={expandedRowId}
  onExpandChange={setExpandedRowId}
/>
```

The expand button appears automatically in the first column.

## Custom Cell Rendering

Use the `render` function in column config:

```tsx
{
  id: "status",
  label: "Status",
  visible: true,
  render: (value, row) => (
    <span className={`badge badge-${value}`}>
      {value.toUpperCase()}
    </span>
  ),
}
```

Parameters:
- `value` — Cell value (row[columnId])
- `row` — Entire row object

## Example: Campaign Table

See `TableExample.tsx` for a complete working example with:
- Column toggling
- Row expansion
- Custom rendering
- Pagination
