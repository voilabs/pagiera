import { IconCode, IconComponents, IconFrame, IconPlus } from "@tabler/icons-react";
import { useMemo } from "react";
import { subtreeIds } from "@/lib/editor/tree";
import { DEFAULT_ROOT_STYLE, type CanvasElement, type RootStyle } from "@/lib/editor/types";
import { ElementsThumbnail } from "../library";

const COMPONENT_MIME = "application/pagiera-component";

type Asset = { id: string; name: string; variants: CanvasElement[] };

function Section({
    title,
    hint,
    onAdd,
    children,
}: {
    title: string;
    hint?: string;
    onAdd?: () => void;
    children: React.ReactNode;
}) {
    return (
        <section className="border-b border-ed-border py-3 last:border-b-0">
            <div className="mb-1 flex h-7 items-center justify-between px-2">
                <h3 className="text-[11px] font-semibold text-ed-text">{title}</h3>
                {onAdd && (
                    <button type="button" onClick={onAdd} aria-label={`Add ${title.toLowerCase()}`} className="flex size-6 items-center justify-center rounded-lg text-ed-muted transition-colors hover:bg-[var(--ed-nav-hover)] hover:text-ed-text">
                        <IconPlus size={13} />
                    </button>
                )}
            </div>
            {hint && <p className="px-2 pb-2 text-[10px] leading-relaxed text-ed-muted">{hint}</p>}
            <div className="flex flex-col gap-2 px-2">{children}</div>
        </section>
    );
}

/**
 * The layers of one master, ready to be drawn as a picture of it.
 *
 * The master becomes an ordinary root so the renderer draws it at all, and
 * anything pinned to the screen is left out: a still image has no scroll
 * position, so a fixed bar or drawer would sit on top of the component it
 * belongs to instead of beside it.
 */
function previewLayers(elements: CanvasElement[], master: CanvasElement): CanvasElement[] {
    const inside = subtreeIds(elements, master.id);
    const pinned = new Set<string>();
    for (const element of elements) {
        if (inside.has(element.id) && element.id !== master.id && element.base.position === "fixed") {
            for (const id of subtreeIds(elements, element.id)) pinned.add(id);
        }
    }
    return elements
        .filter((element) => inside.has(element.id) && !pinned.has(element.id))
        .map((element) => ({
            ...element,
            ...(element.id === master.id ? { parentId: undefined, componentRole: undefined, componentId: undefined } : undefined),
            href: undefined,
            interaction: undefined,
            draggable: undefined,
            loop: undefined,
            base: { ...element.base, entrance: "none" as const },
        }));
}

/**
 * One component, shown as what it looks like.
 *
 * The whole card opens the component and can be dragged onto the page. A
 * component used to be a disclosure row with a "Default" file inside it, which
 * made the most common action — open it, or place it — two clicks deep and
 * said nothing about which component was which.
 */
