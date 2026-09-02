import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "border border-[#171020] bg-[#171020] text-white hover:border-[#6a25f0] hover:bg-[#6a25f0]",
  secondary: "border border-black/10 bg-white/75 text-[#29232f] hover:bg-white",
  purple: "border border-[#5402e6] bg-[#5402e6] text-white hover:bg-[#6c25ed]",
  accent:
    "border border-[#6a25f0] bg-[#6a25f0] text-white hover:border-[#7c3ff2] hover:bg-[#7c3ff2]",
  ghost:
    "border border-transparent bg-transparent text-[#595261] hover:bg-white",
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
  return (
    <a
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center active:scale-[0.98] transition-all! gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-200",
        variants[variant],
        sizes[size],
        className,
      )}
      href={href}
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
