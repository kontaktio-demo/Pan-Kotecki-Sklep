"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { BrandMark } from "@/components/layout/Logo";

const PHRASES = [
  "Dobry wybór! 🐾",
  "Mrau, super!",
  "Wpada do koszyka!",
  "Kot to zaakceptował 🐾",
  "Świetnie!",
];

export default function CatPeek() {
  const bump = useCart((s) => s.bump);
  const [phrase, setPhrase] = useState(PHRASES[0]);

  useEffect(() => {
    if (bump > 0) setPhrase(PHRASES[bump % PHRASES.length]);
  }, [bump]);

  if (bump === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-4 z-[130] flex flex-col items-center sm:right-10"
      aria-hidden="true"
    >
      <div
        key={`bubble-${bump}`}
        className="animate-bubble relative mb-3 rounded-2xl bg-ink px-4 py-2 text-sm font-medium text-milk shadow-xl"
      >
        {phrase}
        <span className="absolute -bottom-1.5 left-1/2 block h-3 w-3 -translate-x-1/2 rotate-45 bg-ink" />
      </div>
      <div
        key={`cat-${bump}`}
        className="animate-peek flex h-24 w-24 items-end justify-center overflow-hidden rounded-t-[2.5rem] border-2 border-b-0 border-orange bg-peach shadow-2xl"
      >
        <BrandMark className="h-[118%] w-[118%] translate-y-1 text-ink" />
      </div>
    </div>
  );
}
