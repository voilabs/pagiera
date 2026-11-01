import Image from "next/image";
import layersShot from "../../../public/editor/editor-layers.png";

export function StudioVisual({ alt }: { alt: string }) {
  return (
    <div className="visual-shot">
      <Image
        src={layersShot}
        alt={alt}
        sizes="(max-width: 900px) 100vw, 560px"
        placeholder="blur"
      />
    </div>
  );
}

export function DataVisual() {
  const rows = [
    ["Spring launch notes", "Product", "Mar 12"],
    ["Designing with tokens", "Design", "Mar 04"],
    ["Edge caching, simply", "Engineering", "Feb 21"],
  ];
  return (
    <div className="visual-card" aria-hidden="true">
      <div className="vd-request">
        <span className="vd-method">GET</span>
        <code>/api/posts?limit=3</code>
        <span className="vd-ok">200</span>
      </div>
      <div className="vd-repeat">
        <span className="vd-label">Repeat · post</span>
        {rows.map(([title, tag, date]) => (
          <div className="vd-row" key={title}>
            <span className="vd-thumb" />
            <span className="vd-title">{title}</span>
            <span className="vd-tag">{tag}</span>
            <span className="vd-date">{date}</span>
          </div>
        ))}
      </div>
      <div className="vd-token">
        <code>{"{{ post.title | upper }}"}</code>
      </div>
    </div>
  );
}

export function ActionsVisual() {
  return (
    <svg
      className="visual-svg"
      viewBox="0 0 560 360"
      role="img"
      aria-label="On click → Branch → Show layer or Hide layer"
    >
      <defs>
        <linearGradient id="wire" x1="0" x2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#ff8fb1" />
        </linearGradient>
      </defs>
      <path
        d="M178 110 C 220 110, 220 180, 262 180"
        stroke="url(#wire)"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M398 166 C 430 166, 430 92, 462 92"
        stroke="url(#wire)"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M398 200 C 430 200, 430 268, 462 268"
        stroke="url(#wire)"
        strokeWidth="3"
        fill="none"
      />
      <Node x={30} y={70} title="On click" sub="Button" tone="#ff8fb1" />
      <Node
        x={262}
        y={140}
        title="Branch"
        sub="Is layer visible"
        tone="#7c5cff"
        w={136}
      />
      <Node x={462} y={52} title="Hide" sub="Panel" tone="#3fb9a8" w={78} />
      <Node x={462} y={228} title="Show" sub="Panel" tone="#3fb9a8" w={78} />
      <text x="390" y="170" textAnchor="end" className="svg-pin">
        True
      </text>
      <text x="390" y="204" textAnchor="end" className="svg-pin">
        False
      </text>
    </svg>
  );
}

function Node({
  x,
  y,
  title,
  sub,
  tone,
  w = 148,
}: {
  x: number;
  y: number;
  title: string;
  sub: string;
  tone: string;
  w?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={w}
        height="80"
        rx="14"
        fill="#fff"
        stroke="#e6e1f5"
        filter="drop-shadow(0 8px 18px rgba(60,40,120,.10))"
      />
      <rect width={w} height="6" rx="3" fill={tone} />
      <text x="14" y="38" className="svg-title">
        {title}
      </text>
      <text x="14" y="60" className="svg-sub">
        {sub}
      </text>
    </g>
  );
}

