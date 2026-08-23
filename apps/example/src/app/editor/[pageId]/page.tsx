import { redirect } from "next/navigation";
import { editorPath } from "pagiera";
import { editorBootstrap } from "@/lib/editor-bootstrap";

export const dynamic = "force-dynamic";

export default async function EditorDocumentPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const initial = await editorBootstrap((await params).pageId);
  redirect(editorPath(initial.page.id));
}
