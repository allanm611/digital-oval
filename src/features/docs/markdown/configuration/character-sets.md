# Character Sets

## Overview

Character Sets is an offer configuration page used to manage character encoding records available in the app.

The page lets you:

- View existing character sets in a table
- Search character sets by name or description
- Create a new character set
- Edit an existing character set
- Delete a character set

---

## Accessing Character Sets

**Navigation:** Dashboard -> Configuration -> Character Sets

From the main Configuration page, Character Sets appears under **Offer Configuration**.

---

## Character Sets List Page

The Character Sets page includes:

### Header

- Page title: **Character Sets**
- Page description explaining that the page manages character encoding sets for language support and text display
- **Create** button

### Search

- A search input with the placeholder **Search character sets...**
- Search filters the list by:
  - Character set name
  - Description

### Table Columns

The list table shows these columns:

- **Character Set Name**
- **Message Type**
- **Character Set Type**
- **Status**
- **Actions**

### Status Display

Each row shows status as:

- **Active**
- **Inactive**

### Row Actions

Each row provides:

- **Edit** button
- **Delete** button

---

## Creating a Character Set

Click **Create** to open the Character Set form page.

**Page label:** Create Character Set

### Basic Information

**Name**

- Required
- Text input
- Placeholder: `e.g., GSM Default`

**Description**

- Optional
- Multi-line text area
- Placeholder: `Describe this character set`

### Configuration

**Message Type**

- Required select field
- Options:
  - SMS
  - Flash SMS
  - Unicode
  - Binary
  - USSD

**Character Set Type**

- Required select field
- Options:
  - GSM7
  - UCS2
  - UTF8
  - ISO-8859-1

**Character Set Size**

- Number input
- Placeholder: `e.g., 160`

### Character Strings

**Standard Characters**

- Required
- Multi-line text area
- Uses monospace styling
- Placeholder contains an example character string

**Double Characters**

- Optional
- Multi-line text area
- Placeholder: `Characters that take 2 positions`

**Triple Characters**

- Optional
- Multi-line text area
- Placeholder: `Characters that take 3 positions`

**Quad Characters**

- Optional
- Multi-line text area
- Placeholder: `Characters that take 4 positions`

### Active Status

- Checkbox labeled **Active**
- Checked by default when creating a new character set

### Form Actions

- **Cancel** returns to the Character Sets list
- **Save** submits the form

---

## Editing a Character Set

Click the **Edit** button in the list to open the Character Set form page.

**Page label:** Edit Character Set

The edit page uses the same fields as the create page:

- Name
- Description
- Message Type
- Character Set Type
- Character Set Size
- Standard Characters
- Double Characters
- Triple Characters
- Quad Characters
- Active

---

## Deleting a Character Set

Click the **Delete** button in the Actions column.

A confirmation modal appears with:

- Title: **Delete Character Set**
- A message warning that deleting the item may affect languages using that character set

If deletion succeeds, the app shows a success message.

---

## Validation and Save Behavior

The form enforces these checks before saving:

- **Name** is required
- **Standard Characters** is required

If **Character Set Size** is empty or not a valid number, the form submits `160` as the default size.

If save fails, the page shows an error message.

---

## Empty State

If there are no character sets and no search term is entered, the page shows an empty state with a prompt to create the first character set.

If a search returns no results, the page shows a no-results message.

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
