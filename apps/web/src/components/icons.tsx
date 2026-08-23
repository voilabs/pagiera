import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "bolt"
  | "brackets"
  | "check"
  | "chevron"
  | "close"
  | "code"
  | "copy"
  | "cursor"
  | "focus"
  | "frame"
  | "github"
  | "globe"
  | "grid"
  | "heading"
  | "image"
  | "layers"
  | "maximize"
  | "menu"
  | "minus"
  | "moon"
  | "panel"
  | "pin"
  | "play"
  | "plus"
  | "redo"
  | "search"
  | "settings"
  | "sparkles"
  | "text"
  | "trash"
  | "undo";

const paths: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  bolt: <path d="m13 2-8 11h7l-1 9 8-12h-7l1-8Z" />,
  brackets: (
    <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3m8-18h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  code: <path d="m8 9-4 3 4 3m8-6 4 3-4 3m-2-9-4 12" />,
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  cursor: <path d="m5 3 12 9-6 1-3 6L5 3Z" />,
  focus: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
    </>
  ),
  frame: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9.5h16M9.5 4v16" />
    </>
  ),
  github: (
    <>
      <path d="M15 22v-3.6a3.2 3.2 0 0 0-.9-2.5c3-.3 6.1-1.5 6.1-6.6a5.1 5.1 0 0 0-1.4-3.5 4.8 4.8 0 0 0-.1-3.5s-1.1-.3-3.7 1.4a12.6 12.6 0 0 0-6.8 0C5.6 2 4.5 2.3 4.5 2.3a4.8 4.8 0 0 0-.1 3.5A5.1 5.1 0 0 0 3 9.3c0 5.1 3.1 6.3 6.1 6.6a3.2 3.2 0 0 0-.9 2.5V22" />
      <path d="M9 18.5c-4.2 1.3-4.2-2.1-6-2.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z" />
    </>
  ),
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  heading: <path d="M6 5v14M18 5v14M6 12h12" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-2 4 4" />
    </>
  ),
  layers: <path d="m12 3-9 5 9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
  maximize: <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  minus: <path d="M5 12h14" />,
  moon: <path d="M20 14.4A8.5 8.5 0 0 1 9.6 4 8.5 8.5 0 1 0 20 14.4Z" />,
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </>
  ),
  pin: <path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5ZM12 14v6" />,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  redo: <path d="m15 14 5-5-5-5M20 9H9.5a5 5 0 0 0 0 10H13" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  settings: (
    <>
      <path d="M4 8h9m4 0h3M4 16h3m4 0h9" />
      <circle cx="15" cy="8" r="2" />
      <circle cx="9" cy="16" r="2" />
    </>
  ),
  sparkles: (
    <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Zm6 10 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13ZM5 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
  ),
  text: <path d="m5 19 6-14 6 14M8 13h6" />,
  trash: <path d="M4 7h16M9 7V5h6v2M6.5 7l.9 12h9.2l.9-12" />,
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5 5 0 0 1 0 10H11" />,
};

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  );
}
