import {
  DocumentationPage,
  docsMetadata,
} from "@/components/documentation-page";
import { docsSources } from "@/lib/docs-source";

type Props = { params: Promise<{ slug?: string[] }> };
export function generateStaticParams() {
  return docsSources.tr.getPages().map((p) => ({ slug: p.slugs }));
}
export async function generateMetadata({ params }: Props) {
  return docsMetadata("tr", (await params).slug);
}
export default async function Page({ params }: Props) {
  return <DocumentationPage locale="tr" slug={(await params).slug} />;
}
