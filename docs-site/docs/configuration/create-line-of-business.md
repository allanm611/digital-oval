# Create Line of Business

## Overview

Create a new Line of Business to represent a new service category or division within your organization. This allows you to organize campaigns, offers, and other configurations by business unit.

## How to Create a New Line of Business

### Step 1: Access the Creation Form

1. Navigate to **Configuration → Line of Business**
2. Click the **Create** button at the top of the page
3. A modal dialog will open with the creation form

### Step 2: Fill in Business Line Details

#### Business Line Name (Required)
- **Field Type:** Text input
- **Max Length:** 100 characters
- **Description:** Enter a unique name for the business line
- **Examples:** "GSM", "Internet Services", "Enterprise Solutions"

#### Description (Optional)
- **Field Type:** Text area
- **Max Length:** 500 characters
- **Description:** Provide context about what this business line encompasses
- **Examples:**
  - "Global System for Mobile Communications - Mobile network services"
  - "Internet and broadband services for residential and business customers"

### Step 3: Save the Business Line

1. Click the **Save** or **Create** button in the modal
2. The system validates the input:
   - Business Line Name is required
   - Name must be unique (no duplicates)
   - Validates character limits
3. Upon successful creation:
   - You'll see a success message
   - The modal closes
   - The new business line appears in the list

## Validation Rules

- **Name is required** - You cannot create a business line without a name
- **Name must be unique** - Each business line name must be distinct within the system
- **Character limits:**
  - Name: Maximum 100 characters
  - Description: Maximum 500 characters

## Error Handling

If creation fails, you'll see an error message. Common issues include:
- **"Name is required"** - Ensure you've entered a business line name
- **"Name already exists"** - Choose a different name as this one is already in use
- **"Name exceeds 100 characters"** - Shorten the name to 100 characters or less
- **"Description exceeds 500 characters"** - Shorten the description

## Next Steps

After creating a business line:
- View the newly created business line in the [Line of Business list](./line-of-business-list)
- [Edit the business line](./edit-line-of-business) to update details if needed
- Use the business line when configuring campaigns, offers, or other features
