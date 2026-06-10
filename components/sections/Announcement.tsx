import { getPublicSettings } from "@/lib/settings";

// Ogłoszenie sklepu (z panelu, ustawienie "announcement") - statyczny pasek
// w treści strony głównej, NIE sticky. Pusty tekst = brak paska.
export default async function Announcement() {
  const { announcement } = await getPublicSettings();
  if (!announcement.trim()) return null;

  return (
    <div className="container-edge mt-6">
      <p className="flex items-center justify-center gap-2 rounded-xl border border-teal/25 bg-mint/60 px-4 py-3 text-center text-sm font-medium text-teal-deep">
        <span aria-hidden="true">🐾</span>
        {announcement.trim()}
      </p>
    </div>
  );
}
