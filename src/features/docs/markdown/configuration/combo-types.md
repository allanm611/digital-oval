# Combo Types

## Overview

Combo Types are categories used to classify and organize product combinations or bundles. They define the structure and rules for how multiple products can be grouped together, enabling you to create coordinated offers, manage bundle discounts, and organize combo-based marketing campaigns.

## Purpose &amp; Benefits

### Why Use Combo Types?

**Organize Product Bundles**
- Categorize bundle offerings by type (Hardware+Software, Starter+Premium, etc.)
- Group related bundle combinations
- Create a taxonomy of your bundle offerings
- Manage bundle catalogs efficiently

**Enable Bundle-Based Campaigns**
- Create campaigns targeting specific combo types
- Design bundle-specific offers and discounts
- Segment customers by bundle interest
- Track bundle performance by type

**Improve Bundle Management**
- Create type-specific pricing rules
- Manage bundle discounts per type
- Track bundle performance metrics
- Organize bundle inventory

**Increase Revenue**
- Encourage multi-product purchases
- Create higher-value customer transactions
- Reduce customer acquisition costs
- Improve customer lifetime value

### Key Benefits

- **Organization:** Clear categorization of all your bundles
- **Bundling:** Structured approach to product combinations
- **Marketing:** Targeted campaigns for specific bundle types
- **Revenue:** Increase average transaction value
- **Flexibility:** Fully customizable combo type definitions
- **Analytics:** Track performance by combo type

---

## Common Combo Types

While combo types are fully customizable, here are common examples used in CVM systems:

### Hardware &amp; Software Bundles

**Device + Software Bundle**
- Hardware device paired with software
- Example: "Laptop + Office Suite", "Phone + Protection Plan"
- Includes setup and licensing
- Common in tech retail

**Device + Service Bundle**
- Hardware with ongoing service
- Example: "Router + Internet Service", "TV + Cable Service"
- Includes support and updates
- Bundled service subscriptions

### Starter &amp; Premium Bundles

**Starter Bundle**
- Basic product set for new customers
- Lower price point
- Entry-level offering
- Example: "Beginner's Kit", "Starter Pack"

**Premium Bundle**
- Enhanced product set with extras
- Higher value offerings
- Additional benefits included
- Example: "Premium Package", "Pro Bundle", "Ultimate Bundle"

**Value Bundle**
- Bundled pricing discount
- Multiple items at reduced price
- Clearance or promotional bundles
- Example: "Bundle &amp; Save", "Combo Deal", "Multi-Pack"

### Service &amp; Subscription Bundles

**Service Bundle**
- Multiple services combined
- Example: "Consulting + Training + Support"
- Coordinated service offerings
- Professional services bundles

**Subscription Bundle**
- Multiple subscription services together
- Example: "Email + Cloud Storage + Premium Support"
- Recurring revenue bundles
- Platform ecosystem bundles

### Seasonal &amp; Promotional Bundles

**Holiday Bundle**
- Seasonal product combinations
- Example: "Holiday Gift Set", "Back-to-School Bundle"
- Time-limited offerings
- Seasonal themes

**Promotional Bundle**
- Limited-time bundle offers
- Example: "Summer Clearance Bundle", "Flash Sale Bundle"
- Marketing-driven combinations
- Limited quantity offers

### Cross-Category Bundles

**Complementary Bundle**
- Products that work well together
- Example: "Laptop + Accessories", "Camera + Lenses"
- Natural product pairings
- Enhanced product utility

**Upgrade Bundle**
- Current product + upgrade
- Example: "Standard + Pro Features", "Basic + Premium"
- Encourages upgrades
- Upsell opportunities

---

## Combo Type Properties

### Core Fields

**Name**
- Display name of the combo type
- Human-readable identifier
- Examples: "Hardware + Software", "Starter Bundle", "Service Package"
- Required, 1-255 characters

**Code**
- Unique system identifier
- Alphanumeric with underscores only
- Lowercase snake_case format
- Must start with a letter
- Used for API references and automation
- Examples: `hardware_software`, `starter_bundle`, `service_package`
- Required, 1-100 characters
- Must be unique across all combo types

**Description**
- Optional explanation of the combo type's purpose
- Helps team members understand the type's use
- Examples: "Hardware and software bundled together", "Entry-level product bundle for new customers"
- Optional, up to 500 characters

**Category**
- Classification of combo type (optional)
- Examples: "Hardware", "Service", "Seasonal", "Subscription"
- Helps organize combo types into groups
- Optional

**Bundle Structure**
- How products are combined in this type
- Examples: "2 products", "3-5 products", "Dynamic"
- Number of items in typical bundle
- Reference information

