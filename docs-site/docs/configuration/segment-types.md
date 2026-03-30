# Segment Types

## Overview

Segment Types are categories used to classify and organize customer segments. They provide a way to group segments by purpose, methodology, or business use case, making it easier to manage segmentation strategies, create segment-specific campaigns, and organize your segmentation taxonomy.

## Purpose &amp; Benefits

### Why Use Segment Types?

**Better Organization**
- Categorize segments by type (Behavioral, Demographic, Firmographic, etc.)
- Group related segments together
- Create a taxonomy of your segmentation approach
- Organize segments logically

**Improved Discoverability**
- Find segments easily by type
- Filter segment lists by category
- Identify all segments of a specific type
- Quick access to segment groups

**Type-Specific Management**
- Create type-specific metrics and reports
- Track performance by segment type
- Monitor segment usage patterns by category
- Manage segment lifecycle by type

**Strategic Segmentation**
- Use types as conceptual templates
- Standardize similar segment approaches
- Maintain consistency across segments
- Build comprehensive segmentation framework

### Key Benefits

- **Organization:** Clear categorization of all your segments
- **Filtering:** Quick access to segments by type
- **Reporting:** Metrics and analytics by segment type
- **Scalability:** Manage growing numbers of segments efficiently
- **Flexibility:** Fully customizable segment type definitions

---

## Common Segment Types

While segment types are fully customizable, here are common examples used in CVM systems:

### Behavioral Segments

**Purchase Behavior**
- Segments based on customer purchase patterns
- Heavy buyers, occasional buyers, dormant customers
- Used for targeting and retention campaigns
- Example: "High-Value Purchasers", "Frequent Buyers", "First-Time Buyers"

**Engagement Behavior**
- Segments based on customer interaction patterns
- Active engagers, email openers, clickers
- Used for engagement campaigns
- Example: "Highly Engaged", "Email Subscribers", "Click Converters"

**Product Usage**
- Segments based on product or feature usage
- Active users, feature adopters, trial users
- Used for product-specific campaigns
- Example: "Premium Feature Users", "Trial Customers", "Feature Adopters"

### Demographic Segments

**Age/Generation**
- Segments by customer age or generation
- Gen Z, Millennials, Gen X, Baby Boomers
- Used for generational targeting
- Example: "Young Adults", "Retirees", "Gen Z Customers"

**Location/Geography**
- Segments by geographic location
- Regional, urban, rural, international
- Used for localized campaigns
- Example: "North America", "EMEA Region", "Asia-Pacific"

**Income/Status**
- Segments by income level or status
- High-income, middle-income, budget-conscious
- Used for price-sensitive targeting
- Example: "High-Income Earners", "Budget Shoppers", "Mid-Tier"

### Firmographic Segments

**Company Size**
- Segments by company/organization size
- Enterprise, Mid-Market, SMB, Startup
- Used for B2B targeting
- Example: "Enterprise Accounts", "SMB Customers", "Startups"

**Industry**
- Segments by industry or vertical
- Technology, Finance, Healthcare, Retail
- Used for industry-specific campaigns
- Example: "Financial Services", "Healthcare Providers", "Tech Companies"

**Company Type**
- Segments by organization type
- Public, Private, Non-profit, Government
- Used for compliance and messaging
- Example: "Public Companies", "Non-profits", "Government Agencies"

### Lifecycle Segments

**Customer Lifecycle**
- Segments by stage in customer journey
- Prospect, New Customer, Active, At-Risk, Churned
- Used for stage-specific campaigns
- Example: "New Customers", "At-Risk Churn", "Loyal Veterans"

**Product Lifecycle**
- Segments by product adoption stage
- Awareness, Trial, Active, Expansion, Retention
- Used for product growth campaigns
- Example: "Trial Users", "Early Adopters", "Power Users"

### Value Segments

**Customer Value**
- Segments by customer lifetime value
- High-Value, Medium-Value, Low-Value
- Used for targeted investment
- Example: "VIP Customers", "Standard Tier", "Growth Potential"

**Revenue Contribution**
- Segments by revenue impact
- Top 10%, Mid-tier, Emerging, Declining
- Used for strategic focus
- Example: "Top Revenue Contributors", "Emerging Customers", "Declining Revenue"

---

## Segment Type Properties

### Core Fields

**Name**
- Display name of the segment type
- Human-readable identifier
- Examples: "Behavioral", "Demographic", "Lifecycle"
- Required, 1-255 characters

**Code**
- Unique system identifier
- Alphanumeric with underscores only
- Lowercase snake_case format
- Must start with a letter
- Used for API references and automation
- Examples: `behavioral`, `demographic`, `lifecycle`
- Required, 1-100 characters
- Must be unique across all segment types

