"use client";

import { IconChevronRight } from "@tabler/icons-react";
import type React from "react";

import { cn } from "@/lib/utils";
import type { HTMLMotionProps } from "motion/react";
import { PopupSurface } from "./popup-surface";

/**
 * The editor's menus.
 *
 * One popover surface for the lot: the toolbar dropdowns, the canvas and layer
 * context menus, the panel overflow menus. A menu is a recognisable thing —
 * label on the left, keyboard hint on the right, dimmed when it cannot be
 * chosen — and it should look identical wherever it opens, so the look lives
 * here and the callers only say what the rows are.
 *
 * The colours come from the `pg-menu` classes in globals.css rather than from
 * the chrome variables, because several of these menus are portalled to
 * <body>, outside the element that defines those variables.
 */
export function Menu({
    className,
    children,
    ...props
}: HTMLMotionProps<"div">) {
    return (
        <PopupSurface role="menu" className={cn("pg-menu", className)} {...props}>
            {children}
        </PopupSurface>
    );
}

type RowProps = {
    /** Drawn at the left rim, before the label. */
    icon?: React.ReactNode;
    label: React.ReactNode;
    /** The right rim: a keyboard hint, a page's slug, a chevron. */
    shortcut?: React.ReactNode;
    /** The row you are already on — the open panel, the current page. */
    active?: boolean;
    /** Deleting and the like: the one row that is allowed to be red. */
    destructive?: boolean;
    /** Opens a menu of its own. */
    submenu?: boolean;
};

function rowContent({ icon, label, shortcut, submenu }: RowProps) {
    return (
        <>
            {icon}
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {shortcut !== undefined && <span className="pg-menu-shortcut">{shortcut}</span>}
            {submenu && <IconChevronRight size={13} className="pg-menu-shortcut" />}
        </>
    );
}

/** A row you press. */
export function MenuItem({
    icon,
    label,
    shortcut,
    active,
    destructive,
    submenu,
    className,
    ...props
}: RowProps & Omit<React.ComponentProps<"button">, "children">) {
    return (
        <button
            type="button"
            role="menuitem"
            data-active={active || undefined}
            data-destructive={destructive || undefined}
            className={cn("pg-menu-item", className)}
            {...props}
        >
            {rowContent({ icon, label, shortcut, submenu })}
        </button>
    );
}

/** A row that goes somewhere — the same row, drawn as a link. */
export function MenuLink({
    icon,
    label,
    shortcut,
    active,
    className,
    ...props
}: RowProps & Omit<React.ComponentProps<"a">, "children">) {
    return (
        <a
            role="menuitem"
            data-active={active || undefined}
            className={cn("pg-menu-item", className)}
            {...props}
        >
            {rowContent({ icon, label, shortcut })}
        </a>
    );
}

/** The rule between two groups of rows. */
export function MenuSeparator({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("pg-menu-sep", className)} {...props} />;
}

/** What a group of rows is called. */
export function MenuLabel({ className, children, ...props }: React.ComponentProps<"p">) {
    return (
        <p className={cn("pg-menu-label truncate", className)} {...props}>
            {children}
        </p>
    );
}
