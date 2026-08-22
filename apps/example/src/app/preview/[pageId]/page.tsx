import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PreviewDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ pageId: string }>;
  searchParams: SearchParams;
}) {
  const rawQuery = await searchParams;
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([key, value]) => [
      key,
      Array.isArray(value) ? (value[0] ?? "") : (value ?? ""),
    ]),
  );
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPreviewPage((await params).pageId, { query });
  if (!page) notFound();
  return (
    <RenderedPage
      elements={page.elements}
      rootStyle={page.rootStyle}
      data={page.data}
    />
  );
}
