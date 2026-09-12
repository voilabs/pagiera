"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { mountMarquees } from "./marquee";
import { mountDisclosures } from './disclosure';
import { mountNativeCarousels } from "./carousel-content";

/** Hydrates SSR content and also starts loops after client-side navigation. */
export function MarqueeRuntime({ children, enabled }: { children: ReactNode; enabled: boolean }) {
    const root = useRef<HTMLElement>(null);
    useEffect(() => {
        if (enabled && root.current) {
            const stopMarquees = mountMarquees(root.current);
            const stopCarousels = mountNativeCarousels(root.current);
            const stopDisclosures = mountDisclosures(root.current);
            return () => { stopDisclosures(); stopCarousels(); stopMarquees(); };
        }
    }, [enabled, children]);
    return <main ref={root} className="pg-root">{children}</main>;
}
