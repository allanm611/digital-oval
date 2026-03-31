# Creative Templates

## Overview

Creative Templates are reusable message templates for delivering offers and communications across multiple channels (SMS, Email, Push, USSD, WhatsApp, IVR, InApp, Web). They define the content structure with dynamic variable placeholders for personalization, supporting multiple languages and channels. Each template maintains version history and supports rollback to previous versions.

## Purpose & Benefits

### Why Use Creative Templates?

**Consistency & Reusability**
- Define message content once, use across multiple campaigns
- Maintain consistent branding across all channels
- Ensure consistent messaging to customers
- Update content once instead of in multiple places

**Multi-Channel Support**
- Single offer can have different creatives for different channels
- Optimize message format per channel (SMS vs Email vs Push)
- Channel-specific length limitations respected
- Rich content support for appropriate channels

**Localization & Personalization**
- Support multiple languages for global audiences
- Dynamic variables with `{{name}}` syntax
- Default values and variable validation
- Personalized messages at scale

**Version Control & Rollback**
- Track changes over time
- Maintain version history
- Rollback to previous versions if needed
- Audit trail of changes

### Key Benefits

- **Efficiency:** Reuse templates across multiple campaigns
- **Consistency:** Uniform messaging across channels
- **Personalization:** Dynamic variables for customer engagement
- **Flexibility:** Different versions for different channels/languages
- **Safety:** Version control and rollback capability

---

## Creative Channels

Creative Templates support 8 communication channels:

### SMS (Short Message Service)

**Description:** Text-based mobile messaging

**Characteristics:**
- 160 characters standard (160 for ASCII, 70 for Unicode)
- Text-only content
- Immediate delivery
- High open rates

**Use For:**
- Quick notifications
- Time-sensitive alerts
- Transactional confirmations
- Concise promotional messages

**Content Fields:**
- Text Body: Required
- Title: Not applicable
- HTML Body: Not used

**Examples:**
- `Hi {{customer_name}}, recharge for {{amount}} and get {{bonus_amount}} bonus data!`
- `Your order {{order_id}} is confirmed. Total: {{total_amount}}`

---

### Email

**Description:** Email message delivery

**Characteristics:**
- Rich formatting support (HTML)
- Longer content possible
- Open tracking available
- Click tracking supported

**Use For:**
- Detailed communications
- Rich HTML templates
- Promotional campaigns
- Newsletter-style content

**Content Fields:**
- Title: Required (email subject line)
- Text Body: Plain text version
- HTML Body: Formatted HTML email

**Examples:**
- Subject: `{{customer_name}}, your special {{discount_percent}}% offer expires soon!`
- HTML body with formatted offer details, images, etc.

---

### Push Notifications

**Description:** Mobile app push notifications

**Characteristics:**
- Title + short message
- Rich notification features
- Deep linking capability
- Immediate delivery

**Use For:**
- Time-sensitive alerts
- App engagement
- Promotional notifications
- Activity notifications

**Content Fields:**
- Title: Required
- Text Body: Required
- HTML Body: Optional formatting

**Examples:**
- Title: `Special Offer`
- Body: `{{customer_name}}, claim your {{bonus_data}}GB bonus now!`

---

### InApp Messaging

**Description:** Messages displayed within mobile or web app

**Characteristics:**
- Rich content support
- Interactive elements possible
- Targeted timing
- User-controlled dismissal

**Use For:**
- Contextual messages
- Rich promotional content
- User education
- Feature announcements

**Content Fields:**
- Title: Optional
- Text Body: Optional
- HTML Body: Rich content

---

### Web

**Description:** Web-based messages (banners, modals)

**Characteristics:**
- Rich HTML support
- Complex layouts possible
- User-controlled display
- Multi-element support

**Use For:**
- Website promotions
- Web banners
- Modal offers
- Rich promotional content

**Content Fields:**
- Title: Optional
- Text Body: Optional
- HTML Body: Rich HTML content

