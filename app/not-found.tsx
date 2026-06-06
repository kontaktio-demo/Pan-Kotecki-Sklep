import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-edge flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-7xl font-semibold tracking-tight text-coral md:text-8xl">404</p>
      <h1 className="mt-4 text-2xl font-semibold md:text-3xl">Ta strona się zawieruszyła</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        Kot pewnie ją gdzieś zataszczył. Wróćmy na znane terytorium.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/sklep" arrow>
          Przejdź do sklepu
        </Button>
        <Button href="/" variant="outline">
          Strona główna
        </Button>
      </div>
    </div>
  );
}
