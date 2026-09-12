import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** The single easing the marketing pages share, so every rise feels related. */
export const EASE = [0.16, 1, 0.3, 1] as const;

const tags = {
  article: motion.article,
  details: motion.details,
  div: motion.div,
  h2: motion.h2,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const;

type RevealProps = {
  /** Element to render, so a reveal can sit directly inside a grid or list. */
  as?: keyof typeof tags;
  /** Fraction of the element that must be visible before it animates. */
  amount?: number;
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  duration?: number;
  /** Forwarded so headings keep the id their aria-labelledby points at. */
  id?: string;
  /** "mount" for above-the-fold content, "view" for anything further down. */
  on?: "mount" | "view";
};

/**
 * A short, eased rise used for every section that was previously static.
 * Reduced-motion visitors get the final state with no transition at all.
 */
export function Reveal({
  as = "div",
  amount = 0.25,
  children,
  className,
  delay = 0,
  distance = 26,
  duration = 0.6,
  id,
  on = "view",
}: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = tags[as];

  if (reduced) {
    return (
      <Tag className={className} id={id}>
        {children}
      </Tag>
    );
  }

  const target = { opacity: 1, y: 0 };
  return (
    <Tag
      className={className}
      id={id}
      initial={{ opacity: 0, y: distance }}
      transition={{ delay, duration, ease: EASE }}
      {...(on === "mount"
        ? { animate: target }
        : { viewport: { amount, once: true }, whileInView: target })}
    >
      {children}
    </Tag>
  );
}
