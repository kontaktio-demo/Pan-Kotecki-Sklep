// Lekki pub/sub do toastów - bez zależności. Komponent Toaster subskrybuje,
// reszta kodu woła toast("Dodano do ulubionych").

export type ToastItem = { id: number; message: string };

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(items);
}

export function toast(message: string) {
  const id = nextId++;
  items = [...items, { id, message }].slice(-3); // max 3 naraz
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 3500);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}
