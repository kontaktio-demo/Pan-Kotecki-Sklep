// Integracja z InPost ShipX (paczkomaty + kurier).
// Działa tylko, gdy ustawione są zmienne INPOST_TOKEN i INPOST_ORG_ID.
// Bez nich panel pokaże komunikat „InPost nie skonfigurowany" i nic się nie psuje.

const BASE = (process.env.INPOST_BASE_URL ?? "https://api-shipx-pl.easypack24.net/v1").replace(/\/+$/, "");
const TOKEN = process.env.INPOST_TOKEN ?? "";
const ORG = process.env.INPOST_ORG_ID ?? "";
const TEMPLATE = process.env.INPOST_PARCEL_TEMPLATE ?? "small"; // small | medium | large
const SERVICE_LOCKER = process.env.INPOST_SERVICE_LOCKER ?? "inpost_locker_standard";
const SERVICE_COURIER = process.env.INPOST_SERVICE_COURIER ?? "inpost_courier_standard";

export function inpostConfigured(): boolean {
  return Boolean(TOKEN && ORG);
}

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
}

// tylko cyfry, ostatnie 9 (format telefonu wymagany przez InPost)
function phone9(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "").slice(-9);
}

export type Receiver = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address?: { street?: string; building_number?: string; city?: string; post_code?: string };
};

export type ShipmentResult = { id: string; tracking_number: string | null; status: string };

// Tworzy przesyłkę w ShipX. method: 'locker' (paczkomat) lub 'courier' (kurier).
export async function createShipment(opts: {
  method: "locker" | "courier";
  receiver: Receiver;
  lockerCode?: string | null;
  reference: string;
}): Promise<ShipmentResult> {
  const r = opts.receiver;
  const receiver: Record<string, unknown> = {
    first_name: r.first_name || "Klient",
    last_name: r.last_name || "Sklepu",
    email: r.email,
    phone: phone9(r.phone),
  };

  const body: Record<string, unknown> = {
    receiver,
    parcels: [{ template: TEMPLATE }],
    reference: opts.reference,
  };

  if (opts.method === "locker") {
    body.service = SERVICE_LOCKER;
    body.custom_attributes = { target_point: opts.lockerCode, sending_method: "parcel_locker" };
  } else {
    body.service = SERVICE_COURIER;
    receiver.address = {
      street: r.address?.street ?? "",
      building_number: r.address?.building_number ?? "",
      city: r.address?.city ?? "",
      post_code: r.address?.post_code ?? "",
      country_code: "PL",
    };
    body.custom_attributes = { sending_method: "dispatch_order" };
  }

  const res = await fetch(`${BASE}/organizations/${ORG}/shipments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`InPost ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id: number | string; tracking_number?: string | null; status?: string };
  return { id: String(data.id), tracking_number: data.tracking_number ?? null, status: data.status ?? "created" };
}

// Pobiera bieżący stan przesyłki (status, numer śledzenia).
// WAŻNE: tylko realne 404 = brak przesyłki. Każdy inny błąd (401/429/500) RZUCAMY,
// żeby nie pomylić chwilowej awarii z „brakiem" i nie utworzyć duplikatu przesyłki.
export async function getShipment(id: string): Promise<ShipmentResult | null> {
  const res = await fetch(`${BASE}/shipments/${id}`, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`InPost ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id: number | string; tracking_number?: string | null; status?: string };
  return { id: String(data.id), tracking_number: data.tracking_number ?? null, status: data.status ?? "created" };
}

// Pobiera etykietę PDF. Zwraca Buffer albo null, jeśli jeszcze nieobsłużona.
export async function fetchLabel(id: string): Promise<Buffer | null> {
  const res = await fetch(`${BASE}/shipments/${id}/label?format=pdf&type=normal`, { headers: headers() });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.length ? buf : null;
}
