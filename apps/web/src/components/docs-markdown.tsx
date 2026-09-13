import type { MarkedToken, Token } from "marked";
import { createElement, Fragment, type ReactNode } from "react";
import { DocsCodeBlock } from "@/components/docs-code-block";
import { localizedHref, useI18n } from "@/lib/i18n";

export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");

export function docLink(href: string, image = false): string | undefined {
  if (href.startsWith("#")) return image ? undefined : href;
  if (!image && href.startsWith("/")) return href;
  try {
    const url = new URL(
      href,
      "https://github.com/voilabs/pagiera/blob/main/packages/pagiera/",
    );
    if (
      !["https:", "http:", ...(image ? [] : ["mailto:"])].includes(url.protocol)
    )
      return undefined;
    if (
      !image &&
      url.hostname === "github.com" &&
      url.pathname.startsWith("/voilabs/pagiera/blob/main/packages/pagiera/")
    ) {
      if (url.pathname.endsWith("/README.md")) return "/docs" + url.hash;
      if (url.pathname.endsWith("/AGENTS.md")) return "/docs/agents" + url.hash;
    }
    if (image && url.hostname === "github.com")
      return url.href.replace(
        "https://github.com/voilabs/pagiera/blob/main/",
        "https://raw.githubusercontent.com/voilabs/pagiera/main/",
      );
    return url.href;
  } catch {
    return undefined;
  }
}

/** Markdown is rendered as React nodes, never injected as remote HTML. */
export function DocsMarkdown({ tokens }: { tokens: Token[] }) {
  const { locale } = useI18n();
  const ids = new Map<string, number>();
  function render(items: Token[]): ReactNode {
    return items.map((raw, index) => {
      const token = raw as MarkedToken;
      const child =
        "tokens" in token && token.tokens
          ? render(token.tokens)
          : "text" in token
            ? token.text
            : null;
      let result: ReactNode = null;
      switch (token.type) {
        case "heading": {
          const slug = headingId(token.text);
          const count = ids.get(slug) ?? 0;
          ids.set(slug, count + 1);
          result = createElement(
            `h${token.depth}`,
            { id: slug + (count ? `-${count}` : "") },
            child,
          );
          break;
        }
        case "paragraph":
          result = <p>{child}</p>;
          break;
        case "text":
        case "escape":
          result = child;
          break;
        case "strong":
          result = <strong>{child}</strong>;
          break;
        case "em":
          result = <em>{child}</em>;
          break;
        case "del":
          result = <del>{child}</del>;
          break;
        case "code":
          result = <DocsCodeBlock code={token.text} language={token.lang} />;
          break;
        case "codespan":
          result = <code>{token.text}</code>;
          break;
        case "link": {
          const safeHref = docLink(token.href);
          const href = safeHref ? localizedHref(safeHref, locale) : undefined;
          result = href ? <a href={href}>{child}</a> : child;
          break;
        }
        case "image": {
          const src = docLink(token.href, true);
          result = src ? (
            <img src={src} alt={token.text} loading="lazy" />
          ) : null;
          break;
        }
        case "list": {
          const entries = token.items.map((item, i) => (
            <li key={i}>
              {item.task && (
                <input
                  type="checkbox"
                  checked={item.checked ?? false}
                  readOnly
                  aria-label="Checklist item"
                />
              )}
              {render(item.tokens)}
            </li>
          ));
          result = token.ordered ? (
            <ol start={Number(token.start) || 1}>{entries}</ol>
          ) : (
            <ul>{entries}</ul>
          );
          break;
        }
        case "blockquote":
          result = <blockquote>{child}</blockquote>;
          break;
        case "table":
          result = (
            <div className="docs-table">
              <table>
                <thead>
                  <tr>
                    {token.header.map((cell, i) => (
                      <th key={i}>{render(cell.tokens)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {token.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{render(cell.tokens)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          break;
        case "hr":
          result = <hr />;
          break;
        case "br":
          result = <br />;
          break;
        // Raw HTML, scripts, and definitions are intentionally not executed.
        default:
          result = null;
      }
      return <Fragment key={index}>{result}</Fragment>;
    });
  }
  return <div className="docs-markdown">{render(tokens)}</div>;
}
