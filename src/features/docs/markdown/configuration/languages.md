# Languages

## Overview

Languages define the supported locales and language variants used in your system for customer communications and interface localization. They enable you to create multilingual campaigns and messages that reach customers in their preferred language and regional format, ensuring better engagement and customer satisfaction.

## Purpose &amp; Benefits

### Why Use Languages?

**Support Multiple Languages**
- Configure supported languages for your platform
- Enable multilingual customer communications
- Reach customers worldwide in their preferred language
- Serve diverse customer bases

**Enable Localization**
- Use language-specific messaging and formatting
- Adapt content to regional preferences
- Support regional date, time, and currency formats
- Maintain cultural relevance

**Improve Customer Engagement**
- Send messages in customer's preferred language
- Increase open rates and response rates
- Improve customer satisfaction
- Build stronger customer relationships

**Organize Messaging**
- Group messaging templates by language
- Create language-specific campaign variations
- Manage translations systematically
- Maintain content consistency

### Key Benefits

- **Global Reach:** Support customers worldwide
- **Personalization:** Messages in customer's language
- **Engagement:** Higher engagement in preferred language
- **Consistency:** Organized language and translation management
- **Compliance:** Meet regional language requirements
- **Flexibility:** Easy to add new languages as needed

---

## Language Structure

### Language Components

**Language Code**
- ISO 639-1 language code (2 letters)
- Examples: en (English), fr (French), es (Spanish), sw (Swahili)
- Uniquely identifies the language
- Used in messaging and API calls

**Locale Code**
- Full locale identifier with region
- Format: language-country (e.g., en-US, en-GB, fr-FR)
- Also called language variant or region-specific language
- Determines regional formatting

**Display Name**
- Human-readable language name
- Examples: "English", "French", "Spanish", "Swahili"
- Used in UI for selection
- Helps users identify language

**Region/Country**
- Specific region for this language
- Examples: United States, United Kingdom, Canada, Kenya
- Affects date, time, currency formatting
- Influences cultural context

**Direction**
- Text direction: Left-to-Right (LTR) or Right-to-Left (RTL)
- Examples: English=LTR, Arabic=RTL, Hebrew=RTL
- Affects message display
- Important for formatting

---

## Common Languages &amp; Locales

### English Variants

**en - English (Generic)**
- Code: en
- Default for non-specific English
- Fallback for other English variants

**en-US - English (United States)**
- Code: en-US
- Locale: United States
- Date Format: MM/DD/YYYY
- Currency: USD

**en-GB - English (United Kingdom)**
- Code: en-GB
- Locale: United Kingdom
- Date Format: DD/MM/YYYY
- Currency: GBP

**en-CA - English (Canada)**
- Code: en-CA
- Locale: Canada
- Date Format: YYYY-MM-DD
- Currency: CAD

### French Variants

**fr - French (Generic)**
- Code: fr
- Default for non-specific French
- Fallback for other French variants

**fr-FR - French (France)**
- Code: fr-FR
- Locale: France
- Date Format: DD/MM/YYYY
- Currency: EUR

**fr-CA - French (Canada)**
- Code: fr-CA
- Locale: Canada
- Date Format: YYYY-MM-DD
- Currency: CAD

### Spanish Variants

**es - Spanish (Generic)**
- Code: es
- Default for non-specific Spanish

**es-ES - Spanish (Spain)**
- Code: es-ES
- Locale: Spain
- Date Format: DD/MM/YYYY
- Currency: EUR

**es-MX - Spanish (Mexico)**
- Code: es-MX
- Locale: Mexico
- Date Format: DD/MM/YYYY
- Currency: MXN

### Swahili Variants

**sw - Swahili (Generic)**
- Code: sw
- Default for non-specific Swahili
- Spoken across East Africa

**sw-KE - Swahili (Kenya)**
- Code: sw-KE
- Locale: Kenya
- Date Format: DD/MM/YYYY
- Currency: KES

**sw-TZ - Swahili (Tanzania)**
- Code: sw-TZ
- Locale: Tanzania
- Date Format: DD/MM/YYYY
- Currency: TZS

**sw-UG - Swahili (Uganda)**
- Code: sw-UG
- Locale: Uganda
- Date Format: DD/MM/YYYY
- Currency: UGX

### Other Common Languages

**ar - Arabic**
- Direction: Right-to-Left
- Spoken in Middle East &amp; North Africa
- Example locales: ar-SA (Saudi Arabia), ar-AE (UAE)