**Description**
- Optional explanation of the segment type's purpose
- Helps team members understand the type's use
- Examples: "Segments based on customer behavior patterns", "Demographic characteristics-based segmentation"
- Optional, up to 500 characters

**Category**
- Classification of segment type (optional)
- Examples: "Behavior", "Demographics", "Lifecycle", "Value"
- Helps organize segment types into groups
- Optional

**Created At**
- Timestamp when the segment type was created
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
- `behavioral`
- `demographic`
- `lifecycle`
- `firmographic`
- `value_based`

**Invalid Examples:**
- `Behavioral` (contains uppercase)
- `1_behavioral` (starts with number)
- `behavioral-segment` (contains hyphen)
- `behavioral segment` (contains space)

---

## Creating Segment Types

### Step-by-Step Guide

**Step 1: Access Segment Types**
- Navigate to Configuration
- Select "Segment Types" from the configuration menu
- Click "Create Segment Type" button

**Step 2: Enter Segment Type Details**

Fill in the following fields:

1. **Name** (Required)
   - Enter a clear, descriptive name
   - Example: "Behavioral Segments"

2. **Code** (Required)
   - Enter the unique system code
   - Use lowercase snake_case format
   - Example: `behavioral`
   - System will validate uniqueness in real-time

3. **Description** (Optional)
   - Add context about this segment type's purpose
   - Example: "Segments based on customer interaction and purchase behavior"

4. **Category** (Optional)
   - Select or enter a category
   - Example: "Behavior", "Demographics", "Lifecycle"

**Step 3: Save**
- Click "Create Segment Type" button
- System validates all fields
- New segment type is added to your configuration

### Code Validation

The system provides real-time validation for the code field:

- **Uniqueness Check:** Validates no duplicate code exists (with 500ms debounce)
- **Format Check:** Validates snake_case format and character rules
- **Error Display:** Shows clear error messages for invalid codes
- **Real-time Feedback:** Validation happens as you type

---

## Managing Segment Types

### Viewing Segment Types

**Segment Types List**
- Access main Segment Types page to see all configured types
- View summary information: Name, Code, Description, Category, Created Date
- See count of segments using each type

**Filtering &amp; Search**
- Search by name, code, description, or category
- Server-side search with debouncing for performance
- Results update as you type

**Statistics**
- **Total Segment Types:** Count of all configured segment types
- **Active Segment Types:** Count of types with associated segments
- **Unused Segment Types:** Count of types with no segments

### Editing Segment Types

**Update Existing Segment Type**

1. Locate the segment type in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Name can be changed freely
   - Code cannot be changed (to preserve segment references)
   - Description can be added or updated
   - Category can be changed or added
4. Click "Save" to update

**What Can Be Changed:**
- Name (display name)
- Description (purpose explanation)
- Category (segment classification)

**What Cannot Be Changed:**
- Code (unique system identifier - to prevent breaking segment references)

### Deleting Segment Types

**Delete Segment Type**

1. Locate the segment type in the list
2. Click the "Delete" action button
3. Confirm deletion in the confirmation dialog
4. Segment type is removed from the system

**Deletion Rules:**
- Can only delete segment types with no associated segments
- If segments reference a segment type, deletion will fail
- System prevents accidental deletion of in-use types
- Error message indicates segments preventing deletion

**Before Deleting:**
- Ensure no segments use this type
- Review usage statistics to identify dependent segments
- Consider archiving instead of deleting for historical tracking

---

## Using Segment Types

### In Segment Management

Segment types are referenced when creating or editing segments:

**Selection During Segment Creation**
1. When setting up a new segment
2. Choose the appropriate segment type from dropdown
3. Segment type helps categorize and organize the segment
4. Segment type appears in segment management and reporting

**Segment Type Reference**
- Each segment has a `segment_type_id` field
- Stores the ID of the associated segment type
- Used for filtering and organization
- Displayed in segment lists and details

### In Campaigns &amp; Offers

**Using Segment Types in Campaigns**
- Filter campaigns by segment type
- Create campaigns targeting specific segment types
- Example: "Campaigns using Behavioral segments"
- Analyze performance by segment type

**Using Segment Types in Offers**
- Create offers for specific segment types
- Example: "Offer targeting Value-based segments"
- Measure performance by segment type
- Segment-specific offer strategies

### In Reporting &amp; Analytics

**Type-Based Reporting**
- Filter segment reports by type
- View type-specific segment metrics
- Analyze type-specific performance
- Compare performance across types

**Analytics Insights**
- Most-used segment types
- Type-specific segment size
- Type-specific customer preferences
- Performance by segment type

---

## Best Practices

### Naming Conventions

**Consistent Naming**
- Use clear, descriptive names
- Use nouns (e.g., "Behavioral" not "Behave")
- Be consistent across segment types
- Avoid generic names like "Type 1" or "Segment"

