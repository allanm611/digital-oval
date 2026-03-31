# Edit Department

## Overview

Modify an existing Department to update its name, description, or other details. Changes affect how campaigns and team members are organized.

## How to Edit a Department

### Step 1: Open the Edit Form

#### From the List View
1. Navigate to **Configuration → Departments**
2. Find the department to edit
3. Click the **Edit** button next to it
4. The edit modal opens with current settings pre-filled

#### From the Details View
1. Navigate to **Configuration → Departments**
2. Click the department name
3. Click the **Edit** button on details page
4. The edit modal opens

### Step 2: Update Department Information

#### Department Name
- **Field Type:** Text input (max 100 characters)
- **Current Value:** Shows existing name
- **To Update:**
  1. Click in the field
  2. Modify the name
  3. Ensure new name is unique

#### Description
- **Field Type:** Text area (max 500 characters)
- **Current Value:** Shows existing description
- **To Update:**
  1. Update the text
  2. Clarify role or responsibilities
  3. Can be left empty

### Step 3: Save Changes

1. Review all modifications
2. Click the **Save** or **Update** button
3. System validates:
   - Name is unique
   - Name is provided
   - Character limits respected
4. Upon success:
   - Confirmation message
   - Modal closes
   - Changes take effect

## Validation Rules

- **Name is required** - Cannot be empty
- **Name must be unique** - No duplicate names
- **Character limits:**
  - Name: Maximum 100 characters
  - Description: Maximum 500 characters

## Common Edit Scenarios

### Correcting a Typo
- **Change:** Fix spelling error
- **Effect:** Clearer department name
- **Impact:** No functional impact

### Renaming Department
- **Change:** Update name to match org changes
- **Effect:** Reflects current structure
- **Impact:** May affect reporting and organization

### Clarifying Role
- **Change:** Update description
- **Effect:** Better team understanding
- **Impact:** No functional change

### Adding Responsibility
- **Change:** Expand description
- **Effect:** Documents new scope
- **Impact:** Helps with campaign assignment

## Impact Analysis

### Consider Before Changing

**Campaigns Using Department**
- Which campaigns reference this department
- How name change affects them
- Whether change affects strategy

**Team Understanding**
- Do team members know this department
- Will changes confuse anyone
- Should you announce changes

## Undo Changes

### Before Saving
- Click **Cancel** without saving
- All changes discarded
- Original settings remain

### After Saving
- Changes are permanent
- To revert:
  1. Edit again
  2. Restore previous values
  3. Save

## Error Handling

- **"Name is required"** - Ensure name is not empty
- **"Name already exists"** - Choose unique name
- **"Name exceeds 100 characters"** - Shorten name
- **"Description exceeds 500 characters"** - Shorten description

## Best Practices

- Document reason for changes
- Keep version history
- Notify affected team members
- Test impact before finalizing

## Related Documentation

- [Departments List](/documentation/departments-list) - View all departments
- [View Department](/documentation/view-department) - See details
- [Create Department](/documentation/create-department) - Add new departments