**de - German**
- Direction: Left-to-Right
- Spoken in Germany, Austria, Switzerland
- Example locales: de-DE, de-AT, de-CH

**it - Italian**
- Direction: Left-to-Right
- Spoken in Italy
- Locale: it-IT

**pt - Portuguese**
- Direction: Left-to-Right
- Example locales: pt-BR (Brazil), pt-PT (Portugal)

**zh - Chinese**
- Direction: Left-to-Right
- Example locales: zh-CN (Simplified), zh-TW (Traditional)

**ja - Japanese**
- Direction: Left-to-Right
- Locale: ja-JP

**ru - Russian**
- Direction: Left-to-Right
- Locale: ru-RU

---

## Language Properties

### Core Fields

**Language Code**
- ISO 639-1 code (2 letters)
- Examples: en, fr, es, sw, ar, de
- Required, globally unique
- Standard across systems and APIs

**Display Name**
- Human-readable language name
- Examples: "English", "French", "Spanish"
- Required, 1-100 characters
- Used in UI dropdown menus

**Locale**
- Full locale identifier (language-country)
- Format: xx-YY (e.g., en-US, fr-FR, sw-KE)
- Required, uniquely identifies specific variant
- Determines regional formatting

**Country/Region**
- Specific region for this language
- Examples: "United States", "United Kingdom", "Kenya"
- Required, helps identify locale
- Used in regional filtering

**Text Direction**
- LTR (Left-to-Right) or RTL (Right-to-Left)
- Default: LTR
- Used for message formatting
- Critical for RTL languages (Arabic, Hebrew, etc.)

**Status**
- Active or Inactive
- Determines if language available for campaigns
- Inactive languages hidden from selection
- Active by default

**Description**
- Optional explanation of language usage
- Examples: "Primary language for African campaigns", "Legacy support only"
- Optional, up to 500 characters

**Created At**
- Timestamp when language was added
- System-generated, read-only
- Useful for audit trails

### Formatting Properties

**Date Format**
- How dates display in messages
- Examples: MM/DD/YYYY (US), DD/MM/YYYY (Europe), YYYY-MM-DD (ISO)
- Used for customer-facing messages
- Optional, defaults to locale standard

**Time Format**
- How times display in messages
- Examples: 12-hour (1:30 PM), 24-hour (13:30)
- Used for appointment or delivery times
- Optional, defaults to locale standard

**Currency Symbol**
- Currency used in region
- Examples: $ (USD), £ (GBP), € (EUR)
- Used for financial messages
- Optional, defaults to locale standard

---

## Creating Languages

### Step-by-Step Guide

**Step 1: Access Languages**
- Navigate to Configuration
- Select "Languages" from the configuration menu
- Click "Create Language" button

**Step 2: Enter Language Information**

Fill in the following fields:

1. **Language Code** (Required)
   - Enter ISO 639-1 code
   - Example: "en" for English, "fr" for French
   - 2-letter codes only
   - Must be unique

2. **Display Name** (Required)
   - Enter user-friendly language name
   - Example: "English", "French", "Swahili"
   - How it appears in UI dropdowns
   - Clear and recognizable

3. **Locale** (Required)
   - Enter full locale code
   - Format: language-country (en-US, fr-FR, sw-KE)
   - Uniquely identifies variant
   - Determines regional formatting

4. **Country/Region** (Required)
   - Enter country or region name
   - Example: "United States", "France", "Kenya"
   - Helps identify geographic scope
   - Used for regional filtering

5. **Text Direction** (Required)
   - Select LTR or RTL
   - Default: LTR
   - RTL for Arabic, Hebrew, Persian
   - Affects message formatting

**Step 3: Configure Optional Settings**

1. **Date Format** (Optional)
   - Select preferred date format
   - Examples: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
   - Defaults to locale standard

2. **Time Format** (Optional)
   - Select 12-hour or 24-hour
   - Defaults to locale standard

3. **Currency** (Optional)
   - Select or enter currency symbol
   - Example: $, £, €, ₹
   - Defaults to locale standard

4. **Description** (Optional)
   - Add notes about language
   - Example: "Primary language for East African campaigns"

**Step 4: Save**
- Click "Create Language" button
- System validates all required fields
- New language available for use

### Validation Rules

