import Link from "next/link";
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";
import { translationsFor } from "@/lib/translations";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ pageId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPreviewPage((await params).pageId);
  if (!page) notFound();

  return (
    <RenderedPage
      elements={page.elements}
      rootStyle={page.rootStyle}
      data={page.data}
      translations={translationsFor((await searchParams).lang)}
      components={{ Link }}
    />
  );
}
