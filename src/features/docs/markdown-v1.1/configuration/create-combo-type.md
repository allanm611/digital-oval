# Create a Combo Type

Create a new combo type to define a reusable bundle template.

## Opening the Create Form

From the [Combo Type List](/documentation/configuration/combo-types-list), click the **Create** button.

A form opens with the title: **Create Combo Type**

![Create Combo Type](/img/v1.1/configuration/createcombotype.png)

## Basic Information

**Name** (required)
- Text input to identify this combo type

**Description**
- Optional multi-line text area

**Active**
- Checkbox to set the combo type as active or inactive

## Combo Resources

Add the resources that make up this combo type.

### Shared Validity Checkbox

When **enabled**:
- All resources share a single **Validity (Hours)** field
- Enter the hours once and it applies to all resources

When **disabled**:
- Each resource shows its own **Validity Hours** field
- Each resource can have different validity

### Shared Price Checkbox

When **enabled**:
- The combo has a single **Combo Price** field
- Enter the price once for the entire bundle

When **disabled**:
- Each resource can have its own **Price** field

### Add Resource Accordion

Click **Add Resource** to expand the section.

**Fields to fill:**

1. **Resource Type** (required)
   - Select from: Data, Voice, SMS, or Utility

2. **Unit** (required)
   - Automatically updates based on the selected resource type
   - Data: MB, Voice: minutes, SMS: count, Utility: units

3. **Utility** (required if Resource Type is "Utility")
   - When you select **Utility** as the resource type, a **Utility** dropdown appears
   - Select which utility to include in the combo
   - Option to create a new utility if needed

4. **Value** (required)
   - Enter the quantity or amount for this resource

5. **Price** (if shared price is disabled)
   - Enter the price for this resource

6. **Validity Hours** (if shared validity is disabled)
   - Enter how many hours this resource is valid

Click **Save Resource** to add the resource to the combo.

### Added Resources

Each resource appears as a card below the Add Resource section. You can:
- **Edit** a resource by clicking the edit icon
- **Delete** a resource by clicking the delete icon

## Save the Combo Type

Click **Save** to create the combo type and return to the list.

Click **Cancel** to discard changes and return to the list.

## Status and Visibility

When you create a new combo type, it is set to **Active** by default. Only active combo types appear in dropdowns when you are creating or editing products. If you deactivate a combo type later, it will no longer be available for selection in product forms.
