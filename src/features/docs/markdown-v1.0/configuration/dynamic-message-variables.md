# Dynamic Message Variables

## Overview

Dynamic Message Variables is a configuration page used to manage which variable categories and fields are active for message variable usage in the system.

In the Configuration page, this item is labeled **Dynamic Modal Generator**.

![Dynamic Modal Generator List](/img/v1.0/configuration/dynamicmodalgeneratorlist.png)

The page lets you:

- View variable categories as cards
- Search categories
- Filter by category
- Activate or deactivate categories
- Open a category to view its fields
- Activate or deactivate individual fields

## Where These Variables Are Used

Dynamic variables configured here are reused in places that support **Insert Variable** functionality, including:

- Manual Communications
- Offer Creatives
- Rewards-related content areas

This page controls what appears in those variable pickers.

## Activation Rules (Visibility)

The active/deactivated state directly controls variable visibility in the insert-variable UI:

- If a **category is active**, its active child fields can be selected where variables are inserted.
- If a **category is deactivated**, that category does not appear and its child fields do not appear.
- If a **field is deactivated**, that field does not appear even if the parent category is active.
- For a field to appear, both the **parent category** and the **field itself** must be active.

## Accessing Dynamic Message Variables

**Navigation:** Configuration -> Dynamic Modal Generator

The page route opens the Dynamic Message Variables screen.

## Main Page Layout

The page includes:

### Header

- Back button with breadcrumb
- Current label: **Dynamic Modal Generator**

### Search

- A search input with the placeholder **Search categories...**
- Search checks:
  - Category name
  - Field name inside a category
  - Field code/value inside a category

### Category Filter

- A dropdown filter
- Default option: **All Categories**
- Other options are populated from the available categories loaded into the page

## Category Cards

Each category is shown as a card.

Each card includes:

- Category name
- Category activation toggle button
- Field count
- **View Fields** button

### Category Activation

Each category card has a toggle action:

- If the category is active, the card shows the deactivate control
- If the category is inactive, the card shows the activate control

When a category is inactive:

- The card appears dimmed

When a category is deactivated:

- The page also deactivates all fields in that category

This behavior is helpful when a full group of placeholders should be hidden quickly without deleting field definitions.

## Fields Modal

Click **View Fields** on a category card to open a modal.

![Dynamic Modal Generator Fields Example](/img/v1.0/configuration/dynamicmodalgeneratormodalexample .png)

The modal title is:

- **[Category Name] - Fields**

### Modal Table Columns

The fields table shows:

- **Field Code**
- **Field Name**
- **Description**
- **Default Value**
- **Status**
- **Actions**

### Field Status

Each field row shows one of these statuses:

- **Active**
- **Inactive**

### Field Actions

Each field row includes:

- **Activate** button
- **Deactivate** button

Button behavior:

- **Activate** is disabled if the field is already active
- **Deactivate** is disabled if the field is already inactive
- Field action buttons are disabled when the category itself is inactive

### Modal Close Actions

The modal can be closed using:

- The **X** button in the header
- The **Close** button in the footer

## Empty State

If no categories match the search or filter, the page shows an empty state.

Messages shown are:

- **No categories found** when a search term is present
- **No categories available** when there are no categories to display

## Notes on Page Behavior

- The page loads category and field data from the available message-variable field configuration source used by the system
- Search input is debounced before filtering results
- Category and field activation changes are saved by the page after each toggle action
