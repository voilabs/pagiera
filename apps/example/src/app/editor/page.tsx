import type { Metadata } from "next";
import { editorBootstrap } from "@/lib/editor-bootstrap";
import { PagieraExampleEditor } from "./pagiera-example-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pagiera editor" };

export default async function EditorPage() {
  const initial = await editorBootstrap();
  return <PagieraExampleEditor initial={initial} />;
}
