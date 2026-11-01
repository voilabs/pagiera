import { docsSources } from "@/lib/docs-source";
export function GET() {
  return new Response(
    "# Pagiera\n\n" +
      Object.values(docsSources)
        .flatMap((s) =>
          s
            .getPages()
            .map(
              (p) =>
                "[" +
                p.data.title +
                "](" +
                p.url +
                "): " +
                (p.data.description ?? ""),
            ),
        )
        .join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
