# Translation System Guide

## Overview

The CVM platform uses a comprehensive i18n (internationalization) system that supports multiple languages. Currently supported languages:

- **English (en)** - Default
- **French (fr)**
- **Spanish (es)**
- **Swahili (sw)**

---

## How It Works

### 1. **Translation Files Structure**

All translations are stored in: `src/shared/i18n/translations/`

```
translations/
├── index.ts          # Exports all translations
├── types.ts          # TypeScript interfaces
├── en.ts             # English translations
├── fr.ts             # French translations
├── es.ts             # Spanish translations
└── sw.ts             # Swahili translations
```

### 2. **Translation Structure**

Each language file follows the same structure defined in `types.ts`:

```typescript
export interface Translations {
  common: {
    // Common UI elements
    save: string;
    cancel: string;
    delete: string;
    // ... etc
  };
  navigation: {
    // Navigation items
    dashboard: string;
    campaigns: string;
    // ... etc
  };
  campaigns: {
    // Campaign-specific
    title: string;
    create: string;
    // ... etc
  };
  settings: {
    // Settings page
    title: string;
    language: string;
    // ... etc
  };
  // ... more sections
}
```

### 3. **Language Context**

The `LanguageContext` (`src/contexts/LanguageContext.tsx`) provides:

- Current language state
- `setLanguage()` function to change language
- `t` object with all translations for current language

**Usage in components:**

```typescript
import { useLanguage } from "../../../contexts/LanguageContext";

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div>
      <h1>{t.pages.dashboard}</h1>
      <button>{t.common.save}</button>
    </div>
  );
}
```

### 4. **Language Service**

The `languageService` (`src/shared/services/languageService.ts`) handles:

- Loading language from localStorage
- Saving language to localStorage
- Mapping language names to codes:
  - "English" → "en"
  - "French" → "fr"
  - "Spanish" → "es"
  - "Swahili" → "sw"

### 5. **Settings Page**

The Settings page (`src/features/settings/pages/SettingsPage.tsx`) allows users to:

- Select their preferred language
- **Changes only apply when "Save Changes" is clicked**
- Language is saved to localStorage as part of `appSettings`

**Flow:**

1. User selects language → Updates local state only
2. User clicks "Save Changes" → Saves to localStorage + Updates LanguageContext
3. All components using `t` automatically update

---

## How to Use Translations

### In Components

```typescript
import { useLanguage } from "../../../contexts/LanguageContext";

export default function MyPage() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t.pages.dashboard}</h1>
      <p>{t.dashboard.welcome}</p>
      <button>{t.common.save}</button>
    </div>
  );
}
```

### Translation Keys Structure

```typescript
t.common.save; // "Save"
t.common.cancel; // "Cancel"
t.pages.dashboard; // "Dashboard"
t.campaigns.title; // "Campaigns"
t.settings.language; // "Language"
t.messages.saved; // "Saved successfully"
```

---

## Adding New Translations

### Step 1: Add to Types

In `src/shared/i18n/translations/types.ts`, add your new section:

```typescript
export interface Translations {
  // ... existing sections

  myNewSection: {
    title: string;
    description: string;
    // ... your keys
  };
}
```

### Step 2: Add Translations to All Languages

**English (`en.ts`):**

```typescript
export const en: Translations = {
  // ... existing
  myNewSection: {
    title: "My New Section",
    description: "Description in English",
  },
};
```

**French (`fr.ts`):**

```typescript
export const fr: Translations = {
  // ... existing
  myNewSection: {
    title: "Ma Nouvelle Section",
    description: "Description en français",
  },
};
```

**Spanish (`es.ts`):**

```typescript
export const es: Translations = {
  // ... existing
  myNewSection: {
    title: "Mi Nueva Sección",
    description: "Descripción en español",
  },
};
```

**Swahili (`sw.ts`):**

```typescript
export const sw: Translations = {
  // ... existing
  myNewSection: {
    title: "Sehemu Yangu Mpya",
    description: "Maelezo kwa Kiswahili",
  },
};
```

### Step 3: Use in Components

```typescript
const { t } = useLanguage();
<h1>{t.myNewSection.title}</h1>;
```

---

## Current Translation Coverage

### ✅ Fully Translated Sections:

- Common UI elements (buttons, labels)
- Navigation items
- Settings page
- Dashboard
- Campaigns
- Messages/Notifications
- User Management
- Configuration pages
- Jobs

### ⚠️ Partially Translated:

- Some page-specific content may still use hardcoded English strings
- Error messages
- Tooltips and help text

### ❌ Not Yet Translated:

- Dynamic content (user-generated)
- API error messages
- Some advanced features

---

## Language Selection Flow

1. **User opens Settings page**

   - Current language is loaded from localStorage
   - Displayed in language dropdown

2. **User selects new language**

   - Dropdown updates (local state only)
   - **UI does NOT change yet**

3. **User clicks "Save Changes"**

   - Settings saved to localStorage
   - `setLanguageSettings()` called
   - `setLanguage()` called → Updates LanguageContext
   - All components re-render with new translations

4. **Language persists**
   - Saved in localStorage as `appSettings.language`
   - Loaded on app startup
   - Synced across browser tabs

---

## Best Practices

1. **Always use `t` object** - Never hardcode text that users see
2. **Use descriptive keys** - `t.campaigns.create` not `t.c1`
3. **Keep translations consistent** - Use same terms across the app
4. **Add to all languages** - Don't leave translations empty
5. **Test language switching** - Verify all pages work in all languages

---

## Adding a New Language

### Step 1: Add Language Code

In `src/shared/services/languageService.ts`:

```typescript
export type LanguageCode = "en" | "fr" | "es" | "sw" | "de"; // Add "de" for German

const LANGUAGE_NAME_TO_CODE: Record<string, LanguageCode> = {
  English: "en",
  French: "fr",
  Spanish: "es",
  Swahili: "sw",
  German: "de", // Add mapping
};
```

### Step 2: Create Translation File

Create `src/shared/i18n/translations/de.ts`:

```typescript
import { Translations } from "./types";

export const de: Translations = {
  common: {
    save: "Speichern",
    cancel: "Abbrechen",
    // ... all translations
  },
  // ... all sections
};
```

### Step 3: Export in index.ts

```typescript
import { de } from "./de";

export const translations: Record<
  "en" | "fr" | "es" | "sw" | "de",
  Translations
> = {
  en,
  fr,
  es,
  sw,
  de, // Add export
};
```

### Step 4: Add to Settings Page

In `src/features/settings/pages/SettingsPage.tsx`:

```typescript
const languages = [
  { name: "English", code: "en" },
  { name: "French", code: "fr" },
  { name: "Spanish", code: "es" },
  { name: "Swahili", code: "sw" },
  { name: "German", code: "de" }, // Add here
];
```

---

## Troubleshooting

### Translation not showing?

1. Check if key exists in `types.ts`
2. Verify translation exists in all language files
3. Check if component is using `useLanguage()` hook
4. Verify language is set correctly in localStorage

### Language not persisting?

1. Check localStorage for `appSettings`
2. Verify `setLanguageSettings()` is called on save
3. Check browser console for errors

### Missing translations?

1. Add to `types.ts` first
2. Add to all language files (en, fr, es, sw)
3. Use English as fallback if translation missing

---

## Summary

✅ **Fixed**: Language changes now only apply when "Save Changes" is clicked  
✅ **System**: Uses React Context + localStorage for persistence  
✅ **Coverage**: Most UI elements are translated  
✅ **Extensible**: Easy to add new languages or translation keys

The translation system is production-ready and can be extended as needed!

