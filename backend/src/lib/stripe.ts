import Stripe from "stripe";

// Stripe działa tylko, gdy ustawiony jest klucz. Bez klucza sklep przyjmuje
// zamówienia jako „nieopłacone" (np. odbiór osobisty / etap przygotowań).
const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;

// Adres sklepu (do success_url / cancel_url). Wymagany, by utworzyć płatność.
export function siteUrl(): string {
  return (process.env.SITE_URL ?? "").replace(/\/+$/, "");
}
