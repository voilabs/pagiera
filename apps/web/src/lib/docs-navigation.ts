import type { Folder, Root } from "fumadocs-core/page-tree";
import enMeta from "../../content/docs/en/meta.json";
import trMeta from "../../content/docs/tr/meta.json";
import { DOCS } from "./docs-catalog";
import { DOCS_CATALOG_TR } from "./docs-catalog-tr";

// The locale meta files own ordering and categories; URLs remain unchanged.
export function docsCategories(locale: "en" | "tr") {
  const categories: {
    title: string;
    pages: { slug: string; title: string; description: string }[];
  }[] = [];
  for (const entry of (locale === "tr" ? trMeta : enMeta).pages) {
    if (entry.startsWith("---")) {
      categories.push({ title: entry.slice(3, -3), pages: [] });
      continue;
    }
    if (entry === "index") continue;
    const doc = DOCS.find((doc) => doc.slug === entry);
    if (!doc) throw new Error(`Missing documentation catalog entry: ${entry}`);
    const copy = locale === "tr" ? DOCS_CATALOG_TR[doc.slug] : doc;
    categories.at(-1)?.pages.push({
      slug: doc.slug,
      title: copy.title,
      description: copy.description,
    });
  }
  return categories;
}

export function categorizedDocsTree(tree: Root): Root {
  const children: Root["children"] = [];
  let folder: Folder | undefined;
  for (const node of tree.children) {
    if (node.type === "separator") {
      folder = {
        type: "folder",
        $id: `${tree.$id ?? "docs"}:category:${children.length}`,
        name: node.name,
        defaultOpen: children.length <= 1,
        children: [],
      };
      children.push(folder);
    } else if (folder) {
      folder.children.push(node);
    } else {
      children.push(node);
    }
  }
  return { ...tree, children };
}
