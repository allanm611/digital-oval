# Sender IDs

## Overview

Sender IDs define the name or label shown to subscribers as the SMS sender. This page is where teams manage approved sender identities for branding, routing, and compliance.

![Sender IDs List](/img/v1.1/configuration/senderidlist.png)

## Accessing Sender IDs

**Navigation:** Configuration -> Sender IDs

From the main Configuration page, Sender IDs appears under **Offer Configuration**.

## Sender IDs List Page

The list view shows each sender ID with description, status, gateway mapping, and row actions. Search helps quickly locate a specific sender ID when the catalog grows.

## Creating a Sender ID

Click **Create** to open the sender ID modal.

**Modal title:** Create New Sender ID

![Create Sender ID](/img/v1.1/configuration/createsenderid.png)

![Sender ID Example](/img/v1.1/configuration/senderid.png)

### Fields

**Sender ID Name (`name`)**

- Required
- Text input

**Description (`description`)**

- Optional
- Multi-line text area

**Gateway (`gateway_key`)**

- Required
- Select field (enum)
- Placeholder: `Select gateway`
- Maps to backend values:
  - Internal (`INTERNAL`)
  - Mocana (`MOCANA`)
  - SMS Gateway Hub (`SMSGW_HUB`)
  - External Provider A (`EXTERNAL_PROVIDER_A`)
  - External Provider B (`EXTERNAL_PROVIDER_B`)

**Active Status (`is_active`)**

- Optional (defaults to active)
- Checkbox: checked = active, unchecked = inactive

All required fields must be filled to enable save.

### Modal Actions

- **Cancel** closes the modal without saving
- **Save** submits the sender ID

## Editing a Sender ID

Click the **Edit** button in the list to open the edit modal.

**Modal title:** Edit Sender ID

The edit modal uses the same visible fields as the create modal:

- Sender ID Name
- Description
- Gateway

## Deleting a Sender ID

Click the **Delete** button in the Actions column.

A confirmation modal appears with:

- Title: **Delete Sender ID**
- A message warning that deleting the item may affect existing SMS creatives

If deletion succeeds, the system shows a success message and removes the record from the visible list.

## Validation and Save Behavior

The modal validates these fields:

- **Sender ID Name** is required
- **Gateway** is required

If saving fails, the page shows an error message.

## Empty State

If there are no sender IDs and no search term is entered, the page shows an empty state with a prompt to create the first sender ID.

If a search returns no results, the page shows a no-results message.
