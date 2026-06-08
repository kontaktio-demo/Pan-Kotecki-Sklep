// Dane strukturalne (schema.org) - Google używa ich do bogatych wyników
// (cena, dostępność, oceny, breadcrumbs). Escapujemy "<" by nie dało się
// wyjść ze <script>.
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