**Code Standards**
- Use meaningful codes (not single letters or random strings)
- Use snake_case consistently
- Keep codes reasonably short but descriptive
- Document code meaning in description

**Examples:**
| Type | Name | Code | Description |
|------|------|------|-------------|
| ✅ Good | Behavioral Segments | `behavioral` | Customer behavior-based segmentation |
| ✅ Good | Lifecycle Segments | `lifecycle` | Customer journey stage segmentation |
| ❌ Poor | B | `b` | Too vague |
| ❌ Poor | Behavioral Engagement Segments | `behavioral_engagement_segments` | Name/code too long |

### Organization Strategy

**By Segmentation Methodology**
- Group types by how segments are created (Behavioral, Demographic, etc.)
- Organize around business models
- Create clear functional categories

**By Business Purpose**
- Segments for retention
- Segments for acquisition
- Segments for expansion
- Segments for reactivation

**By Data Source**
- First-party data segments
- Behavioral data segments
- Transactional data segments
- External data segments

**By Frequency/Recency**
- Real-time segments
- Daily-updated segments
- Weekly-updated segments
- Static/historical segments

### Maintenance

**Regular Review**
- Periodically review configured segment types
- Identify unused types
- Clean up obsolete types
- Keep taxonomy current

**Documentation**
- Maintain clear description for each type
- Document purpose and use cases
- Keep team aligned on type usage
- Update when purpose changes

**Scaling**
- Plan segment type structure as you grow
- Avoid creating too many similar types
- Consolidate related types when appropriate
- Review organization as segmentation expands

---

## Common Use Cases

### Use Case 1: Comprehensive Segmentation Framework

**Scenario:** Organization building complete segmentation strategy

**Segment Types Created:**
- `behavioral` - Purchase and engagement behavior
- `demographic` - Age, location, status
- `lifecycle` - Customer journey stage
- `value_based` - Customer lifetime value
- `firmographic` - B2B company characteristics

**Benefit:** Complete framework covering all segmentation approaches

### Use Case 2: Behavioral-Focused Segmentation

**Scenario:** E-commerce company focused on behavior analysis

**Segment Types Created:**
- `purchase_behavior` - Purchase patterns
- `engagement_behavior` - Interaction patterns
- `product_usage` - Feature/product usage
- `browser_behavior` - Website navigation patterns

**Benefit:** Deep behavioral insights for targeting

### Use Case 3: B2B Account-Based Segmentation

**Scenario:** B2B SaaS company with account-based approach

**Segment Types Created:**
- `account_size` - Company size (Enterprise, Mid-Market, SMB)
- `industry` - Industry vertical
- `buying_stage` - Sales cycle stage
- `engagement_level` - Account engagement
- `expansion_potential` - Upsell/cross-sell opportunity

**Benefit:** Account-level segmentation strategy

### Use Case 4: Retail Multi-Tier Segmentation

**Scenario:** Retail company with tiered customer approach

**Segment Types Created:**
- `value_tier` - Customer value level
- `loyalty_stage` - Loyalty program stage
- `purchase_frequency` - How often they buy
- `product_affinity` - Product category preference
- `channel_preference` - Shopping channel preference

**Benefit:** Multi-dimensional retail segmentation

---

## Troubleshooting

### Cannot Create Segment Type

**Error: "Code already exists"**
- Solution: Choose a unique code that doesn't exist
- Check: Search for existing segment types with similar codes
- Resolution: Append a number or modify code format

**Error: "Invalid code format"**
- Solution: Ensure code uses snake_case format
- Check: Code must start with letter, contain only a-z, 0-9, underscore
- Resolution: Correct code format before saving

**Error: "Name is required"**
- Solution: Enter a name for the segment type
- Check: Name field cannot be empty
- Resolution: Provide a descriptive name

### Cannot Delete Segment Type

**Error: "Cannot delete segment type with associated segments"**
- Cause: One or more segments reference this segment type
- Solution: Delete or reassign segments to different segment type first
- Steps:
  1. Find segments using this type
  2. Delete segments or change their segment type
  3. Then delete the segment type

**Prevention:**
- Review usage statistics before deletion
- Consider deactivating instead of deleting
- Keep history of segment types used

### Code Not Validating

**Issue: Code validation appears stuck**
- Cause: Real-time validation has debounce (500ms delay)
- Solution: Wait a moment for validation to complete
- Alternative: Re-check code format manually

---

## Related Documentation

- [Segments](../segments/segments-list) - Creating and managing customer segments
- [Segment Catalog](./segment-catalog) - Organizing segments into catalogs
- [Campaigns](../campaigns/campaigns-list) - Creating campaigns targeting segments
- [Segment Analytics](../analytics/customer-profile-reports) - Reporting and analytics by segment type
