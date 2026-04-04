# Internationalization (i18n) System

This project includes a multi-language support system that allows the systemlication to be displayed in different languages based on user preferences set in the Settings page.

## Supported Languages

- **English (en)** - Default
- **French (fr)**
- **Spanish (es)**
- **Swahili (sw)**

## How to Use

### 1. Using Translations in Components

Import and use the `useTranslation` hook in your component:

```tsx
import { useTranslation } from "../../../contexts/LanguageContext";

function MyComponent() {
  const t = useTranslation();

  return (
    <div>
      <h1>{t.common.save}</h1>
      <button>{t.common.cancel}</button>
    </div>
  );
}
```

### 2. Available Translation Keys

The translation system is organized into categories:

- **`t.common`** - Common UI elements (save, cancel, delete, edit, etc.)
- **`t.navigation`** - Navigation items (dashboard, campaigns, offers, etc.)
- **`t.campaigns`** - Campaign-related translations
- **`t.settings`** - Settings page translations
- **`t.messages`** - Success/error messages

### 3. Adding New Translations

To add new translations:

1. Open `src/shared/i18n/translations.ts`
2. Add your new key to the `Translations` interface
3. Add translations for all supported languages (en, fr, es, sw)

Example:

```typescript
// In translations.ts
export interface Translations {
  // ... existing keys
  myFeature: {
    title: string;
    description: string;
  };
}

// Then add translations for each language
export const translations: Record<"en" | "fr" | "es" | "sw", Translations> = {
  en: {
    // ... existing translations
    myFeature: {
      title: "My Feature",
      description: "This is my feature",
    },
  },
  fr: {
    // ... existing translations
    myFeature: {
      title: "Ma fonctionnalité",
      description: "Ceci est ma fonctionnalité",
    },
  },
  // ... etc for es and sw
};
```

### 4. Language Service

The language service (`src/shared/services/languageService.ts`) provides:

- `getLanguageSettings()` - Get current language settings
- `getCurrentLanguageCode()` - Get current language code
- `setLanguageSettings(language)` - Set language (updates localStorage)

### 5. Language Context

The `LanguageContext` provides:

- `language` - Current language code
- `setLanguage(languageName)` - Change language
- `t` - Translation object

Access via `useLanguage()` or `useTranslation()` hooks.

## Language Selection

Users can change the language in the Settings page. The change takes effect immediately and is saved to localStorage. The language preference persists across sessions.

## Best Practices

1. **Always use translation keys** instead of hardcoded strings
2. **Add translations for all languages** when adding new features
3. **Use descriptive key names** that indicate the context (e.g., `campaigns.budgetAllocated` not just `budget`)
4. **Keep translations consistent** - use the same translation for the same concept across the system
5. **Test in all languages** to ensure UI doesn't break with longer translations

## Example: Complete Component

```tsx
import { useTranslation } from "../../../contexts/LanguageContext";

export default function CampaignCard({ campaign }) {
  const t = useTranslation();

  return (
    <div>
      <h2>{campaign.name}</h2>
      <p>
        {t.campaigns.status}: {campaign.status}
      </p>
      <p>
        {t.campaigns.budgetAllocated}: {campaign.budget}
      </p>
      <button>{t.common.edit}</button>
      <button>{t.common.delete}</button>
    </div>
  );
}
```
