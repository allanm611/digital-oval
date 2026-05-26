# Create Offer

## Overview

The Create Offer workflow guides you through a 6-step process to set up a new promotional offer that can be used in campaigns.

**Note:** The same 6-step wizard is used for editing existing offers. When editing an offer, all fields are pre-filled with the current values, and you can modify any step based on your permissions. The workflow remains identical whether you're creating a new offer or editing an existing one.

## Step 1: Basic Info

Configure the essential details of your offer.

![Step 1 - Basic Info](/img/v1.2.4/offercreationcommunicationchannelselection.png)

![Step 1 - Route Selection](/img/v1.2.4/offercreationcommunicationchannelrouteselection.png)

### Fields

**Offer Name*** (required)
- Descriptive name for the offer
- Example: "Summer Data Bundle"

**Offer Code*** (required)
- Unique identifier for the offer in your business operations
- Example: "SUMMER_DATA_2024"

**Description** (optional)
- Detailed description of what the offer provides to customers
- Displayed to help internal teams understand the offer

**Offer Type*** (required)
- Category of offer to classify it
- Options: Data, Voice, SMS, Combo, Voucher, Loyalty, Discount, Bundle, Bonus, Other

**Catalog*** (required)
- Select which [offer catalog](/documentation/offers/offer-catalog) to organize this offer under
- Use catalogs to group related offers

**Max Usage Per Customer** (optional)
- Maximum number of times a single customer can use this offer
- Default: 0 (unlimited)

**Communication Channel*** (required)
- Select which communication channel this offer will be delivered through
- Options: SMS, Email, WhatsApp, USSD, Push Notification
- This selection determines which route options are available below
- This is the primary channel for the offer; creatives for other channels can be added in Step 3

**Route Selection** (required, conditional)
- After selecting a communication channel, choose the appropriate route for that channel:
  - **SMS Route** - Select which SMS gateway route to use (e.g., "Twilio Primary SMS"). If SMS channel is selected, you can also choose a **Sender ID** from available sender IDs configured in the system
  - **Email Route** - Select which email gateway route to use (e.g., "SendGrid Production")
  - **WhatsApp Route** - Select which WhatsApp gateway route to use (e.g., "Twilio WhatsApp Business")
  - **USSD Route** - Select which USSD gateway route to use (e.g., "Infobip USSD")
  - **Push Notification Route** - Select which push notification gateway route to use (e.g., "Firebase Production")

**Example Workflow:**
1. Select "SMS" as Communication Channel
2. SMS Route dropdown appears → Select "Twilio Primary SMS"
3. Sender ID dropdown appears → Select a sender ID (e.g., "CompanyName")
4. Continue to Step 2


## Step 2: Products

Select products to include in this offer.

![Step 2 - Products](/img/v1.1/offer-images/step2createoffer.png)

![Step 2 - Extended](/img/v1.1/offer-images/step2createoffer(2).png)

Select one or more products that this offer applies to. These products will be available when the offer is used in campaigns.


## Step 3: Creative

Add marketing content and messaging for the offer in different languages and channels.

![Step 3 - Creative](/img/v1.1/offer-images/step3createoffer.png)

![Step 3 - Extended](/img/v1.1/offer-images/step3createoffer(2).png)

![Step 3 - Preview Creative](/img/v1.1/offer-images/step3createofferpreviewcreative.png)

Define how the offer will be presented to customers across different channels and languages. **Each creative is attached to exactly one language/locale.**

### Adding a Creative

To add a creative for your offer:

1. Click **+ Add Creative** button
2. Select a **Channel** - Choose from: SMS, Email, WhatsApp, USSD, or Push Notification
3. Select a **Language** - Choose the language/locale for this creative from available languages
4. Fill in the content based on the channel type (see section below for channel-specific fields)
5. Preview the creative in the preview panel on the right
6. Save the creative

### One Creative Per Language Rule

**Important:** You can only have one creative per channel per language combination. For example:
- You can have an English SMS creative AND a Swahili SMS creative (different languages, same channel)
- You cannot have two English SMS creatives (same language and channel)
- You can have an English SMS creative AND an English Email creative (same language, different channels)

This ensures each customer receives the correct messaging in their preferred language.

### Language Management

**Available Languages:**
- Languages are loaded from your [Languages Configuration](/documentation/configuration/languages-list)
- Languages are managed system-wide and shared across offers

**Creating Languages Inline:**
- If the language you need isn't available, click **+ Create Language** button
- An inline modal appears to create a new language
- Once created, the new language is automatically available for selection
- No need to navigate away from the offer creation form

### Creative Fields by Channel

