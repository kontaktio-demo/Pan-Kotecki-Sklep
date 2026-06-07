import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn("[supabase] Brak SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY - ustaw je w .env");
}

// Klient z service role: pełny dostęp do bazy. ŻYJE TYLKO W BACKENDZIE.
export const supabase = createClient(url ?? "", key ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
