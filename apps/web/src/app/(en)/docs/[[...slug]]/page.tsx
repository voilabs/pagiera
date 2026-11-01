import {
  DocumentationPage,
  docsMetadata,
} from "@/components/documentation-page";
import { docsSources } from "@/lib/docs-source";

type Props = { params: Promise<{ slug?: string[] }> };
export function generateStaticParams() {
  return docsSources.en.getPages().map((p) => ({ slug: p.slugs }));
}
export async function generateMetadata({ params }: Props) {
  return docsMetadata("en", (await params).slug);
}
export default async function Page({ params }: Props) {
  return <DocumentationPage locale="en" slug={(await params).slug} />;
}
