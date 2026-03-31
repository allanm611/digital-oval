# Character Sets

## Overview

Character Sets define the supported character encodings used in your messaging system. They determine which characters and symbols can be included in messages, how messages are encoded for transmission, and ultimately impact message length, delivery compatibility, and visual presentation across different devices and regions.

## Purpose &amp; Benefits

### Why Use Character Sets?

**Enable Multilingual Support**
- Support different languages and character systems
- Enable non-Latin characters (Chinese, Arabic, Cyrillic, etc.)
- Support special symbols and emoji
- Serve global customer base

**Optimize Message Length**
- Different encodings affect message length
- GSM-7 encoding: 160 characters per SMS
- Unicode encoding: 70 characters per SMS
- Proper encoding ensures predictable message sizes

**Ensure Delivery Compatibility**
- Some devices/carriers support only specific encodings
- Proper encoding improves delivery rates
- Prevents character corruption in transit
- Maintains message integrity

**Control Costs**
- Encoding affects number of SMS required
- Optimal encoding reduces message count
- Fewer messages = lower SMS costs
- Significant savings at scale

**Improve User Experience**
- Characters display correctly on customer devices
- Special symbols and emoji render properly
- Avoid garbled or unreadable messages
- Professional appearance maintained

### Key Benefits

- **Global Reach:** Support all languages and character systems
- **Compatibility:** Messages display correctly everywhere
- **Cost Efficiency:** Optimal encoding reduces SMS costs
- **Quality:** Professional appearance with correct characters
- **Flexibility:** Multiple encodings for different needs
- **Reliability:** Predictable message formatting

---

## Character Set Types

### GSM-7 (7-bit GSM Alphabet)

**Overview:**
- Standard SMS encoding
- 160 characters per message
- Supports basic Latin alphabet
- Limited special character support

**Supported Characters:**
- Uppercase and lowercase letters (A-Z, a-z)
- Numbers (0-9)
- Space and punctuation marks
- Basic symbols: ! " # $ % &amp; ' ( ) * + , - . / : ; &lt; = &gt; ? @
- Special characters: £ ¥ è é ù ì ò Ç Ø ø Å å Δ _ ΦΓΛΩ Π Ψ Σ Θ Ξ

**Does NOT Support:**
- Accented characters beyond list above (á, é, í, ó, ú, ñ, etc.)
- Non-Latin characters (Chinese, Arabic, Cyrillic, Greek symbols)
- Emoji or most special symbols
- High-byte characters

**Best For:**
- English messages
- Simple text-only content
- Cost-sensitive campaigns
- Maximum message length

**Message Length:**
- 160 characters per message
- 306 characters if split into 2 messages
- Lowest cost per message

### Unicode (UTF-16)

**Overview:**
- Universal character encoding
- Supports all languages and characters
- 70 characters per message
- Higher cost but necessary for multilingual content

**Supported Characters:**
- All Latin characters with accents (á, é, í, ó, ú, ñ, ü, ç, etc.)
- Chinese characters (Simplified &amp; Traditional)
- Arabic characters
- Cyrillic alphabet (Russian, Ukrainian, etc.)
- Greek alphabet
- Hebrew characters
- Emoji and special symbols
- Any Unicode character

**Best For:**
- Multilingual campaigns
- Messages with accented characters
- Emoji usage
- Special symbols and icons
- Asian markets
- Middle Eastern markets
- European languages with diacritics

**Message Length:**
- 70 characters per message
- 134 characters if split into 2 messages
- 3.5x more expensive than GSM-7

### Latin-1 (ISO-8859-1)

**Overview:**
- Extended Latin character set
- 160 characters per message
- Supports accented European characters
- Good middle ground for European markets

**Supported Characters:**
- Basic Latin characters
- Accented Latin characters (á, é, í, ó, ú, ñ, ü, ç, etc.)
- European currency symbols (€, ¢, ¥, £)
- Additional punctuation and symbols

**Does NOT Support:**
- Non-Latin characters (Chinese, Arabic, Cyrillic, etc.)
- Emoji or most modern symbols

**Best For:**
- European campaigns
- Content with accented characters
- Balance between coverage and length
- Cost-effective multilingual support

**Message Length:**
- 160 characters per message
- Better than Unicode, more flexible than GSM-7

### Other Character Sets

