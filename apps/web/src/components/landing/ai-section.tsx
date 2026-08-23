import { motion } from "framer-motion";
import { Icon } from "@/components/icons";

export function AiSection() {
  return (
    <section className="grid min-h-[850px] grid-cols-2 items-center gap-24 mx-4 rounded-[48px] bg-[#eee8ff] px-[max(24px,calc((100vw-1200px)/2))] py-32 max-lg:grid-cols-1 max-lg:gap-14 max-lg:py-24">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-2 text-[10px] font-bold tracking-wider text-[#5402e6] uppercase">
          <Icon name="sparkles" size={14} /> Pagiera AI
        </span>
        <h2 className="mt-6 text-[clamp(48px,6vw,82px)] leading-[.94] font-medium tracking-[-.07em]">
          A creative partner inside the canvas.
        </h2>
        <p className="mt-6 max-w-[520px] text-sm leading-7 text-[#6e6578]">
          Describe a direction, watch every step and keep editing the real
          result. AI uses the same responsive components, data and motion system
          you do.
        </p>
      </div>
      <motion.div
        className="overflow-hidden rounded-[28px] border border-white/10 bg-[#15121a] text-white shadow-[0_40px_90px_rgba(64,33,110,.2)]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/8 px-5">
          <span className="grid size-9 place-items-center rounded-xl bg-[#5402e6]">
            <Icon name="sparkles" size={15} />
          </span>
          <div>
            <strong className="block text-xs">Pagiera AI</strong>
            <span className="text-[8px] text-white/40">
              Design agent · Ready
            </span>
          </div>
          <i className="ml-auto size-2 rounded-full bg-[#4bd58a]" />
        </div>
        <div className="min-h-[390px] p-6">
          <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-white px-4 py-3 text-[11px] leading-5 text-[#251e2e]">
            Create a cinematic portfolio for an architecture studio.
          </div>
          <div className="mt-7 grid grid-cols-[32px_1fr] gap-3">
            <span className="grid size-8 place-items-center rounded-xl bg-[#5402e6]">
              <Icon name="sparkles" size={14} />
            </span>
            <div>
              <p className="mt-1 text-[11px] leading-5 text-white/70">
                I’ll build a restrained editorial system with warm stone tones
                and spatial motion.
              </p>
              <div className="mt-4 grid gap-2">
                {[
                  "Creating design direction",
                  "Composing responsive sections",
                  "Adding entrance motion",
                ].map((item, i) => (
                  <span
                    className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-[9px] ${i === 2 ? "border border-[#7c41ff]/30 bg-[#5402e6]/10 text-[#c5b1f0]" : "bg-white/5 text-white/45"}`}
                    key={item}
                  >
                    {i < 2 ? (
                      <Icon className="text-[#50d28a]" name="check" size={12} />
                    ) : (
                      <i className="size-2 animate-spin rounded-full border border-[#a37bff] border-t-transparent" />
                    )}
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="m-4 flex h-14 items-center rounded-2xl border border-white/8 bg-white/[.03] px-4 text-[10px] text-white/35">
          Ask Pagiera to change anything…
          <button
            className="ml-auto grid size-9 cursor-pointer place-items-center rounded-xl bg-[#6d2cf0] text-white"
            type="button"
          >
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
