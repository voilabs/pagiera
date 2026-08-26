import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PagieraDocument } from "pagiera";

export type TemplateCatalogItem = {
  id: string;
  version: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  pages: string[];
  featured: boolean;
  preview: {
    background: string;
    foreground: string;
    accent: string;
    eyebrow: string;
    headline: string;
  };
};

type RegistryEntry = TemplateCatalogItem & { file: string };
type Registry = { schemaVersion: number; templates: RegistryEntry[] };
type TemplatePage = {
  name: string;
  slug: string;
  elements: PagieraDocument["elements"];
  rootStyle: Partial<PagieraDocument["rootStyle"]>;
  dataSources?: unknown[];
};
type TemplateBundle = {
  schemaVersion: number;
  id: string;
  pages: TemplatePage[];
};

const DEFAULT_REPOSITORY = "voilabs/pagiera";
const DEFAULT_REF = "main";
const JSON_CACHE_TTL = 60_000;
const jsonCache = new Map<
  string,
  { expiresAt: number; value: Registry | TemplateBundle }
>();

function repository() {
  const value =
    process.env.PAGIERA_TEMPLATES_REPOSITORY?.trim() || DEFAULT_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(value)) {
    throw new Error(
      "PAGIERA_TEMPLATES_REPOSITORY must use the owner/repository format.",
    );
  }
  return value;
}

function repositoryRef() {
  return process.env.PAGIERA_TEMPLATES_REF?.trim() || DEFAULT_REF;
}

function githubPath(path: string) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

async function readGithubJson<T extends Registry | TemplateBundle>(
  path: string,
): Promise<T> {
  const repo = repository();
  const ref = repositoryRef();
  const token = process.env.GITHUB_TOKEN?.trim();
  const key = `${repo}@${ref}:${path}`;
  const cached = jsonCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const encodedPath = githubPath(path);
  const url = token
    ? `https://api.github.com/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`
    : `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(ref)}/${encodedPath}`;
  const response = await fetch(url, {
    headers: token
      ? {
          Accept: "application/vnd.github.raw+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        }
      : undefined,
  });
  if (!response.ok) {
    throw new Error(`GitHub template request failed (${response.status}).`);
  }
  const value = (await response.json()) as T;
  jsonCache.set(key, { expiresAt: Date.now() + JSON_CACHE_TTL, value });
  return value;
}

async function readLocalJson<T extends Registry | TemplateBundle>(
  path: string,
): Promise<T> {
  const candidates = [
    resolve(process.cwd(), path),
    resolve(process.cwd(), "..", path),
    resolve(process.cwd(), "../..", path),
  ];
  for (const candidate of candidates) {
    try {
      return JSON.parse(await readFile(candidate, "utf8")) as T;
    } catch {
      // Keep looking from the app directory toward the monorepo root.
    }
  }
  throw new Error(`Local Pagiera template file was not found: ${path}`);
}

async function readTemplateJson<T extends Registry | TemplateBundle>(
  path: string,
): Promise<T> {
  if (process.env.PAGIERA_TEMPLATES_SOURCE === "local") {
    return readLocalJson<T>(path);
  }
  try {
    return await readGithubJson<T>(path);
  } catch (githubError) {
    try {
      return await readLocalJson<T>(path);
    } catch {
      throw githubError;
    }
  }
}

async function registry() {
  const value = await readTemplateJson<Registry>("templates/registry.json");
  if (value.schemaVersion !== 1 || !Array.isArray(value.templates)) {
    throw new Error("Unsupported Pagiera template registry.");
  }
  return value;
}

export async function getTemplateCatalog(): Promise<TemplateCatalogItem[]> {
  return (await registry()).templates.map(({ file: _file, ...template }) => ({
    ...template,
    featured: Boolean(template.featured),
  }));
}

export async function getTemplatePreviewDocument(id: string) {
  const templateRegistry = await registry();
  const entry = templateRegistry.templates.find(
    (template) => template.id === id,
  );
  if (!entry) return undefined;
  const relativeFile = entry.file.replace(/^\.\//, "");
  const bundle = await readTemplateJson<TemplateBundle>(
    `templates/${relativeFile}`,
  );
  if (
    bundle.schemaVersion !== 1 ||
    bundle.id !== id ||
    !Array.isArray(bundle.pages)
  ) {
    return undefined;
  }
  const page =
    bundle.pages.find((candidate) => candidate.slug === "home") ??
    bundle.pages[0];
  if (!page) return undefined;

  const document: PagieraDocument = {
    version: 1,
    elements: page.elements,
    dataSources: page.dataSources ?? [],
    rootStyle: {
      documentMode: page.rootStyle.documentMode ?? "page",
      maxWidth: page.rootStyle.maxWidth ?? 1280,
      canvasHeight: page.rootStyle.canvasHeight ?? 900,
      fullWidth: page.rootStyle.fullWidth ?? true,
      bg: page.rootStyle.bg ?? entry.preview.background,
      layout: page.rootStyle.layout ?? "stack",
      direction: page.rootStyle.direction ?? "column",
      gap: page.rootStyle.gap ?? 0,
      fontFamily: page.rootStyle.fontFamily ?? "var(--font-template), sans-serif",
      breakpoints: page.rootStyle.breakpoints ?? [
          { id: "desktop", name: "Desktop", width: 1280 },
          { id: "tablet", name: "Tablet", width: 810 },
          { id: "mobile", name: "Mobile", width: 390 },
        ],
      ...page.rootStyle,
    },
  };

  const { file: _file, ...template } = entry;
  return { document, template, pageName: page.name };
}
