/*
 * One grammar for every inspector field.
 *
 * A 28px row, a muted label on the left, the value on the right, and no
 * visible chrome until the row is hovered or focused. Every control in this
 * folder is built from these four strings, which is what stops the panel
 * reading as a pile of unrelated boxes — change them here and the whole
 * inspector changes with them.
 */

/** The box a value sits in. */
export const FIELD =
    "flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg bg-ed-field px-2.5 text-[11px] text-ed-text transition-colors hover:border-[var(--ed-border-strong)] hover:bg-ed-field-hover focus-within:border-ed-accent focus-within:bg-ed-field-hover focus-within:ring-1 focus-within:ring-inset focus-within:ring-[var(--ed-accent)]/35";

/** What a control is called. */
export const LABEL = "shrink-0 text-[11px] text-ed-muted";

/** The value itself, inside the box. */
export const VALUE =
    "min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none placeholder:text-ed-faint";

/** Label column width, so every row in a group lines up. */
export const LABEL_W = "w-[70px]";
