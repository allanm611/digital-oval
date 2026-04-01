# Product Types

## Overview

Product Types are categories used to classify and organize products in your catalog. They provide a way to group products by function, purpose, or business category, making it easier to manage inventory, create targeted offers, and organize product-based campaigns.

## Purpose &amp; Benefits

### Why Use Product Types?

**Better Organization**
- Categorize products by type (Physical, Digital, Service, etc.)
- Group related products together
- Create a taxonomy of your product offerings
- Organize inventory logically

**Improved Discoverability**
- Find products easily by type
- Filter product lists by category
- Identify all products of a specific type
- Quick access to product groups

**Type-Specific Management**
- Create type-specific metrics and reports
- Track performance by product type
- Monitor usage patterns by category
- Manage pricing per type

**Template-Based Organization**
- Use types as conceptual templates
- Standardize similar product configurations
- Maintain consistency across products
- Streamline product creation

### Key Benefits

- **Organization:** Clear categorization of all your products
- **Filtering:** Quick access to products by type
- **Reporting:** Metrics and analytics by product type
- **Scalability:** Manage growing product catalogs efficiently
- **Flexibility:** Fully customizable product type definitions

---

## Common Product Types

While product types are fully customizable, here are common examples used in CVM systems:

### Physical Products

**Tangible Goods**
- Physical products customers can hold
- Require shipping/delivery
- Have inventory tracking
- Example: "Physical Product", "Merchandise", "Goods"

**Electronics**
- Electronic devices and gadgets
- High value items
- Warranty considerations
- Example: "Electronics", "Tech Products", "Devices"

**Apparel**
- Clothing and fashion items
- Size/color variants common
- Seasonal inventory
- Example: "Apparel", "Clothing", "Fashion Items"

### Digital Products

**Software**
- Digital software or applications
- License-based delivery
- No physical inventory
- Example: "Software", "Applications", "Digital Tools"

**Digital Content**
- E-books, music, videos
- Download-based delivery
- Instant fulfillment
- Example: "Digital Content", "E-books", "Media"

**Digital Subscriptions**
- Recurring digital access
- Time-based licensing
- Subscription management
- Example: "Subscriptions", "Memberships", "Digital Subscriptions"

### Services

**Professional Services**
- Consulting, design, development
- Time-based pricing
- Custom deliverables
- Example: "Professional Services", "Consulting", "Custom Services"

**Support Services**
- Technical support, maintenance
- Ongoing customer support
- Service level agreements
- Example: "Support Services", "Maintenance Plans", "Technical Support"

**Delivery Services**
- Shipping, logistics, delivery
- Service-based offerings
- Example: "Delivery Services", "Shipping", "Logistics"

### Bundles &amp; Combos

**Product Bundles**
- Multiple products sold together
- Discounted pricing
- Coordinated offerings
- Example: "Bundles", "Combo Packages", "Multi-Product Bundles"

**Subscription Boxes**
- Curated product collections
- Recurring delivery
- Bundle management
- Example: "Subscription Boxes", "Monthly Boxes", "Curated Collections"

---

## Product Type Properties

### Core Fields

**Name**
- Display name of the product type
- Human-readable identifier
- Examples: "Physical Product", "Digital Service", "Software License"
- Required, 1-255 characters

**Code**
- Unique system identifier
- Alphanumeric with underscores only
- Lowercase snake_case format
- Must start with a letter
- Used for API references and automation
- Examples: `physical_product`, `digital_service`, `software_license`
- Required, 1-100 characters
- Must be unique across all product types

**Description**
- Optional explanation of the product type's purpose
- Helps team members understand the type's use
- Examples: "Physical goods requiring shipping", "Digital licenses with instant delivery"
- Optional, up to 500 characters

**Category**
- Classification of product type (optional)
- Examples: "Physical", "Digital", "Service", "Bundle"
- Helps organize product types into groups
- Optional

**Created At**
- Timestamp when the product type was created
- System-generated, read-only
- Useful for audit trails and tracking

### Code Format Rules

The code field follows strict naming conventions:

**Requirements:**
- Must start with a letter (a-z)
- Can contain letters, numbers, and underscores
- Must be lowercase
- No spaces or special characters allowed
- Must be unique (no duplicates)

