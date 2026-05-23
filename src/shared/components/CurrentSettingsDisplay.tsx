import { useState, useEffect } from "react";

interface Settings {
  country: string;
  timezone: string;
  currency: string;
  language: string;
  date_format: string;
  number_formatting: string;
}

export default function CurrentSettingsDisplay() {
  const loadSettings = (): Settings => {
    try {
      const stored = localStorage.getItem("appSettings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          country: parsed.country || "Kenya",
          timezone: parsed.timezone || "Africa/Nairobi",
          currency: parsed.currency || "KES",
          language: parsed.language || "English",
          date_format: parsed.date_format || "YYYY-MM-DD",
          number_formatting: parsed.number_formatting || "1,234.56",
        };
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    return {
      country: "Kenya",
      timezone: "Africa/Nairobi",
      currency: "KES",
      language: "English",
      date_format: "YYYY-MM-DD",
      number_formatting: "1,234.56",
    };
  };

  const [settings, setSettings] = useState<Settings>(loadSettings());

  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSettings(customEvent.detail);
    };

    window.addEventListener("appSettingsChanged", handleSettingsChange);
    return () => window.removeEventListener("appSettingsChanged", handleSettingsChange);
  }, []);

  return (
    <div className="text-xs text-white flex items-center gap-4">
      <span>Country: {settings.country}</span>
      <span>Timezone: {settings.timezone}</span>
      <span>Currency: {settings.currency}</span>
    </div>
  );
}