---

### USSD (Unstructured Supplementary Service Data)

**Description:** Interactive menu-based mobile system (no data needed)

**Characteristics:**
- Text-based menu format
- Limited to 160 characters per screen
- Numbered menu options
- Interactive navigation

**Use For:**
- Menu-driven offers
- Feature-limited environments
- USSD dial-in service
- Basic offers

**Content Fields:**
- Text Body: Required (menu format)
- Title: Not applicable
- HTML Body: Not used

**Example:**
```
Welcome {{customer_name}}!
1. {{offer_1_name}} - {{offer_1_price}}
2. {{offer_2_name}} - {{offer_2_price}}
0. Exit
```

---

### WhatsApp

**Description:** WhatsApp Business message delivery

**Characteristics:**
- Rich messaging support
- Media support
- Conversational tone
- High engagement rates

**Use For:**
- Personal-touch messages
- Rich promotional content
- Customer service
- Interactive offers

**Content Fields:**
- Title: Optional
- Text Body: Message content
- HTML Body: Formatting/rich content

---

### IVR (Interactive Voice Response)

**Description:** Automated voice-based system

**Characteristics:**
- Script-based voice delivery
- Speech-to-text capable
- Menu-driven options
- Accessibility option

**Use For:**
- Voice-based offers
- Accessibility support
- Phone-based menu system
- Voice announcements

**Content Fields:**
- Text Body: Voice script
- Title: Not applicable
- HTML Body: Not used

---

## Template Languages & Locales

Creative Templates support multiple language variants:

### Supported Locales

**English:**
- en (Generic English)
- en-US (United States)
- en-GB (United Kingdom)

**French:**
- fr (Generic French)
- fr-CA (Canadian)
- fr-FR (France)

**Spanish:**
- es (Generic Spanish)
- es-ES (Spain)
- es-MX (Mexico)

**Swahili:**
- sw (Generic Swahili)
- sw-UG (Uganda)
- sw-KE (Kenya)

### Using Locales

When creating or editing creatives:
1. Select the language/locale from dropdown
2. Create separate creative for each locale
3. System tracks locale alongside channel
4. Campaigns can deliver correct locale to users

---

## Dynamic Variables

Creative Templates support dynamic variables for personalization.

### Variable Syntax

Variables use double-brace syntax: `{{variable_name}}`

**Examples:**
- `{{customer_name}}` - Customer's name
- `{{offer_amount}}` - Offer amount
- `{{expiry_date}}` - Expiration date
- `{{bonus_data}}` - Bonus data amount

### Variable Types

Variables can be:
- **String:** Text values (names, addresses)
- **Number:** Numeric values (amounts, percentages)
- **Boolean:** True/false values

### Variable Properties

**Optional Fields:**
- `variables`: Defined variables for template
- `default_values`: Default if not provided at send time
- `required_variables`: Variables that must be provided

### Variable Substitution

When rendering creative:
1. System finds all `{{variable_name}}` patterns
2. Replaces with provided values
3. Uses default_values if not provided
4. Validates required_variables are present
5. Returns rendered message

**Example:**

```
Template: "Hi {{customer_name}}, enjoy {{discount_percent}}% off!"
Variables: {customer_name: "John", discount_percent: 20}
Rendered: "Hi John, enjoy 20% off!"
```

---

## Creating & Using Creative Templates

### Creating Creatives in Offer Creation

When creating an offer:

**Step 1: Access Offer Creative Editor**
- Navigate to Create Offer
- Reach the "Offer Creatives" step
- Select channels you want to deliver through

**Step 2: Add Creative for Each Channel**
- Click "Add Creative" for desired channel
- Select locale (language)
- Enter content:
  - **SMS:** Text body only
  - **Email:** Title (subject), text body, HTML body
  - **Push:** Title and text body
  - **Web/InApp:** HTML content
  - **USSD:** Menu-style text body

