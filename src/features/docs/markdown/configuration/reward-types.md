# Reward Types

## Overview

Reward Types are categories used to classify and organize the different kinds of rewards you can offer to customers. They provide a way to standardize reward management, track reward usage patterns, and create reward-specific campaigns. Reward types are fully customizable and can be created based on your organization's specific business models and customer incentive strategies.

## Purpose & Benefits

### Why Use Reward Types?

**Better Organization**
- Categorize rewards by type (Points, Vouchers, Discounts, Gifts, etc.)
- Group related rewards together
- Create a taxonomy of your reward offerings

**Improved Discoverability**
- Find rewards easily by type
- Filter reward lists by category
- Identify all rewards of a specific type

**Type-Specific Management**
- Create type-specific metrics and reports
- Track performance by reward type
- Monitor redemption patterns by category

**Flexible Reward Structure**
- Use types as conceptual templates
- Standardize similar reward configurations
- Maintain consistency across rewards

### Key Benefits

- **Organization:** Clear categorization of all your rewards
- **Filtering:** Quick access to rewards by type
- **Reporting:** Metrics and analytics by reward type
- **Scalability:** Manage growing numbers of rewards efficiently
- **Flexibility:** Fully customizable reward type definitions

---

## Common Reward Types

While reward types are fully customizable, here are common examples used in CVM systems:

### Points &amp; Currency Rewards

**Points Programs**
- Loyalty points earned through purchases
- Points redeemable for discounts or products
- Accumulative customer engagement metric
- Example: "Loyalty Points", "Purchase Points", "Engagement Points"

**Virtual Currency**
- Digital currency balance (e.g., "Credits")
- Used like gift card balance
- Transferable between accounts
- Example: "Store Credits", "Digital Wallet", "Account Balance"

### Discounts &amp; Percentage Offers

**Percentage Discounts**
- Off-percentage offers (e.g., 10% off, 20% off)
- Applied to transactions or specific items
- Example: "Percentage Discount", "Tiered Discount", "Category Discount"

**Fixed Amount Discounts**
- Fixed dollar/amount off (e.g., $5 off, $10 off)
- Applied to transaction total or minimum purchase
- Example: "Fixed Amount Off", "Dollar Discount", "Amount Reduction"

### Vouchers &amp; Coupons

**Voucher Codes**
- Single-use or multi-use redemption codes
- Often time-limited
- Example: "Promo Code", "Digital Voucher", "Coupon Code"

**Gift Cards &amp; Gift Vouchers**
- Prepaid value cards
- Full or partial redemption
- Example: "Gift Card", "Store Voucher", "Digital Gift Certificate"

### Freebies &amp; Giveaways

**Free Products**
- Complimentary product or service
- No cost reward
- Example: "Free Product", "Sample Offer", "Complimentary Service"

**Free Shipping**
- Waived shipping or delivery charges
- Order value dependent or standalone
- Example: "Free Shipping", "Free Delivery", "Complimentary Delivery"

### Exclusive Access &amp; Experiences

**Early Access**
- Access to new products before general release
- Exclusive preview or beta access
- Example: "Early Access", "VIP Preview", "Beta Access"

**Exclusive Experiences**
- VIP events, special services, exclusive content
- Non-tangible but high-value rewards
- Example: "VIP Event Access", "Exclusive Webinar", "Priority Support"

### Tiered &amp; Subscription Rewards

**Tier Upgrades**
- Membership level upgrades
- Status elevation rewards
- Example: "Tier Upgrade", "Membership Level Up", "VIP Status"

**Free Subscriptions**
- Complimentary subscription periods
- Trial or extended access
- Example: "Free Month Subscription", "Trial Extension", "Premium Access"

---

## Reward Type Properties

### Core Fields

**Name**
- Display name of the reward type
- Human-readable identifier
- Examples: "Loyalty Points", "Discount Code", "Free Shipping"
- Required, 1-255 characters

**Code**
- Unique system identifier
- Alphanumeric with underscores only
- Lowercase snake_case format
- Must start with a letter
- Used for API references and automation
- Examples: `loyalty_points`, `discount_code`, `free_shipping`
- Required, 1-100 characters
- Must be unique across all reward types

**Description**
- Optional explanation of the reward type's purpose
- Helps team members understand the type's use
- Examples: "Loyalty points earned through customer purchases", "Fixed percentage discount vouchers"
- Optional, up to 500 characters

**Reward Category**
- Classification of reward type (optional)
- Examples: "Points", "Discounts", "Gifts", "Experiences"
- Helps organize reward types into groups
- Optional

**Created At**
- Timestamp when the reward type was created
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
- `loyalty_points`
- `discount_code`
- `free_shipping`
- `gift_card_100`
- `tier_upgrade`

