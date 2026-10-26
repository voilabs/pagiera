import assert from "node:assert/strict";
import { bindElement } from "../src/internal/lib/render/bind";

// Bağlanan verinin biçimi ve güvenli şablon ifadeleri. `bun scripts/test-binding-format.ts`
const describe = (_name: string, run: () => void) => run();
const test = (name: string, run: () => void) => {
    try {
        run();
    } catch (error) {
        console.error(`✗ ${name}`);
        throw error;
    }
};
const expect = (value: unknown) => ({
    toBe: (expected: unknown) => assert.equal(value, expected),
    toEqual: (expected: unknown) => assert.deepEqual(value, expected),
    toBeUndefined: () => assert.equal(value, undefined),
    toBeNull: () => assert.equal(value, null),
    toContain: (part: string) => assert.ok(String(value).includes(part), `${String(value)} should contain ${part}`),
    not: { toContain: (part: string) => assert.ok(!String(value).includes(part), `${String(value)} should not contain ${part}`) },
});
import { evaluate } from "../src/internal/lib/data/expression";
import { formatValue, parsePipes } from "../src/internal/lib/data/format";
import { bindTemplate } from "../src/internal/lib/render/bind";
import { parseElements } from "../src/internal/lib/editor/validate";

const row = {
    title: "merhaba-dunya",
    status: "draft",
    price: 1000,
    stock: 0,
    author: { name: "Bilal", bio: null },
    tags: [{ name: "next" }, { name: "react" }, { name: "pagiera" }],
    items: [{ type: "side", price: 5 }, { type: "main", price: 40 }],
    published_at: "2026-10-24T09:05:00Z",
    views: "1200",
};
const t = (template: string) => bindTemplate(template, row);

describe("ifadeler", () => {
    test("koşul ve eşitlik", () => {
        expect(t('{{status == "draft" ? "Taslak" : "Yayında"}}')).toBe("Taslak");
        expect(t('{{stock > 0 ? "Stokta" : "Tükendi"}}')).toBe("Tükendi");
        expect(t('{{views >= 1000 ? "Popüler" : ""}}')).toBe("Popüler");
        expect(t('{{status != "draft" && "x" || "y"}}')).toBe("y");
    });
    test("metin işlemleri", () => {
        expect(t('{{title.replace("-", " ")}}')).toBe("merhaba dunya");
        expect(t('{{title.replaceAll("a", "4").toUpperCase()}}')).toBe("MERH4B4-DUNY4");
        expect(t('{{title.split("-")[1]}}')).toBe("dunya");
        expect(t("{{title.slice(0, 3) + '…'}}")).toBe("mer…");
        expect(t("{{title.length}}")).toBe("13");
    });
    test("listeler ve seçme", () => {
        expect(t('{{tags.map(t => t.name).join(", ")}}')).toBe("next, react, pagiera");
        expect(t('{{tags.filter(t => t.name.startsWith("p")).length}}')).toBe("1");
        expect(t('{{items.find(i => i.type == "main").price * 1.2}}')).toBe("48");
        expect(t("{{tags[0].name}}")).toBe("next");
        expect(t("{{tags.at(-1).name}}")).toBe("pagiera");
        expect(t('{{items.map((i, n) => n + ":" + i.type).join(" ")}}')).toBe("0:side 1:main");
    });
    test("boşluk ve güvenli zincir", () => {
        expect(t('{{author.bio ?? "Biyografi yok"}}')).toBe("Biyografi yok");
        expect(t('{{author?.missing?.deep ?? "—"}}')).toBe("—");
        expect(t('{{nothing.at.all | default:"yok"}}')).toBe("yok");
    });
    test("yardımcılar ve borularla birlikte", () => {
        expect(t('{{date(published_at, "d MMMM yyyy", "tr-TR")}}')).toBe("24 Ekim 2026");
        expect(t('{{price * 1.2 | currency:TRY | locale:tr-TR | number:0}}')).toBe("1.200");
        expect(t("{{Math.round(price / 3, 2)}}")).toBe("333.33");
        expect(t('{{price > 500 || stock > 0 ? "a" : "b"}}')).toBe("a");
    });
    test("map ve replace boruları", () => {
        expect(t("{{status | map:draft=Taslak,published=Yayında}}")).toBe("Taslak");
        expect(t('{{status | map:published=Yayında,*="Bilinmiyor"}}')).toBe("Bilinmiyor");
        expect(t('{{title | replace:"-"," " | capitalize}}')).toBe("Merhaba Dunya");
        expect(parsePipes('x | replace:"a,b","c"').format?.replace).toEqual([["a,b", "c"]]);
        expect(formatValue("draft", { map: { draft: "" }, empty: "boş" })).toBe("boş");
    });
});

