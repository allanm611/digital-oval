# Creative Templates Overview

Creative Templates are reusable message templates that define the content structure for offers across multiple communication channels (SMS, Email, Push, InApp, Web, IVR, USSD, WhatsApp). They support multiple languages and dynamic variable placeholders for personalization.

## What are Creative Templates?

Creative Templates allow you to:
- **Define Reusable Content** - Create templates that can be used across multiple offers
- **Multi-Channel Support** - Create different versions of templates for different channels
- **Personalization** - Use dynamic variables (like {{customer_name}}) for personalized messages
- **Consistency** - Maintain consistent branding and messaging across campaigns

## Supported Channels

Creative Templates support the following communication channels:

- **SMS** - Text message delivery (160 characters standard)
- **Email** - Email messages with subject line and HTML/plain text
- **Push** - Mobile push notifications
- **InApp** - In-app messages within mobile or web applications
- **Web** - Web-based messages and notifications
- **IVR** - Interactive Voice Response systems
- **USSD** - Unstructured Supplementary Service Data
- **WhatsApp** - WhatsApp business messaging

## Supported Languages

Creative Templates support multiple languages and locales for global audiences. Examples include:
- English (en), English - United States (en-US), English - United Kingdom (en-GB)
- French (fr), French - Canada (fr-CA), French - France (fr-FR)
- Spanish (es), Spanish - Spain (es-ES), Spanish - Mexico (es-MX)
- Swahili (sw), Swahili - Uganda (sw-UG), Swahili - Kenya (sw-KE)

## Managing Creative Templates

Navigate to **Configuration → Creative Templates** to manage all creative templates.

### Viewing Creative Templates List

The creative templates list displays all configured templates with:
- **Template Name** - Name of the template
- **Description** - Details about the template's purpose
- **Status** - Active or Inactive

You can:
- **Search** - Find templates by name or description

### Create Creative Template

Click the **Create** button to add a new creative template.

**Required Fields:**
- **Template Name** - The name of the template (max 120 characters)

**Optional Fields:**
- **Description** - Explain the template's purpose and usage (max 600 characters)

Click **Save** to create the template.

Once created, you can use this template as a base for creating creatives in your offers.

### Edit Creative Template

Click **Edit** on any template to update:
- Template Name
- Description
- Status

Click **Save** to apply changes.

### Delete Creative Template

Click **Delete** to remove a template. Existing creatives created from this template will not be deleted, only the template definition is removed.

## Using Templates in Offers

When creating an offer, you can:
1. Create creatives for different channels (SMS, Email, Push, etc.)
2. For each channel, provide content in one or more languages
3. Use dynamic variables like {{customer_name}} for personalization
4. Reference creative templates you've created here for consistency

Creative templates help you reuse common messaging structures and maintain consistency across multiple offers.

## Template Variables

You can use dynamic variables in templates with the following syntax:
- `{{variable_name}}` - Will be replaced with actual value when sent to customers
- Example: `Hello {{customer_name}}, your offer of {{discount_percent}}% off expires soon!`

Variables are populated when creatives are used in actual campaign communications.
