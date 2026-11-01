import { createFromSource } from "fumadocs-core/search/server";
import { docsSources } from "@/lib/docs-source";

const search = {
  en: createFromSource(docsSources.en),
  tr: createFromSource(docsSources.tr),
};
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "tr" ? "tr" : "en";
  url.searchParams.delete("locale");
  return search[locale].GET(new Request(url, request));
}
