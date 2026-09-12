import assert from "node:assert/strict";
import { interactiveDocument, normalizeInteractive, restoreInteractiveElement } from "../src/internal/lib/editor/interactive";
import { createElement } from "../src/internal/lib/editor/tree";
import { parseElements } from "../src/internal/lib/editor/validate";
import { normalizeCarouselControl, carouselControlAttributes } from "../src/internal/lib/editor/carousel-controls";

assert.equal(normalizeCarouselControl({ action: "bad" }), undefined);
assert.equal(normalizeCarouselControl({ action: "go-to", slide: -1 })?.slide, 1);
const customControl = normalizeCarouselControl({ action: "go-to", slide: 2, activeColor: "#5402e6", inactiveOpacity: 45 })!;
const customButton = { ...createElement("Button", { x: 0, y: 0, z: 0 }), carouselControl: customControl };
assert.deepEqual(parseElements(JSON.parse(JSON.stringify([customButton])))[0].carouselControl, customControl);
assert.equal(carouselControlAttributes(customControl)["data-carousel-target"], 1);
console.log("Custom carousel controls: validation and persistence passed.");

for (const kind of ["carousel", "marquee"] as const) {
    const interactive = normalizeInteractive({ kind })!;
    const element = { ...createElement("Frame", { x: 0, y: 0, z: 0 }), interactive };
    const parsed = parseElements(JSON.parse(JSON.stringify([element])));
    if (kind === "marquee") {
        assert.equal(parsed[0].interactive?.items.length, 0);
        assert.equal(parsed.filter(item => item.parentId === element.id).length, 3);
        assert.equal(parsed.filter(item => item.type === "Text").length, 3);
        const again = parseElements(JSON.parse(JSON.stringify(parsed)));
        const content = (items: typeof parsed) => items.map(({ id, parentId, type, content, base }) => ({ id, parentId, type, content, base }));
        assert.deepEqual(content(again), content(parsed));
    } else {
        assert.equal(parsed[0].interactive?.items.length, 0);
        assert.equal(parsed.filter(item => item.parentId === element.id).length, 3);
        assert.equal(parsed.filter(item => item.type === "Text").length, 3);
        const again = parseElements(JSON.parse(JSON.stringify(parsed)));
        assert.deepEqual(again.map(item => [item.id, item.parentId, item.content]), parsed.map(item => [item.id, item.parentId, item.content]));
    }
    const html = interactiveDocument(interactive);
    assert.deepEqual(restoreInteractiveElement({ code: html }).interactive, interactive);
    assert.equal(restoreInteractiveElement({ code: "unrelated code" }).interactive, undefined);
    const script = html.match(/<script>([\s\S]*)<\/script>/)![1];
    assert.doesNotThrow(() => new Function(script));
    assert.ok(html.includes("prefers-reduced-motion"));
    const unsafe = normalizeInteractive({ kind, items: [{ text: '</script><script>alert(1)</script>', image: 'javascript:alert(1)' }], interval: -5 })!;
    assert.equal(unsafe.items[0].image, "");
    assert.equal(unsafe.interval, 1);
    assert.equal((interactiveDocument(unsafe).match(/<script>/g) ?? []).length, 1);
    console.log(`${kind}: settings round-trip, script syntax and escaping passed.`);
}

for (const transition of ["slide", "fade", "zoom"] as const) {
    const settings = normalizeInteractive({ kind: "carousel", transition, duration: 900, easing: "ease-in-out", loop: false, arrows: false, dots: false, swipe: false, pauseOnHover: false, imageFit: "contain" })!;
    assert.equal(settings.transition, transition);
    assert.equal(settings.loop, false);
    assert.equal(settings.swipe, false);
    assert.equal(settings.duration, 900);
    assert.deepEqual(restoreInteractiveElement({ code: interactiveDocument(settings) }).interactive, settings);
}
const invalid = normalizeInteractive({ kind: "carousel", transition: "bad", duration: Infinity, easing: "injected", imageFit: "bad" })!;
assert.equal(invalid.transition, "slide");
assert.equal(invalid.duration, 450);
assert.equal(invalid.easing, "ease");
assert.equal(invalid.imageFit, "cover");
console.log("Carousel transition/options defaults and legacy recovery passed.");
