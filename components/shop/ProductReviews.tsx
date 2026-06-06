import Paw from "@/components/ui/Paw";

const REVIEWS = [
  {
    name: "Ania i kot Mruczek",
    text: "Mruczek pokochał od pierwszego dnia. Jakość super, a wysyłka naprawdę błyskawiczna.",
  },
  {
    name: "Kuba i Pixel",
    text: "Wreszcie sklep, w którym wszystko jest przemyślane. Czuć, że robią to kociarze.",
  },
  {
    name: "Marta i Tofik",
    text: "Ładne, solidne i naprawdę używane przez kota. Na pewno wrócę po więcej.",
  },
];

export default function ProductReviews() {
  return (
    <section className="container-edge mt-20 md:mt-28">
      <div className="mb-7 flex items-center gap-2">
        <Paw className="h-5 w-5 text-orange" />
        <h2 className="text-2xl font-semibold md:text-3xl">Pokochały to koty i ich ludzie</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <figure key={r.name} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
            <div className="text-sm tracking-wide text-coral">★★★★★</div>
            <blockquote className="flex-1 leading-relaxed text-ink-soft">„{r.text}"</blockquote>
            <figcaption className="text-sm font-medium">{r.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
