import { motion } from "framer-motion";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

export function WorkflowSection() {
  const { t } = useI18n();
  const steps = [
    {
      number: "01",
      title: t("Compose", "Oluşturun"),
      copy: t(
        "Start with a blank canvas or a complete responsive system.",
        "Boş bir tuvalle veya tüm ekranlara uyumlu eksiksiz bir sistemle başlayın.",
      ),
      detail: t("Canvas · Components", "Tuval · Bileşenler"),
    },
    {
      number: "02",
      title: t("Connect", "Bağlayın"),
      copy: t(
        "Bind APIs, route parameters and forms directly to the page.",
        "API'leri, rota parametrelerini ve formları doğrudan sayfaya bağlayın.",
      ),
      detail: t("Data · Routes · Forms", "Veri · Rotalar · Formlar"),
    },
    {
      number: "03",
      title: t("Refine", "İyileştirin"),
      copy: t(
        "Tune breakpoints, variants, typography and motion in context.",
        "Kırılma noktalarını, varyantları, tipografiyi ve hareketi yerinde ayarlayın.",
      ),
      detail: t("Responsive · Motion", "Ekran uyumu · Hareket"),
    },
    {
      number: "04",
      title: t("Publish", "Yayınlayın"),
      copy: t(
        "Ship the exact experience as semantic, server-rendered output.",
        "Tasarladığınız deneyimi anlamsal, sunucuda oluşturulan çıktı olarak yayınlayın.",
      ),
      detail: t("SSR · Production", "SSR · Canlı ortam"),
    },
  ];

  return (
    <section
      className="bg-[#0b0b0b] px-[max(24px,calc((100vw-1240px)/2))] py-36 text-white max-md:py-24"
      id="workflow"
    >
      <div className="grid grid-cols-[.8fr_1.4fr] gap-20 max-lg:grid-cols-1 max-lg:gap-8">
        <span className="text-[10px] font-bold tracking-[.13em] text-[#6a25f0] uppercase">
          {t("From first frame to live URL", "İlk çerçeveden yayındaki URL'ye")}
        </span>
        <div>
          <h2 className="text-[clamp(50px,7vw,100px)] leading-[.88] font-medium tracking-[-.08em]">
            {t("Four moves.", "Dört adım.")}
            <br />
            {t("One continuous flow.", "Kesintisiz bir akış.")}
          </h2>
          <p className="mt-8 max-w-[620px] text-base leading-8 text-white/52">
            {t(
              "No handoff theatre and no rebuilding the same decision in three different tools. Every step happens on the page that will ship.",
              "Gereksiz devir süreçleri veya aynı kararı üç farklı araçta yeniden uygulamak yok. Her adım, yayınlanacak sayfanın üzerinde gerçekleşir.",
            )}
          </p>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-4 overflow-hidden rounded-[34px] border border-white/10 bg-[#131313] max-lg:grid-cols-2 max-md:grid-cols-1 max-md:rounded-[26px]">
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
              <span className="grid size-10 place-items-center rounded-full border border-white/10 text-[#939393] transition group-hover:bg-[#6a25f0] group-hover:text-white">
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

      <div className="mt-8 flex items-center justify-between rounded-full bg-[#131313] px-7 py-5 text-sm text-white max-md:items-start max-md:gap-4 max-md:rounded-[24px]">
        <span className="flex items-center gap-3">
          <i className="size-2 rounded-full bg-[#737373]" />{" "}
          {t(
            "Every stage remains editable.",
            "Her aşama düzenlenebilir kalır.",
          )}
        </span>
        <span className="text-white/45 max-sm:hidden">
          {t(
            "Nothing gets flattened on the way to production.",
            "Canlı ortama geçerken hiçbir şey düzenlenemez hale gelmez.",
          )}
        </span>
      </div>
    </section>
  );
}
