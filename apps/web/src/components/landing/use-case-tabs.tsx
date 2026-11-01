"use client";
import { type KeyboardEvent, type ReactNode, useId, useState } from "react";

export type UseCaseTab = {
  id: string;
  tab: string;
  title: string;
  text: string;
  points: string[];
  href: string;
  visual: ReactNode;
};

// WAI-ARIA vertical tabs with automatic activation and roving focus.
export function UseCaseTabs({
  tabs,
  label,
  more,
}: {
  tabs: UseCaseTab[];
  label: string;
  more: string;
}) {
  const base = useId();
  const [active, setActive] = useState(0);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = tabs.length - 1;
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
    const next = forward
      ? active === last
        ? 0
        : active + 1
      : back
        ? active === 0
          ? last
          : active - 1
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? last
            : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`${base}-tab-${next}`)?.focus();
  }

  const tab = tabs[active];
  return (
    <div className="explorer">
      <div className="explorer-nav">
        <div className="explorer-nav-inner">
          <p className="explorer-label">{label}</p>
          <div role="tablist" aria-label={label} aria-orientation="vertical">
            {tabs.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${base}-tab-${index}`}
                aria-selected={index === active}
                aria-controls={`${base}-panel`}
                tabIndex={index === active ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={onKeyDown}
              >
                {item.tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className="explorer-panel"
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${active}`}
      >
        <div className="window">
          <div className="window-bar" aria-hidden="true">
            <span className="window-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="window-title">Pagiera · {tab.tab}</span>
          </div>
          <div className="window-body" key={tab.id}>
            {tab.visual}
          </div>
        </div>
        <div className="explorer-copy">
          <div>
            <h3>{tab.title}</h3>
            <p>{tab.text}</p>
            <a className="text-link" href={tab.href}>
              {more} →
            </a>
          </div>
          <ul>
            {tab.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
