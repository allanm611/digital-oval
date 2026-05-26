# Character Sets Overview

Character Sets defines the encoding profiles used when composing message content. This page helps teams control how text is interpreted across channels, especially where character limits and encoding compatibility matter.

## Accessing Character Sets

**Navigation:** Configuration → Character Sets

From the main Configuration page, Character Sets is available as a dedicated section.

## What You Can Do

- View existing character set records
- Search by name or description
- Create a new character set
- Edit an existing character set
- Delete a character set

## Why This Page Matters

Character set configuration has direct impact on message rendering and payload sizing. Keeping these records accurate helps avoid delivery issues caused by unexpected encoding behavior.

Character sets determine:
- How characters are encoded in messages
- Character count calculations for SMS
- Multi-part message splitting logic
- Compatibility with different channels and devices

## Key Concepts

**Message Type** - The category of message (SMS, Email, etc.)

**Character Set Type** - The encoding standard (GSM 7-bit, Unicode, etc.)

**Standard Characters** - The base set of characters supported

**Double/Triple/Quad Characters** - Additional character sets for extended characters that take multiple bytes

**Character Set Size** - Default length limit for messages using this character set

## Next Steps

- [View Character Set List](character-sets-list.md)
- [Create a Character Set](create-character-set.md)
- [View Character Set Details](view-character-set.md)
