import { useId } from "react";

/**
 * The Pagiera mark, drawn rather than bundled.
 *
 * The editor ships as an npm package with no asset pipeline of its own, so an
 * image file would have to be inlined as a data URI and would blur on high-DPI
 * screens. The geometry is simple enough to keep as vectors.
 */
export function PagieraMark({
    size = 20,
    className = "",
}: {
    size?: number;
    className?: string;
}) {
    // Stable across server and client while remaining unique per instance.
    const gradientId = `pg-mark-${useId().replace(/:/g, "")}`;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            role="img"
            aria-label="Pagiera"
            className={className}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7A3BE8" />
                    <stop offset="100%" stopColor="#4517A6" />
                </linearGradient>
            </defs>
            <rect width="512" height="512" rx="116" fill={`url(#${gradientId})`} />
            <rect
                x="124"
                y="124"
                width="264"
                height="264"
                rx="82"
                fill="none"
                stroke="#ffffff"
                strokeWidth="34"
            />
            <path
                d="M236 388h84a68 68 0 0 0 68-68v-84h-84a68 68 0 0 0-68 68z"
                fill="#ffffff"
            />
        </svg>
    );
}

/**
 * The Pagiera mark shaped like an icon-set glyph.
 *
 * Luma is the product speaking, so its rail entry carries the brand rather
 * than a generic sparkle. The signature matches the Tabler icons the rail
 * renders — `stroke` is accepted and ignored — so it can be handed around as
 * one of them instead of being special-cased at every call site.
 */
export function LumaMark({ size = 16, className = "" }: { size?: number; stroke?: number; className?: string }) {
    return <PagieraMark size={size} className={`rounded-[5px] ${className}`} />;
}
