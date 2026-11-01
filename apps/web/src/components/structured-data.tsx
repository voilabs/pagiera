import { serializeStructuredData } from "@/lib/structured-data";

export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the JSON serializer escapes HTML script delimiters before insertion.
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}
    />
  );
}
