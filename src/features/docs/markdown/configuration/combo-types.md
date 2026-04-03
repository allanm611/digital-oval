# Combo Types

## Overview

Combo Types is a configuration page used to define and manage different types of product combinations.

The page lets you:

- View combo types in a table
- Search combo types by name or description
- Create a combo type in a modal
- Edit a combo type in a modal
- Delete a combo type

---

## Accessing Combo Types

**Navigation:** Dashboard -> Configuration -> Combo Types

From the main Configuration page, Combo Types appears under **Product Configuration**.

---

## Combo Types List Page

The Combo Types page includes:

### Header

- Page title: **Combo Types**
- Page description: **Define and manage different types of product combinations**
- **Create** button

### Search

- A search input with the placeholder **Search combo types by name or description...**
- Search filters the list by:
  - Combo type name
  - Description

### Table Columns

The list table shows these columns:

- **Combo Type Name**
- **Description**
- **Status**
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

## Creating a Combo Type

Click **Create** to open the combo type modal.

**Modal title:** Create New Combo Type

### Basic Fields

**Combo Type Name**

- Required
- Text input

**Description**

- Optional
- Multi-line text area

### Resources Section

The modal includes a **Resources** section where you can add resource blocks.

Available resource buttons:

- **+ Data**
- **+ Voice**
- **+ SMS**

Only one resource block per type can be added at a time.

Each resource block shows:

- Resource type label
- Resource unit
- Numeric value input
- Delete resource button

Resource units shown in the form are:

- Data: `data_mb`
- Voice: `onnet_minutes`
- SMS: `sms_count`

### Shared Validity

The modal includes a **Shared Validity** checkbox.

When shared validity is enabled:

- A single **Validity Hours** field is shown
- The shared validity hours apply across the combo resources

When shared validity is disabled:

- Each resource row shows its own **Hours** input

### Price

The modal includes a **Combo Price** number input.

### Modal Actions

- **Cancel** closes the modal without saving
- **Save** submits the combo type

---

## Editing a Combo Type

Click the **Edit** button in the list to open the edit modal.

**Modal title:** Edit Combo Type

The edit modal uses the same sections as create:

- Combo Type Name
- Description
- Resources
- Shared Validity
- Validity Hours or per-resource Hours
- Combo Price

---

## Deleting a Combo Type

Click the **Delete** button in the Actions column.

A confirmation modal appears with:

- Title: **Delete Combo Type**
- A confirmation message that the action cannot be undone

If deletion succeeds, the app shows a success message.

---

## Validation and Save Behavior

The modal validates these fields:

- **Combo Type Name** is required
- Name length is limited by the form configuration
- Description length is limited by the form configuration

If saving fails, the page shows an error message.

---

## Empty State

If there are no combo types and no search term is entered, the page shows an empty state with a prompt to create the first combo type.

If a search returns no results, the page shows a no-results message.
