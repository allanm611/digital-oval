# Settings

## Overview

Settings is where you configure your personal preferences for the platform. These settings control language, timezone, date and currency formats, theme, Do Not Disturb hours, and communication defaults. Settings are saved locally on your device and apply only to your current browser.

<!-- **Note:** Settings are device-specific. If you use multiple devices or browsers, you'll need to configure settings on each separately. -->

## Language & Localization

![Location & Localization Settings](/img/v1.1/usersettings/location&localizationsetitngs.png)

### Language Preference

Select the language for the user interface:

**Available Languages:**
- English (Default)
- Français (French)
- Español (Spanish)
- Swahili (Kiswahili)

**How to Change:**
1. Go to Settings
2. Find "Language" dropdown
3. Select desired language
4. Click Save Settings

### Regional Format

![Date & Currency Settings](/img/v1.1/usersettings/dateandcurrencysetting.png)

Configure how dates and numbers display:

**Date Format:**
- YYYY-MM-DD (ISO standard)
- MM/DD/YYYY (United States)
- DD/MM/YYYY (Europe/UK)
- DD-MM-YYYY
- MM-DD-YYYY
- YYYY/MM/DD

**Timezone:**
- Select your local timezone
- Used for displaying timestamps
<!-- - Affects scheduled task times -->

**Currency:**
- All currencies from currency-codes library

**Number Format:**
- 1,234.56 (comma thousands, period decimal)
- 1 234,56 (space thousands, comma decimal)
- 1.234,56 (period thousands, comma decimal)
- 1'234.56 (apostrophe thousands, period decimal)

## Communication Preferences

![Character Set & Default Channel Setting](/img/v1.1/usersettings/characteranddefaultchannelsetting.png)

![Sender ID & Route Setting](/img/v1.1/usersettings/senderidandroutesetting.png)

### Default Communication Settings

Configure defaults for sending communications:

**Default Communication Channel:**
- SMS
- Email
- USSD
- Push Notification
- IVR
- Voice
- WhatsApp

**Default Sender ID:**
- Effortel
- Equitel
- EquitelKE
- EquitelAlert
- EquitelPromo

**Default SMS Route:**
- Effortel SMS Gateway

**Character Set (for SMS):**

Choose the encoding that best fits your message content:

- **GSM-7 (Standard SMS)** - Default
  - Example: "Hello! Your code is 12345. Valid 24 hours."
  - Best for: English-only messages, lowest cost
  - 160 characters per message

- **UTF-8 (Unicode)**
  - Example: "Café réouvert! 🎉 Venez maintenant."
  - Best for: Accents, emoji, multilingual content
  - 70 characters per message

- **ASCII (English only)**
  - Example: "Login now at example.com"
  - Best for: Very basic English text only
  - Limited character support

- **UCS-2 (Full Unicode)**
  - Example: "مرحبا بك! 你好! Привет!"
  - Best for: Multiple languages, Arabic, Chinese, Russian
  - 70 characters per message

**Notification Sound:**
- None (Silent)
- Bell
- Chime
- Ding
- Notification
- Alert
- Pop
- Ping


## Do Not Disturb (DND)

![Do Not Disturb Settings](/img/v1.1/usersettings/dndsettings.png)

### Enable Do Not Disturb

Set quiet hours when you don't want to be bothered with notifications. Notifications received during DND hours are held and delivered as a batch when your DND period ends.

**Enable DND:**
- Toggle to enable/disable Do Not Disturb
- When enabled, notifications are silenced during your set hours

**DND Hours:**
- Set start time (e.g., 21:00 for 9 PM)
- Set end time (e.g., 08:00 for 8 AM)
- Notifications won't notify you during this window

**DND Days:**
- **Weekdays** (Mon-Fri) — Apply DND only on weekdays
- **Weekends** (Sat-Sun) — Apply DND only on weekends
- **Daily** (all days) — Apply DND every day
- **Custom Days** — Select specific days for DND

**What Happens During DND:**
- You don't receive notification alerts or sounds during these hours
- Notifications are collected and queued in the background
- When DND ends, all queued notifications are delivered as a batch
- Critical system alerts may still be delivered immediately

**Example:**
- DND enabled 21:00 (9 PM) to 08:00 (8 AM) daily
- At 10:45 PM: Campaign notification arrives → queued, no alert
- At 10:50 PM: Segment update notification arrives → queued, no alert
- At 08:00 AM: DND ends → all queued notifications delivered at once

**Default:** DND enabled from 21:00 to 08:00 daily

## Notification Types & Channels

![Notification Settings](/img/v1.1/usersettings/notificationsetting.png)

### Notification Preferences

Manage which notifications you want to receive. The list shows all available [notification types](/documentation/configuration/notification-types-list) configured by your organization.

**Available Notification Types:**
The notification types available depend on what your organization has set up. Examples include:
- Campaign Approval Request
- Campaign Execution Completed
- Segment Computation Completed
- Offer Status Changed
- And others configured by your organization

**How to Enable/Disable Notifications:**
1. In the Notifications section, you'll see a list of all available notification types
2. Each notification type has a checkbox
3. Check the box to enable notifications for that type
4. Uncheck the box to disable notifications for that type
5. Changes are saved automatically

**Default:** All notification types are enabled

### Preferred Notification Channels

Select which communication channels you want to use for receiving notifications:

- SMS
- Email
- USSD
- Push
- IVR
- Voice
- WhatsApp

**How to Select Channels:**
1. Click on the "Preferred Channels" dropdown
2. Select one or more channels you want to use
3. Selected channels appear as tags below the dropdown
4. Click the × on a tag to remove a channel
5. Changes are saved automatically

**Default:** SMS and Email

**Note:** Your selected channels are used as the preferred delivery method for all enabled notifications.

## Theme

### Theme Selection

![Display Theme Setting](/img/v1.1/usersettings/themesetting.png)

Choose how the interface appears:

**Available Options:**
- **Light Mode** - Standard light background (default)
- **Dark Mode** - Dark background with light text

**How to Change:**
1. Go to Settings
2. Find the Theme dropdown
3. Select Light Mode or Dark Mode
<!-- 4. Changes apply immediately -->
