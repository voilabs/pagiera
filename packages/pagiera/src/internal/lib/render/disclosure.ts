/** All mutations are restored when editor preview ends or the page unmounts. */
export function mountDisclosures(root: ParentNode) {
    const cleanups = Array.from(root.querySelectorAll<HTMLElement>('[data-pg-disclosure]')).map(widget => {
        const owned = (selector: string) => Array.from(widget.querySelectorAll<HTMLElement>(selector)).filter(node => node.closest('[data-pg-disclosure]') === widget);
        const triggers = owned('[data-pg-disclosure-role=trigger]');
        const panels = owned('[data-pg-disclosure-role=panel]');
        const controller = new AbortController();
        const saved = [...triggers, ...panels].map(node => ({ node, attrs: ['style', 'role', 'tabindex', 'aria-selected', 'aria-expanded', 'aria-hidden', 'aria-controls', 'aria-labelledby', 'id'].map(name => [name, node.getAttribute(name)] as const) }));
        const tabs = widget.dataset.pgDisclosure === 'tabs';
        let active = triggers[0]?.dataset.pgDisclosureTarget ?? '';
        const open = new Set<string>();
        function render() {
            triggers.forEach((trigger, i) => {
                const target = trigger.dataset.pgDisclosureTarget!;
                const panel = panels.find(node => node.dataset.pgDisclosureTarget === target);
                const selected = tabs ? active === target : open.has(target);
                if (!panel) return;
                if (!trigger.id) trigger.id = `pg-trigger-${crypto.randomUUID()}`;
                if (!panel.id) panel.id = `pg-panel-${crypto.randomUUID()}`;
                trigger.setAttribute('aria-controls', panel.id);
                trigger.setAttribute('aria-expanded', String(selected));
                if (tabs) { trigger.setAttribute('role', 'tab'); trigger.setAttribute('aria-selected', String(selected)); trigger.tabIndex = selected ? 0 : -1; }
                panel.setAttribute('role', tabs ? 'tabpanel' : 'region');
                panel.setAttribute('aria-labelledby', trigger.id);
                panel.setAttribute('aria-hidden', String(!selected));
                const originalStyle = saved.find(entry => entry.node === panel)!.attrs.find(([name]) => name === 'style')![1];
                if (selected) { if (originalStyle === null) panel.removeAttribute('style'); else panel.setAttribute('style', originalStyle); }
                else panel.style.setProperty('display', 'none', 'important');
            });
        }
        const tablist = tabs ? triggers[0]?.parentElement : undefined;
        const oldRole = tablist?.getAttribute('role');
        tablist?.setAttribute('role', 'tablist');
        triggers.forEach((trigger, index) => {
            trigger.addEventListener('click', event => {
                event.preventDefault(); event.stopPropagation(); const target = trigger.dataset.pgDisclosureTarget!;
                if (tabs) active = target; else if (open.has(target)) open.delete(target); else open.add(target);
                render();
            }, { signal: controller.signal });
            if (tabs) trigger.addEventListener('keydown', event => {
                if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? triggers.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length;
                active = triggers[next].dataset.pgDisclosureTarget!; render(); triggers[next].focus();
            }, { signal: controller.signal });
        });
        render();
        return () => {
            controller.abort(); saved.forEach(({ node, attrs }) => attrs.forEach(([name, value]) => value === null ? node.removeAttribute(name) : node.setAttribute(name, value)));
            if (tablist) { if (oldRole == null) tablist.removeAttribute('role'); else tablist.setAttribute('role', oldRole); }
        };
    });
    return () => cleanups.forEach(cleanup => cleanup());
}