**Valid Examples:**
- `physical_product`
- `digital_service`
- `software_license`
- `subscription_box`
- `professional_services`

**Invalid Examples:**
- `Physical Product` (contains space)
- `1_physical_product` (starts with number)
- `PHYSICAL_PRODUCT` (contains uppercase)
- `physical-product` (contains hyphen)
- `physical product` (contains space)

---

## Creating Product Types

### Step-by-Step Guide

**Step 1: Access Product Types**
- Navigate to Configuration
- Select "Product Types" from the configuration menu
- Click "Create Product Type" button

**Step 2: Enter Product Type Details**

Fill in the following fields:

1. **Name** (Required)
   - Enter a clear, descriptive name
   - Example: "Physical Product"

2. **Code** (Required)
   - Enter the unique system code
   - Use lowercase snake_case format
   - Example: `physical_product`
   - System will validate uniqueness in real-time

3. **Description** (Optional)
   - Add context about this product type's purpose
   - Example: "Tangible products requiring shipping and inventory management"

4. **Category** (Optional)
   - Select or enter a category
   - Example: "Physical", "Digital", "Service"

**Step 3: Save**
- Click "Create Product Type" button
- System validates all fields
- New product type is added to your configuration

### Code Validation

The system provides real-time validation for the code field:

- **Uniqueness Check:** Validates no duplicate code exists (with 500ms debounce)
- **Format Check:** Validates snake_case format and character rules
- **Error Display:** Shows clear error messages for invalid codes
- **Real-time Feedback:** Validation happens as you type

---

## Managing Product Types

### Viewing Product Types

**Product Types List**
- Access main Product Types page to see all configured types
- View summary information: Name, Code, Description, Category, Created Date
- See count of products using each type

**Filtering &amp; Search**
- Search by name, code, description, or category
- Server-side search with debouncing for performance
- Results update as you type

**Statistics**
- **Total Product Types:** Count of all configured product types
- **Active Product Types:** Count of types with associated products
- **Unused Product Types:** Count of types with no products

### Editing Product Types

**Update Existing Product Type**

1. Locate the product type in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Name can be changed freely
   - Code cannot be changed (to preserve product references)
   - Description can be added or updated
   - Category can be changed or added
4. Click "Save" to update

**What Can Be Changed:**
- Name (display name)
- Description (purpose explanation)
- Category (product classification)

**What Cannot Be Changed:**
- Code (unique system identifier - to prevent breaking product references)

### Deleting Product Types

**Delete Product Type**

1. Locate the product type in the list
2. Click the "Delete" action button
3. Confirm deletion in the confirmation dialog
4. Product type is removed from the system

**Deletion Rules:**
- Can only delete product types with no associated products
- If products reference a product type, deletion will fail
- System prevents accidental deletion of in-use types
- Error message indicates products preventing deletion

**Before Deleting:**
- Ensure no products use this type
- Review usage statistics to identify dependent products
- Consider archiving instead of deleting for historical tracking

---

## Using Product Types

### In Product Management

Product types are referenced when creating or editing products:

**Selection During Product Creation**
1. When setting up a new product
2. Choose the appropriate product type from dropdown
3. Product type helps categorize and organize the product
4. Product type appears in product management and reporting

**Product Type Reference**
- Each product has a `product_type_id` field
- Stores the ID of the associated product type
- Used for filtering and organization
- Displayed in product lists and details

### In Offers &amp; Campaigns

**Using Product Types in Offers**
- Create offers for specific product types
- Example: "20% off all Digital Products"
- Target offers by type
- Measure performance by type

**Using Product Types in Campaigns**
- Create campaigns targeting product types
- Example: "Email about new Physical Products"
- Filter campaigns by product type
- Segment customers by product interest

### In Reporting &amp; Analytics

**Type-Based Reporting**
- Filter product reports by type
- View type-specific sales metrics
- Analyze type-specific performance
- Compare performance across types

**Analytics Insights**
- Top-selling product types
- Type-specific revenue
- Type-specific customer preferences
- Performance by product type

---

## Best Practices

### Naming Conventions

**Consistent Naming**
- Use clear, descriptive names
- Use nouns (e.g., "Physical Product" not "Sell Physical")
- Be consistent across product types
- Avoid generic names like "Type 1" or "Product"