describe("güvenlik", () => {
    const attacks = [
        "constructor.constructor('return process')()",
        "title.constructor",
        "tags.constructor.constructor('return 1')()",
        "title.__proto__",
        "this",
        "process.env",
        "globalThis",
        "require('fs')",
        "import('fs')",
        "Function('return 1')()",
        "eval('1')",
        "fetch('http://x')",
        "tags.map.call",
        "Math.constructor",
        "title.valueOf()",
        "tags.push(1)",
        "(x => x)",
        "items.sort.constructor",
    ];
    for (const attack of attacks)
        test(attack, () => {
            const value = evaluate(attack, { row });
            expect(typeof value === "function").toBe(false);
            expect(value === undefined || typeof value !== "object" || Array.isArray(value)).toBe(true);
            expect(String(value ?? "")).not.toContain("function");
        });

    test("satırı değiştiremez", () => {
        evaluate('tags.reverse()', { row });
        evaluate('tags.sort()', { row });
        expect(row.tags[0]!.name).toBe("next");
    });
    test("sonsuz iş ve şişme durdurulur", () => {
        expect(evaluate('"x".repeat(100000)', { row })).toBeUndefined();
        const huge = Array.from({ length: 900 }, (_, i) => i);
        expect(evaluate("list.map(a => list.map(b => a + b)).length", { row: { list: huge } })).toBeUndefined();
        expect(evaluate("a".repeat(600), { row })).toBeUndefined();
    });
    test("bozuk ifade boş döner", () => {
        expect(t("{{title.(}}")).toBe("");
        expect(t('{{"unterminated}}')).toBe("");
    });
    test("doğrulama map/replace'i süzer", () => {
        const [e] = parseElements([{ id: "v", type: "Text", z: 0, base: {}, bindingFormat: { map: { draft: "T", __proto__: "x", n: 5 }, replace: [["a", "b"], ["", "x"], "bad"] } }]) as any[];
        expect(e.bindingFormat).toEqual({ map: { draft: "T" }, replace: [["a", "b"]] });
    });
});

describe("biçimler", () => {
    const iso = "2026-10-24T09:05:07.000Z";
    const tr = { kind: "date" as const, locale: "tr-TR", timeZone: "Europe/Istanbul" };
    test("tarih", () => {
        expect(formatValue(iso, { ...tr, pattern: "d MMMM yyyy" })).toBe("24 Ekim 2026");
        expect(formatValue(iso, { ...tr, pattern: "dd.MM.yyyy HH:mm" })).toBe("24.10.2026 12:05");
        expect(formatValue(iso, { ...tr, pattern: "EEEE, d MMM 'saat' H:mm" })).toBe("Cumartesi, 24 Eki saat 12:05");
        expect(formatValue(iso, { kind: "date", locale: "en-US", pattern: "MMMM d, yyyy h:mm a" })).toBe("October 24, 2026 9:05 AM");
        expect(formatValue("yarın", { kind: "date", pattern: "d MMMM" })).toBe("yarın");
    });
    test("sayı ve metin", () => {
        expect(formatValue(1234567.891, { kind: "number", locale: "tr-TR", decimals: 2 })).toBe("1.234.567,89");
        expect(formatValue("1499.9", { kind: "currency", currency: "TRY", locale: "tr-TR", decimals: 2 })).toBe("₺1.499,90");
        expect(formatValue("istanbul ılık", { transform: "upper", locale: "tr-TR" })).toBe("İSTANBUL ILIK");
        expect(formatValue("abcdefghij", { maxLength: 4 })).toBe("abcd…");
    });
    test("boşsa", () => {
        for (const value of [null, undefined, "", "  ", []]) expect(formatValue(value, { empty: "Yok" })).toBe("Yok");
        expect(formatValue(0, { empty: "Yok" })).toBe("0");
        expect(formatValue(null, { prefix: "₺" })).toBe("");
    });
    test("bağlı öğe", () => {
        const bound = { id: "b", type: "Text", z: 0, base: {}, content: "x", binding: "price", bindingFormat: { kind: "currency", currency: "TRY", locale: "tr-TR", decimals: 0 } } as never;
        expect((bindElement(bound, row) as { content?: string }).content).toBe("₺1.000");
        const missing = { id: "m", type: "Text", z: 0, base: {}, binding: "subtitle", bindingFormat: { empty: "Alt başlık yok" } } as never;
        expect((bindElement(missing, row) as { content?: string }).content).toBe("Alt başlık yok");
        const page = { id: "p", type: "Text", z: 0, base: {}, content: "{{title}} · {{params.slug}}" } as never;
        expect((bindElement(page, row) as { content?: string }).content).toBe("merhaba-dunya · {{params.slug}}");
    });
});

console.log("binding format: ok");
