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
    // Unique per instance: two marks on one page must not share a gradient id.
    const gradientId = `pg-mark-${Math.random().toString(36).slice(2, 9)}`;
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
