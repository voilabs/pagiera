import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const packageRoot = resolve(import.meta.dirname, "..");
const from = resolve(packageRoot, "src/internal/app/globals.css");
const source = await readFile(from, "utf8");
const result = await postcss([tailwindcss()]).process(source, { from });
const fontImports = '@import "@fontsource-variable/figtree";\n@import "@fontsource-variable/figtree/wght-italic.css";\n\n';
const css = `${fontImports}${result.css}`;
await writeFile(resolve(packageRoot, "dist/full.css"), css);
