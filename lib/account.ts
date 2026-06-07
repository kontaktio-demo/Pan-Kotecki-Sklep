"use client";

import { supabase } from "./supabase";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export type AccountProfile = {
  email: string;
  full_name: string;
  phone: string;
  marketing_consent: boolean;
};

export type AccountAddress = {
  id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  street: string;
  building: string;
  apartment: string | null;
  postal_code: string;
  city: string;
  phone: string | null;
  is_default: boolean;
  created_at?: string;
};

export type AddressInput = {
  label?: string | null;
  first_name: string;
  last_name: string;
  street: string;
  building: string;
  apartment?: string | null;
  postal_code: string;
  city: string;
  phone?: string | null;
  is_default?: boolean;
};

export type OrderItem = { name: string; qty: number; slug: string | null; price: number; image: string | null };

export type AccountOrder = {
  number: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
  shippingMethod: string | null;
  trackingNumber: string | null;
  itemCount: number;
  items: OrderItem[];
};

export type AccountOrderDetail = AccountOrder & {
  subtotal: number;
  discount: number;
  shipping: number;
  parcelLocker: string | null;
  shippingAddress: Record<string, unknown> | null;
  promoCode: string | null;
};

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API) throw new Error("Sklep nie jest połączony z API.");
  const token = await getAccessToken();
  if (!token) throw new Error("Zaloguj się, aby kontynuować.");
  const res = await fetch(`${API}/api/account${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Coś poszło nie tak.");
  return data as T;
}

// Profil
export const getProfile = () => call<AccountProfile>("/me");
export const updateProfile = (patch: Partial<Pick<AccountProfile, "full_name" | "phone" | "marketing_consent">>) =>
  call<{ ok: true }>("/me", { method: "PUT", body: JSON.stringify(patch) });
export const deleteAccount = () => call<{ ok: true }>("/me", { method: "DELETE" });

// Zamówienia
export const getOrders = () => call<AccountOrder[]>("/orders");
export const getOrder = (number: string) => call<AccountOrderDetail>(`/orders/${encodeURIComponent(number)}`);

// Adresy
export const getAddresses = () => call<AccountAddress[]>("/addresses");
export const addAddress = (a: AddressInput) => call<AccountAddress>("/addresses", { method: "POST", body: JSON.stringify(a) });
export const updateAddress = (id: string, a: AddressInput) =>
  call<AccountAddress>(`/addresses/${id}`, { method: "PUT", body: JSON.stringify(a) });
export const deleteAddress = (id: string) => call<{ ok: true }>(`/addresses/${id}`, { method: "DELETE" });
