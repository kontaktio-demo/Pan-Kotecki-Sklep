// Publiczne ustawienia sklepu z backendu (próg darmowej dostawy, koszty
// dostawy, ogłoszenie). Sklep działa też bez backendu - na wartościach domyślnych.

export type PublicSettings = {
  freeShippingZl: number;
  lockerCostZl: number;
  courierCostZl: number;
  announcement: string;
  open: boolean;
};

export const DEFAULT_SETTINGS: PublicSettings = {
  freeShippingZl: 149,
  lockerCostZl: 11.99,
  courierCostZl: 14.99,
  announcement: "",
  open: true,
};

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

type ApiSettings = {
  freeShippingGrosze?: number;
  shippingLockerGrosze?: number;
  shippingCourierGrosze?: number;
  announcement?: string;
  open?: boolean;
};

function fromApi(s: ApiSettings): PublicSettings {
  const zl = (grosze: unknown, fallback: number) => {
    const n = Number(grosze);
    return Number.isFinite(n) && n >= 0 ? n / 100 : fallback;
  };
  return {
    freeShippingZl: zl(s.freeShippingGrosze, DEFAULT_SETTINGS.freeShippingZl),
    lockerCostZl: zl(s.shippingLockerGrosze, DEFAULT_SETTINGS.lockerCostZl),
    courierCostZl: zl(s.shippingCourierGrosze, DEFAULT_SETTINGS.courierCostZl),
    announcement: typeof s.announcement === "string" ? s.announcement : "",
    open: s.open !== false,
  };
}

// Wersja dla server components (cache 60 s).
export async function getPublicSettings(): Promise<PublicSettings> {
  if (!API) return DEFAULT_SETTINGS;
  try {
    const res = await fetch(`${API}/api/settings/public`, { next: { revalidate: 60 } });
    if (!res.ok) return DEFAULT_SETTINGS;
    return fromApi((await res.json()) as ApiSettings);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Wersja dla klienta (provider) - zwykły fetch.
export async function fetchPublicSettings(): Promise<PublicSettings> {
  if (!API) return DEFAULT_SETTINGS;
  try {
    const res = await fetch(`${API}/api/settings/public`);
    if (!res.ok) return DEFAULT_SETTINGS;
    return fromApi((await res.json()) as ApiSettings);
  } catch {
    return DEFAULT_SETTINGS;
  }
}
