import { useEffect, useRef, type ReactNode } from "react";
import { MarqueeContent, mountMarquees } from "@/lib/render/marquee";
import type { InteractiveSettings } from "@/lib/editor/interactive";

export function MarqueePreview({ settings, children, preview }: { settings: InteractiveSettings; children: ReactNode; preview: boolean }) {
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (root.current && preview) return mountMarquees(root.current);
    }, [settings, children, preview]);
    return <div ref={root} style={{ width: "100%", minWidth: 0, height: "100%", gap: "inherit" }}><MarqueeContent settings={settings} editing={!preview}>{children}</MarqueeContent></div>;
}
