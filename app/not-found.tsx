import { Button } from "@/components/ui/Button";
import Paw from "@/components/ui/Paw";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="container-edge relative flex min-h-[64vh] flex-col items-center justify-center py-24 text-center">
        <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-peach text-orange-deep shadow-sm">
          <Paw className="h-7 w-7" />
        </span>
        <p className="font-display text-7xl font-semibold leading-none text-coral md:text-8xl">404</p>
        <h1 className="mt-5 text-2xl font-semibold md:text-3xl">Ta strona się zawieruszyła</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Kot pewnie ją gdzieś zataszczył pod kanapę. Wróćmy na znane terytorium.
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
    </div>
  );
}
