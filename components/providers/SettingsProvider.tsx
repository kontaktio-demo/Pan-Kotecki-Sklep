"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, fetchPublicSettings, type PublicSettings } from "@/lib/settings";

// Jedne ustawienia dla całego sklepu (koszyk, karty produktów, kasa) -
// pobrane raz, z fallbackiem gdy backend niedostępny.
const SettingsContext = createContext<PublicSettings>(DEFAULT_SETTINGS);

export function useSettings(): PublicSettings {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let alive = true;
    fetchPublicSettings().then((s) => {
      if (alive) setSettings(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}
