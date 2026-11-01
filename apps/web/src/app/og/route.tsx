import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tr = params.get("locale") === "tr";
  const title = (
    params.get("title") ||
    (tr
      ? "Uygulamanızın içinde görsel düzenleme"
      : "Visual editing built into your app")
  )
    .replace(/\s+/g, " ")
    .slice(0, 140);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#f4f1ea",
        color: "#1b1a21",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #d7d2c6",
          paddingBottom: 24,
        }}
      >
        <span style={{ fontSize: 34, fontWeight: 700 }}>Pagiera</span>
        <span style={{ fontSize: 20, color: "#6b6775" }}>
          React / Next.js / Open source
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 18,
            color: "#3d39a3",
            letterSpacing: 3,
          }}
        >
          {tr ? "TASARLA. BAĞLA. YAYIMLA." : "DESIGN. CONNECT. PUBLISH."}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 85 ? 53 : 66,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -2,
            maxWidth: 1020,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #d7d2c6",
          paddingTop: 24,
        }}
      >
        <span style={{ fontSize: 20, color: "#6b6775" }}>
          {tr
            ? "Sizin uygulamanız. Sizin veriniz."
            : "Your application. Your data."}
        </span>
        <div style={{ display: "flex", gap: 7 }}>
          {[0, 1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                width: 16,
                height: 16,
                background: n % 2 ? "#bcb9db" : "#3d39a3",
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
