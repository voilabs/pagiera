/**
 * The editor's interface, in parts.
 *
 * Everything about how the editor looks lives in this folder, one concern per
 * file, so changing the look is opening the file named after the thing you
 * want to change rather than searching the editor's behaviour for a class
 * string.
 *
 * - `shell.tsx`   — where the regions sit: the bar, the rail, the panel, the
 *                   canvas, the inspector. Widths, heights, borders, order.
 * - `button.tsx`  — the icon and worded buttons, and the tone table that says
 *                   what hovered and on look like for all of them at once.
 * - `toolbar.tsx` — groups, segmented bars, rules and readouts in the bar.
 * - `rail.tsx`    — the destinations in the icon column.
 * - `panel.tsx`   — the left panel's title row, its actions and its search.
 * - `menu.tsx`    — dropdowns and context menus.
 * - `tooltip.tsx` — the label that appears on hover.
 * - `fields/`     — the inspector's controls, split the same way.
 *
 * Import from the folder rather than the files: `./ui`.
 */
export * from "./button";
export * from "./assets-panel";
export * from "./fields";
export * from "./menu";
export * from "./panel";
export * from "./rail";
export * from "./shell";
export * from "./settings-nav";
export * from "./toolbar";
export * from "./tooltip";
