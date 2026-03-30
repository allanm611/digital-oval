# Edit Line of Business

## Overview

Edit an existing Line of Business to update its name or description. This allows you to maintain accurate and current business line information.

## How to Edit a Line of Business

### Step 1: Access the Edit Form

#### From the List View
1. Navigate to **Configuration → Line of Business**
2. Find the business line you want to edit
3. Click the **Edit** button next to the business line
4. The edit modal opens with the current information pre-filled

#### From the Details View
1. Navigate to **Configuration → Line of Business**
2. Click on the business line name to view details
3. Click the **Edit** button on the details page
4. The edit modal opens

### Step 2: Update Business Line Information

#### Business Line Name
- **Field Type:** Text input
- **Max Length:** 100 characters
- **Current Value:** Shows the existing name
- **To Update:**
  1. Clear the current name or select all text
  2. Type the new name
  3. Ensure the new name is unique (no duplicates in the system)

#### Description
- **Field Type:** Text area
- **Max Length:** 500 characters
- **Current Value:** Shows the existing description
- **To Update:**
  1. Click in the description field
  2. Modify the text as needed
  3. You can leave it empty (description is optional)

### Step 3: Save Changes

1. Review your changes in the modal
2. Click the **Save** or **Update** button
3. The system validates the input:
   - Business Line Name is required
   - New name must be unique if changed
   - Validates character limits
4. Upon successful update:
   - A success message appears
   - The modal closes
   - The list refreshes with updated information

## Validation Rules

- **Name is required** - You cannot leave the name empty
- **Name must be unique** - If changing the name, ensure no other business line uses it
- **Character limits:**
  - Name: Maximum 100 characters
  - Description: Maximum 500 characters

## Undo Changes

### Before Saving
- Click **Cancel** or close the modal without saving to discard all changes
- Your original data remains unchanged

### After Saving
- Changes are permanent immediately after saving
- To revert, edit the business line again and restore the previous values
- Plan ahead to avoid unintended changes

## Error Handling

If saving fails, you'll see an error message:
- **"Name is required"** - Ensure you've entered a business line name
- **"Name already exists"** - Choose a different name
- **"Name exceeds 100 characters"** - Shorten the name
- **"Description exceeds 500 characters"** - Shorten the description

## Common Edit Scenarios

### Correcting a Typo
1. Open the edit form for the business line
2. Fix the typo in the name or description
3. Click Save

### Updating Business Line Focus
1. Edit the business line
2. Update the description to reflect new focus areas
3. Save changes

### Renaming for Clarity
1. Edit the business line
2. Change the name to something more descriptive
3. Update the description if needed
4. Save changes

## Best Practices

- Review changes before clicking Save
- Keep names descriptive but concise
- Use clear, professional language in descriptions
- Avoid special characters in names unless necessary
- Document the reason for changes (in your notes, not in the system)

## Related Documentation

- [Line of Business List](./line-of-business-list) - View all business lines
- [View Line of Business](./view-line-of-business) - See detailed information
- [Create Line of Business](./create-line-of-business) - Add new business lines