**Step 3: Insert Variables**
- Click variable insertion helper
- Select from available variables
- Or manually type {{variable_name}}
- Test with preview

**Step 4: Preview**
- Preview pane shows rendered content
- Test with sample variable values
- Verify formatting and length

**Step 5: Save**
- Creatives saved with offer
- Create new versions for changes
- Can rollback if needed

### Editing Existing Creatives

**For Active Offers:**
1. Go to Offer Details
2. Edit creative
3. System creates new version
4. Previous version retained
5. Can rollback to previous

**Version Management:**
- Each change creates new version
- System tracks all versions
- Can view version history
- Can rollback to any previous version

---

## Using Creatives in Campaigns

### Campaign Flow Setup

When campaigns execute:

**1. Campaign References Offer**
- Campaign selects segment
- Campaign selects offer
- Offer has creatives for different channels

**2. Channel Selection**
- Campaign chooses delivery channel (SMS, Email, etc.)
- System selects corresponding creative
- Multiple channels can deliver different creatives

**3. Variable Population**
- Campaign or customer data populates variables
- System substitutes {{variables}} with actual values
- Renders final message

**4. Delivery**
- Campaign delivers rendered message
- Channel-optimized format used
- Variables personalized per customer

### Multi-Channel Campaign Example

**Scenario:** Deliver offer via Email and SMS

- **Email Creative:**
  - Title: `{{customer_name}}, Your Special {{discount}}% Offer`
  - HTML: Rich formatted offer details

- **SMS Creative:**
  - Text: `Hi {{first_name}}, get {{discount}}% off! Use code {{code}}`

Campaign sends:
- Email to customers with email address
- SMS to customers with phone number
- Same offer, different channel formats

---

## Variable Management

### Defining Variables

When creating creatives:

**1. Identify Variables**
- What information changes per customer?
- What offer details are dynamic?
- What personalization elements needed?

**2. Define Variable Names**
- Use clear, descriptive names
- Example: `{{customer_name}}`, `{{discount_percent}}`
- Avoid spaces, special characters

**3. Set Variable Properties**
- Mark as required if essential
- Provide defaults if optional
- Document variable purpose

**4. Test Variables**
- Use preview with sample values
- Verify substitution works
- Check formatting after substitution

### Common Variables

**Customer Variables:**
- {{customer_name}} - Full name
- {{first_name}} - First name only
- {{email}} - Customer email
- {{phone}} - Customer phone

**Offer Variables:**
- {{offer_name}} - Offer title
- {{discount_percent}} - Discount percentage
- {{discount_amount}} - Fixed discount
- {{bonus_amount}} - Bonus value

**Campaign Variables:**
- {{campaign_name}} - Campaign title
- {{expiry_date}} - Offer expiration
- {{validity_period}} - How long offer valid
- {{redemption_code}} - Unique code

---

## Version Control & Rollback

### Version History

Each creative maintains version history:

**Viewing Versions:**
- Open creative details
- See version history list
- View each version's changes
- See who made changes and when

**Version Information:**
- Version number (1, 2, 3, etc.)
- Changed date
- Changed by (user name)
- Change summary

### Rollback

**Why Rollback:**
- Revert to previous messaging
- Fix erroneous content
- Return to proven version
- Fix channel-specific issues

**How to Rollback:**
1. Open creative details
2. View version history
3. Select version to restore
4. Click "Rollback to Version"
5. Confirm action
6. Previous version becomes active

