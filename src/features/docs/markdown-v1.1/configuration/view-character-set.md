# View Character Set Details

View complete information about a character set including its encoding configuration and character definitions.

![Character Set Details](/img/v1.1/configuration/charactersetsdetailspage.png)

## Accessing Character Set Details

From the [Character Set List](/documentation/configuration/character-sets-list):

1. Find the character set you want to view
2. Click the **View Details** button (eye icon) on the row

The details page opens showing the complete character set configuration.

## Character Set Information

**Character Set Name**
- The identifier for this character set
- Used when mapping languages and creating messages

**Description**
- Summary of the encoding type and usage

**Status**
- Active or Inactive
- Active character sets are available for selection
- Inactive character sets are not available for use

## Encoding Configuration

**Message Type** - The category this character set applies to (SMS, Email, etc.)

**Character Set Type** - The encoding standard used (GSM 7-bit, Unicode, etc.)

**Character Set Size** - The default character limit for messages using this encoding
- Example: 160 for standard SMS, 70 for Unicode SMS

## Character Definitions

**Standard Characters** - The base set of characters supported

**Double Characters** - Characters requiring 2 bytes of encoding

**Triple Characters** - Characters requiring 3 bytes (if applicable)

**Quad Characters** - Characters requiring 4 bytes (if applicable)

## Editing

To modify this character set:

1. Click the **Edit** button
2. Update the desired fields:
   - Name
   - Description
   - Message type
   - Character set type
   - Character set size
   - Character definitions
   - Status
3. Click **Save** to apply changes

## Deleting

To remove this character set:

1. Click the **Delete** button
2. Confirm deletion in the modal
3. The character set is permanently removed

**Warning:** Ensure no languages or messages are using this character set before deleting.

## Using This Character Set

Once created, this character set is used:

- When configuring language support
- To calculate message length and splitting
- To determine character limits for different message types
- To handle special characters and emoji

## Tips

- Keep character set definitions in sync with your messaging provider
- Test message length calculations with actual content
- Review character sets when adding new language support
- Use clear naming so team members recognize the encoding type
- Monitor which languages use each character set before making changes
