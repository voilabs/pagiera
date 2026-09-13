import { useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

const KEYWORDS = new Set([
  "async", "await", "const", "export", "from", "function", "if", "import",
  "new", "return", "throw", "type", "interface", "true", "false", "null",
]);

const TOKEN = /(\/\/.*|#(?![0-9a-fA-F]{3,8}\b).*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;

function highlighted(code: string) {
  return code.split("\n").map((line, lineIndex) => {
    const parts: ReactNode[] = [];
    let cursor = 0;
    for (const match of line.matchAll(TOKEN)) {
      const start = match.index ?? 0;
      if (start > cursor) parts.push(line.slice(cursor, start));
      const value = match[0];
      let kind = "identifier";
      if (value.startsWith("//") || value.startsWith("#")) kind = "comment";
      else if (/^["'`]/.test(value)) kind = "string";
      else if (/^\d/.test(value)) kind = "number";
      else if (KEYWORDS.has(value)) kind = "keyword";
      else if (/^[A-Z]/.test(value)) kind = "type";
      parts.push(<span className={`syntax-${kind}`} key={`${start}-${value}`}>{value}</span>);
      cursor = start + value.length;
    }
    if (cursor < line.length) parts.push(line.slice(cursor));
    return <span className="syntax-line" key={`line-${lineIndex}`}>{parts}{"\n"}</span>;
  });
}

export function DocsCodeBlock({ code, language }: { code: string; language?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return <div className="docs-code">
    <div className="docs-code-bar"><span>{language || t("text", "metin")}</span><button onClick={copy} type="button"><Icon name={copied ? "check" : "copy"} size={13} />{copied ? t("Copied", "Kopyalandı") : t("Copy", "Kopyala")}</button></div>
    <pre><code className={`language-${language || "text"}`}>{highlighted(code)}</code></pre>
  </div>;
}
