import { defineConfig, defineDocs } from "fumadocs-mdx/config";
export const docsEn = defineDocs({
  dir: "content/docs/en",
  docs: { postprocess: { extractLinkReferences: true } },
});
export const docsTr = defineDocs({
  dir: "content/docs/tr",
  docs: { postprocess: { extractLinkReferences: true } },
});
export default defineConfig();
