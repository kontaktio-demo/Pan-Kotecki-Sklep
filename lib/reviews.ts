// Opinie o produktach - tylko przez backend (weryfikowany zakup).
const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export type Review = {
  id: string;
  author: string;
  rating: number;
  body: string;
  verified: boolean;
  createdAt: string;
};

export type ReviewsPayload = {
  summary: { avg: number | null; count: number; stars: Record<number, number> };
  reviews: Review[];
  page: number;
  pageCount: number;
};

export const reviewsEnabled = Boolean(API);

export async function getReviews(slug: string, page = 1): Promise<ReviewsPayload | null> {
  if (!API) return null;
  try {
    const res = await fetch(`${API}/api/products/${encodeURIComponent(slug)}/reviews?strona=${page}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ReviewsPayload;
  } catch {
    return null;
  }
}

export type SubmitReviewInput = {
  rating: number;
  body: string;
  author_name: string;
  order_number?: string;
  email?: string;
};

export async function submitReview(
  slug: string,
  input: SubmitReviewInput,
  token?: string | null,
): Promise<{ ok: boolean; message: string }> {
  if (!API) return { ok: false, message: "Opinie są chwilowo niedostępne." };
  try {
    const res = await fetch(`${API}/api/products/${encodeURIComponent(slug)}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    if (res.ok) return { ok: true, message: data.message ?? "Dziękujemy! Opinia czeka na zatwierdzenie." };
    return { ok: false, message: data.error ?? "Nie udało się wysłać opinii. Spróbuj ponownie." };
  } catch {
    return { ok: false, message: "Brak połączenia. Spróbuj ponownie." };
  }
}
