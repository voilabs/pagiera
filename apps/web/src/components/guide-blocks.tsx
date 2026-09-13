import type { GuideBlock } from "@/lib/guides";
import { useI18n } from "@/lib/i18n";

/**
 * Guides are authored as data, not markdown, so every block renders into the
 * same semantic element on every page — which is what keeps the copy quotable
 * for answer engines and the styling predictable for readers.
 */
export function GuideBlocks({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: blocks are static per guide.
        <GuideBlockView block={block} key={index} />
      ))}
    </>
  );
}

function GuideBlockView({ block }: { block: GuideBlock }) {
  const { t } = useI18n();
  switch (block.type) {
    case "text":
      return <p>{block.body}</p>;
    case "list":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "ordered":
      return (
        <ol>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre
          aria-label={t(
            `${block.lang} code example`,
            `${block.lang} kod örneği`,
          )}
          tabIndex={0}
        >
          <code>{block.source}</code>
        </pre>
      );
    case "note":
      return (
        <p className="guide-note">
          <strong>{t("Note", "Not")}</strong>
          {block.body}
        </p>
      );
    case "table":
      return (
        <div className="docs-table">
          <table>
            <thead>
              <tr>
                <th>{block.head[0]}</th>
                <th>{block.head[1]}</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}
