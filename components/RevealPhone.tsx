"use client";

import { useState } from "react";

// Numer NIE jest zapisany jako tekst w kodzie strony — tylko jako kody znaków,
// składane dopiero po kliknięciu. Boty/scrapery nie wyłapią go z HTML.
// [54,54,51,32,51,54,49,32,50,49,57] = "663 361 219"
const CODES = [54, 54, 51, 32, 51, 54, 49, 32, 50, 49, 57];

export default function RevealPhone({ className = "" }: { className?: string }) {
  const [shown, setShown] = useState(false);
  const display = String.fromCharCode(...CODES);
  const tel = "+48" + display.replace(/\s/g, "");

  if (!shown) {
    return (
      <button
        type="button"
        onClick={() => setShown(true)}
        className="text-base font-medium text-orange-deep underline decoration-dotted underline-offset-2 transition-colors hover:text-coral"
      >
        pokaż numer 🐾
      </button>
    );
  }
  return (
    <a href={`tel:${tel}`} className={className}>
      {display}
    </a>
  );
}