**Code Standards**
- Use meaningful codes (not single letters or random strings)
- Use snake_case consistently
- Keep codes reasonably short but descriptive
- Document code meaning in description

**Examples:**

**✅ Good** - Physical Product - `physical_product` - Tangible goods requiring shipping


**✅ Good** - Digital Service - `digital_service` - Digital services with instant delivery


**❌ Poor** - PP - `pp` - Too vague


**❌ Poor** - Physical Product Goods - `physical_product_goods` - Name/code too long


### Organization Strategy

**By Product Model**
- Group types by how products are delivered (Physical, Digital, Service)
- Organize around business models
- Create clear functional categories

**By Value**
- Separate premium products from basic products
- Group high-value vs. low-value types
- Makes pricing strategy easier

**By Lifecycle**
- Separate perishable from non-perishable
- Group subscription-based vs. one-time
- Affects inventory management

**By Department**
- Create types per department or business unit
- Prefix with department name if needed
- Example: `retail_physical`, `saas_digital`, `consulting_services`

### Maintenance

**Regular Review**
- Periodically review configured product types
- Identify unused types
- Clean up obsolete types
- Keep taxonomy current

**Documentation**
- Maintain clear description for each type
- Document purpose and use cases
- Keep team aligned on type usage
- Update when purpose changes

**Scaling**
- Plan product type structure as you grow
- Avoid creating too many similar types
- Consolidate related types when appropriate
- Review organization as catalog expands

---

## Common Use Cases

### Use Case 1: Retail Multi-Category Store

**Scenario:** Retail company with multiple product categories

**Product Types Created:**
- `apparel` - Clothing and fashion
- `electronics` - Electronic devices
- `home_goods` - Home and kitchen items
- `books` - Physical books
- `digital_content` - E-books and audiobooks

**Benefit:** Easy to filter products and create category-specific campaigns

### Use Case 2: Software &amp; Services Company

**Scenario:** SaaS company with software and consulting services

**Product Types Created:**
- `software_license` - Software licenses
- `saas_subscription` - SaaS subscriptions
- `consulting_services` - Professional consulting
- `support_plans` - Support and maintenance
- `training_services` - Training and onboarding

**Benefit:** Different pricing, delivery, and management per type

### Use Case 3: Digital Media Platform

**Scenario:** Media company selling digital content

**Product Types Created:**
- `ebook` - Digital e-books
- `audiobook` - Audiobook licenses
- `video_course` - Video course access
- `subscription_plan` - Subscription memberships
- `digital_bundle` - Bundled content packages

**Benefit:** Manage different delivery mechanisms per type

### Use Case 4: B2B Marketplace

**Scenario:** B2B platform with diverse product offerings

**Product Types Created:**
- `physical_inventory` - Physical goods
- `digital_assets` - Digital files/templates
- `services` - Professional services
- `subscriptions` - Recurring subscriptions
- `custom_solutions` - Bespoke solutions

**Benefit:** Support complex multi-type business model

---

## Troubleshooting

### Cannot Create Product Type

**Error: "Code already exists"**
- Solution: Choose a unique code that doesn't exist
- Check: Search for existing product types with similar codes
- Resolution: Append a number or modify code format

**Error: "Invalid code format"**
- Solution: Ensure code uses snake_case format
- Check: Code must start with letter, contain only a-z, 0-9, underscore
- Resolution: Correct code format before saving

**Error: "Name is required"**
- Solution: Enter a name for the product type
- Check: Name field cannot be empty
- Resolution: Provide a descriptive name

### Cannot Delete Product Type

**Error: "Cannot delete product type with associated products"**
- Cause: One or more products reference this product type
- Solution: Delete or reassign products to different product type first
- Steps:
  1. Find products using this type
  2. Delete products or change their product type
  3. Then delete the product type

**Prevention:**
- Review usage statistics before deletion
- Consider deactivating instead of deleting
- Keep history of product types used

### Code Not Validating

**Issue: Code validation appears stuck**
- Cause: Real-time validation has debounce (500ms delay)
- Solution: Wait a moment for validation to complete
- Alternative: Re-check code format manually

---

