"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klient Supabase TYLKO do logowania klientów (auth). Dane sklepu nadal idą
// przez własny backend. Konta są opcjonalne — gdy brak zmiennych env, sklep
// działa normalnie jako „gość", a UI logowania pokazuje stosowny komunikat.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anon
    ? createClient(url, anon, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    : null;

export const authConfigured = !!supabase;
