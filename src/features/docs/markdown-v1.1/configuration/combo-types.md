# Combo Types

## Overview

Combo Types is used to define reusable bundle templates that combine data, voice, and SMS into one offer unit. The page is designed for product and commercial teams that need to shape bundle structures before those bundles are used in products and offers.

![Combo Types List](/img/v1.1/configuration/combotypeslist.png)

## Accessing Combo Types

**Navigation:** Configuration -> Combo Types

From the main Configuration page, Combo Types appears under **Product Configuration**.

## Combo Types List Page

The list view gives you a quick operating snapshot of each combo type, including name, description, status, and actions. Search is available for fast narrowing by name or description, and row actions let you edit or delete without leaving the page.

## Creating a Combo Type

Click **Create** to open the combo type modal.

**Modal title:** Create New Combo Type

![Create Combo Type Form - Part 1](/img/v1.1/configuration/createcombotypeimage1.png)

![Create Combo Type Form - Part 2](/img/v1.1/configuration/createcombotypeimage2.png)

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

Only one block per resource type can be added in the same combo type.

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

The modal includes a **Combo Price** numeric input used as the final bundle price.

### Modal Actions

- **Cancel** closes the modal without saving
- **Save** submits the combo type

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

## Deleting a Combo Type

Click the **Delete** button in the Actions column.

A confirmation modal appears with:

- Title: **Delete Combo Type**
- A confirmation message that the action cannot be undone

If deletion succeeds, the system shows a success message and refreshes the list.

## Validation and Save Behavior

The modal validates these fields:

- **Combo Type Name** is required
- Name length is limited by the form configuration
- Description length is limited by the form configuration

If saving fails, the page shows an error message.

## Empty State

If there are no combo types and no search term is entered, the page shows an empty state with a prompt to create the first combo type.

If a search returns no results, the page shows a no-results message.
