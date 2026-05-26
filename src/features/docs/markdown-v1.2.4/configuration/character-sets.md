# Character Sets

Character Sets defines the encoding profiles used when composing message content. This page helps teams control how text is interpreted across channels, especially where character limits and encoding compatibility matter.

![Character Sets List](/img/v1.1/configuration/charactersetslistimage.png)

## Open The Page

Go to `Configuration -> Character Sets`.

## What You Can Do

- view existing character set records
- search by name or description
- create a new character set
- edit an existing character set
- delete a character set

## Character Sets List

The list shows each character set with message type, character set type, status, and actions.

This makes it easier to verify what is active before mapping languages and creative content.

## Create A Character Set

Click **Create** to open the form.

![Create Character Set](/img/v1.1/configuration/createcharactersetimage.png)

<!-- ![Create Character Set - Name and Description](/img/v1.1/configuration/createcharactersetname-decsriptionimage.png) -->

![Create Character Set - Configuration](/img/v1.1/configuration/createcharactersetconfigurationtillbottomimage.png)

Main inputs include:

- **Name** (required)
- **Description** (optional)
- **Message Type** (required)
- **Character Set Type** (required)
- **Character Set Size**
- **Standard Characters** (required)
- optional character groups for double/triple/quad-size handling
- **Active** toggle

Save to create the record.

## Edit A Character Set

Use **Edit** from the row action to update the same form fields.

## Delete A Character Set

Use **Delete** from the actions column and confirm in the modal.

If deletion succeeds, the record is removed from the list.

## Validation Behavior

The form validates required inputs before save, especially Name and Standard Characters.

If Character Set Size is not provided, the form defaults to `160` during submit.

## Why This Page Matters

Character set configuration has direct impact on message rendering and payload sizing. Keeping these records accurate helps avoid delivery issues caused by unexpected encoding behavior.
