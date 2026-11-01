import { Fragment } from "react";

// Splits "\n" into explicit line breaks for display headings.
export function Lines({ text }: { text: string }) {
  return text.split("\n").map((line, index, all) => (
    <Fragment key={line}>
      {line}
      {index < all.length - 1 && <br />}
    </Fragment>
  ));
}

export function Logo({ size = 22 }: { size?: number }) {
  return (
    // biome-ignore lint/performance/noImgElement: small static logo
    <img src="/logo.png" alt="" width={size} height={size} className="logo" />
  );
}

// A 5×5 pixel asterisk, the section marker in the dark band.
export function PixelMark() {
  const on = [0, 2, 4, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 18, 20, 22, 24];
  return (
    <svg className="pixel-mark" viewBox="0 0 50 50" aria-hidden="true">
      {on.map((i) => (
        <rect
          key={i}
          x={(i % 5) * 10 + 1}
          y={Math.floor(i / 5) * 10 + 1}
          width="8"
          height="8"
        />
      ))}
    </svg>
  );
}

// Fading dot field used at the edges of the dark band.
export function PixelField({ className }: { className: string }) {
  const cells: { x: number; y: number; o: number }[] = [];
  for (let y = 0; y < 14; y++)
    for (let x = 0; x < 30; x++) {
      const fade = x / 30 - y / 28 + ((x * 7 + y * 13) % 10) / 22;
      if (fade > 0.45) cells.push({ x, y, o: Math.min(1, fade - 0.35) });
    }
  return (
    <svg className={className} viewBox="0 0 300 140" aria-hidden="true">
      {cells.map((c) => (
        <rect
          key={`${c.x}-${c.y}`}
          x={c.x * 10}
          y={c.y * 10}
          width="4"
          height="4"
          opacity={c.o}
        />
      ))}
    </svg>
  );
}
