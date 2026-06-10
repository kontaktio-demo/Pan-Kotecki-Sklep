export function formatPrice(value: number, currency: "PLN" = "PLN"): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Domyślny próg darmowej dostawy (zł) - realna wartość przychodzi z ustawień
// sklepu przez SettingsProvider / getPublicSettings.
export const DEFAULT_FREE_SHIPPING_FROM = 149;
