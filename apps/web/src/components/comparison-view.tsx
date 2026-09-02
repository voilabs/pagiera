import { motion } from "framer-motion";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import type { Comparison } from "@/lib/comparisons";

/**
 * The order here is deliberate and is the whole SEO/GEO argument: the verdict
 * paragraph comes before the table, so a crawler—or a model summarising the
 * page—reaches a complete, quotable answer without parsing any layout.
 */
export function ComparisonView({
  comparison,
  others,
}: {
  comparison: Comparison;
  others: Comparison[];
}) {
  return (
    <>
      <section className="relative m-2 overflow-hidden rounded-[36px] bg-[#f7f5fb] px-6 pt-[190px] pb-24 text-[#17101f] max-md:m-1 max-md:rounded-[28px] max-md:px-4 max-md:pt-32 max-md:pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(56%_46%_at_50%_18%,rgba(106,37,240,.5),rgba(143,92,247,.22)_45%,transparent_72%)] [mask-image:radial-gradient(closest-side,#000_58%,transparent),repeating-conic-gradient(#000_0%_25%,transparent_0%_50%)] [mask-position:0_0] [mask-repeat:repeat] [mask-size:12px_12px,12px_12px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[linear-gradient(#f7f5fb_28%,rgba(247,245,251,.72)_62%,transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(transparent,#f7f5fb)]" />

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative z-[3] mx-auto max-w-[940px] text-center"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[.08] bg-white/80 px-3.5 py-1.5 text-[10px] font-bold tracking-[.08em] text-[#3d3548] uppercase backdrop-blur-md">
            <i className="size-1.5 rounded-full bg-[#6a25f0]" /> Comparison
          </span>
          <h1 className="mt-8 text-[clamp(48px,6.4vw,88px)] leading-[.92] font-semibold tracking-[-0.075em] max-md:mt-6 max-md:text-[clamp(40px,11vw,58px)]">
            Pagiera{" "}
            <em className="font-serif font-normal text-[#6a25f0]">vs</em>{" "}
            {comparison.rival}
          </h1>
          <p className="mx-auto mt-7 max-w-[620px] text-sm leading-7 text-[#5b5566]">
            {comparison.headline}
          </p>
          <div className="mt-9 flex justify-center gap-2 max-sm:mx-auto max-sm:w-[min(330px,100%)] max-sm:flex-col">
            <ButtonLink href="#at-a-glance" size="lg" variant="accent">
              See the differences <Icon name="arrow" size={16} />
            </ButtonLink>
            <ButtonLink
              className="bg-white/85"
              href="/templates"
              size="lg"
              variant="secondary"
            >
              Browse templates
            </ButtonLink>
          </div>
        </motion.div>
      </section>

      <section className="bg-[#0d0915] px-[max(24px,calc((100vw-1120px)/2))] py-28 text-white max-md:py-20">
        {/* The short answer, first and unqualified. */}
        <div className="rounded-[30px] border border-white/[.08] bg-[#171020] p-10 max-md:rounded-[24px] max-md:p-6">
          <h2 className="text-[10px] font-bold tracking-[.13em] text-[#a982ff] uppercase">
            The short answer
          </h2>
          <p className="mt-5 text-lg leading-9 text-white/82 max-md:text-base max-md:leading-8">
            {comparison.verdict}
          </p>
        </div>

        <p className="mt-10 max-w-[720px] text-sm leading-7 text-white/45">
          {comparison.intent}
        </p>

        <h2
          className="mt-24 text-[clamp(34px,4.2vw,58px)] leading-[.96] font-medium tracking-[-.07em] max-md:mt-16"
          id="at-a-glance"
        >
          At a{" "}
          <em className="font-serif font-normal text-[#a982ff]">glance.</em>
        </h2>

        <div className="mt-10 overflow-x-auto rounded-[26px] border border-white/[.08]">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <caption className="sr-only">
              Pagiera compared with {comparison.rival}
            </caption>
            <thead>
              <tr className="bg-white/[.04]">
                <th
                  className="px-6 py-5 text-[10px] font-bold tracking-[.12em] text-white/40 uppercase"
                  scope="col"
                >
                  Aspect
                </th>
                <th
                  className="px-6 py-5 text-[13px] font-semibold text-[#a982ff]"
                  scope="col"
                >
                  Pagiera
                </th>
                <th
                  className="px-6 py-5 text-[13px] font-semibold text-white/70"
                  scope="col"
                >
                  {comparison.rival}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr className="border-t border-white/[.07]" key={row.label}>
                  <th
                    className="px-6 py-5 align-top text-[12px] font-semibold text-white/55"
                    scope="row"
                  >
                    {row.label}
                  </th>
                  <td className="px-6 py-5 align-top text-[13px] leading-6 text-white/85">
                    {row.pagiera}
                  </td>
                  <td className="px-6 py-5 align-top text-[13px] leading-6 text-white/60">
                    {row.rival}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <ChoiceCard
            accent
            items={comparison.choosePagiera}
            title="Choose Pagiera when"
          />
          <ChoiceCard
            items={comparison.chooseRival}
            title={`Choose ${comparison.rival} when`}
          />
        </div>

        <h2 className="mt-24 text-[clamp(34px,4.2vw,58px)] leading-[.96] font-medium tracking-[-.07em] max-md:mt-16">
          Common{" "}
          <em className="font-serif font-normal text-[#a982ff]">questions.</em>
        </h2>
        <dl className="mt-10 grid gap-3">
          {comparison.faq.map((entry) => (
            <div
              className="rounded-[24px] border border-white/[.08] bg-[#171020] p-7 max-md:p-5"
              key={entry.question}
            >
              <dt className="text-[15px] font-semibold tracking-[-.02em] text-white">
                {entry.question}
              </dt>
              <dd className="mt-3 text-[13px] leading-7 text-white/55">
                {entry.answer}
              </dd>
            </div>
          ))}
        </dl>

        {others.length > 0 && (
          <>
            <h2 className="mt-24 text-[10px] font-bold tracking-[.13em] text-[#6a25f0] uppercase max-md:mt-16">
              Other comparisons
            </h2>
            <div className="mt-6 grid grid-cols-3 gap-3 max-md:grid-cols-1">
              {others.map((entry) => (
                <a
                  className="group flex items-center justify-between gap-4 rounded-[22px] border border-white/[.08] bg-white/[.02] px-6 py-5 transition-colors hover:border-[#6a25f0]/40 hover:bg-white/[.05]"
                  href={`/compare/${entry.slug}`}
                  key={entry.slug}
                >
                  <span className="text-[14px] font-semibold tracking-[-.03em]">
                    Pagiera vs {entry.rival}
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 text-[#a982ff] transition-colors group-hover:border-[#6a25f0] group-hover:bg-[#6a25f0] group-hover:text-white">
                    <Icon name="arrow" size={14} />
                  </span>
                </a>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

function ChoiceCard({
  accent,
  items,
  title,
}: {
  accent?: boolean;
  items: string[];
  title: string;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-[26px] border border-[#6a25f0]/35 bg-[#6a25f0]/10 p-8 max-md:p-6"
          : "rounded-[26px] border border-white/[.08] bg-white/[.02] p-8 max-md:p-6"
      }
    >
      <h3 className="text-[13px] font-semibold tracking-[-.02em] text-white">
        {title}
      </h3>
      <ul className="mt-5 grid gap-3.5">
        {items.map((item) => (
          <li
            className="flex gap-3 text-[13px] leading-6 text-white/60"
            key={item}
          >
            <span
              className={
                accent
                  ? "mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-[#6a25f0] text-white"
                  : "mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-white/10 text-white/70"
              }
            >
              <Icon name="check" size={10} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
