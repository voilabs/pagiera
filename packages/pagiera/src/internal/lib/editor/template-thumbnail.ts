type ThumbnailTemplate = {
    name: string;
    category: string;
    preview: {
        background: string;
        foreground: string;
        accent: string;
        eyebrow: string;
        headline: string;
    };
};

const xml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const lines = (value: string, max = 24) => {
    const words = value.split(/\s+/);
    const result: string[] = [];
    for (const word of words) {
        const current = result.at(-1);
        if (!current || `${current} ${word}`.length > max) result.push(word);
        else result[result.length - 1] = `${current} ${word}`;
    }
    return result.slice(0, 4);
};

/** Deterministic package-owned fallback preview for every catalog entry. */
export function templateThumbnailSvg(template: ThumbnailTemplate) {
    const titleLines = lines(template.preview.headline);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750" role="img" aria-labelledby="title desc">
  <title id="title">${xml(template.name)} template preview</title>
  <desc id="desc">Automatically generated Pagiera catalog thumbnail.</desc>
  <defs>
    <radialGradient id="glow" cx="86%" cy="8%" r="70%"><stop offset="0" stop-color="${xml(template.preview.accent)}" stop-opacity=".82"/><stop offset="1" stop-color="${xml(template.preview.accent)}" stop-opacity="0"/></radialGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".025"/></linearGradient>
  </defs>
  <rect width="1200" height="750" rx="32" fill="${xml(template.preview.background)}"/>
  <rect width="1200" height="750" rx="32" fill="url(#glow)"/>
  <rect x="48" y="40" width="1104" height="54" rx="27" fill="url(#glass)" stroke="${xml(template.preview.foreground)}" stroke-opacity=".12"/>
  <circle cx="78" cy="67" r="7" fill="${xml(template.preview.accent)}"/><text x="98" y="73" fill="${xml(template.preview.foreground)}" font-family="Arial, sans-serif" font-size="18" font-weight="700">${xml(template.name)}</text>
  <text x="1095" y="73" text-anchor="end" fill="${xml(template.preview.foreground)}" fill-opacity=".55" font-family="Arial, sans-serif" font-size="14">${xml(template.category.toUpperCase())}</text>
  <text x="70" y="178" fill="${xml(template.preview.accent)}" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="3">${xml(template.preview.eyebrow)}</text>
  ${titleLines.map((line, index) => `<text x="70" y="${278 + index * 82}" fill="${xml(template.preview.foreground)}" font-family="Arial, sans-serif" font-size="76" font-weight="700" letter-spacing="-4">${xml(line)}</text>`).join("\n  ")}
  <rect x="70" y="630" width="196" height="52" rx="26" fill="${xml(template.preview.accent)}"/><text x="168" y="663" text-anchor="middle" fill="${xml(template.preview.background)}" font-family="Arial, sans-serif" font-size="16" font-weight="700">Explore template</text>
  <rect x="870" y="500" width="250" height="182" rx="24" fill="url(#glass)" stroke="${xml(template.preview.foreground)}" stroke-opacity=".14"/>
  <circle cx="995" cy="572" r="42" fill="${xml(template.preview.accent)}"/><rect x="906" y="638" width="178" height="10" rx="5" fill="${xml(template.preview.foreground)}" fill-opacity=".5"/><rect x="936" y="658" width="118" height="8" rx="4" fill="${xml(template.preview.foreground)}" fill-opacity=".25"/>
</svg>\n`;
}
