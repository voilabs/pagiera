import { motion } from "framer-motion";
import { Icon } from "@/components/icons";

const steps = [
  [
    "01",
    "Compose",
    "Start from a blank canvas or a complete responsive template.",
  ],
  [
    "02",
    "Connect",
    "Bind real APIs, route params and forms without losing server rendering.",
  ],
  [
    "03",
    "Refine",
    "Tune breakpoints, variants, typography and motion in one visual system.",
  ],
  [
    "04",
    "Publish",
    "Ship exactly what you saw on the canvas—with semantic production output.",
  ],
];

export function WorkflowSection() {
  return (
    <section
      className="grid grid-cols-[.85fr_1.35fr] gap-24 bg-[#f8f7fb] px-[max(24px,calc((100vw-1200px)/2))] py-36 max-lg:grid-cols-1 max-lg:gap-14 max-lg:py-24"
      id="workflow"
    >
      <div>
        <span className="text-[11px] font-bold tracking-[.1em] text-[#655e6e] uppercase">
          From idea to live site
        </span>
        <h2 className="sticky top-28 mt-6 text-[clamp(48px,6vw,82px)] leading-[.94] font-medium tracking-[-.07em] max-lg:static">
          A workflow that keeps momentum.
        </h2>
      </div>
      <div className="divide-y divide-black/10 border-y border-black/10">
        {steps.map(([number, title, copy], index) => (
          <motion.article
            className="group grid min-h-[190px] grid-cols-[48px_1fr_auto] items-center gap-5"
            key={number}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.05 }}
          >
            <span className="font-mono text-[10px] text-[#5402e6]">
              {number}
            </span>
            <div>
              <h3 className="text-[32px] font-medium tracking-[-.05em]">
                {title}
              </h3>
              <p className="mt-3 max-w-[480px] text-sm leading-6 text-[#746d7c]">
                {copy}
              </p>
            </div>
            <span className="grid size-11 place-items-center rounded-full border border-black/10 transition-colors group-hover:bg-[#5402e6] group-hover:text-white">
              <Icon name="arrow" />
            </span>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
