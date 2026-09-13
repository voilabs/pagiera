import { Reveal } from "@/components/reveal";
import { productCapabilities, productFaq } from "@/lib/product-content";
import { productCapabilitiesTr, productFaqTr } from "@/lib/product-content-tr";
import { localizedHref, useI18n } from "@/lib/i18n";

export function ProductDetails() {
  const { locale, t } = useI18n();
  const integrationSteps = [
    [
      t("Install & connect", "Kurun ve bağlayın"),
      t(
        "Add pagiera to your application. Configure PostgreSQL, Redis and protected editor/API routes. Add an OpenRouter key only if you want to use AI generation.",
        "Uygulamanıza pagiera ekleyin. PostgreSQL, Redis ve korumalı editör/API rotalarını yapılandırın. Yalnızca yapay zekâ ile üretim kullanmak istiyorsanız OpenRouter anahtarı ekleyin.",
      ),
    ],
    [
      t("Design & refine", "Tasarlayın ve iyileştirin"),
      t(
        "Start with native elements or a template. Reuse components and layouts, adjust breakpoints, and review targeted AI proposals before applying them.",
        "Yerel öğelerle veya bir şablonla başlayın. Bileşenleri ve düzenleri yeniden kullanın, kırılma noktalarını ayarlayın ve hedefli yapay zekâ önerilerini uygulamadan önce inceleyin.",
      ),
    ],
    [
      t("Preview & publish", "Önizleyin ve yayınlayın"),
      t(
        "Save a draft and test its preview. Publish the approved page through Pagiera, then serve it with the runtime. Deploy your application on your own infrastructure.",
        "Bir taslak kaydedin ve önizlemesini test edin. Onaylanan sayfayı Pagiera üzerinden yayınlayın, ardından çalışma zamanıyla sunun. Uygulamanızı kendi altyapınıza dağıtın.",
      ),
    ],
  ] as const;

  return (
    <>
      <section
        className="product-story"
        aria-labelledby="capabilities-title"
        id="capabilities"
      >
        <div className="product-story-heading">
          <Reveal as="p" className="product-eyebrow" distance={18}>
            {t("A closer look at Pagiera", "Pagiera'ya yakından bakın")}
          </Reveal>
          <Reveal as="h2" delay={0.08} id="capabilities-title">
            {t("More than a canvas.", "Bir tuvalden fazlası.")}
            <br />
            <span>
              {t("A system for your site.", "Siteniz için bir sistem.")}
            </span>
          </Reveal>
          <Reveal as="p" delay={0.16} distance={20}>
            {t(
              "From reusable page structure to the smallest interaction, create native elements that remain editable after the first design.",
              "Yeniden kullanılabilir sayfa yapısından en küçük etkileşime kadar, ilk tasarımdan sonra da düzenlenebilir kalan yerel öğeler oluşturun.",
            )}
          </Reveal>
        </div>
        <div className="product-capabilities">
          {(locale === "tr" ? productCapabilitiesTr : productCapabilities).map(
            (item, index) => (
              <Reveal
                as="article"
                delay={(index % 2) * 0.1}
                key={item.category}
              >
                <p className="product-eyebrow">{item.category}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <ul>
                  {item.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </Reveal>
            ),
          )}
        </div>
      </section>
      <section
        className="integration-story"
        id="integration"
        aria-labelledby="integration-title"
      >
        <div>
          <Reveal as="p" className="product-eyebrow" distance={18}>
            {t(
              "For developers and coding agents",
              "Geliştiriciler ve kodlama ajanları için",
            )}
          </Reveal>
          <Reveal as="h2" delay={0.08} id="integration-title">
            {t("Your next website.", "Bir sonraki web siteniz.")}
            <br />
            {t("Inside your own stack.", "Kendi teknoloji altyapınızda.")}
          </Reveal>
          <Reveal as="p" delay={0.16} distance={20}>
            {t(
              "Pagiera is an MIT-licensed React and Next.js website builder, not a separate hosted website account. Install the package, connect your services and keep your design in an editable document.",
              "Pagiera, ayrı bir barındırılan web sitesi hesabı değil, MIT lisanslı bir React ve Next.js web sitesi oluşturucusudur. Paketi kurun, hizmetlerinizi bağlayın ve tasarımınızı düzenlenebilir bir belgede tutun.",
            )}
          </Reveal>
          <Reveal as="div" delay={0.22} distance={16}>
            <a href={localizedHref("/docs", locale)}>
              {t(
                "Read the integration guide →",
                "Entegrasyon kılavuzunu okuyun →",
              )}
            </a>
            <a href={localizedHref("/docs/agents", locale)}>
              {t(
                "Build with your coding agent →",
                "Kodlama ajanınızla oluşturun →",
              )}
            </a>
          </Reveal>
        </div>
        <ol>
          {integrationSteps.map(([title, text], index) => (
            <Reveal as="li" delay={index * 0.09} key={title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>
      <section className="product-faq" id="faq" aria-labelledby="faq-title">
        <div>
          <Reveal as="p" className="product-eyebrow" distance={18}>
            {t("Before you build", "Başlamadan önce")}
          </Reveal>
          <Reveal as="h2" delay={0.08} id="faq-title">
            {t("Good questions.", "İyi sorular.")}
            <br />
            {t("Straight answers.", "Net yanıtlar.")}
          </Reveal>
          <Reveal as="p" delay={0.16} distance={20}>
            {t(
              "The setup, the workflow and what you own.",
              "Kurulum, iş akışı ve sahip olduklarınız.",
            )}
          </Reveal>
        </div>
        <div>
          {(locale === "tr" ? productFaqTr : productFaq).map((item, index) => (
            <Reveal
              as="details"
              amount={0.6}
              delay={index * 0.05}
              distance={16}
              key={item.question}
            >
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
