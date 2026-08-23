"use client";

import { useRouter } from "next/navigation";
import { createPagieraClient, editorPanel, editorPath } from "pagiera";
import type { PagieraStudioProps } from "pagiera/full";
import PagieraStudio from "pagiera/full";
import { useEffect, useMemo, useState } from "react";

export type EditorBootstrap = {
  page: PagieraStudioProps["page"];
  pages: PagieraStudioProps["pages"];
  library: PagieraStudioProps["library"];
};

export function PagieraEditor({
  initial,
  initialPanel,
}: {
  initial: EditorBootstrap;
  initialPanel: string;
}) {
  const router = useRouter();
  const client = useMemo(() => createPagieraClient(), []);
  const [bootstrap, setBootstrap] = useState(initial);
  const editorHref = (id: string, panel?: string) =>
    editorPath(id, editorPanel(panel) ?? "layers");

  useEffect(() => setBootstrap(initial), [initial]);

  return (
    <PagieraStudio
      page={bootstrap.page}
      pages={bootstrap.pages}
      library={bootstrap.library}
      initialPanel={initialPanel}
      adapters={{
        ...client.adapters,
        editorHref,
        navigate: async (id, options) => {
          const next = (await client.bootstrap(id)) as EditorBootstrap;
          setBootstrap(next);
          const candidate = window.location.pathname
            .split("/")
            .filter(Boolean)
            .at(-1);
          const panel = candidate ? editorPanel(candidate) : undefined;
          const href = `${editorHref(id, panel)}${window.location.search}`;
          if (options?.replace) router.replace(href);
          else router.push(href);
        },
        refresh: () => {
          void client
            .bootstrap(bootstrap.page.id)
            .then((next) => setBootstrap(next as EditorBootstrap));
        },
        previewHref: (id) => `/preview/${encodeURIComponent(id)}`,
        publishedHref: (slug) =>
          slug === "home"
            ? "/"
            : `/${slug
                .split("/")
                .map((part) =>
                  part.startsWith(":") ? part : encodeURIComponent(part),
                )
                .join("/")}`,
      }}
    />
  );
}
