---
title: Create Job Type
---

import { EditButton } from '@site/src/components/EditButton';

# Create Job Type

## Overview

The Create Job Type form allows you to add a new job type category. Define the type name, code, and description.

## Form Fields

### Type Name*
**Type:** Text input
**Required:** Yes
- Display name of the job type
- Examples: "Data Import", "Report Generation", "Notification"
- 1-255 characters
- Used in job lists and filters

### Type Code*
**Type:** Text input
**Required:** Yes
- Unique identifier for the type
- Alphanumeric with underscores (e.g., "data_import", "report_gen")
- Cannot be changed after creation
- 1-100 characters

### Description
**Type:** Text area
**Optional**
- Detailed explanation of type purpose
- When to use this type
- Examples of jobs in this type
- Guidelines for job creators

## Form Actions

### Save Type
- Creates new job type
- Validates all required fields
- Shows error if validation fails

### Cancel
- Return to type list
- Discard unsaved changes

## Validation Rules

- **Type Name** - Required, 1-255 characters
- **Type Code** - Required, alphanumeric and underscores, unique
- **Description** - Optional, up to 1000 characters

## After Creating

After successful creation:
1. Type created and available for use
2. Appears in type list
3. Can be assigned to jobs immediately
4. Next steps:
   - Create jobs using this type
   - Use type for job filtering and organization

## Best Practices

### Naming Conventions
- Use clear, descriptive names
- Use consistent naming patterns
- Make codes readable and searchable
- Examples: "data_import", "report_generation", "system_cleanup"

### Organization
- Group similar job functions into types
- Create types before creating jobs
- Document type purpose clearly
- Avoid duplicate types

### Description
- Explain when to use this type
- Give examples of compatible jobs
- Document any special requirements
- Provide usage guidelines

<EditButton docSlug="jobs/create-job-type" docTitle="Create Job Type" />
