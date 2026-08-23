import { redirect } from "next/navigation";
import { editorPanel, editorPath } from "pagiera";
import { editorBootstrap } from "@/lib/editor-bootstrap";
import { PagieraEditor } from "../../pagiera-editor";

export const dynamic = "force-dynamic";

export default async function EditorPanelPage({
  params,
}: {
  params: Promise<{ pageId: string; panel: string }>;
}) {
  const { pageId, panel: rawPanel } = await params;
  const panel = editorPanel(rawPanel);
  if (!panel) redirect(editorPath(pageId));
  const initial = await editorBootstrap(pageId);
  return <PagieraEditor initial={initial} initialPanel={panel} />;
}
