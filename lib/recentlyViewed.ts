// Ostatnio oglądane produkty - localStorage, max 8, najnowsze pierwsze.
const KEY = "kotecki-recently-viewed";
const MAX = 8;

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function recordViewed(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = [slug, ...getRecentlyViewed().filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* localStorage pełny/zablokowany - trudno */
  }
}
