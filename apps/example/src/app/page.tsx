import type { Metadata } from "next";
import {
  type PublishedSearchParams,
  publishedMetadata,
  renderPublishedPage,
} from "@/lib/published-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return publishedMetadata("home");
}

export default function HomePage({
  searchParams,
}: {
  searchParams: PublishedSearchParams;
}) {
  return renderPublishedPage("home", searchParams);
}
