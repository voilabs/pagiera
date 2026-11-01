"use client";
import { useState } from "react";

export function InstallPill({
  command,
  copy,
  copied,
}: {
  command: string;
  copy: string;
  copied: string;
}) {
  const [done, setDone] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      // Clipboard can be blocked; the command stays visible to select by hand.
    }
  }

  return (
    <div className="install">
      <code>
        <span className="install-prompt" aria-hidden="true">
          $
        </span>{" "}
        {command}
      </code>
      <button type="button" onClick={onCopy} aria-label={copy}>
        <span aria-hidden="true">{done ? "✓" : "⧉"}</span>
      </button>
      <span className="sr-only" role="status">
        {done ? copied : ""}
      </span>
    </div>
  );
}
