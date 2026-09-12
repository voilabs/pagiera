import assert from "node:assert/strict";
import { ICON_PACKS, loadIconPack, iconNames, iconSvg } from "../src/internal/lib/editor/icon-library";
import { createElement } from "../src/internal/lib/editor/tree";
import { parseElements } from "../src/internal/lib/editor/validate";

for (const pack of ICON_PACKS) {
    const data = await loadIconPack(pack.id);
    const names = iconNames(data);
    assert.ok(names.length > 1000);
    for (const name of names) {
        const svg = iconSvg(data, name);
        assert.ok(svg.startsWith("<svg"), `${pack.id}:${name} missing SVG`);
        const icon = { ...createElement("Icon", { x: 0, y: 0, z: 0 }), svg };
        const [restored] = parseElements(JSON.parse(JSON.stringify([icon])));
        assert.equal(restored.svg, svg, `${pack.id}:${name} changed on save`);
    }
    console.log(`${pack.name}: ${names.length} icons and aliases passed SVG/save round-trip.`);
}
