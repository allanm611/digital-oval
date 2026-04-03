# Sender IDs

## Overview

Sender IDs define the name or label shown to subscribers as the SMS sender. This page is where teams manage approved sender identities for branding, routing, and compliance.

![Sender IDs List](/img/configuration/senderidlist.png)

## Accessing Sender IDs

**Navigation:** Configuration -> Sender IDs

From the main Configuration page, Sender IDs appears under **Offer Configuration**.

## Sender IDs List Page

The list view shows each sender ID with description, status, gateway mapping, and row actions. Search helps quickly locate a specific sender ID when the catalog grows.

## Creating a Sender ID

Click **Create** to open the sender ID modal.

**Modal title:** Create New Sender ID

![Create Sender ID](/img/configuration/createsenderid.png)

![Sender ID Example](/img/configuration/senderid.png)

### Fields

**Sender ID Name**

- Required
- Text input

**Description**

- Optional
- Multi-line text area

**Gateway**

- Required
- Select field
- Placeholder: `Select gateway`

Available gateway options in the system are:

- Internal
- Mocana
- SMS Gateway Hub
- External Provider A
- External Provider B

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

If deletion succeeds, the app shows a success message and removes the record from the visible list.

## Validation and Save Behavior

The modal validates these fields:

- **Sender ID Name** is required
- **Gateway** is required

If saving fails, the page shows an error message.

## Empty State

If there are no sender IDs and no search term is entered, the page shows an empty state with a prompt to create the first sender ID.

If a search returns no results, the page shows a no-results message.
