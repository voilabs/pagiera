import { motion } from "framer-motion";
import { Icon, type IconName } from "@/components/icons";

const capabilities: Array<{
  icon: IconName;
  title: string;
  copy: string;
}> = [
  {
    icon: "cursor",
    title: "Place with intent",
    copy: "Move freely on the canvas, then let guides and responsive rules keep the result disciplined.",
  },
  {
    icon: "layers",
    title: "Reuse the good parts",
    copy: "Turn any selection into a component with variants that stay in sync across every page.",
  },
  {
    icon: "brackets",
    title: "Ship real output",
    copy: "Bind APIs and route data while preserving semantic markup, server rendering and code ownership.",
  },
];

export function FeaturesSection() {
  return (
    <section
      className="bg-[#0d0915] px-[max(24px,calc((100vw-1240px)/2))] py-36 text-white max-md:py-24"
      id="features"
    >
      <div className="grid grid-cols-[.72fr_1.5fr] gap-20 max-lg:grid-cols-1 max-lg:gap-8">
        <span className="text-[10px] font-bold tracking-[.13em] text-[#6a25f0] uppercase">
          The visual layer, rebuilt
        </span>
        <div>
          <h2 className="max-w-[920px] text-[clamp(48px,6.5vw,94px)] leading-[.9] font-medium tracking-[-.075em]">
            Design without leaving production behind.
          </h2>
          <p className="mt-8 max-w-[650px] text-base leading-8 text-white/52">
            Pagiera puts visual freedom and implementation structure in the same
            workspace. The canvas stays expressive; the output stays ready for
            the web.
          </p>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-3 border-y border-white/10 max-lg:grid-cols-1 max-lg:border-y-0">
        {capabilities.map((item, index) => (
          <motion.article
            className="border-white/10 px-8 py-10 first:pl-0 not-first:border-l last:pr-0 max-lg:border-t max-lg:px-0 max-lg:first:border-t"
            initial={{ opacity: 0, y: 24 }}
            key={item.title}
            transition={{ delay: index * 0.08, duration: 0.55 }}
            viewport={{ amount: 0.35, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className="grid size-11 place-items-center rounded-full bg-[#6a25f0]/16 text-[#a982ff]">
              <Icon name={item.icon} size={18} />
            </span>
            <h3 className="mt-9 text-2xl font-semibold tracking-[-.045em]">
              {item.title}
            </h3>
            <p className="mt-3 max-w-[340px] text-sm leading-7 text-white/46">
              {item.copy}
            </p>
          </motion.article>
        ))}
      </div>

      <motion.div
        className="mt-16 overflow-hidden rounded-[38px] bg-[#120b1f] p-3 shadow-[0_45px_100px_rgba(47,24,81,.16)] max-md:rounded-[28px] max-md:p-2"
        initial={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ amount: 0.18, once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="flex h-14 items-center border-b border-white/10 px-5 text-[10px] text-white/45">
          <span className="flex items-center gap-2 text-white/85">
            <i className="size-2 rounded-full bg-[#8f5cff]" /> Pagiera canvas
          </span>
          <span className="mx-auto rounded-full bg-white/[.06] px-4 py-2 font-mono">
            Desktop · 1280+
          </span>
          <span>Live preview</span>
        </div>

        <div className="grid min-h-[620px] grid-cols-[220px_1fr] overflow-hidden rounded-b-[28px] bg-[#e9e5ee] max-lg:grid-cols-[170px_1fr] max-md:min-h-[500px] max-md:grid-cols-[54px_1fr]">
          <aside className="border-r border-black/10 bg-white/70 p-5 max-md:p-2">
            <strong className="text-xs max-md:hidden">Layers</strong>
            <div className="mt-7 space-y-2 max-md:mt-3">
              {["Navbar", "Hero", "Proof", "Projects", "Footer"].map(
                (item, index) => (
                  <span
                    className={`flex h-10 items-center gap-2 rounded-xl px-3 text-[10px] ${index === 1 ? "bg-[#6a25f0] text-white" : "text-[#6f6877]"}`}
                    key={item}
                  >
                    <Icon name={index === 1 ? "heading" : "layers"} size={13} />
                    <i className="not-italic max-md:hidden">{item}</i>
                  </span>
                ),
              )}
            </div>
          </aside>

          <div className="relative grid place-items-center overflow-hidden bg-[linear-gradient(rgba(35,20,51,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(35,20,51,.055)_1px,transparent_1px)] bg-[size:28px_28px] p-12 max-md:p-5">
            <div className="relative w-[86%] max-w-[780px] overflow-hidden rounded-[22px] bg-[#fbf9f3] p-[7%] shadow-[0_30px_70px_rgba(43,23,67,.2)] max-md:w-full">
              <span className="text-[8px] font-bold tracking-[.16em] uppercase">
                Independent creative studio
              </span>
              <div className="relative mt-10 border border-[#6a25f0] p-2">
                <strong className="block text-[clamp(32px,5vw,72px)] leading-[.82] tracking-[-.075em]">
                  MAKE THE WEB
                  <i className="block font-normal text-[#6a25f0]">
                    FEEL ALIVE.
                  </i>
                </strong>
                {[
                  "-top-1 -left-1",
                  "-top-1 -right-1",
                  "-bottom-1 -left-1",
                  "-right-1 -bottom-1",
                ].map((position) => (
                  <i
                    className={`absolute size-2.5 rounded-full border border-[#6a25f0] bg-white ${position}`}
                    key={position}
                  />
                ))}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-[#6a25f0] px-2 py-1 font-mono text-[8px] text-white">
                  Hero title · component
                </span>
              </div>
              <p className="mt-12 max-w-[430px] text-xs leading-6 text-black/50">
                Design decisions remain visible, reusable and ready to become
                production output.
              </p>
            </div>
            <motion.span
              animate={{ x: [0, 10, 0], y: [0, 7, 0] }}
              className="absolute top-[62%] left-[71%] text-[#6a25f0]"
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            >
              <Icon name="cursor" size={24} />
            </motion.span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
