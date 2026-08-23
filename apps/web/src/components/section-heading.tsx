import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  copy,
  inverted,
}: {
  eyebrow: string;
  title: ReactNode;
  copy?: ReactNode;
  inverted?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_2.2fr_1fr] items-end gap-10 max-lg:grid-cols-[1fr_2fr] max-md:grid-cols-1">
      <span
        className={cn(
          "self-start text-[11px] font-bold tracking-[0.1em] uppercase",
          inverted ? "text-white/50" : "text-[#655e6e]",
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          "m-0 text-[clamp(42px,5vw,70px)] leading-[0.98] font-medium tracking-[-0.065em]",
          inverted ? "text-white" : "text-[#17131d]",
        )}
      >
        {title}
      </h2>
      {copy && (
        <div
          className={cn(
            "text-sm leading-7",
            inverted ? "text-white/55" : "text-[#746d7c]",
          )}
        >
          {copy}
        </div>
      )}
    </div>
  );
}
