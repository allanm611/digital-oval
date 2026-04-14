# VIP List Management Overview

VIP List Management allows you to organize and manage your most valuable customers by creating VIP lists and adding customers to them. You can then reference these VIP lists in communication policies to provide special treatment or exclusions for your high-value customers.

![VIP Customers Tab](/img/v1.1/configuration/viplistmanagementvipcustomerstab.png)

![VIP Lists Tab](/img/v1.1/configuration/viplistmanagentvipliststab.png)

## What are VIP Lists?

VIP Lists allow you to:

- **Create VIP Tiers** - Define named lists for different VIP customer segments
- **Add Customers** - Assign customers to specific VIP lists
- **Track VIP Status** - Monitor which customers are in which VIP lists
- **Use in Policies** - Reference VIP lists in communication policies for special handling

## Managing VIP Lists

Navigate to **Configuration → VIP List Management** to manage VIP lists and customers.

The VIP List Management page has two tabs:

### VIP Customers Tab

View and manage individual customers assigned to VIP lists.

**Display:**

- **Customer Name** - Name of the VIP customer
- **VIP List** - Which VIP tier they belong to
- **Status** - Active (currently in VIP list) or Inactive (removed)
- **Added Date** - When they were added to the VIP list
- **Added By** - User who added them

**Actions:**

- **Search** - Find customers by name, email, or phone number
- **Filter by VIP List** - Filter customers by which VIP tier they're in
- **Filter by Status** - Show active, inactive, or all VIP customers

### VIP Lists Tab

View and manage VIP list definitions.

**Display:**

- **List Name** - Name of the VIP tier (e.g., "Premium VIP", "Gold VIP")
- **Description** - Optional description of this VIP tier
- **Customer Count** - Number of customers in this VIP list
- **Status** - Active or Inactive
- **Created Date** - When the VIP list was created

## Adding Customer to VIP List

From the **VIP Customers** tab, click the **Add Customer** button.

![Add VIP Customer Modal - Part 1](/img/v1.1/configuration/addvipcustomermodalimage1.png)

![Add VIP Customer Modal - Part 2](/img/v1.1/configuration/addvipcustomermodalimage2.png)

**Required Fields:**

- **Customer Name** - Full name or identifier for the customer
- **Email** - Customer email address
- **Phone Number** - Customer phone number
- **VIP List** - Select which VIP tier to add them to

Click **Add Customer** to add them. The system automatically:

- Sets status to Active
- Records the current date and time
- Records the user who added them

## Removing Customer from VIP List

Click **Remove** on any VIP customer to remove them from their VIP list.

The system will:

- Change status from Active to Inactive
- Record the removal date and time
- Record the user who removed them
- Keep the historical record for tracking purposes

## VIP Customer Status

**Active Status** - Customer is currently in the VIP list. Include them in VIP policies and special handling.

**Inactive Status** - Customer has been removed from the VIP list. They will no longer be treated as VIP. Historical records are kept for audit purposes.

## Using VIP Lists in Communication Policies

When creating a communication policy, you can configure a VIP List policy type to:

- **Include VIP customers** - Give VIP customers priority treatment or special messaging
- **Exclude VIP customers** - Protect VIP customers from receiving certain messages

Reference the VIP lists you create here when setting up VIP List policies.
