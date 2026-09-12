import {
    IconChevronRight,
    IconCode,
    IconComponents,
    IconFile,
    IconFrame,
    IconPlus,
} from "@tabler/icons-react";
import type { CanvasElement } from "@/lib/editor/types";

const COMPONENT_MIME = "application/pagiera-component";

type Asset = { id: string; name: string; variants: CanvasElement[] };

function Section({
    title,
    onAdd,
    children,
}: {
    title: string;
    onAdd?: () => void;
    children: React.ReactNode;
}) {
    return (
        <section className="border-b border-white/[0.07] py-3 last:border-b-0">
            <div className="mb-1 flex h-7 items-center justify-between px-2">
                <h3 className="text-[11px] font-semibold text-ed-text">{title}</h3>
                {onAdd && (
                    <button type="button" onClick={onAdd} aria-label={`Add ${title.toLowerCase()}`} className="flex size-6 items-center justify-center rounded-lg text-ed-muted transition-colors hover:bg-white/[0.07] hover:text-ed-text">
                        <IconPlus size={13} />
                    </button>
                )}
            </div>
            <div>{children}</div>
        </section>
    );
}

function Row({ icon, label, tone = "purple", onClick }: { icon: React.ReactNode; label: string; tone?: "purple" | "blue" | "muted"; onClick?: () => void }) {
    const color = tone === "blue" ? "text-sky-500" : tone === "purple" ? "text-ed-accent" : "text-ed-muted";
    return (
        <button type="button" onClick={onClick} className="group flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[11px] text-ed-muted transition-colors hover:bg-white/[0.055] hover:text-ed-text">
            <IconChevronRight size={11} className="text-ed-faint transition-transform group-hover:translate-x-0.5" />
            <span className={color}>{icon}</span>
            <span className="min-w-0 flex-1 truncate">{label}</span>
        </button>
    );
}

export function AssetsPanel({
    assets,
    activeMasterId,
    onOpen,
    onCreate,
    onCreateLayout,
    pageLayoutId,
    onRemoveLayout,
    onCode,
}: {
    assets: Asset[];
    activeMasterId?: string;
    onOpen: (master: CanvasElement) => void;
    onCreate: () => void;
    onCreateLayout: () => void;
    pageLayoutId?: string;
    onRemoveLayout: () => void;
    onCode: () => void;
}) {
    const codeAssets = assets.flatMap((asset) => asset.variants).filter((variant) => Boolean(variant.code));
    return (
        <div className="px-2 pb-4">
            <Section title="Layouts" onAdd={onCreateLayout}>
                <p className="px-2 pb-2 text-[10px] leading-relaxed text-ed-muted">Drag a layout onto a page. Its content appears inside Children.</p>
                {assets.filter(asset => asset.variants[0]?.isLayout).map(asset => <button key={asset.id} type="button" draggable onDragStart={event => { event.dataTransfer.setData(COMPONENT_MIME, asset.variants[0].id); event.dataTransfer.effectAllowed = "copy"; }} onClick={() => onOpen(asset.variants[0])} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[12px] text-ed-text hover:bg-ed-field"><IconFrame size={14} className="text-ed-accent"/><span className="flex-1 truncate">{asset.name}</span>{pageLayoutId === asset.id && <span className="text-[9px] text-ed-muted">Applied</span>}</button>)}
                {pageLayoutId && <button type="button" onClick={onRemoveLayout} className="mt-2 px-2 text-[10px] text-ed-muted hover:text-ed-text">Remove layout from this page</button>}
            </Section>

            <Section title="Components" onAdd={onCreate}>
                {assets.length === 0 ? (
                    <p className="px-7 py-2 text-[10px] leading-relaxed text-ed-faint">No components yet. Add one to build a reusable asset.</p>
                ) : assets.filter(asset => !asset.variants[0]?.isLayout).map((asset) => (
                    <details key={asset.id} className="group/asset" open={assets.length < 4}>
                        <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-[11px] text-ed-muted transition-colors hover:bg-white/[0.055] hover:text-ed-text [&::-webkit-details-marker]:hidden">
                            <IconChevronRight size={11} className="text-ed-faint transition-transform group-open/asset:rotate-90" />
                            <IconComponents size={14} className="text-ed-accent" />
                            <span className="min-w-0 flex-1 truncate">{asset.name}</span>
                            {asset.variants.length > 1 && <span className="rounded-full bg-ed-accent/15 px-1.5 py-0.5 text-[8px] font-semibold text-ed-accent">{asset.variants.length}</span>}
                        </summary>
                        <div className="ml-[25px] border-l border-white/[0.08] pl-2">
                            {asset.variants.map((variant) => (
                                <button
                                    key={variant.id}
                                    type="button"
                                    draggable
                                    onDragStart={(event) => { event.dataTransfer.setData(COMPONENT_MIME, variant.id); event.dataTransfer.effectAllowed = "copy"; }}
                                    onClick={() => onOpen(variant)}
                                    className={`flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[10px] transition-colors ${activeMasterId === variant.id ? "bg-ed-accent/15 text-ed-text" : "text-ed-muted hover:bg-white/[0.055] hover:text-ed-text"}`}
                                >
                                    <IconFile size={12} className="text-ed-faint" />
                                    <span className="truncate">{variant.variant ?? "Default"}</span>
                                </button>
                            ))}
                        </div>
                    </details>
                ))}
            </Section>

            <Section title="Code" onAdd={onCode}>
                {codeAssets.map((variant) => (
                    <Row key={variant.id} icon={<IconCode size={14} />} label={`${variant.name || "Component"}.tsx`} tone="muted" onClick={() => onOpen(variant)} />
                ))}
            </Section>
        </div>
    );
}