**Invalid Examples:**
- `Loyalty Points` (contains space)
- `1_loyalty_points` (starts with number)
- `LOYALTY_POINTS` (contains uppercase)
- `loyalty-points` (contains hyphen)
- `loyalty points` (contains space)

---

## Creating Reward Types

### Step-by-Step Guide

**Step 1: Access Reward Types**
- Navigate to Configuration
- Select "Reward Types" from the configuration menu
- Click "Create Reward Type" button

**Step 2: Enter Reward Type Details**

Fill in the following fields:

1. **Name** (Required)
   - Enter a clear, descriptive name
   - Example: "Loyalty Points"

2. **Code** (Required)
   - Enter the unique system code
   - Use lowercase snake_case format
   - Example: `loyalty_points`
   - System will validate uniqueness in real-time

3. **Description** (Optional)
   - Add context about this reward type's purpose
   - Example: "Points earned through customer purchases, redeemable for discounts"

4. **Reward Category** (Optional)
   - Select or enter a category
   - Example: "Points", "Discounts", "Gifts"

**Step 3: Save**
- Click "Create Reward Type" button
- System validates all fields
- New reward type is added to your configuration

### Code Validation

The system provides real-time validation for the code field:

- **Uniqueness Check:** Validates no duplicate code exists (with 500ms debounce)
- **Format Check:** Validates snake_case format and character rules
- **Error Display:** Shows clear error messages for invalid codes
- **Real-time Feedback:** Validation happens as you type

---

## Managing Reward Types

### Viewing Reward Types

**Reward Types List**
- Access main Reward Types page to see all configured types
- View summary information: Name, Code, Description, Category, Created Date
- See count of rewards using each type

**Filtering &amp; Search**
- Search by name, code, description, or category
- Server-side search with debouncing for performance
- Results update as you type

**Statistics**
- **Total Reward Types:** Count of all configured reward types
- **Active Reward Types:** Count of types with associated rewards
- **Unused Reward Types:** Count of types with no rewards

### Editing Reward Types

**Update Existing Reward Type**

1. Locate the reward type in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Name can be changed freely
   - Code cannot be changed (to preserve reward references)
   - Description can be added or updated
   - Category can be changed or added
4. Click "Save" to update

**What Can Be Changed:**
- Name (display name)
- Description (purpose explanation)
- Category (reward classification)

**What Cannot Be Changed:**
- Code (unique system identifier - to prevent breaking reward references)

### Deleting Reward Types

**Delete Reward Type**

1. Locate the reward type in the list
2. Click the "Delete" action button
3. Confirm deletion in the confirmation dialog
4. Reward type is removed from the system

**Deletion Rules:**
- Can only delete reward types with no associated rewards
- If rewards reference a reward type, deletion will fail
- System prevents accidental deletion of in-use types
- Error message indicates rewards preventing deletion

**Before Deleting:**
- Ensure no rewards use this type
- Review usage statistics to identify dependent rewards
- Consider archiving instead of deleting for historical tracking

---

## Using Reward Types

### In Reward Management

Reward types are referenced when creating or editing rewards:

**Selection During Reward Creation**
1. When setting up a new reward
2. Choose the appropriate reward type from dropdown
3. Reward type helps categorize and organize the reward
4. Reward type appears in reward management and reporting

**Reward Type Reference**
- Each reward has a `reward_type_id` field
- Stores the ID of the associated reward type
- Used for filtering and organization
- Displayed in reward lists and details

### In Manual Actions

Manual rewards are created with specific reward types:

**Creating Manual Rewards**
- Select reward type when creating a manual reward
- Type determines reward structure and redemption rules
- Type appears in reward history and reporting

**Tracking by Type**
- View all manual rewards of a specific type
- Create type-specific reward campaigns
- Monitor type-specific redemption patterns
- Analyze type-specific performance

### In Reporting &amp; Analytics

**Type-Based Reporting**
- Filter reward reports by type
- View type-specific redemption rates
- Analyze type-specific costs and ROI
- Compare performance across reward types

**Analytics Insights**
- Most redeemed reward types
- Type-specific redemption velocity
- Type-specific customer preference patterns
- Cost per redemption by type

---

## Best Practices

### Naming Conventions

**Consistent Naming**
- Use clear, descriptive names
- Use present tense nouns (e.g., "Loyalty Points" not "Loyalty Pointed")
- Be consistent across reward types
- Avoid generic names like "Type 1" or "Reward"

**Code Standards**
- Use meaningful codes (not single letters or random strings)
- Use snake_case consistently
- Keep codes reasonably short but descriptive
- Document code meaning in description

