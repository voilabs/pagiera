import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

export async function editorBootstrap(pageId?: string) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const bootstrap =
    typeof server.getEditorBootstrap === "function"
      ? await server.getEditorBootstrap(pageId)
      : await server
          .handle(
            new Request(
              `http://pagiera.local/api/pagiera/bootstrap${pageId ? `?pageId=${encodeURIComponent(pageId)}` : ""}`,
            ),
          )
          .then(async (response) =>
            response.ok ? response.json() : undefined,
          );
  if (!bootstrap) throw new Error("Editor page not found");
  return bootstrap;
}
