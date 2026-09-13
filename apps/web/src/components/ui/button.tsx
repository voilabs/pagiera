import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { localizedHref, useI18n } from "@/lib/i18n";

const variants = {
  primary:
    "border border-[#131313] bg-[#131313] text-white hover:border-[#6a25f0] hover:bg-[#6a25f0]",
  secondary: "border border-black/10 bg-white/75 text-[#252525] hover:bg-white",
  purple: "border border-[#5402e6] bg-[#5402e6] text-white hover:bg-[#6a25f0]",
  accent:
    "border border-[#6a25f0] bg-[#6a25f0] text-white hover:border-[#8247f3] hover:bg-[#8247f3]",
  ghost:
    "border border-transparent bg-transparent text-[#555555] hover:bg-white",
} as const;

const sizes = {
  sm: "min-h-10 px-4 text-xs",
  md: "min-h-10 px-4 text-[13px]",
  lg: "min-h-12 px-4 text-sm",
} as const;

type SharedProps = {
  children: ReactNode;
  className?: string;
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
};

export function ButtonLink({
  children,
  className,
  href,
  size = "md",
  variant = "primary",
}: SharedProps & { href: string }) {
  const { locale } = useI18n();
  return (
    <a
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center active:scale-[0.98] transition-all! gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-200",
        variants[variant],
        sizes[size],
        className,
      )}
      href={localizedHref(href, locale)}
    >
      {children}
    </a>
  );
}

export function Button({
  children,
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-200",
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