**Created At**
- Timestamp when the combo type was created
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
- `hardware_software`
- `starter_bundle`
- `service_package`
- `premium_upgrade`
- `seasonal_bundle`

**Invalid Examples:**
- `Hardware Software` (contains space)
- `1_hardware_software` (starts with number)
- `HARDWARE_SOFTWARE` (contains uppercase)
- `hardware-software` (contains hyphen)
- `hardware software` (contains space)

---

## Creating Combo Types

### Step-by-Step Guide

**Step 1: Access Combo Types**
- Navigate to Configuration
- Select "Combo Types" from the configuration menu
- Click "Create Combo Type" button

**Step 2: Enter Combo Type Details**

Fill in the following fields:

1. **Name** (Required)
   - Enter a clear, descriptive name
   - Example: "Hardware + Software Bundle"

2. **Code** (Required)
   - Enter the unique system code
   - Use lowercase snake_case format
   - Example: `hardware_software_bundle`
   - System will validate uniqueness in real-time

3. **Description** (Optional)
   - Add context about this combo type's purpose
   - Example: "Physical hardware paired with software license and setup"

4. **Category** (Optional)
   - Select or enter a category
   - Example: "Hardware", "Service", "Seasonal"

5. **Bundle Structure** (Optional)
   - Document typical structure
   - Example: "2-3 products", "Dynamic composition"

**Step 3: Save**
- Click "Create Combo Type" button
- System validates all fields
- New combo type is added to your configuration

### Code Validation

The system provides real-time validation for the code field:

- **Uniqueness Check:** Validates no duplicate code exists (with 500ms debounce)
- **Format Check:** Validates snake_case format and character rules
- **Error Display:** Shows clear error messages for invalid codes
- **Real-time Feedback:** Validation happens as you type

---

## Managing Combo Types

### Viewing Combo Types

**Combo Types List**
- Access main Combo Types page to see all configured types
- View summary information: Name, Code, Description, Category, Created Date
- See count of combos using each type

![Combo Types List](/img/configuration/combotypeslist.png)

**Filtering &amp; Search**
- Search by name, code, description, or category
- Server-side search with debouncing for performance
- Results update as you type

**Statistics**
- **Total Combo Types:** Count of all configured combo types
- **Active Combo Types:** Count of types with associated combos
- **Unused Combo Types:** Count of types with no combos

### Editing Combo Types

**Update Existing Combo Type**

1. Locate the combo type in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Name can be changed freely
   - Code cannot be changed (to preserve combo references)
   - Description can be added or updated
   - Category can be changed or added
4. Click "Save" to update

**What Can Be Changed:**
- Name (display name)
- Description (purpose explanation)
- Category (bundle classification)
- Bundle Structure (reference information)

**What Cannot Be Changed:**
- Code (unique system identifier - to prevent breaking combo references)

### Deleting Combo Types

**Delete Combo Type**

1. Locate the combo type in the list
2. Click the "Delete" action button
3. Confirm deletion in the confirmation dialog
4. Combo type is removed from the system

**Deletion Rules:**
- Can only delete combo types with no associated combos
- If combos reference a combo type, deletion will fail
- System prevents accidental deletion of in-use types
- Error message indicates combos preventing deletion

**Before Deleting:**
- Ensure no combos use this type
- Review usage statistics to identify dependent combos
- Consider archiving instead of deleting for historical tracking

---

## Using Combo Types

### In Bundle &amp; Combo Management

Combo types are referenced when creating or editing product bundles:

**Selection During Bundle Creation**
1. When setting up a new product bundle
2. Choose the appropriate combo type from dropdown
3. Combo type helps categorize and organize the bundle
4. Combo type appears in bundle management and reporting

**Combo Type Reference**
- Each combo/bundle has a `combo_type_id` field
- Stores the ID of the associated combo type
- Used for filtering and organization
- Displayed in combo lists and details

### In Offers &amp; Campaigns

**Using Combo Types in Offers**
- Create offers for specific combo types
- Example: "20% off Hardware + Software Bundles"
- Target offers by bundle type
- Measure performance by type

**Using Combo Types in Campaigns**
- Create campaigns targeting combo types
- Example: "Email about new Premium Bundles"
- Filter campaigns by combo type
- Segment customers by bundle interest

### In Reporting &amp; Analytics

**Type-Based Reporting**
- Filter bundle reports by combo type
- View type-specific sales metrics
- Analyze type-specific performance
- Compare performance across types

**Analytics Insights**
- Top-selling combo types
- Type-specific revenue
- Type-specific customer preferences
- Performance by combo type

---

## Best Practices

### Naming Conventions

**Consistent Naming**
- Use clear, descriptive names
- Use compound terms (e.g., "Hardware + Software")
- Be consistent across combo types
- Avoid generic names like "Type 1" or "Bundle"

