"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { mountMarquees } from "./marquee";
import { mountDisclosures } from './disclosure';
import { mountActions } from './actions';
import { mountNativeCarousels } from "./carousel-content";

type RanFor = Record<string, string | undefined>;
const noSubscription = () => () => {};

/**
 * Runs code as an inline `<script>` and reports whether it executed.
 *
 * The body is wrapped in a function so its variables stay local, as they did
 * under `new Function`. A nonce on the page's own scripts is copied, so a
 * nonce-based policy accepts it too. The first statement sets a one-off flag:
 * a script the policy refuses never sets it. An error thrown later in the
 * code still counts as run; it reaches the console like any page error.
 */
function runInline(code: string) {
    const flag = `__pgExec${Math.random().toString(36).slice(2)}`;
    const host = window as unknown as Record<string, unknown>;
    const script = document.createElement("script");
    const nonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;
    if (nonce) script.nonce = nonce;
    script.text = `window[${JSON.stringify(flag)}]=1;(function(){\n${code}\n})();`;
    document.head.appendChild(script);
    script.remove();
    const ran = host[flag] === 1;
    delete host[flag];
    return ran;
}

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
 *
 * The effect runs the code as a `<script>` element of its own, never through
 * `new Function`: that is `eval`, and a site whose Content Security Policy
 * omits `'unsafe-eval'` — the normal case in production — blocked it, so
 * after a link every entrance stayed hidden. An appended script is an inline
 * script, which the same policy already allows for the server-rendered tag.
 */
export function PageScript({ name, code, page }: { name: string; code: string; page: string }) {
    // True while the server renders and while the client hydrates that HTML,
    // false for anything mounted on the client afterwards.
    const fromServer = useSyncExternalStore(noSubscription, () => false, () => true);
    useEffect(() => {
        const host = window as unknown as { __pgRan?: RanFor };
        const ran = (host.__pgRan ??= {});
        // The note only marks the run the HTML parser already did for this
        // mount. Consuming it means a later mount of the same page — leaving
        // and coming back — runs the script again for its fresh nodes.
        if (ran[name] === page) {
            delete ran[name];
            return;
        }
        if (runInline(code)) return;
        console.error(`Pagiera: the "${name}" page script could not run (blocked by the Content Security Policy?).`);
        // Entrances hide content until the script reveals it. When it cannot
        // run, show everything rather than leave the page blank.
        if (name === "entrance") document.documentElement.classList.remove("pg-ready");
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
            const stopActions = mountActions(root.current);
            return () => { stopActions(); stopDisclosures(); stopCarousels(); stopMarquees(); };
        }
    }, [enabled, children]);
    return <main ref={root} className="pg-root">{children}</main>;
}
