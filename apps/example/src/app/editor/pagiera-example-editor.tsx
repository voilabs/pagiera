"use client";

import { useRouter } from "next/navigation";
import { createPagieraClient } from "pagiera";
import type { PagieraStudioProps } from "pagiera/full";
import PagieraStudio from "pagiera/full";
import { useEffect, useMemo, useState } from "react";

export type EditorBootstrap = {
  page: PagieraStudioProps["page"];
  pages: PagieraStudioProps["pages"];
  library: PagieraStudioProps["library"];
};

export function PagieraExampleEditor({
  initial,
}: {
  initial: EditorBootstrap;
}) {
  const router = useRouter();
  const client = useMemo(() => createPagieraClient(), []);
  const [bootstrap, setBootstrap] = useState(initial);

  useEffect(() => setBootstrap(initial), [initial]);

  return (
    <PagieraStudio
      page={bootstrap.page}
      pages={bootstrap.pages}
      library={bootstrap.library}
      adapters={{
        ...client.adapters,
        navigate: async (id, options) => {
          if (id === bootstrap.page.id) return;
          const next = (await client.bootstrap(id)) as EditorBootstrap;
          setBootstrap(next);
          const href = `/editor/${encodeURIComponent(id)}`;
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
