# View Customer Identity Field Details

## Overview

View detailed information about a specific customer identity field. Customer identity fields are the unique fields used to uniquely identify customers in the system. Each field includes metadata, data type information, validation rules, and supported operators for use in segmentation and filtering.

![Field Details Page](/img/v1.0/customer360-images/customeridentitydetailpage.png)

## Field Overview Section

Three information cards displaying field metadata:

### Core Metadata Card

**Field Name** - System identifier for the field (e.g., `customer_tier`, `date_of_birth`)

**Field Value** - Display name/label shown in UI (e.g., "Customer Tier", "Date of Birth")

**Description** - Explanation of what the field represents and its purpose

### Type Information Card

**Field Type** - Data type classification (String, Integer, Date, Boolean, etc.)

**Postgres Type** - Native PostgreSQL data type (e.g., character varying, integer, timestamp)

**Type Precision** - For numeric/decimal types, the precision specification (e.g., NUMERIC(10,2))

### Source Validation Card

**Source Table** - Database table or system that provides the field data

**Validation Strategy** - How values are validated (none, enum, range, pattern, etc.)

**Value Length** - Maximum character length for text fields (if applicable)

![Field Details Page](/img/v1.0/customer360-images/customeridentitydetailsfieldinfo.png)

## Operator Support Section

Table displaying all operators available for filtering with this field:

**Label** - Display name of operator (e.g., "Equals", "Greater Than", "Contains")

**Symbol** - Operator symbol used (e.g., =, >, <, !=, contains)

**Requires Value** - Yes/No - Whether operator needs a single value parameter

**Requires Two Values** - Yes/No - Whether operator needs two values (e.g., for "Between" operator)

**Applicable Types** - Which field data types this operator works with (String, Integer, Date, Boolean, etc.)

![Field Details Page](/img/v1.0/customer360-images/customeridentitydetailopearatorssection.png)

## Navigation

- **Back Button** - Return to field list
- **Breadcrumb** - Shows current location in navigation
