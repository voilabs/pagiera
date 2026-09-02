import { motion } from "framer-motion";
import { Icon } from "@/components/icons";

const steps = [
  {
    number: "01",
    title: "Compose",
    copy: "Start with a blank canvas or a complete responsive system.",
    detail: "Canvas · Components",
  },
  {
    number: "02",
    title: "Connect",
    copy: "Bind APIs, route parameters and forms directly to the page.",
    detail: "Data · Routes · Forms",
  },
  {
    number: "03",
    title: "Refine",
    copy: "Tune breakpoints, variants, typography and motion in context.",
    detail: "Responsive · Motion",
  },
  {
    number: "04",
    title: "Publish",
    copy: "Ship the exact experience as semantic, server-rendered output.",
    detail: "SSR · Production",
  },
];

export function WorkflowSection() {
  return (
    <section
      className="bg-[#0d0915] px-[max(24px,calc((100vw-1240px)/2))] py-36 text-white max-md:py-24"
      id="workflow"
    >
      <div className="grid grid-cols-[.8fr_1.4fr] gap-20 max-lg:grid-cols-1 max-lg:gap-8">
        <span className="text-[10px] font-bold tracking-[.13em] text-[#6a25f0] uppercase">
          From first frame to live URL
        </span>
        <div>
          <h2 className="text-[clamp(50px,7vw,100px)] leading-[.88] font-medium tracking-[-.08em]">
            Four moves.
            <br />
            One continuous flow.
          </h2>
          <p className="mt-8 max-w-[620px] text-base leading-8 text-white/52">
            No handoff theatre and no rebuilding the same decision in three
            different tools. Every step happens on the page that will ship.
          </p>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-4 overflow-hidden rounded-[34px] border border-white/10 bg-[#171020] max-lg:grid-cols-2 max-md:grid-cols-1 max-md:rounded-[26px]">
        {steps.map((step, index) => (
          <motion.article
            className="group relative min-h-[420px] border-white/10 p-7 not-first:border-l max-lg:nth-[3]:border-l-0 max-md:min-h-[330px] max-md:border-t max-md:border-l-0 max-md:first:border-t-0"
            initial={{ opacity: 0, y: 26 }}
            key={step.number}
            transition={{ delay: index * 0.07, duration: 0.55 }}
            viewport={{ amount: 0.25, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#6a25f0]">
                {step.number}
              </span>
              <span className="grid size-10 place-items-center rounded-full border border-white/10 text-[#a982ff] transition group-hover:bg-[#6a25f0] group-hover:text-white">
                <Icon name="arrow" size={15} />
              </span>
            </div>
            <div className="mt-24 max-md:mt-16">
              <h3 className="text-[clamp(34px,3vw,46px)] font-medium tracking-[-.06em]">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/46">
                {step.copy}
              </p>
            </div>
            <span className="absolute right-7 bottom-7 left-7 border-t border-white/10 pt-4 font-mono text-[9px] tracking-[.08em] text-white/30 uppercase">
              {step.detail}
            </span>
          </motion.article>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between rounded-full bg-[#171020] px-7 py-5 text-sm text-white max-md:items-start max-md:gap-4 max-md:rounded-[24px]">
        <span className="flex items-center gap-3">
          <i className="size-2 rounded-full bg-[#8f5cff]" /> Every stage remains
          editable.
        </span>
        <span className="text-white/45 max-sm:hidden">
          Nothing gets flattened on the way to production.
        </span>
      </div>
    </section>
  );
}
