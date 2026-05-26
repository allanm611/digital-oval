# Create a Character Set

Create a new character set definition for encoding message content.

## Opening the Create Form

From the [Character Set List](/documentation/configuration/character-sets-list), click the **Create** button in the top right.

A form opens with the title: **Create New Character Set**

![Create Character Set](/img/v1.1/configuration/createcharactersetimage.png)

## Basic Information

### Character Set Name

**Required**

- Text input field
- Identify the character set with a clear, descriptive name
- Examples: "GSM 7-bit Standard", "Unicode UTF-8", "Latin Extended"

### Description

**Optional**

- Multi-line text area
- Explain the character set's encoding and use cases
- Examples: "Standard SMS encoding, 7-bit", "Supports accented characters and emoji"

## Configuration

![Create Character Set - Configuration](/img/v1.1/configuration/createcharactersetconfigurationtillbottomimage.png)

### Message Type

**Required**

- Select the category of messages this character set applies to
- Options typically include:
  - SMS
  - Email
  - Push Notification
  - Other message types

### Character Set Type

**Required**

- Select the encoding standard
- Common options:
  - GSM 7-bit
  - Unicode (UTF-8)
  - Latin-1 (ISO-8859-1)
  - Other encoding standards

### Character Set Size

**Optional** (Defaults to 160)

- Numeric input for the default character limit
- This is typically:
  - 160 for single SMS (GSM 7-bit)
  - 70 for Unicode SMS (due to 2-byte characters)
  - Higher values for email and push

If not provided, the system defaults to 160 during save.

### Standard Characters

**Required**

- Define the base set of characters supported by this encoding
- This is a string listing all standard characters
- Example for GSM 7-bit: "@£$¥èéùìòÇ..." plus alphanumerics and symbols

### Double/Triple/Quad Characters

**Optional**

- Additional character groups for characters that require multiple bytes
- **Double Characters** - Characters taking 2 bytes
- **Triple Characters** - Characters taking 3 bytes (if supported)
- **Quad Characters** - Characters taking 4 bytes (if supported)

These help the system calculate correct message length and split logic for extended character sets.

### Active Toggle

**Optional**

- Toggle to set this character set as Active or Inactive
- Active character sets are available for selection
- Inactive character sets are not available for use

## Modal Actions

**Cancel**
- Closes the form without saving
- Any entered data is lost

**Save**
- Submits the character set
- Form validates required fields before saving
- Shows success message on successful creation
- Returns to the list view

## Validation

The form validates:
- **Character Set Name** is required
- **Message Type** is required
- **Character Set Type** is required
- **Standard Characters** is required (must not be empty)

If validation fails, an error message appears. Correct the issues and try again.

## Save Behavior

On successful save:
1. Character set is created and assigned an ID
2. Status is set based on the Active toggle
3. You are returned to the Character Set List
4. The new character set appears in the list

## Tips

- Coordinate character set definitions with your messaging provider's specifications
- Test character limits with actual content in your messages
- Use standard encoding names so team members recognize them
- Document character limits and encoding details clearly
- Create separate character sets for different languages if they have different encoding requirements
- Consider emoji and special character support when defining extended character sets
