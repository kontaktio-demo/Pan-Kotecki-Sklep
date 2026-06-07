import type { PanelConfig } from "./global";

// Konfiguracja (adres API + klucz) w localStorage przeglądarki.
export function loadConfig(): PanelConfig {
  try {
    return JSON.parse(localStorage.getItem("panel-config") || "{}");
  } catch {
    return {};
  }
}

export function saveConfig(cfg: PanelConfig): void {
  localStorage.setItem("panel-config", JSON.stringify(cfg));
}
