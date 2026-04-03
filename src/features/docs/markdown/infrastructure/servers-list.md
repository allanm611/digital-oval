# Servers List

## Overview

Servers List is the main page for browsing and managing server records.

## Statistics Cards

At the top of the page, the app shows:

- **Total Servers**
- **Health Coverage**
- **Protocol Mix**
- **Region Coverage**

## Search, Dataset Scope, And Filters

The top controls include:

- Search by server name or code
- Dataset scope:
  - All servers
  - Health on
  - Failing
  - Due
- Filters drawer

Filters include:

- Environment
- Protocol
- Region
- Status (`active`, `inactive`, `deprecated`)
- Server Type

## Table Columns

The list table displays:

- Server
- Code
- Environment
- Endpoint
- Health
- Status
- Actions

Health cell behavior:

- `disabled` when health checks are off
- `null` when enabled but no status exists
- Backend status text when available

Status can show active/inactive and deprecated badge.

## Actions

Per row, the page provides:

- View details
- Edit
- Enable or disable health checks
- Deprecate or restore

## Selection Mode And Bulk Actions

Selection mode allows choosing multiple visible rows.

Bulk actions available:

- Activate selected
- Deactivate selected

## Empty State

If no rows match current filters, the page shows an empty-state message.

## Pagination

Servers List paginates results and supports page navigation and page-size controls.

## Related Topics

- [Servers](/documentation/infrastructure/servers)
- [Create Server](/documentation/infrastructure/create-server)
- [View Server Details](/documentation/infrastructure/view-server)
