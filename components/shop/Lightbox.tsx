"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

// Pełnoekranowy podgląd zdjęć produktu: strzałki, swipe, Esc, fokus wraca
// do elementu, który otworzył podgląd.
export default function Lightbox({
  images,
  startIndex,
  alt,
  onClose,
}: {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      restoreFocus.current?.focus();
    };
  }, [onClose, prev, next]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Podgląd zdjęć: ${alt}`}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/95 p-4"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 48) (dx > 0 ? prev : next)();
        touchStartX.current = null;
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Zamknij podgląd"
        className="tap absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-milk/10 text-milk transition-colors hover:bg-milk/20"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <div className="relative h-[82vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <Image src={images[index]} alt={`${alt} - zdjęcie ${index + 1}`} fill sizes="100vw" className="object-contain" priority />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Poprzednie zdjęcie"
            className="tap absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-milk/10 p-3 text-milk transition-colors hover:bg-milk/20 md:left-6"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Następne zdjęcie"
            className="tap absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-milk/10 p-3 text-milk transition-colors hover:bg-milk/20 md:right-6"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-milk/10 px-3 py-1 text-xs text-milk tabular-nums">
            {index + 1} / {images.length}
          </p>
        </>
      )}
    </div>
  );
}