**Language Code:**
- Exactly 2 characters
- Lowercase letters only
- Must be ISO 639-1 standard
- Globally unique

**Display Name:**
- 1-100 characters
- Cannot be empty
- Should match language name

**Locale:**
- Format: xx-YY (language-country)
- Language code + dash + country code
- Both parts required
- Must be valid locale

**Country/Region:**
- 1-100 characters
- Clear, recognizable name
- Cannot be empty

---

## Managing Languages

### Viewing Languages

**Languages List**
- Access main Languages page
- View all configured languages
- See: Code, Display Name, Locale, Country, Direction, Status
- Filter by status or direction
- Search by code or name

**Filtering &amp; Search**
- Filter by status (Active/Inactive)
- Filter by text direction (LTR/RTL)
- Search by language code
- Search by display name

**Statistics**
- **Total Languages:** Count of configured languages
- **Active Languages:** Count enabled for campaigns
- **LTR Languages:** Count of left-to-right languages
- **RTL Languages:** Count of right-to-left languages

### Editing Languages

**Update Existing Language**

1. Locate the language in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Display Name can be changed
   - Some fields locked to preserve references
   - Status can be toggled (Active/Inactive)
   - Description can be updated
4. Click "Save" to update

**What Can Be Changed:**
- Display Name (user-friendly name)
- Status (Active/Inactive)
- Description (notes and purpose)
- Optional formatting settings
- Date/Time/Currency formats

**What Cannot Be Changed:**
- Language Code (core identifier)
- Locale (to preserve usage references)
- Country/Region (for consistency)

### Deactivating Languages

**Deactivate Instead of Delete**
- Set status to "Inactive"
- Language hidden from selection dropdowns
- Existing messages retain language
- Can be reactivated if needed

**When to Deactivate:**
- Language no longer supported
- No longer serving customers in region
- Consolidating language variants
- Temporary suspension

### Deleting Languages

**Delete Language**

1. Locate the language in the list
2. Click the "Delete" action button
3. Confirm deletion in dialog
4. Language removed from system

**Deletion Rules:**
- Can only delete inactive languages
- Active languages must be deactivated first
- Cannot delete if campaigns reference it
- Consider deactivating instead

**Before Deleting:**
- Ensure no active campaigns use language
- Deactivate first if currently active
- Backup any documentation
- Consider deactivating for history

---

## Using Languages in Campaigns

### Assigning Languages to Messages

**During Message Creation**
1. Create new message or template
2. Select primary language
3. Language determines formatting
4. Date/time/currency formatted per locale
5. Translation strings loaded per language

**Language-Specific Content**
- Different messages per language
- Translations managed per language
- Cultural adaptations per region
- Format variations (date, time, currency)

### Multi-Language Campaigns

**Creating Multilingual Campaigns**

1. Select base language for campaign
2. Create message in base language
3. Translate message to other languages
4. Link translations in message configuration
5. System sends appropriate language to each customer

**Customer Language Preference**
- System stores customer's preferred language
- Messages sent in customer's language
- Fallback to default if translation unavailable
- Can be overridden per campaign

**Example:**
- Customer A: Prefers English (en-US)
- Customer B: Prefers French (fr-FR)
- Campaign sends in each customer's language
- Same campaign, different language per customer

### Language Selection in Campaigns

**Choose Campaign Language**
1. During campaign creation
2. Select primary language
3. All messages in that language
4. Can create language variants

**Language Variants**
- Create same campaign in multiple languages
- Each language is separate campaign version
- Target different customer segments
- Track performance per language

---

## Best Practices

### Language Selection

**Support Primary Markets**
- Include languages for target markets
- English for global campaigns
- Regional languages for local campaigns
- Don't overextend to unsupported languages

**Clear Naming**
- Use standard ISO 639-1 codes
- Include country codes for variants
- Examples: en-US, en-GB, fr-FR, sw-KE
- Avoid ambiguous naming

**Regional Considerations**
- Add all relevant regional variants
- en-US, en-GB, en-CA for English-speaking markets
- fr-FR, fr-CA for French-speaking markets
- sw-KE, sw-TZ, sw-UG for East Africa

### RTL Language Support

**For Arabic, Hebrew, Persian:**
- Set Text Direction to RTL
- Messages display right-to-left
- UI elements mirror appropriately
- Test thoroughly before production

**Formatting for RTL:**
- Numbers remain left-to-right (standard)
- Dates format per regional preference
- Currency symbols position correctly
- Special characters display properly