**Examples:**
| Type | Name | Code | Description |
|------|------|------|-------------|
| ✅ Good | Loyalty Points | `loyalty_points` | Points earned through customer purchases |
| ✅ Good | Discount Code | `discount_code` | Percentage or fixed amount discount vouchers |
| ❌ Poor | LP | `lp` | Too vague |
| ❌ Poor | Customer Loyalty Reward Points System | `customer_loyalty_reward_points_system` | Name/code too long |

### Organization Strategy

**By Reward Model**
- Group types by how customers redeem (Points, Vouchers, Discounts)
- Organize around business models
- Create clear functional categories

**By Value**
- Separate premium rewards from basic rewards
- Group high-cost vs. low-cost reward types
- Makes budget tracking easier

**By Frequency**
- Separate one-time rewards from recurring
- Group daily, weekly, monthly reward types together
- Makes campaign planning easier

**By Customer Segment**
- Create types for different customer tiers
- Prefix with segment name if needed
- Example: `vip_exclusive_reward`, `standard_discount`, `newbie_welcome`

### Maintenance

**Regular Review**
- Periodically review configured reward types
- Identify unused types
- Clean up obsolete types
- Keep taxonomy current

**Documentation**
- Maintain clear description for each type
- Document purpose and use cases
- Keep team aligned on type usage
- Update when purpose changes

**Scaling**
- Plan reward type structure as you grow
- Avoid creating too many similar types
- Consolidate related types when appropriate
- Review organization as system expands

---

## Common Use Cases

### Use Case 1: Multi-Model Loyalty Program

**Scenario:** Retail company with mixed reward approaches

**Reward Types Created:**
- `loyalty_points` - Core points program
- `tier_upgrade` - VIP tier advancement
- `birthday_discount` - Annual birthday offer
- `referral_bonus` - Referral program reward
- `flash_sale_coupon` - Limited-time coupons

**Benefit:** Easy to create tier-specific, seasonal, and event-based campaigns

### Use Case 2: Discount &amp; Voucher Program

**Scenario:** E-commerce company with discount-focused strategy

**Reward Types Created:**
- `percentage_discount` - 10-50% off offers
- `fixed_amount_off` - $5-$50 off offers
- `free_shipping` - Shipping waiver
- `buy_one_get_one` - BOGO offers
- `combo_deal` - Multi-item bundled discounts

**Benefit:** Categorize discount offers for targeted campaign creation

### Use Case 3: Premium Rewards Program

**Scenario:** High-end brand with exclusive experiences

**Reward Types Created:**
- `vip_event_access` - Exclusive VIP events
- `concierge_service` - Personal shopping service
- `early_access` - Early access to collections
- `gift_package` - Premium gift boxes
- `custom_experience` - Bespoke customer experiences

**Benefit:** Track and measure high-value experience rewards separately

### Use Case 4: Department-Specific Rewards

**Scenario:** Multi-department organization

**Reward Types Created:**
- `marketing_discount` - Marketing-driven discounts
- `sales_bonus` - Sales team bonuses
- `customer_service_gift` - CS appreciation gifts
- `operations_incentive` - Ops team incentives
- `executive_recognition` - Executive-level recognition

**Benefit:** Each department manages their own reward types

---

## Troubleshooting

### Cannot Create Reward Type

**Error: "Code already exists"**
- Solution: Choose a unique code that doesn't exist
- Check: Search for existing reward types with similar codes
- Resolution: Append a number or modify code format

**Error: "Invalid code format"**
- Solution: Ensure code uses snake_case format
- Check: Code must start with letter, contain only a-z, 0-9, underscore
- Resolution: Correct code format before saving

**Error: "Name is required"**
- Solution: Enter a name for the reward type
- Check: Name field cannot be empty
- Resolution: Provide a descriptive name

### Cannot Delete Reward Type

**Error: "Cannot delete reward type with associated rewards"**
- Cause: One or more rewards reference this reward type
- Solution: Delete or reassign rewards to different reward type first
- Steps:
  1. Find rewards using this type
  2. Delete rewards or change their reward type
  3. Then delete the reward type

**Prevention:**
- Review usage statistics before deletion
- Consider deactivating instead of deleting
- Keep history of reward types used

### Code Not Validating

**Issue: Code validation appears stuck**
- Cause: Real-time validation has debounce (500ms delay)
- Solution: Wait a moment for validation to complete
- Alternative: Re-check code format manually

---

## Related Documentation

- [Manual Rewards](./documentation/manual-actions/manual-rewards) - Creating and managing manual rewards
- [Offers](./documentation/offers/offer-list) - Using rewards in offer configuration
- [Reward Reports](./documentation/analytics/offer-reports) - Reporting and analytics by reward type
