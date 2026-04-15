# Create a Combo Type

Create a new combo type to define a reusable bundle template combining data, voice, and SMS services.

## Opening the Create Form

From the [Combo Type List](/documentation/configuration/combo-types-list), click the **Create** button in the top right.

A modal opens with the title: **Create New Combo Type**

![Create Combo Type Form - Part 1](/img/v1.1/configuration/createcombotypeimage1.png)

## Basic Information

### Combo Type Name

**Required**

- Text input field
- Used to identify and reference this combo type
- Examples: "Premium Bundle", "Standard Data+Voice", "All-in-One Combo"

### Description

**Optional**

- Multi-line text area
- Explain the purpose and composition of the combo type
- Examples: "Includes 10GB data, 500 minutes, 100 SMS", "Budget-friendly basic bundle"

## Resources Section

Define which services are included in this combo type.

![Create Combo Type Form - Part 2](/img/v1.1/configuration/createcombotypeimage2.png)

### Adding Resources

Click one of the resource buttons to add that resource:

- **+ Data** - Add a data bundle
- **+ Voice** - Add voice minutes
- **+ SMS** - Add SMS messages

**Important:** Only one block per resource type can be added in the same combo type.

### Resource Configuration

Each resource block shows:

- **Resource Type Label** - Displays the service type (Data, Voice, or SMS)
- **Unit** - Shows the measurement unit:
  - Data: `MB`
  - Voice: `minutes`
  - SMS: `count`
- **Value Input** - Enter the numeric quantity
- **Delete Button** - Remove this resource from the combo

### Examples

**Data Resource:**
- Value: 5000 MB (5GB)

**Voice Resource:**
- Value: 500 minutes

**SMS Resource:**
- Value: 100 messages

## Shared Validity

Control how validity periods are applied to resources.

### Shared Validity Checkbox

When **enabled** (checked):
- All resources share a single **Validity Hours** field
- The same validity period applies to data, voice, and SMS

When **disabled** (unchecked):
- Each resource row shows its own **Hours** input
- Each resource can have a different validity period

### Validity Hours

Enter the number of hours the resource bundle is valid for:
- Examples: 24, 168 (1 week), 730 (1 month)

## Combo Price

**Combo Price**

Enter the bundle price as a numeric value. This is the total price for the entire combo, not per resource.

Examples: 9.99, 15, 24.50

## Modal Actions

**Cancel**
- Closes the modal without saving
- Any entered data is lost

**Save**
- Submits the combo type
- Form validates required fields before saving
- Shows success message on successful creation
- Returns to the list view

## Validation

The form validates:
- **Combo Type Name** is required
- At least one resource must be added
- Resource values must be numeric and positive
- Validity Hours must be numeric and positive

If validation fails, an error message appears. Correct the issues and try again.

## Save Behavior

On successful save:
1. Combo type is created and assigned an ID
2. Status defaults to Active
3. You are returned to the Combo Type List
4. The new combo type appears in the list

## Tips

- Create combo types that represent common bundle offerings in your business
- Use consistent naming conventions to make bundles easy to find
- Document the purpose in the description field
- Plan shared vs. individual validity before creating to match your business model
- Consider the pricing carefully as it will be used across products using this combo type
