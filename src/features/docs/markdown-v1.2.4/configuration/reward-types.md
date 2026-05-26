# Reward Types Overview

Reward Types are categories used to classify and organize the different kinds of rewards you can offer to customers. Reward types help standardize how rewards are defined and managed in the system.

![Reward Types List](/img/v1.1/configuration/rewardtypeslist.png)

## What are Reward Types?

Reward Types allow you to:

- **Categorize Rewards** - Organize rewards by type (Points, Discounts, Vouchers, Freebies, etc.)
- **Standardize Structure** - Create consistent reward definitions across your offers
<!-- - **Track by Category** - Monitor and report on rewards organized by type -->
- **Organize Management** - Group similar rewards together

## About Reward Types

Reward Types can be created, edited, and managed directly in the UI. Each reward type includes:

- **Name** (required)
- **Description** (optional)
- **Reward Key** (required, unique)
- **Active Status** (checkbox)

You can search and filter reward types by name, description, or status.

## Managing Reward Types

Navigate to **Configuration → Reward Types** to view and manage all reward types.

### Viewing Reward Types List

The reward types list displays all configured types with:

- **Reward Type Name** - Name of the reward type
- **Description** - Details about what rewards of this type include
- **Status** - Active or Inactive

You can:

- **Search** - Find reward types by name or description

This page is mainly a maintenance screen: keep reward type names clear, keep descriptions useful for operations teams, and make sure active/inactive state matches what should be available during offer setup.

### Edit Reward Type

<!-- Click **Edit** or **Create** to open the reward type modal: -->
Click **Edit** to open the reward type modal:


![Edit Reward Type Modal](/img/v1.1/configuration/editrewardtype.png)

- **Name** (required)
- **Description** (optional)
- **Reward Key** (required, unique)
- **Active** (checkbox)

**Activation/Deactivation:**

- Use the **Active** checkbox to control whether a reward type is available for use. Deactivating a reward type will hide it from the offer creation dropdown, but it will remain in the list for record-keeping and reporting.
- Only **active** reward types appear in the reward type dropdown when creating or editing an offer. Inactive types are not selectable.

Click **Save** to apply changes. The list will update automatically.

## Using Reward Types in Offers

When creating or editing an offer, you assign a reward type to define what kind of reward customers receive:

**Common Reward Type Examples:**

- **Points** - Loyalty points customers can accumulate and redeem
- **Discount** - Percentage or fixed amount discount on purchases
- **Voucher** - Promotional code or voucher for redemption
- **Freebie** - Free product, service, or shipping
- **Cashback** - Return of a portion of purchase amount to customer
- **Credits** - Store credits or account balance

The reward type you select determines how the reward is configured and applied when an offer is sent to customers.