**ASCII**
- Basic English characters only
- Limited support
- Rarely used (GSM-7 preferred)

**UTF-8**
- Variable-width encoding
- Full Unicode support
- Email and web use (not typical for SMS)

---

## Character Set Properties

### Core Fields

**Name**
- Display name for the character set
- Human-readable identifier
- Examples: "GSM-7", "Unicode UTF-16", "Latin-1 (ISO-8859-1)"
- Required, 1-100 characters

**Code**
- Unique system identifier
- Examples: GSM7, UNICODE, LATIN1, ASCII
- Used for API references
- Required, alphanumeric

**Encoding Type**
- Technical name of encoding
- Examples: GSM-7, UTF-16, ISO-8859-1
- Standard encoding designation
- Required

**Characters Per Message**
- Maximum characters supported in single SMS
- Examples: 160 (GSM-7), 70 (Unicode), 160 (Latin-1)
- Determines message splitting
- Required

**Description**
- Explanation of character set purpose
- Best use cases and characteristics
- Examples: "Standard SMS encoding, English-friendly", "Universal encoding for all languages"
- Optional, up to 500 characters

**Status**
- Active or Inactive
- Determines if available for campaigns
- Inactive character sets hidden from selection
- Active by default

**Language Support**
- Which languages this character set supports
- Examples: GSM-7 (English, Basic European), Unicode (All)
- Helps determine appropriate character set
- Reference information

**Cost Factor**
- Relative cost multiplier
- GSM-7 = 1x cost
- Unicode = 3.5x cost
- Helps justify character set choice
- Informational

**Created At**
- Timestamp when character set was added
- System-generated, read-only
- Audit trail information

---

## Creating Character Sets

### Step-by-Step Guide

**Step 1: Access Character Sets**
- Navigate to Configuration
- Select "Character Sets" from the configuration menu
- Click "Create Character Set" button

**Step 2: Enter Character Set Information**

Fill in the following fields:

1. **Name** (Required)
   - Enter descriptive character set name
   - Example: "Unicode UTF-16"
   - Used in UI for selection

2. **Code** (Required)
   - Enter unique system code
   - Example: "UNICODE" or "GSM7"
   - Alphanumeric, no spaces

3. **Encoding Type** (Required)
   - Specify technical encoding
   - Example: "UTF-16", "GSM-7", "ISO-8859-1"
   - Standard encoding designation

4. **Characters Per Message** (Required)
   - Number of characters allowed
   - Example: 70 for Unicode, 160 for GSM-7
   - Determines if messages split

**Step 3: Configure Optional Settings**

1. **Description** (Optional)
   - Add details about character set
   - Example: "Use for multilingual campaigns with emoji"
   - Helps users choose appropriate set

2. **Status** (Default: Active)
   - Set to Active to enable
   - Set to Inactive to hide from selection

3. **Language Support** (Optional)
   - Document supported languages
   - Example: "English, French, Spanish, German"

4. **Cost Factor** (Optional)
   - Relative cost multiplier
   - Example: 1.0 for GSM-7, 3.5 for Unicode

**Step 4: Save**
- Click "Create Character Set" button
- System validates configuration
- New character set available for use

### Validation Rules

**Name &amp; Code:**
- Name: 1-100 characters
- Code: Alphanumeric, no spaces
- Both must be unique

**Characters Per Message:**
- Numeric value required
- Typical ranges: 70-160
- Must be positive number

**Encoding Type:**
- Must be recognized encoding
- Examples: UTF-16, GSM-7, ISO-8859-1
- Standard designations only

---

## Managing Character Sets

### Viewing Character Sets

**Character Sets List**
- Access main Character Sets page
- View all configured sets
- See: Name, Code, Encoding, Chars/Message, Status, Language Support
- Filter by status or encoding type

**Filtering &amp; Search**
- Filter by status (Active/Inactive)
- Filter by encoding type
- Search by name or code
- Results update as you type

**Statistics**
- **Total Character Sets:** Count of all configured sets
- **Active Sets:** Count enabled for campaigns
- **GSM-7 Sets:** Count of GSM-7 encoded sets
- **Unicode Sets:** Count of Unicode encoded sets

### Editing Character Sets

**Update Existing Character Set**

1. Locate the character set in the list
2. Click the "Edit" action button
3. Modify fields as needed:
   - Name can be changed
   - Code locked to preserve references
   - Characters per message can be adjusted
   - Status can be toggled
