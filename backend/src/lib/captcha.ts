// Weryfikacja tokenu hCaptcha po stronie serwera (formularze kontakt/newsletter).
// Gdy HCAPTCHA_SECRET nie jest ustawiony → captcha wyłączona (zwraca true),
// więc formularze działają jak dotąd. Ustaw ten sam Secret key, co w Supabase.
const SECRET = process.env.HCAPTCHA_SECRET;

export async function verifyCaptcha(token?: string): Promise<boolean> {
  if (!SECRET) return true; // captcha wyłączona
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: SECRET, response: token });
    const res = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}