**Code Standards**
- Use meaningful codes (not single letters or random strings)
- Use snake_case consistently
- Keep codes reasonably short but descriptive
- Document code meaning in description

**Examples:**

**✅ Good** - Hardware + Software - `hardware_software` - Device with software license


**✅ Good** - Premium Bundle - `premium_bundle` - High-value product combination


**❌ Poor** - HS - `hs` - Too vague


**❌ Poor** - Hardware plus Software Bundle - `hardware_plus_software_bundle` - Name/code too long


### Organization Strategy

**By Bundle Structure**
- Group by number of products (2-product, 3-product, etc.)
- Organize around typical combinations
- Create clear structural categories

**By Value**
- Separate budget bundles from premium bundles
- Group starter, standard, and premium tiers
- Makes pricing strategy easier

**By Business Purpose**
- Bundles for customer acquisition
- Bundles for upselling
- Bundles for cross-selling
- Bundles for retention

**By Department**
- Create types per department or business unit
- Prefix with department name if needed
- Example: `hardware_bundle`, `saas_bundle`, `consulting_bundle`

### Maintenance

**Regular Review**
- Periodically review configured combo types
- Identify unused types
- Clean up obsolete types
- Keep taxonomy current

**Documentation**
- Maintain clear description for each type
- Document purpose and use cases
- Keep team aligned on type usage
- Update when purpose changes

**Scaling**
- Plan combo type structure as you grow
- Avoid creating too many similar types
- Consolidate related types when appropriate
- Review organization as bundle offerings expand

---

## Common Use Cases

### Use Case 1: Tech Retail Multi-Bundle Strategy

**Scenario:** Electronics retailer with multiple bundle options

**Combo Types Created:**
- `laptop_office_suite` - Laptop + Office software
- `phone_accessories_bundle` - Phone + cases, chargers, etc.
- `gaming_setup_bundle` - Monitor + keyboard + mouse
- `protection_plan_bundle` - Device + warranty + insurance
- `seasonal_holiday_bundle` - Holiday gift combination

**Benefit:** Easy to filter bundles and create type-specific campaigns

### Use Case 2: SaaS Platform Bundles

**Scenario:** SaaS company with tiered subscription bundles

**Combo Types Created:**
- `starter_bundle` - Basic tier with core features
- `professional_bundle` - Mid-tier with additional services
- `enterprise_bundle` - Premium tier with full suite
- `addon_bundle` - Popular feature add-ons
- `upgrade_bundle` - Current plan + upgrade features

**Benefit:** Manage different pricing tiers and upsell opportunities

### Use Case 3: Retail Seasonal Bundles

**Scenario:** Retail company with seasonal promotions

**Combo Types Created:**
- `back_to_school_bundle` - School supplies combination
- `holiday_gift_bundle` - Seasonal gift sets
- `summer_essentials_bundle` - Summer product combo
- `black_friday_bundle` - Holiday sale bundles
- `flash_sale_bundle` - Time-limited promotional combos

**Benefit:** Organized seasonal promotion management

### Use Case 4: Service Package Bundles

**Scenario:** Service company with coordinated offerings

**Combo Types Created:**
- `consulting_training_bundle` - Consulting + training services
- `support_maintenance_bundle` - Support + ongoing maintenance
- `implementation_bundle` - Setup + training + support
- `enterprise_support_bundle` - Premium support tier
- `success_package_bundle` - Comprehensive customer success package

**Benefit:** Complex service offerings organized by type

---

## Troubleshooting

### Cannot Create Combo Type

**Error: "Code already exists"**
- Solution: Choose a unique code that doesn't exist
- Check: Search for existing combo types with similar codes
- Resolution: Append a number or modify code format

**Error: "Invalid code format"**
- Solution: Ensure code uses snake_case format
- Check: Code must start with letter, contain only a-z, 0-9, underscore
- Resolution: Correct code format before saving

**Error: "Name is required"**
- Solution: Enter a name for the combo type
- Check: Name field cannot be empty
- Resolution: Provide a descriptive name

### Cannot Delete Combo Type

**Error: "Cannot delete combo type with associated combos"**
- Cause: One or more combos reference this combo type
- Solution: Delete or reassign combos to different combo type first
- Steps:
  1. Find combos using this type
  2. Delete combos or change their combo type
  3. Then delete the combo type

**Prevention:**
- Review usage statistics before deletion
- Consider deactivating instead of deleting
- Keep history of combo types used

### Code Not Validating

**Issue: Code validation appears stuck**
- Cause: Real-time validation has debounce (500ms delay)
- Solution: Wait a moment for validation to complete
- Alternative: Re-check code format manually

---

