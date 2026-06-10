type IconName =
  | "home"
  | "orders"
  | "products"
  | "stats"
  | "more"
  | "bell"
  | "plus"
  | "back"
  | "chevron"
  | "search"
  | "refresh"
  | "swap"
  | "check"
  | "tag"
  | "users"
  | "settings"
  | "truck"
  | "trash"
  | "star"
  | "close";

const PATHS: Record<IconName, string> = {
  home: "M3 10.7 12 3l9 7.7M5 9.5V21h5v-6h4v6h5V9.5",
  orders: "M6 2h12v20l-3-2-3 2-3-2-3 2V2ZM9 7h6M9 11h6M9 15h4",
  products: "M6 8h12l-1 13H7L6 8ZM9 8a3 3 0 0 1 6 0",
  stats: "M3 21h18M6 21v-7M12 21V4M18 21v-10",
  more: "M4 5h7v6H4zM13 5h7v6h-7zM4 13h7v6H4zM13 13h7v6h-7z",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 7 2 7H4s2-2 2-7M10 21a2 2 0 0 0 4 0",
  plus: "M12 5v14M5 12h14",
  back: "M15 18l-6-6 6-6",
  chevron: "M9 6l6 6-6 6",
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.3-4.3",
  refresh: "M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5",
  swap: "M7 16H3l4-4M3 16l4 4M17 8h4l-4-4M21 8l-4 4",
  check: "M5 12l4 4L19 6",
  tag: "M3 12V4h8l9 9-8 8-9-9ZM7.5 7.5h.01",
  users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 20v-2a4 4 0 0 0-3-3.9M16 4.1a4 4 0 0 1 0 7.8",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.3-1.3L13.7 2h-3.4l-.3 2.5A7 7 0 0 0 7.7 5.8l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5.3 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.3 1.3l.3 2.5h3.4l.3-2.5a7 7 0 0 0 2.3-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3Z",
  truck: "M3 6h11v9H3zM14 9h4l3 3v3h-7zM7 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M18 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6",
  star: "M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17.2 6.5 20l1-6.1L3 9.5l6.3-.9L12 3Z",
  close: "M6 6l12 12M18 6L6 18",
};

export default function Icon({
  name,
  className = "",
  size = 22,
  strokeWidth = 2,
}: {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
