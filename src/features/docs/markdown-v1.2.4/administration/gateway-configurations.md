---
title: Gateway Configurations
---

# Gateway Configurations

Gateway Configurations manage the credentials and settings for external gateway providers that deliver messages across all communication channels (Email, SMS, WhatsApp, Push Notifications, and USSD). Each configuration stores the provider-specific credentials needed to authenticate and send messages through that provider.

## Accessing Gateway Configurations

Navigate to **Administration → Gateway Configurations** to manage all gateway credentials across all channels in one unified interface.

## Gateway Configurations List

![Gateway Configurations List](/img/v1.2.4/gatewayconfigslistpage.png)

The list displays all gateway configurations with:

- **Name** - Configuration name identifier
- **Description** - Additional details about the configuration
- **Channel** - Which communication channel this configuration is for (Email, SMS, WhatsApp, Push, USSD)
- **Gateway Provider** - The external provider name (e.g., SendGrid, Twilio, Firebase)
- **Status** - Active or Inactive indicator
- **Created/Updated** - Timestamp when the configuration was created or last modified
- **Actions** - Edit or Delete buttons

### List Features

**Search:**
- Search for configurations by name or description

**Filter by Channel:**
- All Channels - Show all configurations
- Email - Show only email configurations
- SMS - Show only SMS configurations
- WhatsApp - Show only WhatsApp configurations
- Push Notification - Show only push configurations
- USSD - Show only USSD configurations

**Toggle Status:**
- Click the Activate/Deactivate button to enable or disable a configuration
- Active configurations are available for use in routes and campaigns
- Inactive configurations cannot be used

**Edit:**
- Click Edit to modify a configuration's details

**Delete:**
- Click Delete to remove a configuration (confirmation required)

## Creating a Gateway Configuration

Click the **Create** button to open the channel and provider selection form.

### Step 1: Select Communication Channel and Provider

**Form Fields:**

- **Communication Channel** (required) - Choose which messaging channel this configuration is for: Email, SMS, WhatsApp, Push Notification, or USSD
- **Gateway Provider** (required) - Select the specific provider for that channel (options vary by channel)

### Step 2: Enter Configuration Details

![Create Gateway Configuration](/img/v1.2.4/creategatewayconfigwithemailchannel.png)

Based on the selected channel, you'll see provider-specific forms with different credential fields.

#### Email Configurations

**Basic Information:**
- **Communication Channel** - Email (auto-selected)
- **Email Provider** - Select provider (e.g., SendGrid, Gmail, other SMTP providers)
- **Configuration Name** (required) - Unique name for this configuration (e.g., "SendGrid Production", "Gmail Corporate")
- **Description** (optional) - Details about the configuration's purpose

**SMTP Credentials:**
- **SMTP Host** (required) - The SMTP server address (e.g., smtp.sendgrid.net)
- **SMTP Port** (required) - The SMTP port number (typically 587 or 465)
- **SMTP Username** (required) - Username for SMTP authentication (e.g., apikey)
- **SMTP Password** (required) - Password for SMTP authentication
- **From Address** (required) - Email address messages will be sent from (e.g., noreply@company.com)
- **Reply-To Address** (optional) - Email address for replies (e.g., support@company.com)
- **Enable TLS** (optional checkbox) - Enable TLS encryption for the connection

#### SMS Configurations

**Basic Information:**
- **Communication Channel** - SMS (auto-selected)
- **SMS Provider** - Select provider (e.g., Twilio, Infobip, other SMS gateways)
- **Configuration Name** (required) - Unique name for this configuration (e.g., "Twilio Primary SMS")
- **Description** (optional) - Details about the configuration's purpose

**API Credentials:**
- **API Key** (required) - API key for the SMS provider
- **API Secret** (optional) - API secret if required by the provider
- **Account SID / Account ID** (optional) - Account identifier (e.g., AC1234567890abcdef for Twilio)
- **Phone Number / Sender ID** (optional) - Default sender phone number or sender ID (e.g., +1234567890 or Company Name)
- **Gateway URL** (optional) - Custom gateway endpoint URL if applicable
- **Messaging Service ID** (optional) - Messaging service ID (e.g., MG1234567890abcdef for Twilio)

#### WhatsApp Configurations

**Basic Information:**
- **Communication Channel** - WhatsApp (auto-selected)
- **WhatsApp Provider** - Select provider: Twilio or MessageBird
- **Configuration Name** (required) - Unique name for this configuration (e.g., "Twilio WhatsApp Business")
- **Description** (optional) - Details about the configuration's purpose

