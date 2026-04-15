# Create a Language

Create a new language record to support multi-language campaigns and content.

## Opening the Create Form

From the [Language List](/documentation/configuration/languages-list), click the **Create** button in the top right.

A modal opens with the title: **Add Language**

![Add Language Modal](/img/v1.1/configuration/addlanguagemodal.png)

## Language Information

### Language Name

**Required**

- Text input field
- The readable name of the language
- Examples: "English", "Spanish", "French", "Mandarin Chinese"

### Description

**Optional**

- Multi-line text area
- Additional context about the language variant or target audience
- Examples: "European Spanish", "Latin American Spanish", "Simplified Chinese"

### Language Code

**Required** (in metadata field)

- Standard language identifier
- Uses ISO 639-1 codes
- Examples: "en", "es", "fr", "zh", "sw"
- Unique identifier for this language

## Language Configuration

### Country

**Required**

- Select the country or region for this language variant
- This specifies the regional variant being supported
- Examples: "United States", "Spain", "Canada", "China"
- Important for supporting regional dialects and conventions

### Character Set Type

**Required**

- Select the character set type that supports this language
- The dropdown shows available character set types
- Choose a type that supports:
  - All characters in this language
  - Any special characters or diacritics
  - Emoji if needed

Example selections:
- English: GSM 7-bit or Unicode
- Spanish (with accents): Unicode or Latin-1
- Arabic: Unicode
- Chinese (Simplified): Unicode
- Swahili: Latin-1 or Unicode

## Modal Actions

**Cancel**
- Closes the modal without saving
- Any entered data is lost

**Save**
- Submits the language
- Form validates required fields before saving
- Shows success message on successful creation
- Returns to the language list

## Validation

The form validates:
- **Language Name** is required
- **Language Code** is required
- **Country** is required
- **Character Set Type** is required

If validation fails, an error message appears. Correct the issues and try again.

## Save Behavior

On successful save:
1. Language is created and assigned an ID
2. Status defaults to Active
3. You are returned to the Language List
4. The new language appears in the list

## Tips

- Create all language variants your organization needs before launching campaigns
- Use standard language codes so team members recognize them
- Choose character sets that support all characters in the language
- Consider regional variants (en-US vs en-GB) if your content differs by region
- Keep descriptions clear about the target region or audience
- Coordinate with your content team on which languages to support
- Test character limits and encoding with actual content in each language
