import type { Metadata } from "next";
import {
  type PublishedSearchParams,
  publishedMetadata,
  renderPublishedPage,
} from "@/lib/published-page";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ path: string[] }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  return publishedMetadata((await params).path.join("/"));
}

export default async function PublishedPathPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: PublishedSearchParams;
}) {
  return renderPublishedPage((await params).path.join("/"), searchParams);
}
