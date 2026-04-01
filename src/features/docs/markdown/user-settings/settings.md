# Settings

## Overview

Settings is where you configure your personal preferences for the platform. These settings control language, timezone, date and currency formats, theme, Do Not Disturb hours, and communication defaults. Settings are saved locally on your device and apply only to your current browser.

**Note:** Settings are device-specific. If you use multiple devices or browsers, you'll need to configure settings on each separately.

## Accessing Settings

**Step 1: Open User Menu**
- Click your **profile icon** in the top-right corner
- A dropdown menu appears

**Step 2: Navigate to Settings**
- Click on **"Settings"** option
- Settings page loads

**Route:** `/dashboard/user-settings/settings`

---

## Theme

### Theme Selection

![Display Theme Setting](/img/usersettings/themesetting.png)

Choose how the interface appears:

**Available Options:**
- **Light Mode** - Standard light background (default)
- **Dark Mode** - Dark background with light text

**How to Change:**
1. Go to Settings
2. Find the Theme dropdown
3. Select Light Mode or Dark Mode
4. Changes apply immediately

---

## Language & Localization

![Location & Localization Settings](/img/usersettings/location&localizationsetitngs.png)

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
5. Interface updates (may require page refresh)

### Regional Format

![Date & Currency Settings](/img/usersettings/dateandcurrencysetting.png)

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
- Affects scheduled task times
- Examples: Africa/Nairobi, Europe/London, America/New_York

**Currency:**
- All currencies from currency-codes library
- Examples: KES, USD, EUR, GBP

**Number Format:**
- 1,234.56 (comma thousands, period decimal)
- 1 234,56 (space thousands, comma decimal)
- 1.234,56 (period thousands, comma decimal)
- 1'234.56 (apostrophe thousands, period decimal)

---

## Communication Preferences

![Character Set & Default Channel Setting](/img/usersettings/characteranddefaultchannelsetting.png)

![Sender ID & Route Setting](/img/usersettings/senderidandroutesetting.png)

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
- GSM-7 (Standard SMS) - Default
- UTF-8 (Unicode)
- ASCII (English only)
- UCS-2 (Full Unicode)

**Notification Sound:**
- None (Silent)
- Bell
- Chime
- Ding
- Notification
- Alert
- Pop
- Ping

---

## Do Not Disturb (DND)

![Do Not Disturb Settings](/img/usersettings/dndsettings.png)

### Enable Do Not Disturb

Configure when notifications should be queued instead of delivered immediately:

**Enable DND:**
- Toggle to enable/disable Do Not Disturb

**DND Hours:**
- Set start time (e.g., 21:00 for 9 PM)
- Set end time (e.g., 08:00 for 8 AM)

**DND Days:**
- Weekdays (Mon-Fri)
- Weekends (Sat-Sun)
- Daily (all days)
- Custom Days

**What Happens During DND:**
- Notifications are queued (not sent immediately)
- All notifications sent as batch when DND ends
- Critical system alerts may still be delivered

**Default:** DND enabled from 21:00 to 08:00 daily

---

## Notification Types & Channels

![Notification Settings](/img/usersettings/notificationsetting.png)

### Enabled Notification Types

Choose which notification types you want to receive:

- Campaigns
- Offers
- Segments
- Products
- Jobs
- Users
- System

**Default:** All types enabled

### Preferred Notification Channels

Select which channels to use for notifications:

- SMS
- Email
- USSD
- Push
- IVR
- Voice
- WhatsApp

**Default:** SMS and Email

---

## Saving Settings

### Automatic Saving

Most settings save automatically when you change them. A confirmation message appears when changes are saved successfully.

### Manual Save

If changes are not saving automatically:
1. Make your changes
2. Click "Save Settings" button at bottom of page
3. Wait for confirmation message
4. Settings are now saved locally

---

## Troubleshooting

### Settings Not Saving

**Issue:** Changes don't persist after saving
- Solution: Check for error messages on the page
- Clear your browser cache and try again
- Refresh the page and make changes again
- Try a different browser

### Settings Appear to Reset

**Issue:** Settings changed back to defaults
- Solution: Settings are stored in your browser's local storage
- Clearing browser cache will reset settings
- Reconfigure settings after clearing cache
- Try not clearing cache to preserve settings

### Theme Not Changing

**Issue:** Dark mode not activating or changes not visible
- Solution: Refresh the page after changing theme
- Close and reopen the Settings page
- Check if your browser supports dark mode
- Disable browser extensions that might override theme

### Language Not Updating

**Issue:** Interface still shows previous language
- Solution: Refresh the page after changing language
- Close and reopen the app
- Clear browser cache if language persists
- Wait a moment for interface to update

### Different Settings on Different Devices

**Issue:** Settings are different when using another device
- Solution: Settings are device-specific, not synced across devices
- Configure settings separately on each device
- Each browser/device maintains its own settings
- This is expected behavior

---

