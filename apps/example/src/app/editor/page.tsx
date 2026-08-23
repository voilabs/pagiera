import { redirect } from "next/navigation";
import { editorPath } from "pagiera";
import { editorBootstrap } from "@/lib/editor-bootstrap";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const initial = await editorBootstrap();
  redirect(editorPath(initial.page.id));
}
