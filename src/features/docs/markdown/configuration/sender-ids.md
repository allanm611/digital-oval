# Sender IDs

## Overview

Sender IDs is a configuration page used to manage SMS sender ID records in the app.

The page lets you:

- View sender IDs in a table
- Search sender IDs by name or description
- Create a sender ID
- Edit a sender ID
- Delete a sender ID

---

## Accessing Sender IDs

**Navigation:** Dashboard -> Configuration -> Sender IDs

From the main Configuration page, Sender IDs appears under **Offer Configuration**.

---

## Sender IDs List Page

The Sender IDs page includes:

### Header

- Page title: **Sender IDs**
- Page description explaining that the page manages SMS sender IDs for branding and compliance
- **Create** button

### Search

- A search input with the placeholder **Search sender IDs...**
- Search filters the list by:
  - Sender ID name
  - Description

### Table Columns

The list table shows these columns:

- **Sender ID**
- **Description**
- **Status**
- **Gateway**
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

## Creating a Sender ID

Click **Create** to open the sender ID modal.

**Modal title:** Create New Sender ID

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

Available gateway options in the app are:

- Internal
- Mocana
- SMS Gateway Hub
- External Provider A
- External Provider B

### Modal Actions

- **Cancel** closes the modal without saving
- **Save** submits the sender ID

---

## Editing a Sender ID

Click the **Edit** button in the list to open the edit modal.

**Modal title:** Edit Sender ID

The edit modal uses the same visible fields as the create modal:

- Sender ID Name
- Description
- Gateway

---

## Deleting a Sender ID

Click the **Delete** button in the Actions column.

A confirmation modal appears with:

- Title: **Delete Sender ID**
- A message warning that deleting the item may affect existing SMS creatives

If deletion succeeds, the app shows a success message.

---

## Validation and Save Behavior

The modal validates these fields:

- **Sender ID Name** is required
- **Gateway** is required

If saving fails, the page shows an error message.

---

## Empty State

If there are no sender IDs and no search term is entered, the page shows an empty state with a prompt to create the first sender ID.

If a search returns no results, the page shows a no-results message.
