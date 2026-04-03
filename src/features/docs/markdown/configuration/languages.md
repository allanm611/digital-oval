# Languages

## Overview

Languages is a configuration page used to manage available languages and locales for offer creatives.

The page lets you:

- View languages in a table
- Search languages by name or description
- Create a language
- Edit a language
- Delete a language

---

## Accessing Languages

**Navigation:** Dashboard -> Configuration -> Languages

From the main Configuration page, Languages appears under **Offer Configuration**.

---

## Languages List Page

The Languages page includes:

### Header

- Page title: **Languages**
- Page description explaining that languages and locales can be used for offer creatives and localized message content
- **Create** button

### Search

- A search input with the placeholder **Search languages...**
- Search filters the list by:
  - Language name
  - Description

### Table Columns

The list table shows these columns:

- **language**
- **Description**
- **Status**
- **Language Code**
- **Actions**

### Status Display

Each row shows one of these statuses:

- **Active**
- **Inactive**

### Row Actions

Each row provides:

- **Edit** button
- **Delete** button

---

## Creating a Language

Click **Create** to open the language modal.

**Modal title:** Add Language

### Fields

**Name**

- Required
- Text input

**Description**

- Optional
- Multi-line text area

**Language Code**

- Text input
- Placeholder: `e.g., en, fr, es, sw`

**Country**

- Required
- Select field
- Placeholder: `Select a country`

**Character Set**

- Required
- Select field
- Placeholder: `Select a character set`
- Options are loaded dynamically from active character sets

### Modal Actions

- **Cancel** closes the modal without saving
- **Save** submits the language

---

## Editing a Language

Click the **Edit** button in the list to open the edit modal.

**Modal title:** Edit Language

The edit modal uses the same visible fields as the create modal:

- Name
- Description
- Language Code
- Country
- Character Set

---

## Deleting a Language

Click the **Delete** button in the Actions column.

A confirmation modal appears with:

- Title: **Delete Language**
- A message warning that deleting the item may affect existing creatives using this language

If deletion succeeds, the app shows a success message.

---

## Validation and Save Behavior

The modal validates these fields:

- **Name** is required
- **Country** is required
- **Character Set** is required

If saving fails, the page shows an error message.

---

## Empty State

If there are no languages and no search term is entered, the page shows an empty state with a prompt to create the first language.

If a search returns no results, the page shows a no-results message.

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
