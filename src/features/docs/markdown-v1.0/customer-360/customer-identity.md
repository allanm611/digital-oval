# Customer Identity

## Overview

Customer identity fields are the unique fields used to uniquely identify customers in the system. View all configured identity fields in a searchable, filterable list.

## Field List

The page shows a table with the following columns:

**ID** - Unique field identifier (clickable to view details)

**Field Name** - System identifier for the field (e.g., `customer_tier`, `date_of_birth`)

**Field Type** - Data type (String, Integer, Date, Boolean, etc.)

**Source Table** - Database table or system where field data originates

**Description** - Explanation of what the field represents

**Actions** - Click **View** (eye icon) to see field details

The page displays all customer identity fields in a searchable, filterable list.

![Customer Identity List](/img/customer360-images/customeridentitylistpage.png)

## Search & Filter

### Search Box

Find fields by typing:

- Field name (system identifier)
- Field value (display label)
- Description keywords
- Source table name

Results update as you type.

### Filter by Field Type

Dropdown to filter by data type:

- All Field Types (default)
- String, Integer, Date, Boolean, etc.

Filter updates list automatically.

## Viewing Field Details

Click the **View** button or field ID to open the field details page with:

- Field metadata (name, type, description, source)
- Type information (PostgreSQL type, precision)
- Validation configuration
- Supported operators for filtering

See [View Customer Identity Field Details](/documentation/customer-360/view-customer-identity-details).
