"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Ulubione: goście trzymają listę lokalnie; po zalogowaniu syncWithAccount()
// scala ją z listą konta (unia) przez backend.
const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

type WishlistState = {
  slugs: string[];
  toggle: (slug: string) => boolean; // zwraca true gdy dodano, false gdy usunięto
  has: (slug: string) => boolean;
  setAll: (slugs: string[]) => void;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) => {
        const cur = get().slugs;
        const added = !cur.includes(slug);
        set({ slugs: added ? [slug, ...cur] : cur.filter((s) => s !== slug) });
        return added;
      },
      has: (slug) => get().slugs.includes(slug),
      setAll: (slugs) => set({ slugs }),
      clear: () => set({ slugs: [] }),
    }),
    { name: "kotecki-wishlist", partialize: (s) => ({ slugs: s.slugs }) },
  ),
);

// Po zalogowaniu: wyślij lokalną listę, przyjmij unię z konta.
export async function syncWishlistWithAccount(token: string): Promise<void> {
  if (!API || !token) return;
  try {
    const res = await fetch(`${API}/api/account/wishlist/sync`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slugs: useWishlist.getState().slugs }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { slugs?: string[] };
    if (Array.isArray(data.slugs)) useWishlist.getState().setAll(data.slugs);
  } catch {
    /* offline/backend niedostępny - lokalna lista zostaje */
  }
}

// Dopisz/usuń na koncie w tle (gdy zalogowany) - UI nie czeka.
export async function pushWishlistChange(token: string | null, slug: string, added: boolean): Promise<void> {
  if (!API || !token) return;
  try {
    await fetch(`${API}/api/account/wishlist/${encodeURIComponent(slug)}`, {
      method: added ? "POST" : "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* nieszkodliwe - sync przy następnym logowaniu */
  }
}
