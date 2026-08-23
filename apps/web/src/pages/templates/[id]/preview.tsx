import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import dynamic from "next/dynamic";
import { Manrope } from "next/font/google";
import Head from "next/head";
import type { PagieraDocument } from "pagiera";
import { RenderedPage as RuntimePage } from "pagiera/runtime";
import {
  getTemplateCatalog,
  getTemplatePreviewDocument,
} from "@/lib/template-catalog";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-template" });
const RenderedPage = dynamic(() => Promise.resolve(RuntimePage), {
  ssr: false,
});

type PreviewProps = {
  document: PagieraDocument;
  name: string;
};

export const getStaticPaths = (async () => ({
  paths: (await getTemplateCatalog()).map((template) => ({
    params: { id: template.id },
  })),
  fallback: "blocking",
})) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params }) => {
  const id = typeof params?.id === "string" ? params.id : "";
  const preview = await getTemplatePreviewDocument(id);
  if (!preview) return { notFound: true };
  return {
    props: { document: preview.document, name: preview.template.name },
    revalidate: 300,
  };
}) satisfies GetStaticProps<PreviewProps>;

export default function TemplatePreview({
  document,
  name,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div
      className={`${manrope.variable} min-h-screen bg-[#0d0c10] font-[var(--font-template)]`}
    >
      <Head>
        <title>{name} preview — Pagiera</title>
        <meta content="noindex,follow" name="robots" />
        {/* Template documents may ask for these families. They used to load on
            every page from _document, which put a render-blocking third-party
            stylesheet in front of the marketing pages that never use them. */}
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Geist:ital,wght@0,100..900;1,100..900&family=Syncopate:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <RenderedPage
        elements={document.elements}
        rootStyle={document.rootStyle}
        data={{}}
      />
    </div>
  );
}
