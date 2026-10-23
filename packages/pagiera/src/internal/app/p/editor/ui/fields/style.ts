/*
 * One grammar for every inspector field.
 *
 * A 32px white field with a hairline edge, the value read left to right,
 * and a blue edge with a soft halo while it has focus — the same field
 * whether it holds a number, a word or a choice. Every control in this
 * folder is built from these four strings, which is what stops the panel
 * reading as a pile of unrelated boxes — change them here and the whole
 * inspector changes with them.
 */

/** The box a value sits in. */
export const FIELD =
    "pg-field flex h-8 min-w-0 flex-1 items-center gap-2 rounded-[9px] bg-ed-surface px-2.5 text-[12px] text-ed-text transition-shadow shadow-[inset_0_0_0_1px_var(--ed-border-strong)] hover:shadow-[inset_0_0_0_1px_rgb(24_24_27/0.24)] focus-within:shadow-[inset_0_0_0_1px_var(--ed-accent),0_0_0_3px_var(--ed-accent-soft)]";

/** What a control is called. */
export const LABEL = "shrink-0 text-[12px] text-ed-muted";

/** The value itself, inside the box. */
export const VALUE =
    "min-w-0 flex-1 bg-transparent text-left tabular-nums outline-none placeholder:text-ed-faint";

/** Label column width, so every row in a group lines up. */
export const LABEL_W = "w-[70px]";
