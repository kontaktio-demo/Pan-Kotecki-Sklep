export default function Paw({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} fill="currentColor" aria-hidden="true">
      <path d="M36 33c10 0 17 7 17 15.5 0 7-5.5 11-12 11-2.6 0-3.6-1-5-1s-2.4 1-5 1c-6.5 0-12-4-12-11C19 40 26 33 36 33Z" />
      <ellipse cx="16.5" cy="30" rx="6" ry="7.6" transform="rotate(-18 16.5 30)" />
      <ellipse cx="29" cy="19.5" rx="5.8" ry="8" transform="rotate(-7 29 19.5)" />
      <ellipse cx="43" cy="19.5" rx="5.8" ry="8" transform="rotate(7 43 19.5)" />
      <ellipse cx="55.5" cy="30" rx="6" ry="7.6" transform="rotate(18 55.5 30)" />
    </svg>
  );
}
