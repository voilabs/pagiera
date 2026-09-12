"use client";
import { motion, useIsPresent, useReducedMotion, type HTMLMotionProps } from "motion/react";

export function PopupSurface({ children, style, ...props }: HTMLMotionProps<"div">) {
    const reduced = useReducedMotion();
    const present = useIsPresent();
    return <motion.div {...props}
        initial={{ opacity: 0, scale: reduced ? 1 : .97, y: reduced ? 0 : -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: reduced ? 1 : .98, y: reduced ? 0 : -2 }}
        transition={{ duration: reduced ? 0 : present ? .16 : .12, ease: [.2, .8, .2, 1] }}
        inert={!present || undefined}
        style={{ transformOrigin: "top left", ...style, pointerEvents: present ? style?.pointerEvents : "none" }}
    >{children}</motion.div>;
}