function ComponentCard({
    asset,
    elements,
    rootStyle,
    role,
    activeMasterId,
    onOpen,
}: {
    asset: Asset;
    elements: CanvasElement[];
    rootStyle: RootStyle;
    role?: string;
    activeMasterId?: string;
    onOpen: (master: CanvasElement) => void;
}) {
    const master = asset.variants[0];
    const layers = useMemo(() => previewLayers(elements, master), [elements, master]);
    const active = asset.variants.some((variant) => variant.id === activeMasterId);
    const drag = (variant: CanvasElement) => (event: React.DragEvent) => {
        event.dataTransfer.setData(COMPONENT_MIME, variant.id);
        event.dataTransfer.effectAllowed = "copy";
    };

    return (
        <div className={`overflow-hidden rounded-xl border bg-ed-subtle transition-colors ${active ? "border-ed-accent" : "border-ed-border hover:border-ed-border"}`}>
            <button
                type="button"
                draggable
                onDragStart={drag(master)}
                onClick={() => onOpen(master)}
                title="Click to edit · drag onto the page to place"
                className="block w-full cursor-grab text-left active:cursor-grabbing"
            >
                {layers.length > 1 || master.content || master.src ? (
                    <ElementsThumbnail elements={layers} title={`${asset.name} preview`} rootStyle={rootStyle} />
                ) : (
                    <span className="flex h-14 items-center justify-center border-b border-ed-border text-[10px] text-ed-faint">Empty — open to design it</span>
                )}
                <span className="flex items-center gap-2 px-2.5 py-2">
                    {master.code ? <IconCode size={13} className="shrink-0 text-ed-muted" /> : master.isLayout ? <IconFrame size={13} className="shrink-0 text-ed-accent" /> : <IconComponents size={13} className="shrink-0 text-ed-accent" />}
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ed-text">{asset.name}</span>
                    {role && <span className="rounded-full bg-ed-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-ed-accent">{role}</span>}
                </span>
            </button>
            {asset.variants.length > 1 && (
                <div className="flex flex-wrap gap-1 border-t border-ed-border px-2 py-1.5">
                    {asset.variants.map((variant) => (
                        <button
                            key={variant.id}
                            type="button"
                            draggable
                            onDragStart={drag(variant)}
                            onClick={() => onOpen(variant)}
                            className={`rounded-md px-1.5 py-0.5 text-[10px] transition-colors ${activeMasterId === variant.id ? "bg-ed-accent/20 text-ed-text" : "bg-[var(--ed-nav-field)] text-ed-muted hover:text-ed-text"}`}
                        >
                            {variant.variant ?? "Default"}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function AssetsPanel({
    assets,
    elements,
    rootStyle,
    activeMasterId,
    onOpen,
    onCreate,
    onCreateLayout,
    pageLayoutId,
    onRemoveLayout,
    onCode,
}: {
    assets: Asset[];
    /** The document the masters live in, so each card can draw its component. */
    elements: CanvasElement[];
    rootStyle: RootStyle;
    activeMasterId?: string;
    onOpen: (master: CanvasElement) => void;
    onCreate: () => void;
    onCreateLayout: () => void;
    pageLayoutId?: string;
    onRemoveLayout: () => void;
    onCode: () => void;
}) {
    // A thumbnail is a page of its own: the site's font and breakpoints, none
    // of this page's width cap, custom code or background.
    const previewRoot = useMemo<RootStyle>(
        () => ({
            ...DEFAULT_ROOT_STYLE,
            fullWidth: true,
            bg: "transparent",
            fontFamily: rootStyle.fontFamily,
            customFonts: rootStyle.customFonts,
            breakpoints: rootStyle.breakpoints,
            baseBreakpointId: rootStyle.baseBreakpointId,
        }),
        [rootStyle.baseBreakpointId, rootStyle.breakpoints, rootStyle.customFonts, rootStyle.fontFamily],
    );
    const roleOf = (asset: Asset) =>
        asset.id === rootStyle.siteHeaderId ? "Site header"
            : asset.id === rootStyle.siteFooterId ? "Site footer"
            : asset.id === pageLayoutId ? "Applied"
            : undefined;
    const card = (asset: Asset) => (
        <ComponentCard key={asset.id} asset={asset} elements={elements} rootStyle={previewRoot} role={roleOf(asset)} activeMasterId={activeMasterId} onOpen={onOpen} />
    );
    const layouts = assets.filter((asset) => asset.variants[0]?.isLayout);
    const code = assets.filter((asset) => !asset.variants[0]?.isLayout && asset.variants.some((variant) => Boolean(variant.code)));
    const components = assets.filter((asset) => !asset.variants[0]?.isLayout && !code.includes(asset));

    return (
        <div className="px-2 pb-4">
            <Section title="Components" hint={components.length ? "Click one to edit it everywhere. Drag it onto the page to place a copy." : undefined} onAdd={onCreate}>
                {components.length === 0
                    ? <p className="py-2 text-[10px] leading-relaxed text-ed-faint">No components yet. Add one, or right-click a layer and choose Create component.</p>
                    : components.map(card)}
            </Section>

            <Section title="Layouts" hint="A layout wraps a page: drag one onto the page and its content appears inside Children." onAdd={onCreateLayout}>
                {layouts.map(card)}
                {pageLayoutId && <button type="button" onClick={onRemoveLayout} className="self-start text-[10px] text-ed-muted hover:text-ed-text">Remove layout from this page</button>}
            </Section>

            <Section title="Code" onAdd={onCode}>
                {code.map(card)}
            </Section>
        </div>
    );
}
