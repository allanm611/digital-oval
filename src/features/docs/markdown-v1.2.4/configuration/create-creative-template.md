# Create a Creative Template

Create a new reusable creative template for your campaigns and offers.

## Opening the Create Form

From the [Creative Template List](/documentation/configuration/creative-templates-list), click the **Create** button in the top right.

A form opens with the title: **Create New Creative Template**

![Create Creative Template - Name and Description](/img/v1.1/configuration/createcreativetemplatename-decsriptionimage.png)

## Basic Information

### Template Name

**Required**

- Text input field
- Identify the template with a clear, descriptive name
- Examples: "Welcome SMS", "Order Confirmation Email", "Promotional Push Notification"

### Description

**Optional**

- Multi-line text area
- Explain what the template is for and when to use it
- Examples: "Sent to new customers on sign-up", "Order confirmation with tracking info", "Weekend promotion notification"

### Template Code

**Required**

- Text input field
- Unique identifier for the template (in code/system)
- Must be unique across all templates
- Typically in lowercase with underscores or hyphens
- Examples: "welcome_sms", "order_confirmation_email", "promo_push"

## Template Configuration

![Create Creative Template - Template Configuration](/img/v1.1/configuration/createcreativetemplate-templateconfigsection.png)

### Channel

**Required**

- Select the communication channel this template is for:
  - SMS
  - Email
  - Push Notification
  - Messaging Apps (WhatsApp, etc.)

### Locale

**Required**

- Select the language and regional variant
- Examples: English (US), French (Canada), Spanish (Mexico)
- This allows you to create multiple language variants of the same template

## Template Content

![Create Creative Template - Template Content](/img/v1.1/configuration/createcreativetemplate-templatecontentsection.png)

Content fields vary by channel:

**For SMS Templates:**
- Message body text
- Character count display
- Variable placeholders for personalization

**For Email Templates:**
- Subject line
- Email body (text and/or HTML)
- Recipient email address
- Variable placeholders

**For Push Templates:**
- Title
- Message body
- Deep link or action URL
- Variable placeholders

### Dynamic Variables

Most templates support personalization with dynamic variables:

- `{first_name}` - Customer's first name
- `{customer_id}` - Unique customer identifier
- `{offer_name}` - Name of the offer being promoted
- `{expiration_date}` - When the offer expires

Consult your content team's variable list for available options.

## Modal Actions

**Cancel**
- Closes the form without saving
- Any entered data is lost

**Save**
- Submits the creative template
- Form validates required fields before saving
- Shows success message on successful creation
- Returns to the template list

## Validation

The form validates:
- **Template Name** is required
- **Template Code** is required (must be unique)
- **Channel** is required
- **Content** fields as required by the selected channel
- **Variables** (if provided) must be valid JSON format

If validation fails, an error message appears. Correct the issues and try again.

## Save Behavior

On successful save:
1. Template is created and assigned an ID
2. Status defaults to Active
3. You are returned to the Creative Template List
4. The new template appears in the list

## Tips

- Create templates that your team can reuse across multiple campaigns
- Use consistent variable names and formatting
- Document any special requirements in the description
- Create locale variants for multi-language campaigns
- Keep templates generic enough to be reusable but specific enough to be useful
- Review character counts for SMS templates to ensure they fit in standard message limits
