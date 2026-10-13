"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { mountMarquees } from "./marquee";
import { mountDisclosures } from './disclosure';
import { mountNativeCarousels } from "./carousel-content";

type RanFor = Record<string, string | undefined>;
const noSubscription = () => () => {};

/**
 * An inline page script that also runs after a client-side navigation.
 *
 * A `<script>` only executes when the HTML parser inserts it. One that React
 * creates while moving between pages is inert, so entrances, layer toggles and
 * the rest worked on a full load and silently did nothing after following a
 * link.
 *
 * On a full load the tag is in the HTML and the parser runs it, leaving a note
 * of which page it ran for. After that the tag is not rendered at all — React
 * would only create a script it cannot execute — and the effect runs the code
 * whenever the note does not match the page now on screen. The note carries
 * the page's signature because moving between two pages of one route keeps
 * this component mounted and only changes the document around it.
 */
export function PageScript({ name, code, page }: { name: string; code: string; page: string }) {
    // True while the server renders and while the client hydrates that HTML,
    // false for anything mounted on the client afterwards.
    const fromServer = useSyncExternalStore(noSubscription, () => false, () => true);
    useEffect(() => {
        const host = window as unknown as { __pgRan?: RanFor };
        const ran = (host.__pgRan ??= {});
        if (ran[name] === page) return;
        ran[name] = page;
        try {
            new Function(code)();
        } catch (error) {
            console.error(error);
        }
    }, [code, name, page]);
    if (!fromServer) return null;
    return (
        <script
            // biome-ignore lint/security/noDangerouslySetInnerHTML: the caller passes one of the renderer's fixed scripts or the page author's own code, exactly as before
            dangerouslySetInnerHTML={{ __html: `(window.__pgRan=window.__pgRan||{})[${JSON.stringify(name)}]=${JSON.stringify(page)};${code}` }}
        />
    );
}

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
