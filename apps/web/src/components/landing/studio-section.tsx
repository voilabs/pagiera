import { motion } from "framer-motion";
import { Icon } from "@/components/icons";

const systemItems = [
  ["Navbar", "4 variants", "layers"],
  ["Hero", "3 breakpoints", "frame"],
  ["Project card", "Bound to CMS", "brackets"],
] as const;

export function StudioSection() {
  return (
    <section
      className="relative mx-3 overflow-hidden rounded-[48px] bg-[#6a25f0] px-[max(24px,calc((100vw-1240px)/2))] py-32 text-white max-md:mx-2 max-md:rounded-[30px] max-md:py-24"
      id="studio"
    >
      <div className="pointer-events-none absolute -top-36 right-[-10%] size-[620px] rounded-full bg-[#a982ff]/40 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-48 left-[-8%] size-[560px] rounded-full bg-[#2d087d]/45 blur-[130px]" />

      <div className="relative grid grid-cols-[.8fr_1.4fr] gap-20 max-lg:grid-cols-1 max-lg:gap-8">
        <span className="text-[10px] font-bold tracking-[.13em] text-white/55 uppercase">
          A system that stays alive
        </span>
        <div>
          <h2 className="max-w-[940px] text-[clamp(50px,7vw,102px)] leading-[.88] font-medium tracking-[-.08em]">
            Change once.
            <br />
            Feel it everywhere.
          </h2>
          <p className="mt-8 max-w-[630px] text-base leading-8 text-white/68">
            Components, breakpoints and real content remain connected while you
            work. Pagiera turns visual decisions into a system instead of a
            collection of disconnected screens.
          </p>
        </div>
      </div>

      <motion.div
        className="relative mt-20 grid min-h-[680px] grid-cols-[330px_1fr] overflow-hidden rounded-[36px] border border-white/15 bg-[#120b1f] shadow-[0_50px_120px_rgba(25,4,62,.35)] max-lg:grid-cols-1 max-md:mt-14 max-md:min-h-0 max-md:rounded-[26px]"
        initial={{ opacity: 0, y: 42 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ amount: 0.16, once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <aside className="border-r border-white/10 p-7 max-lg:border-r-0 max-lg:border-b max-md:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Components</span>
            <span className="grid size-8 place-items-center rounded-full bg-white/[.07] text-white/55">
              <Icon name="plus" size={14} />
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-5 text-white/35">
            Reusable building blocks in this project.
          </p>
          <div className="mt-8 space-y-2">
            {systemItems.map(([title, detail, icon], index) => (
              <motion.div
                animate={
                  index === 1
                    ? {
                        borderColor: [
                          "rgba(255,255,255,.08)",
                          "rgba(169,130,255,.7)",
                          "rgba(255,255,255,.08)",
                        ],
                      }
                    : undefined
                }
                className="rounded-2xl border border-white/[.08] bg-white/[.035] p-4"
                key={title}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="flex items-center gap-3">
                  <i className="grid size-9 place-items-center rounded-xl bg-white/[.06] text-[#b99dff]">
                    <Icon name={icon} size={15} />
                  </i>
                  <span>
                    <strong className="block text-[12px] font-semibold">
                      {title}
                    </strong>
                    <i className="mt-1 block text-[9px] not-italic text-white/35">
                      {detail}
                    </i>
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-dashed border-white/12 p-4 text-[10px] leading-5 text-white/35">
            Edit a master and every instance follows—without flattening local
            content.
          </div>
        </aside>

        <div className="relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_48%,rgba(106,37,240,.28),transparent_44%),linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:auto,32px_32px,32px_32px] p-12 max-md:min-h-[520px] max-md:p-5">
          <div className="relative w-full max-w-[720px] rounded-[28px] bg-[#f7f3ec] p-6 text-[#18111f] shadow-[0_35px_90px_rgba(0,0,0,.35)] max-md:p-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-4 text-[9px]">
              <strong>PAGIERA® STUDIO</strong>
              <span className="flex gap-4 text-black/45">
                <i>Work</i>
                <i>About</i>
                <b className="rounded-full bg-[#18111f] px-3 py-1.5 font-medium text-white">
                  Start a project
                </b>
              </span>
            </div>
            <div className="relative py-14 max-md:py-10">
              <span className="text-[8px] font-bold tracking-[.15em] uppercase">
                Independent creative studio
              </span>
              <h3 className="mt-5 text-[clamp(42px,6vw,78px)] leading-[.83] font-medium tracking-[-.075em]">
                MAKE THE WEB
                <span className="block text-[#6a25f0]">FEEL ALIVE.</span>
              </h3>
              <div className="absolute top-[46px] right-4 h-[58%] w-[42%] rounded-full bg-[radial-gradient(circle,#9b6cff_0%,#6a25f0_32%,transparent_68%)] blur-lg" />
              <motion.span
                animate={{ x: [0, 12, 0], y: [0, 8, 0] }}
                className="absolute right-[34%] bottom-[22%] z-10 text-[#6a25f0]"
                transition={{ duration: 3.8, repeat: Infinity }}
              >
                <Icon name="cursor" size={21} />
              </motion.span>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-black/10 pt-4 text-[8px] font-bold tracking-[.08em] uppercase">
              {["Strategy", "Identity", "Digital", "Motion"].map((item) => (
                <span
                  className="rounded-full border border-black/10 px-3 py-2"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <span className="absolute right-6 bottom-6 rounded-full border border-white/10 bg-[#120b1f]/75 px-4 py-2 font-mono text-[9px] text-white/45 backdrop-blur">
            3 instances updated
          </span>
        </div>
      </motion.div>
    </section>
  );
}
