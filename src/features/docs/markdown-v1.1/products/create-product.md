# Create Product

## Overview

The Create Product form guides you through setting up a new product that can be used in the system. The same form is used for both creating new products and editing existing ones when editing, all fields are pre-filled with current values based on your edit permissions.

![Create Product Form](/img/v1.1/product-images/createproductimage1.png)

## Product Type Selection

**Product Type\*** - Select the type of product:

- **Standard** - Single product with basic properties
- **Combo** - Bundle product combining multiple resources/components

When you select **Combo** type, additional sections appear to manage the bundled resources that make up the combo.

## Form Fields

### Required Fields (marked with \*)

**Product Code\***

- Unique identifier for the product in the system

**Name\***

- The name of the product

**Price\***

- The cost or price of the product

**DA ID\***

- Digital Assistant ID for the product

### Optional Fields

**Description**

- Detailed description of what the product provides

**Category\***

- Select which product category to organize this product under

**Currency**

- Select the currency for pricing (default: KES)

**Scope**

- Define the scope of the product

**Unit**

- Unit of measurement for the product

**Unit Value**

- Quantity for the unit

**Validity Hours**

- How long the product is valid for (in hours)

**Product Type\***

- Choose between Standard or Combo
- Determines which additional sections appear in the form

---

## Combo Product Type

When you select **Combo** as the product type, additional sections become available to manage the bundled resources.

### Product Type Dropdown

![Product Type Selection](/img/v1.1/product-images/createproduct-productypedropdown.png)

### Combo-Specific Fields

#### Shared Checkboxes (When Combo Type Selected)

![Combo Type - Unchecked Resources](/img/v1.1/product-images/createproduct-combotypeuncheckedresources.png)

**Shared Resource Management:**

- Toggle checkboxes to mark resources as shared across all bundle components
- Shared resources apply uniformly to all items in the combo

![Combo Type - Shared Checkboxes](/img/v1.1/product-images/createproduct-combotypewith%20sharedcheckoxes.png)

#### Add Combo Resources

![Combo Type Selected](/img/v1.1/product-images/createproduct-combotypeselected.png)

When Combo type is selected:

- **Add Resource** button appears to add products/components to the bundle
- Manage which products are included in the combo
- Define resource-specific properties for each component
- Resources can be marked as shared or component-specific

### Product Category Selection

![Product Category Dropdown](/img/v1.1/product-images/createproductimage2-productcategorydrodpodown.png)

## Creating a Product

1. Fill in all required fields marked with \*
2. Select product type (Standard or Combo)
3. For Combo products:
   - Add resources/components to the bundle
   - Configure shared vs. component-specific properties
   - Set shared checkboxes as needed
4. Add optional information as needed
5. Click **Create Product** to save

---

## Editing a Product

The product creation form is also used for editing existing products. When you edit a product:

![Edit Product Form](/img/v1.1/product-images/editproduct.png)

- All fields are pre-filled with the product's current values
- You can modify any field based on your edit permissions
- The same wizard steps and validations apply
- Click **Save** to apply your changes

## Next Steps

After creating or editing a product, you can:

- View the product details on the [Product List](/documentation/products/products-list)
- View detailed information on the [Product Details](/documentation/products/view-product-details) page
- Add the product to a catalog using [Product Catalog](/documentation/products/product-catalog)