**Note:** Rollback creates new version (doesn't delete current)

---

## Best Practices

### Content Guidelines

**SMS:**
- Keep under 160 characters
- Use short, clear language
- Include call-to-action
- Test on different devices

**Email:**
- Compelling subject line (`{{customer_name}}` increases opens)
- Mobile-responsive HTML
- Clear call-to-action
- Test in major email clients

**Push/InApp:**
- Concise title and message
- Relevant to user context
- Non-intrusive dismissal
- Fast load time

### Variable Usage

**Use Variables For:**
- Personalization (names, preferences)
- Dynamic values (amounts, dates)
- User-specific content
- Campaign-specific details

**Avoid Over-Variables:**
- Don't over-customize
- Keep templates reusable
- Use defaults for optional info
- Keep text coherent

**Testing Variables:**
- Test with real data
- Verify substitution works
- Check formatting preserved
- Validate length limits met

### Localization

**Language Versions:**
- Create variants for each language
- Use native speakers
- Test culturally appropriateness
- Keep brand voice consistent

**Regional Variations:**
- Consider regional preferences
- Adjust currency/units
- Respect cultural norms
- Test with regional users

### Channel Optimization

**SMS vs Email:**
- SMS: Urgent, time-sensitive
- Email: Detailed, rich content
- Use both for reinforcement

**Web vs App:**
- Web: Browser-based users
- App: Mobile app users
- Different layouts per channel

---

## Common Use Cases

### Use Case 1: Multi-Channel Offer Delivery

**Scenario:** Launch offer via SMS, Email, and Push simultaneously

**Email Creative:**
- Subject: `{{customer_name}}, get {{discount}}% off {{product}}`
- HTML: Rich offer details with images

**SMS Creative:**
- Text: `Hi {{first_name}}, {{discount}}% off {{product}}! Code: {{code}}`

**Push Creative:**
- Title: `Special Offer`
- Body: `{{discount}}% off {{product}}`

**Result:** Coordinated multi-channel campaign with channel-optimized messages

---

### Use Case 2: Localized Campaign

**Scenario:** Global campaign with English, French, Spanish versions

**English Creative:**
- Text: `Enjoy {{discount}}% off - Offer expires {{date}}`

**French Creative:**
- Text: `Profitez de {{discount}}% de réduction - L'offre expire {{date}}`

**Spanish Creative:**
- Text: `Disfruta {{discount}}% de descuento - Oferta vence {{date}}`

**Result:** Customers receive messages in their preferred language

---

### Use Case 3: Personalized Win-Back Campaign

**Scenario:** Reactivate dormant customers with personalized offers

**Template:**
- `Hi {{customer_name}}, we miss you! Return to get {{loyalty_bonus}} bonus on your next purchase. Code: {{code}}`
- Personalized with customer name and loyalty bonus
- Unique redemption code per customer

**Result:** Higher engagement through personalization

---

## Troubleshooting

### Variables Not Substituting

**Issue:** `{{variable}}` appears as-is in rendered message
- **Cause:** Variable name doesn't match exactly, variable not provided
- **Solution:** Check variable spelling exactly matches definition
- **Verify:** Variable is in provided data
- **Alternative:** Check for extra spaces in `{{variable }}`

### Message Truncated

**Issue:** SMS or USSD message appears cut off
- **Cause:** Content exceeds channel character limit
- **Solution:** SMS max 160 chars, USSD max 160 chars per screen
- **Verify:** Count characters including variables
- **Fix:** Reduce content or split into multiple messages

### Formatting Issues

**Issue:** Email HTML not rendering correctly
- **Cause:** HTML syntax error, client incompatibility
- **Solution:** Validate HTML syntax
- **Test:** Preview in major email clients (Gmail, Outlook, Apple)
- **Simplify:** Use simple HTML structure

### Version Rollback Failed

**Issue:** Can't rollback to previous version
- **Cause:** Version doesn't exist, permission issue
- **Solution:** Verify version exists in history
- **Check:** User has edit permission
- **Contact:** Support if permission issue

---

## Related Documentation

- [Offer Management](./documentation/offers/offer-list) - Creating offers with creatives
- [Campaigns](./documentation/campaigns/campaigns-list) - Using creatives in campaigns
- [Campaign Reports](./documentation/analytics/campaign-reports) - Performance by channel
- [Communications](./documentation/manual-actions/manual-communications) - Separate template system for manual messages