**SMS Creatives:**
- **Channel:** SMS
- **Language:** Select language for this message
- **Title:** Brief headline (optional, for internal reference)
- **Message Body:** The SMS text to send to customers
- **Sender ID:** Optional - override the sender ID for this specific creative (defaults to the route's sender ID)
- **SMS Route:** The SMS gateway route selected in Step 1
- **Variables:** Insert custom variables (e.g., {{customer_name}}) that will be personalized per customer

**Email Creatives:**
- **Channel:** Email
- **Language:** Select language for this email
- **Subject Line:** Email subject (required)
- **Email Body:** Full email content (rich text editor with formatting options)
- **HTML Body:** Optional HTML formatting for styled emails
- **Variables:** Insert custom variables for personalization (e.g., {{customer_name}}, {{offer_code}})
- Supports both plain text and HTML content

**WhatsApp Creatives:**
- **Channel:** WhatsApp
- **Language:** Select language for this message
- **Message Body:** WhatsApp message text
- **Variables:** Insert custom variables for personalization
- **WhatsApp Route:** The WhatsApp gateway route selected in Step 1

**USSD Creatives:**
- **Channel:** USSD
- **Language:** Select language for this USSD session
- **Message Body:** USSD menu/prompt text
- **Variables:** Insert custom variables as needed
- **USSD Route:** The USSD gateway route selected in Step 1

**Push Notification Creatives:**
- **Channel:** Push Notification
- **Language:** Select language for the notification
- **Title:** Notification title (required)
- **Body:** Notification message body (required)
- **Variables:** Insert custom variables for personalization
- **Push Route:** The Push Notification gateway route selected in Step 1

### Using Templates

**Pre-built Templates:**
- Click **Use Template** to insert a pre-built template for quick creative creation
- Templates are available for each channel type
- Templates include:
  - Standard formatting
  - Example variables
  - Best practice messaging

**Creating Custom Templates:**
- Click **+ Create Template** to build a reusable template
- An inline modal appears to create and save the template
- Templates can be used across multiple offers
- Templates include all the fields for a specific channel

### Variable Insertion

**Add Dynamic Content:**
- Click **Insert Variable** to add placeholders for customer-specific data
- Variables are formatted as: `{{variable_name}}`
- Common variables include:
  - `{{customer_name}}` - Customer's name
  - `{{customer_email}}` - Customer's email
  - `{{offer_code}}` - The offer code
  - `{{discount_amount}}` - Discount percentage or amount
  - Custom variables based on your data structure

**Example Creatives:**

*SMS Example (English):*
- Language: English
- Channel: SMS
- Body: "Hi {{customer_name}}! Get {{discount_amount}}% OFF with code {{offer_code}}. Valid until {{expiry_date}}. Reply STOP to unsubscribe."

*Email Example (English):*
- Language: English
- Channel: Email
- Subject: "Exclusive Offer for You, {{customer_name}}!"
- Body: "Hi {{customer_name}},\n\nEnjoy {{discount_amount}}% off your next purchase!\n\nUse code: {{offer_code}}\n\nBest regards,\nThe Team"

*Email Example (Swahili):*
- Language: Swahili
- Channel: Email
- Subject: "Ofa Maalum Kwako, {{customer_name}}!"
- Body: "Habari {{customer_name}},\n\nTamasamu {{discount_amount}}% kutoka kwa ununuzi wako unaofuata..."

### Creative Preview

- As you fill in creative content, the **Preview Panel** on the right shows how it will appear to customers
- Preview updates in real-time as you type
- Preview displays according to the selected channel:
  - SMS shows mobile phone message appearance
  - Email shows inbox preview
  - Other channels show their respective formats
- Use preview to verify variables are inserted correctly and content looks good


## Step 4: Tracking

Configure performance monitoring and tracking for the offer.

![Step 4 - Tracking](/img/v1.1/offer-images/step4createoffer-trackingimage1.png)

![Step 4 - Tracking Source](/img/v1.1/offer-images/step4createoffertrackingsource%20image2.png)

Set up how the offer's performance will be tracked:
- Tracking sources for attribution
- Conversion metrics
- Revenue tracking
- Other performance indicators


## Step 5: Rewards

Define reward configuration for the offer.

![Step 5 - Rewards](/img/v1.1/offer-images/step5createofferrewardsstepimage1.png)

![Step 5 - Rewards Extended](/img/v1.1/offer-images/step5createofferrewardsstepimage2.png)

Configure what reward or incentive is provided:
- Reward type
- Reward amount/value
- Redemption terms
- Reward expiration (if applicable)


## Step 6: Review

Review all offer settings before creating.

![Step 6 - Preview](/img/v1.1/offer-images/previewimage1createoffer.png)

![Step 6 - Review](/img/v1.1/offer-images/previewimage2createoffer.png)

Review all the information you've entered:
- Offer name, code, and type
- Selected products
- Creative content for each channel
- Tracking configuration
- Reward details

**Save Options:**
- **Save as Draft** - Save the offer without submitting for approval (can edit later)
- **Save and Request Approval** - Submit the offer for approval by authorized reviewers


## Offer Status After Creation

After creating an offer:
- **Draft** - If you saved as draft (can be edited)
- **Pending Approval** - If you submitted for approval (awaiting review)

See [View Offer Details](/documentation/offers/view-offer-details) to manage your offer after creation.


