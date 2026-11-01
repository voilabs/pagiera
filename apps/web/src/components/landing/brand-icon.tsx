import {
  type SimpleIcon,
  siBun,
  siDocker,
  siModelcontextprotocol,
  siNextdotjs,
  siNodedotjs,
  siOpenrouter,
  siPostgresql,
  siReact,
  siRedis,
  siTailwindcss,
  siTypescript,
  siVercel,
} from "simple-icons";
import type { StackName } from "@/lib/landing-copy";

const ICONS: Record<StackName, SimpleIcon> = {
  "Next.js": siNextdotjs,
  React: siReact,
  TypeScript: siTypescript,
  PostgreSQL: siPostgresql,
  Redis: siRedis,
  "Tailwind CSS": siTailwindcss,
  OpenRouter: siOpenrouter,
  MCP: siModelcontextprotocol,
  Vercel: siVercel,
  Docker: siDocker,
  Bun: siBun,
  "Node.js": siNodedotjs,
};

// Brand colours that are too dark for the night background render white.
function tone(hex: string) {
  const n = Number.parseInt(hex, 16);
  const luminance =
    0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return luminance < 70 ? "#ffffff" : `#${hex}`;
}

export function BrandIcon({ name }: { name: StackName }) {
  const icon = ICONS[name];
  return (
    <svg
      className="brand-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill={tone(icon.hex)}
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}