4. Click "Save" to update

**What Can Be Changed:**
- Name (display name)
- Description (notes)
- Status (Active/Inactive)
- Characters Per Message (if needed)
- Language Support notes
- Cost Factor

**What Cannot Be Changed:**
- Code (unique identifier)
- Encoding Type (core property)

### Deactivating Character Sets

**Deactivate Instead of Delete**
- Set status to "Inactive"
- Character set hidden from selections
- Existing messages retain encoding
- Can be reactivated if needed

**When to Deactivate:**
- Character set no longer used
- Consolidated with another set
- Deprecated in favor of better option
- Temporary suspension

### Deleting Character Sets

**Delete Character Set**

1. Locate the character set in the list
2. Click the "Delete" action button
3. Confirm deletion in dialog
4. Character set removed from system

**Deletion Rules:**
- Can only delete inactive character sets
- Active sets must be deactivated first
- Cannot delete if campaigns reference it
- Consider deactivating instead

---

## Using Character Sets in Campaigns

### Selecting Character Set for Messages

**During Message Creation**
1. Create new message or template
2. Select or detect character set
3. System validates characters used
4. Warns if characters invalid for set
5. Shows message length impact

**Manual Selection**
- Choose character set explicitly
- For specific language requirements
- To optimize message length
- For cost considerations

**Automatic Detection**
- System detects characters used
- Recommends appropriate set
- Flags character compatibility issues
- Suggests optimal encoding

### Message Length Implications

**GSM-7 Encoding**
- 160 characters per message
- Split at 153 characters (2nd message)
- Example: 320 character message = 2 SMS

**Unicode Encoding**
- 70 characters per message
- Split at 67 characters (2nd message)
- Example: 140 character message = 2 SMS

**Cost Impact**
- Character set choice affects SMS count
- Unicode costs 3.5x more per character
- Message at 71 characters: 1 SMS in GSM-7, 2 SMS in Unicode
- Impacts campaign costs significantly

**Optimization Strategy**
- Use GSM-7 for English content
- Use Unicode only when necessary
- Consider message length carefully
- Estimate costs per character set

### Campaign Character Set Configuration

**Campaign-Level Selection**
1. During campaign creation
2. Select character set for SMS
3. All SMS in campaign use same set
4. Cannot change per segment

**Different Sets per Channel**
- Email: No character set restrictions
- SMS: Specific character set required
- Push: Varies by platform
- Other channels: No restrictions

---

## Best Practices

### Choosing Right Character Set

**For English-Only Content**
- Use GSM-7 encoding
- Most characters supported
- 160 characters per message
- Lowest cost

**For Multilingual Content**
- Use Unicode (UTF-16)
- Supports all languages
- 70 characters per message
- Higher cost but necessary

**For European Languages with Accents**
- Consider Latin-1 (ISO-8859-1)
- 160 characters per message
- Good balance for European markets
- More cost-effective than Unicode

**For Asian Markets**
- Use Unicode only
- Necessary for Chinese, Japanese, Korean
- Shorter messages but essential
- No alternative available

**For Middle East/Arabic**
- Use Unicode
- Required for Arabic characters
- Right-to-left text display
- Ensure proper message formatting

### Message Length Optimization

**Keep Messages Concise**
- Consider 160 character limit (GSM-7)
- Plan for message splitting
- Test messages on real devices
- Allow for customer preferences

**Monitor Character Count**
- Check estimated message length
- Preview how message splits
- Calculate multi-message costs
- Adjust content if needed

**Use Abbreviations**
- Shorten where possible
- Standard SMS abbreviations understood
- Saves characters and cost
- Maintain clarity

**Plan Multilingual Campaigns**
- English: 160 characters
- Unicode: 70 characters
- Budget accordingly
- May need shorter Unicode messages

### Character Set Management

**Maintain Standard Sets**
- Use only necessary character sets
- Standard sets (GSM-7, Unicode, Latin-1)
- Avoid custom sets unless required
- Regular review of configured sets

**Document Usage**
- Document when each set is used
- Note language/market mapping
- Record cost implications
- Update as markets change

**Test Thoroughly**
- Test messages with various characters
- Verify on real devices
- Check on multiple carriers
- Ensure proper display

**Monitor Performance**
- Track character set usage
- Monitor delivery by character set
- Compare performance metrics
- Optimize selection over time

