import Link from "next/link";
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPreviewPage((await params).pageId);
  if (!page) notFound();

  return (
    <RenderedPage
      elements={page.elements}
      rootStyle={page.rootStyle}
      data={page.data}
      components={{ Link }}
    />
  );
}