export function MotionVisual() {
  const tracks: { name: string; keys: number[] }[] = [
    { name: "Opacity", keys: [0, 38] },
    { name: "Translate Y", keys: [0, 46, 70] },
    { name: "Scale", keys: [12, 52] },
    { name: "Blur", keys: [0, 30] },
  ];
  return (
    <div className="visual-card visual-motion" aria-hidden="true">
      <div className="vm-ruler">
        {["0s", "0.4s", "0.8s", "1.2s"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      {tracks.map((track) => (
        <div className="vm-track" key={track.name}>
          <span className="vm-name">{track.name}</span>
          <span className="vm-lane">
            <span
              className="vm-bar"
              style={{
                left: `${track.keys[0]}%`,
                width: `${track.keys[track.keys.length - 1] - track.keys[0]}%`,
              }}
            />
            {track.keys.map((k) => (
              <span className="vm-key" key={k} style={{ left: `${k}%` }} />
            ))}
          </span>
        </div>
      ))}
      <svg className="vm-curve" viewBox="0 0 440 80" aria-hidden="true">
        <path
          d="M8 74 L 170 74 M 432 6 L 230 6"
          stroke="#f3c2d4"
          strokeWidth="1.5"
        />
        <path
          d="M8 74 C 170 74, 230 6, 432 6"
          fill="none"
          stroke="#7c5cff"
          strokeWidth="2.5"
        />
        <circle cx="170" cy="74" r="5" fill="#ff8fb1" />
        <circle cx="230" cy="6" r="5" fill="#ff8fb1" />
      </svg>
      <span className="vm-playhead" />
    </div>
  );
}

export function CliVisual() {
  return (
    <div className="visual-terminal" aria-hidden="true">
      <p>
        <span className="t-prompt">$</span> pagiera page validate --file
        about.json
      </p>
      <p className="t-ok">✓ valid · 42 elements · 3 breakpoints</p>
      <p>
        <span className="t-prompt">$</span> pagiera page update PAGE_ID --file
        about.json --expected-version 3
      </p>
      <p className="t-ok">✓ saved · version 4</p>
      <p className="t-dim">draft updated; publish when ready</p>
      <p>
        <span className="t-prompt">$</span> <span className="t-caret" />
      </p>
    </div>
  );
}

// Deterministic pseudo-random numbers so server and client render the same dots.
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

// An engraving-style rendering of the Pagiera mark: hatched sun, contour lines
// and a cross-hatched logo, drawn entirely with strokes.
export function Etching() {
  const rand = seeded(7);
  const dots = Array.from({ length: 220 }, () => {
    const angle = rand() * Math.PI * 2;
    const radius = 250 + rand() * 170;
    return {
      x: 450 + Math.cos(angle) * radius * 1.25,
      y: 280 + Math.sin(angle) * radius * 0.62,
      r: 0.6 + rand() * 1.3,
    };
  }).filter((d) => d.x > 10 && d.x < 890 && d.y > 10 && d.y < 510);
  const contours = Array.from({ length: 11 }, (_, i) => 150 + i * 16);
  const sunLines = Array.from({ length: 46 }, (_, i) => 60 + i * 9);
  const clouds = [
    { x: 150, y: 400, w: 210, h: 70 },
    { x: 270, y: 440, w: 170, h: 52 },
    { x: 690, y: 380, w: 230, h: 76 },
    { x: 590, y: 446, w: 160, h: 50 },
  ];
  return (
    <svg
      className="etching"
      viewBox="0 0 900 520"
      role="img"
      aria-label="Engraving of the Pagiera mark rising like a sun above clouds"
    >
      <defs>
        <clipPath id="etch-sun">
          <circle cx="450" cy="250" r="210" />
        </clipPath>
        <pattern
          id="etch-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </pattern>
        <pattern
          id="etch-cross"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-35)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <line
            x1="0"
            y1="0"
            x2="5"
            y2="0"
            stroke="currentColor"
            strokeWidth="0.9"
          />
        </pattern>
        <pattern
          id="etch-cloud"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="2"
            x2="4"
            y2="2"
            stroke="currentColor"
            strokeWidth="0.9"
          />
        </pattern>
      </defs>

      <g clipPath="url(#etch-sun)" opacity="0.55">
        {sunLines.map((y, i) => (
          <line
            key={y}
            x1="230"
            x2="670"
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeWidth={0.5 + (i / sunLines.length) * 1.6}
          />
        ))}
      </g>
      <circle
        cx="450"
        cy="250"
        r="210"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />

      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2;
        return (
          <line
            key={a}
            x1={450 + Math.cos(a) * 222}
            y1={250 + Math.sin(a) * 222}
            x2={450 + Math.cos(a) * (240 + (i % 3) * 18)}
            y2={250 + Math.sin(a) * (240 + (i % 3) * 18)}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.7"
          />
        );
      })}

      <g transform="rotate(-6 450 250)">
        {contours.map((size, i) => (
          <rect
            key={size}
            x={450 - size / 2}
            y={250 - size / 2}
            width={size}
            height={size}
            rx={size * 0.26}
            fill="none"
            stroke="currentColor"
            strokeWidth={i === 0 ? 1.4 : 0.7}
            opacity={1 - i * 0.07}
          />
        ))}
        <rect
          x="380"
          y="180"
          width="140"
          height="140"
          rx="36"
          fill="var(--paper)"
        />
        <rect
          x="380"
          y="180"
          width="140"
          height="140"
          rx="36"
          fill="url(#etch-hatch)"
        />
        <rect
          x="400"
          y="200"
          width="100"
          height="100"
          rx="26"
          fill="var(--paper)"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="400"
          y="200"
          width="100"
          height="100"
          rx="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          transform="translate(4 4)"
        />
        <rect
          x="448"
          y="248"
          width="56"
          height="56"
          rx="16"
          fill="url(#etch-cross)"
        />
        <rect
          x="448"
          y="248"
          width="56"
          height="56"
          rx="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </g>

      {clouds.map((c) => (
        <g key={c.x}>
          <ellipse
            cx={c.x}
            cy={c.y}
            rx={c.w / 2}
            ry={c.h / 2}
            fill="var(--paper)"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <ellipse
            cx={c.x}
            cy={c.y + c.h * 0.18}
            rx={c.w / 2 - 6}
            ry={c.h / 2 - 8}
            fill="url(#etch-cloud)"
            opacity="0.65"
          />
          <path
            d={`M${c.x - c.w / 2 + 10} ${c.y - 4} q ${c.w / 6} -${c.h / 2} ${c.w / 3} 0 q ${c.w / 6} -${c.h / 2.4} ${c.w / 3} 0`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </g>
      ))}

      {dots.map((d) => (
        <circle
          key={`${d.x}-${d.y}`}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill="currentColor"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

// Small engraving-style sketches for the navigation menus.
function SketchDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern
        id={`${id}-hatch`}
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="5"
          stroke="currentColor"
          strokeWidth="1"
        />
      </pattern>
      <pattern
        id={`${id}-lines`}
        width="4"
        height="4"
        patternUnits="userSpaceOnUse"
      >
        <line
          x1="0"
          y1="2"
          x2="4"
          y2="2"
          stroke="currentColor"
          strokeWidth="0.7"
        />
      </pattern>
    </defs>
  );
}

export function SketchMotion() {
  const keys = [
    [40, 150],
    [120, 150],
    [190, 60],
    [260, 60],
  ];
  return (
    <svg className="sketch" viewBox="0 0 300 200" aria-hidden="true">
      <SketchDefs id="sm" />
      <circle cx="210" cy="78" r="62" fill="url(#sm-lines)" opacity="0.55" />
      <circle
        cx="210"
        cy="78"
        r="62"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1="24"
          x2="282"
          y1={40 + i * 30}
          y2={40 + i * 30}
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 4"
        />
      ))}
      <path
        d="M40 150 C 120 150, 110 60, 190 60 L 260 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M44 156 C 124 156, 114 66, 194 66 L 264 66"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
      />
      <path
        d="M40 150 C 120 150, 110 60, 190 60 L 190 170 L 40 170 Z"
        fill="url(#sm-hatch)"
        opacity="0.5"
      />
      {keys.map(([x, y]) => (
        <rect
          key={x}
          x={x - 6}
          y={y - 6}
          width="12"
          height="12"
          transform={`rotate(45 ${x} ${y})`}
          fill="var(--paper)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
      <line
        x1="150"
        x2="150"
        y1="22"
        y2="182"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M144 22 h12 l-6 8 z" fill="currentColor" />
    </svg>
  );
}

export function SketchBook() {
  return (
    <svg className="sketch" viewBox="0 0 300 200" aria-hidden="true">
      <SketchDefs id="sb" />
      <ellipse
        cx="150"
        cy="176"
        rx="118"
        ry="12"
        fill="url(#sb-lines)"
        opacity="0.6"
      />
      <path
        d="M150 52 C 115 36, 72 36, 40 46 L 40 166 C 72 156, 115 156, 150 172 Z"
        fill="var(--paper)"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M150 52 C 185 36, 228 36, 260 46 L 260 166 C 228 156, 185 156, 150 172 Z"
        fill="var(--paper)"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M150 52 C 185 36, 228 36, 260 46 L 260 166 C 228 156, 185 156, 150 172 Z"
        fill="url(#sb-hatch)"
        opacity="0.35"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M58 ${72 + i * 14} C 85 ${66 + i * 14}, 112 ${66 + i * 14}, 136 ${76 + i * 14}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity={i === 2 ? 0.35 : 0.8}
        />
      ))}
      <rect
        x="170"
        y="70"
        width="70"
        height="44"
        rx="6"
        fill="var(--paper)"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M178 104 l14 -14 10 9 12 -16 18 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="150"
        y1="52"
        x2="150"
        y2="172"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M150 52 L 150 20"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
      <circle
        cx="150"
        cy="16"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

export function SketchData() {
  return (
    <svg className="sketch" viewBox="0 0 300 200" aria-hidden="true">
      <SketchDefs id="sd" />
      <ellipse
        cx="62"
        cy="52"
        rx="38"
        ry="12"
        fill="var(--paper)"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M24 52 v70 a38 12 0 0 0 76 0 v-70"
        fill="url(#sd-lines)"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M24 76 a38 12 0 0 0 76 0 M24 100 a38 12 0 0 0 76 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M110 92 C 140 92, 140 60, 168 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />
      <path
        d="M162 55 l8 5 -8 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(176 ${34 + i * 46})`}>
          <rect
            width="104"
            height="36"
            rx="5"
            fill="var(--paper)"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="6"
            y="6"
            width="24"
            height="24"
            rx="3"
            fill="url(#sd-hatch)"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          <line
            x1="38"
            x2="92"
            y1="14"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <line
            x1="38"
            x2={70 - i * 8}
            y1="24"
            y2="24"
            stroke="currentColor"
            strokeWidth="0.8"
          />
        </g>
      ))}
      <path
        d="M168 38 v134"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="2 4"
      />
    </svg>
  );
}

export function SketchGraph() {
  const node = (x: number, y: number, w: number) => (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={w}
        height="38"
        rx="6"
        fill="var(--paper)"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect width={w} height="7" rx="3" fill="url(#sg-hatch)" />
      <line
        x1="10"
        x2={w - 18}
        y1="21"
        y2="21"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line
        x1="10"
        x2={w - 34}
        y1="29"
        y2="29"
        stroke="currentColor"
        strokeWidth="0.7"
      />
    </g>
  );
  return (
    <svg className="sketch" viewBox="0 0 300 200" aria-hidden="true">
      <SketchDefs id="sg" />
      <circle cx="150" cy="100" r="78" fill="url(#sg-lines)" opacity="0.4" />
      <path
        d="M86 80 C 112 80, 106 104, 124 104"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M196 96 C 216 96, 210 54, 228 54"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M196 112 C 216 112, 210 150, 228 150"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {node(14, 62, 72)}
      {node(124, 85, 72)}
      {node(228, 36, 60)}
      {node(228, 131, 60)}
      {[
        [86, 80],
        [124, 104],
        [196, 96],
        [196, 112],
        [228, 54],
        [228, 150],
      ].map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r="3.2"
          fill="var(--paper)"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}