**WhatsApp API Credentials:**
- **API Key** (required) - API key for WhatsApp provider
- **API Secret** (optional) - API secret if required by the provider
- **Business Account ID** (required) - WhatsApp Business Account ID (e.g., 102334567890123456)
- **Phone Number ID** (required) - WhatsApp Phone Number ID (e.g., 1234567890123456)
- **Display Name** (optional) - Display name for WhatsApp messages (e.g., Company Support)
- **Webhook URL** (optional) - URL for receiving delivery callbacks or message status updates
- **Webhook Verify Token** (optional) - Token for verifying webhook requests

#### Push Notification Configurations

**Basic Information:**
- **Communication Channel** - Push Notification (auto-selected)
- **Push Notification Provider** - Select provider: Firebase (Google) or Apple APNS
- **Configuration Name** (required) - Unique name for this configuration (e.g., "Firebase Production")
- **Description** (optional) - Details about the configuration's purpose

**Firebase Credentials (if provider is Firebase):**
- **Server Key** (required) - Firebase server key for authentication
- **Sender ID** (required) - Firebase sender ID (e.g., 123456789012)
- **Project ID** (required) - Firebase project ID (e.g., company-firebase-project)
- **Private Key** (required) - Firebase private key JSON (paste the entire key)
- **Client Email** (required) - Service account email (e.g., firebase-adminsdk@project.iam.gserviceaccount.com)

**Apple APNS Credentials (if provider is Apple APNS):**
- **Certificate Path** (required) - Path to APNS certificate file (e.g., /certs/apns_production.p8)
- **Certificate Password** (optional) - Password if certificate is encrypted
- **Team ID** (required) - Apple Team ID (e.g., ABCD123456)
- **Key ID** (required) - APNS key identifier (e.g., XYZKEY1234)
- **Bundle ID** (required) - Application bundle ID (e.g., com.company.app)

#### USSD Configurations

**Basic Information:**
- **USSD Provider** - Select provider: Infobip, Twilio, Jambaz, Liquid Intelligent, AfricasTalking, or Internal Gateway
- **Configuration Name** (required) - Unique name for this configuration (e.g., "Infobip Production")
- **Description** (optional) - Details about the configuration's purpose

**API Configuration:**
- **API Endpoint** (required) - The USSD gateway API endpoint (e.g., https://api.infobip.com/ussd/1/send)
- **API Key** (required) - API key for authentication
- **API Secret** (optional) - API secret if required by the provider
- **Request Method** (optional) - HTTP method for API requests: POST or GET (default: POST)
- **Request Format** (optional) - Data format for API requests: JSON, XML, or Form Data (default: JSON)

Click **Save** to create the configuration. You'll be redirected to the gateway configurations list.

## Editing a Gateway Configuration

Click the **Edit** button on any configuration to modify its details.

**Editable Fields:**
All fields from the creation form can be edited, including:
- Configuration name and description
- Gateway provider selection
- All provider-specific credentials

Click **Save** to update the configuration.

## Viewing Configuration Details

Click on a configuration name (or click **View Details** if available) to see the complete configuration information:

**Overview section displays:**
- Configuration name and description
- Communication channel type
- Provider name
- Current status (Active/Inactive)
- Created and last updated timestamps

**Credentials section displays:**
- All credential fields as key-value pairs
- Long values are truncated for display

### Actions on Details Page

- **Activate/Deactivate** - Enable or disable the configuration
- **Edit** - Modify the configuration
- **Delete** - Remove the configuration with confirmation

## Toggling Configuration Status

From the gateway configurations list or details page, use the **Activate/Deactivate** button to enable or disable a configuration:

- **Active** - Configuration is enabled and available for use in routes and campaigns
- **Inactive** - Configuration is disabled and cannot be used

Status changes apply immediately and show a confirmation message.

## Deleting a Gateway Configuration

Click the **Delete** button on any configuration to remove it.

1. Confirm the deletion when prompted
2. The configuration will be permanently deleted
3. You'll return to the gateway configurations list

**Note:** Deletion cannot be undone. Ensure the configuration is not in use before deleting.

## Gateway Configurations vs Routes

**Gateway Configurations** store the credentials and authentication details for external providers.

**Routes** (SMS Routes, Email Routes, WhatsApp Routes, Push Routes, USSD Routes) use these gateway configurations and add channel-specific features like:
- Failover/backup routing
- Sender IDs (for SMS)
- Webhook URLs (for WhatsApp/Push)
- Template support settings (for WhatsApp)
- Quality thresholds (for WhatsApp)

To use a gateway in your campaigns, you must:
1. Create a gateway configuration (store credentials)
2. Create a route (reference the configuration, add channel-specific settings)
3. Use the route in your campaigns or communications