---

## Common Use Cases

### Use Case 1: English-Only Campaigns

**Scenario:** Company serving English-only market

**Character Sets Used:**
- `GSM7` - Standard English encoding

**Configuration:**
- All campaigns use GSM-7
- 160 characters per message
- Standard punctuation and symbols
- Lowest cost

**Example Message:**
- "Welcome to XYZ Bank! Your account is ready. Login now: example.com/login" (82 chars)

### Use Case 2: Multilingual Global Company

**Scenario:** International company serving multiple language markets

**Character Sets Used:**
- `GSM7` - English markets
- `UNICODE` - All non-Latin markets
- `LATIN1` - European accented languages

**Configuration per Market:**
- English (US, UK): GSM-7
- Spanish (Spain, Mexico): Latin-1
- French (France, Canada): Latin-1
- Chinese (Mainland, Taiwan): Unicode
- Arabic (Saudi, UAE): Unicode
- Russian: Unicode

**Benefit:** Optimal encoding per market

### Use Case 3: Emoji-Heavy Campaigns

**Scenario:** Brand using emoji for youth market

**Character Sets Used:**
- `UNICODE` - Only option for emoji

**Configuration:**
- All campaigns with emoji use Unicode
- Limited to 70 characters
- Emoji count as 1-2 characters
- Higher cost but necessary

**Example Message:**
- "🎉 You won! 💰 Claim your $50 gift card 🎁 Expires in 48hrs ⏰" (about 40 chars, 1 SMS)

### Use Case 4: Accented European Languages

**Scenario:** E-commerce company in European markets

**Character Sets Used:**
- `LATIN1` - European languages with accents

**Configuration:**
- French: "Bienvenue! Vérifiez votre compte maintenant."
- Spanish: "¡Bienvenido! Verifique su cuenta ahora."
- German: "Willkommen! Überprüfen Sie jetzt Ihr Konto."
- All 160 chars per message with Latin-1

**Benefit:** Accented characters work, keep 160 char limit

---

## Troubleshooting

### Cannot Create Character Set

**Error: "Code already exists"**
- Cause: Duplicate code
- Solution: Use unique code
- Check: Search for existing code

**Error: "Invalid encoding type"**
- Cause: Unrecognized encoding designation
- Solution: Use standard encoding (UTF-16, GSM-7, ISO-8859-1)
- Check: Consult encoding standards

**Error: "Characters per message invalid"**
- Cause: Non-numeric or invalid value
- Solution: Enter valid number (typically 70-160)
- Check: Verify value is positive integer

### Character Set Not Appearing in Campaigns

**Issue: Cannot select character set for campaign**
- Cause: Character set status is Inactive
- Solution: Activate character set
- Check: Go to edit, set status to Active

**Issue: System shows wrong character set**
- Cause: Character set auto-detected incorrectly
- Solution: Manually select correct character set
- Check: Remove unsupported characters

### Message Length Issues

**Issue: Message longer than expected**
- Cause: Unicode used instead of GSM-7
- Solution: Switch to GSM-7 if possible
- Check: Remove non-GSM-7 characters

**Issue: Message split into multiple SMS unexpectedly**
- Cause: Selected character set has shorter limit
- Solution: Shorten message or change character set
- Check: Verify character count

**Issue: Special characters showing as garbage**
- Cause: Wrong character set selected
- Solution: Choose character set supporting characters
- Check: Use Unicode for special characters/emoji

### Character Display Issues

**Issue: Accented characters not displaying**
- Cause: GSM-7 selected (doesn't support all accents)
- Solution: Switch to Latin-1 or Unicode
- Check: Verify character support

**Issue: Arabic text not displaying properly**
- Cause: Character set selected (must be Unicode)
- Solution: Switch to Unicode encoding
- Check: Verify RTL text handling

**Issue: Emoji showing as question marks**
- Cause: GSM-7 or Latin-1 selected
- Solution: Switch to Unicode
- Check: Only Unicode supports emoji

---

## Related Documentation

- [Languages](/documentation/languages) - Language configuration with locale-specific formatting
- [Creative Templates](/documentation/creative-templates) - Message templates with character considerations
- [Campaigns](./documentation/campaigns/campaigns-list) - Creating campaigns with character set selection
- [Communication Channels](/documentation/communication-channels) - Channel-specific character support
