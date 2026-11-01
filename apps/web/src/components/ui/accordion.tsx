"use client";
import { type KeyboardEvent, useId, useState } from "react";

export type AccordionItem = { id?: string; title: string; content: string };

// WAI-ARIA disclosure accordion: a button inside a heading controls each panel.
export function Accordion({
  items,
  headingLevel = 3,
  defaultOpen = -1,
  className,
}: {
  items: AccordionItem[];
  headingLevel?: 2 | 3 | 4;
  defaultOpen?: number;
  className?: string;
}) {
  const base = useId();
  const [open, setOpen] = useState<number>(defaultOpen);
  const Heading = `h${headingLevel}` as const;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const buttons = Array.from(
      event.currentTarget
        .closest("[data-accordion]")
        ?.querySelectorAll<HTMLButtonElement>("[data-accordion-trigger]") ?? [],
    );
    const last = buttons.length - 1;
    const next =
      event.key === "ArrowDown"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowUp"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <div className={className} data-accordion>
      {items.map((item, index) => {
        const id = `${base}-${item.id ?? index}`;
        const expanded = open === index;
        return (
          <div className="accordion-item" key={id} data-open={expanded}>
            <Heading className="accordion-heading">
              <button
                type="button"
                id={`${id}-trigger`}
                aria-expanded={expanded}
                aria-controls={`${id}-panel`}
                data-accordion-trigger
                onClick={() => setOpen(expanded ? -1 : index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span>{item.title}</span>
                <span className="accordion-icon" aria-hidden="true" />
              </button>
            </Heading>
            <section
              id={`${id}-panel`}
              aria-labelledby={`${id}-trigger`}
              className="accordion-panel"
              hidden={!expanded}
            >
              <p>{item.content}</p>
            </section>
          </div>
        );
      })}
    </div>
  );
}
