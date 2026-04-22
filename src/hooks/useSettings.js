import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "codemaxxer-settings";

const DEFAULTS = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  activeLine: true,
  showTyping: true,
  showRemoteCursors: true,
  defaultUsername: "",
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * Persisted settings hook. Reads/writes to localStorage.
 */
export function useSettings() {
  const [settings, setSettingsState] = useState(loadSettings);

  const setSetting = useCallback((key, value) => {
    setSettingsState((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    saveSettings(DEFAULTS);
    setSettingsState({ ...DEFAULTS });
  }, []);

  // Listen for changes from other tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setSettingsState(loadSettings());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { settings, setSetting, resetSettings };
}
