import { motion } from "framer-motion";
import { Icon } from "@/components/icons";

const actions = [
  "Set an editorial type scale",
  "Create responsive project cards",
  "Bind the featured-project query",
];

export function AiSection() {
  return (
    <section className="bg-[#0d0915] px-3 pb-3">
      <div className="relative overflow-hidden rounded-[48px] border border-white/[.08] bg-[#171020] px-[max(24px,calc((100vw-1240px)/2))] py-32 text-white max-md:rounded-[30px] max-md:py-24">
        <div className="pointer-events-none absolute top-[-30%] right-[-12%] size-[720px] rounded-full bg-[#6a25f0]/28 blur-[140px]" />
        <div className="relative grid grid-cols-[.88fr_1.12fr] items-center gap-24 max-lg:grid-cols-1 max-lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-[10px] font-bold tracking-[.1em] text-[#a982ff] uppercase backdrop-blur">
              <Icon name="sparkles" size={14} /> Pagiera AI
            </span>
            <h2 className="mt-7 text-[clamp(50px,6.5vw,92px)] leading-[.9] font-medium tracking-[-.075em]">
              Ask for direction.
              <br />
              Keep the decisions.
            </h2>
            <p className="mt-7 max-w-[560px] text-base leading-8 text-white/52">
              AI works inside the same component, data and responsive system you
              edit by hand. Every result remains visible, inspectable and yours
              to change.
            </p>
            <div className="mt-9 flex flex-wrap gap-2">
              {["Visible steps", "Real components", "Editable output"].map(
                (item) => (
                  <span
                    className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-2 text-[10px] font-semibold text-white/62"
                    key={item}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <motion.div
            className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[.055] p-3 shadow-[0_45px_100px_rgba(0,0,0,.28)] backdrop-blur-xl max-md:rounded-[26px]"
            initial={{ opacity: 0, y: 34 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-[25px] bg-[#151020] p-5 text-white max-md:p-4">
              <div className="flex items-center border-b border-white/10 pb-4">
                <span className="grid size-9 place-items-center rounded-xl bg-[#6a25f0]">
                  <Icon name="sparkles" size={15} />
                </span>
                <span className="ml-3">
                  <strong className="block text-xs">Design agent</strong>
                  <i className="mt-1 block text-[9px] not-italic text-white/35">
                    Working in this page
                  </i>
                </span>
                <i className="ml-auto size-2 rounded-full bg-[#7ee2a8]" />
              </div>

              <div className="py-7">
                <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-sm bg-white px-4 py-3 text-[11px] leading-5 text-[#20162d]">
                  Build a restrained portfolio system for an architecture
                  studio.
                </div>
                <div className="mt-7 grid grid-cols-[32px_1fr] gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#6a25f0]">
                    <Icon name="sparkles" size={13} />
                  </span>
                  <div>
                    <p className="text-[11px] leading-5 text-white/65">
                      I’ll create the system in three visible steps.
                    </p>
                    <div className="mt-4 space-y-2">
                      {actions.map((action, index) => (
                        <motion.div
                          className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.04] px-3"
                          initial={{ opacity: 0.35 }}
                          key={action}
                          transition={{ delay: index * 0.35, duration: 0.4 }}
                          viewport={{ once: true }}
                          whileInView={{ opacity: 1 }}
                        >
                          <span className="grid size-5 place-items-center rounded-full bg-[#6a25f0]/20 text-[#b99dff]">
                            <Icon name="check" size={11} />
                          </span>
                          <span className="text-[10px] text-white/55">
                            {action}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-14 items-center rounded-2xl border border-white/10 bg-white/[.04] px-4 text-[10px] text-white/30">
                Ask for a change…
                <span className="ml-auto grid size-9 place-items-center rounded-full bg-[#6a25f0] text-white">
                  <Icon name="arrow" size={14} />
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
