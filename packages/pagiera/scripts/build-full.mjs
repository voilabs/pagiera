import { build } from "esbuild";
import { resolve } from "node:path";

const packageRoot = resolve(import.meta.dirname, "..");
const internalRoot = resolve(packageRoot, "src/internal");

await build({
    stdin: {
        contents: `import PagieraStudio from "./app/p/editor/editor.tsx"; export { PagieraStudio }; export default PagieraStudio;`,
        resolveDir: internalRoot,
        sourcefile: "pagiera-full-entry.ts",
        loader: "ts",
    },
    outfile: resolve(packageRoot, "dist/full-editor.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    jsx: "automatic",
    sourcemap: true,
    alias: { "@": internalRoot },
    external: ["react", "react-dom", "react/jsx-runtime", "motion/react", "@tabler/icons-react", "radix-ui", "pagiera/provider"],
});

await build({
    entryPoints: [resolve(packageRoot, "src/server-source.ts")],
    outfile: resolve(packageRoot, "dist/server.js"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: ["node20"],
    sourcemap: true,
    alias: { "@": internalRoot },
    external: ["pg", "redis", "drizzle-orm", "drizzle-orm/*", "ai", "@openrouter/ai-sdk-provider", "zod"],
    loader: { ".woff2": "dataurl" },
});

await build({
    stdin: {
        contents: `export { RenderedPage, ElementContent } from "./lib/render/page-render.tsx";`,
        resolveDir: internalRoot,
        sourcefile: "pagiera-renderer-entry.ts",
        loader: "ts",
    },
    outfile: resolve(packageRoot, "dist/runtime.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    jsx: "automatic",
    sourcemap: true,
    alias: { "@": internalRoot },
    external: ["react", "react/jsx-runtime"],
});

await build({
    stdin: {
        contents: `export { loadPageData, PageDataNotFoundError } from "./lib/render/load-data.ts";`,
        resolveDir: internalRoot,
        sourcefile: "pagiera-data-entry.ts",
        loader: "ts",
    },
    outfile: resolve(packageRoot, "dist/data.js"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: ["node20"],
    sourcemap: true,
    alias: { "@": internalRoot },
});