### Translation Management

**Organize by Language**
- Create templates per language
- Use consistent naming
- Group related translations
- Version control translations

**Quality Assurance**
- Have native speakers review
- Test formatting in messages
- Verify date/time display
- Check currency handling

**Maintenance**
- Keep translations current
- Update when base language changes
- Remove obsolete translations
- Document translation status

### Documentation

**Language Purpose**
- Document why each language added
- Note target markets
- Record active status
- Track changes over time

**Language Variants**
- Document differences between variants
- Note regional formatting
- Record supported locales
- Maintain variant hierarchy

**Support Information**
- Keep contact info for translators
- Document translation standards
- Record language requirements
- Track performance per language

---

## Common Use Cases

### Use Case 1: Global English Company

**Scenario:** International company serving English-speaking markets

**Languages Configured:**
- `en` - English (Generic/Default)
- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `en-CA` - English (Canada)

**Usage:**
- Primary campaigns in en-US
- UK campaigns in en-GB
- Canadian campaigns in en-CA
- Default en for unspecified regions

**Benefit:** Region-specific formatting and variants

### Use Case 2: Multilingual African Operations

**Scenario:** Telecom company serving East African countries

**Languages Configured:**
- `en-KE` - English (Kenya)
- `en-UG` - English (Uganda)
- `en-TZ` - English (Tanzania)
- `sw-KE` - Swahili (Kenya)
- `sw-UG` - Swahili (Uganda)
- `sw-TZ` - Swahili (Tanzania)

**Usage:**
- English campaigns for business customers
- Swahili campaigns for mass market
- Country-specific formatting
- Preference-based language selection

**Benefit:** Serve customers in their preferred language

### Use Case 3: European Expansion

**Scenario:** European company expanding to multiple countries

**Languages Configured:**
- `en-GB` - English (UK)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)
- `es-ES` - Spanish (Spain)
- `it-IT` - Italian (Italy)

**Usage:**
- Each country gets native language campaigns
- Regional formatting per country
- Localized messaging
- Cultural adaptation

**Benefit:** Strong local relevance in each market

### Use Case 4: Legacy System with New Expansion

**Scenario:** System supporting legacy English, adding new languages

**Languages Configured:**
- `en` - English (Legacy/Generic) - Inactive
- `en-US` - English (United States) - Active
- `en-GB` - English (United Kingdom) - Active
- `ar-SA` - Arabic (Saudi Arabia) - Active (New)
- `ar-AE` - Arabic (UAE) - Active (New)

**Usage:**
- Legacy campaigns use generic en
- New campaigns use specific variants
- Gradual migration to new language structure
- RTL support for Arabic messages

**Benefit:** Maintain backward compatibility while expanding

---

## Troubleshooting

### Cannot Create Language

**Error: "Language code already exists"**
- Cause: Language code duplicated
- Solution: Use unique code
- Check: Search for existing language with same code

**Error: "Invalid locale format"**
- Cause: Locale doesn't match xx-YY format
- Solution: Use correct format (e.g., en-US, fr-FR)
- Check: Both language and country codes required

**Error: "Invalid language code"**
- Cause: Code not ISO 639-1 standard
- Solution: Use 2-letter ISO code
- Check: Lowercase letters only

### Language Not Appearing in Dropdowns

**Issue: Created language not showing in campaign selection**
- Cause: Language status is Inactive
- Solution: Set status to Active
- Check: Go to edit language, change status

**Issue: Language shows but can't select it**
- Cause: Insufficient permissions
- Solution: Check user permissions
- Contact: System administrator

### Formatting Issues

**Issue: Dates showing in wrong format**
- Cause: Date format not configured
- Solution: Set date format in language settings
- Check: Verify format matches region

**Issue: Currency symbol not displaying**
- Cause: Currency not configured
- Solution: Set currency symbol in language settings
- Check: Verify symbol correct for region

**Issue: RTL text displaying incorrectly**
- Cause: Text Direction not set to RTL
- Solution: Change direction to RTL
- Check: Verify for Arabic, Hebrew, Persian

### Language Performance

**Issue: Campaigns slow for certain language**
- Cause: Language has many templates
- Solution: Optimize template organization
- Check: Archive unused translations

**Issue: Translation strings taking time to load**
- Cause: Too many languages configured
- Solution: Deactivate unused languages
- Check: Keep only active languages

---

