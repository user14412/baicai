import { useCallback, useState } from "react";
import { loadSettings, saveSettings as persistSettings } from "../lib/storage";
import type { Settings } from "../lib/types";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const saveSettings = useCallback((nextSettings: Settings) => {
    setSettings(nextSettings);
    persistSettings(nextSettings);
  }, []);

  return {
    settings,
    saveSettings,
  };
}
