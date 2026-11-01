/**
 * Comparison pages. Claims about other products describe their documented,
 * headline behaviour and avoid prices and version numbers. Re-read them before
 * a release: this is the file that goes stale first.
 */
import type { Locale } from "@/lib/landing-copy";

/** yes = built in, partial = possible with your own code or plan, no = not offered. */
export type Mark = "yes" | "partial" | "no";

export type Rival = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  headline: string;
  verdict: string;
  intent: string;
  choosePagiera: string[];
  chooseRival: string[];
  rows: { label: string; pagiera: string; rival: string }[];
  together: string;
  faq: { q: string; a: string }[];
  marks: Mark[];
};

export type CompareCopy = {
  criteria: string[];
  pagieraMarks: Mark[];
  legend: Record<Mark, string>;
  matrixTitle: string;
  matrixNote: string;
  rivalsTitle: string;
  atGlance: string;
  chooseWhen: (name: string) => string;
  together: string;
  rivals: Rival[];
};

const en: CompareCopy = {
  criteria: [
    "Editor runs inside your app",
    "Open-source license",
    "Content in your own database",
    "Free-form visual canvas",
    "Storage, drafts and publishing included",
    "Pages bind to your own APIs",
  ],
  pagieraMarks: ["yes", "yes", "yes", "yes", "yes", "yes"],
  legend: {
    yes: "Built in",
    partial: "Partly, or with your own code",
    no: "Not offered",
  },
  matrixTitle: "At a glance",
  matrixNote:
    "Based on each product's documented headline behaviour. Products change; check their docs before deciding.",
  rivalsTitle: "One by one",
  atGlance: "Side by side",
  chooseWhen: (name) => `Choose ${name} when…`,
  together: "Can they work together?",
  rivals: [
    {
      slug: "pagiera-vs-puck",
      name: "Puck",
      category: "Open-source editor",
      tagline: "an open-source visual editor for React",
      headline: "Both embed in your React app. One brings the backend too.",
      verdict:
        "Puck is an excellent embeddable drag-and-drop editor: you register components, it produces JSON, and storage, publishing and rendering are yours to build. Pagiera embeds the same way but ships the rest of the stack: PostgreSQL storage, drafts and revisions, a free-form responsive canvas, data binding, actions and motion, and a server-rendered runtime.",
      intent:
        "Teams comparing these two already want the editor in their own app. The question is how much of the surrounding system they want to write themselves.",
      choosePagiera: [
        "You want storage, drafts, revisions and publishing working on day one.",
        "Editors need a free-form canvas with breakpoints, not only a component list.",
        "Pages should bind to APIs and have interactions and motion without custom code.",
      ],
      chooseRival: [
        "You want the smallest possible editor and full control of everything around it.",
        "Every block must be one of your own React components.",
        "You already have a backend and only need the editing surface.",
      ],
      rows: [
        {
          label: "What you install",
          pagiera: "Editor, backend handlers and rendering runtime.",
          rival: "An editor component and a renderer.",
        },
        {
          label: "Storage",
          pagiera: "PostgreSQL, with drafts and revisions.",
          rival: "Yours to implement; Puck hands you JSON.",
        },
        {
          label: "Editing model",
          pagiera: "Free-form canvas with native blocks and breakpoints.",
          rival: "Drag and drop of the components you register.",
        },
        {
          label: "Behaviour and motion",
          pagiera: "Action graph and keyframe timeline built in.",
          rival: "Implemented inside your components.",
        },
        { label: "License", pagiera: "MIT.", rival: "MIT." },
      ],
      together:
        "Rarely on the same page. Pick Puck if your components are the product; pick Pagiera if editors need a complete page builder.",
      faq: [
        {
          q: "Can Pagiera use my React components?",
          a: "Pages are made of native Pagiera blocks rendered by its runtime, and they render inside your app. Shared structure is built from reusable Pagiera components and layouts.",
        },
        {
          q: "Is Pagiera heavier than Puck?",
          a: "It does more: backend routes, storage and runtime ship in the package. If you only need an editing surface, Puck is smaller.",
        },
        {
          q: "Do both run in Next.js?",
          a: "Yes. Both embed in a React application; Pagiera's full integration targets the Next.js App Router.",
        },
      ],
      marks: ["yes", "yes", "partial", "partial", "no", "partial"],
    },
    {
      slug: "pagiera-vs-builder-io",
      name: "Builder.io",
      category: "Hosted visual CMS",
      tagline: "a hosted visual CMS with SDKs for many frameworks",
      headline: "The same idea, opposite ownership.",
      verdict:
        "Builder.io is a hosted visual CMS: editors work in Builder's app and your site fetches content from its API through an SDK. Pagiera runs the editor and the content inside your own application and database. Choose Builder.io for a managed service across many frameworks; choose Pagiera when the editor, data and output must stay in your stack.",
      intent:
        "This comparison is usually about where content lives and who operates the editor, not about features.",
      choosePagiera: [
        "Content must stay in your own database and infrastructure.",
        "The editor should live behind your own authentication, inside your product.",
        "You prefer an MIT-licensed package to a hosted subscription.",
      ],
      chooseRival: [
        "You want a managed service with nothing to operate.",
        "You ship content to many frameworks and platforms from one place.",
        "You need the integrations and team features of a hosted platform.",
      ],
      rows: [
        {
          label: "Where the editor runs",
          pagiera: "In your app, on a protected route.",
          rival: "In Builder.io's hosted app.",
        },
        {
          label: "Where content lives",
          pagiera: "Your PostgreSQL database.",
          rival: "Builder.io's cloud, read through its API.",
        },
        {
          label: "Rendering",
          pagiera: "Server-rendered by your app with pagiera/runtime.",
          rival: "Rendered by your app with Builder's SDK.",
        },
        {
          label: "Operating it",
          pagiera: "You run Postgres and Redis.",
          rival: "Managed by Builder.io.",
        },
        {
          label: "License",
          pagiera: "MIT package.",
          rival: "Proprietary platform with open-source SDKs.",
        },
      ],
      together:
        "Not usually: both manage the same pages. Teams moving content in-house sometimes rebuild their key pages in Pagiera.",
      faq: [
        {
          q: "Is Pagiera a self-hosted Builder.io?",
          a: "It covers similar ground—visual editing of pages your app renders—but it is a different product with its own document model, not a clone.",
        },
        {
          q: "Does Pagiera need an API key from a vendor?",
          a: "No. Only OpenRouter for optional AI features; everything else runs on your own services.",
        },
        {
          q: "Can non-developers use it?",
          a: "Yes. Editors work on a visual canvas; developers handle installation and access.",
        },
      ],
      marks: ["no", "partial", "no", "yes", "yes", "partial"],
    },
    {
      slug: "pagiera-vs-plasmic",
      name: "Plasmic",
      category: "Visual builder for React",
      tagline: "a visual builder for React with headless and codegen modes",
      headline: "Two visual builders for React, two places to edit.",
      verdict:
        "Plasmic is a visual builder for React apps: you design in Plasmic Studio and either load the result from its service or generate code into your repository. Pagiera puts the studio inside your own application, stores documents in your database and renders them with its own runtime. Choose Plasmic for its studio and codegen workflow; choose Pagiera when editing itself should be part of your product.",
      intent:
        "Teams weighing these two like visual building for React and are deciding where the studio and the content should live.",
      choosePagiera: [
        "The editor must be part of your own app, behind your own login.",
        "Documents should live in your database, not a vendor's.",
        "You want data binding, actions and motion from one package.",
      ],
      chooseRival: [
        "You prefer to design in a dedicated hosted studio.",
        "You want visual designs generated into code in your repository.",
        "You rely on its library of integrations and code components.",
      ],
      rows: [
        {
          label: "Where the editor runs",
          pagiera: "In your app.",
          rival: "In Plasmic Studio.",
        },
        {
          label: "Output",
          pagiera: "JSON documents rendered by pagiera/runtime.",
          rival: "Loaded from Plasmic or generated as code.",
        },
        {
          label: "Where content lives",
          pagiera: "Your PostgreSQL database.",
          rival: "Plasmic's service, or your code with codegen.",
        },
        {
          label: "Interactions",
          pagiera: "Action graph and keyframe timeline.",
          rival: "Interactions and states in Studio.",
        },
        {
          label: "Integration",
          pagiera: "One npm package and a catch-all route.",
          rival: "Loader or codegen SDKs.",
        },
      ],
      together:
        "They overlap too much to combine on one page; pick one per project.",
      faq: [
        {
          q: "Does Pagiera generate code?",
          a: "No. Pages stay documents rendered at runtime, so editors can change them without a deploy.",
        },
        {
          q: "Can developers still review changes?",
          a: "Documents are JSON; the CLI can export, diff and patch them, and revisions keep history.",
        },
        {
          q: "Which is better for designers?",
          a: "Plasmic offers a dedicated design studio; Pagiera's studio is aimed at editing production pages inside your app.",
        },
      ],
      marks: ["no", "partial", "partial", "yes", "yes", "yes"],
    },
    {
      slug: "pagiera-vs-payload",
      name: "Payload",
      category: "Headless CMS",
      tagline: "an open-source, code-first headless CMS built on Next.js",
      headline: "A CMS for content models, a builder for pages.",
      verdict:
        "Payload is an open-source, code-first CMS: you define collections in code and editors fill in forms in an admin panel inside your Next.js app. Pagiera is a visual page builder: editors arrange layout, data, interactions and motion on a canvas. Choose Payload for structured content; choose Pagiera for visually built pages—or use both.",
      intent:
        "Both run in your Next.js app and both are open source. The real question is whether editors fill in fields or design the page.",
      choosePagiera: [
        "Editors design layout and responsive behaviour themselves.",
        "Landing pages need interactions and motion without new code.",
        "You want a visual canvas rather than a form per block.",
      ],
      chooseRival: [
        "Your content is structured data: articles, products, authors.",
        "You want collections, fields and access control defined in code.",
        "Developers own the layout and editors own the words.",
      ],
      rows: [
        {
          label: "Editing model",
          pagiera: "Visual canvas.",
          rival: "Admin forms for fields and blocks.",
        },
        {
          label: "Content model",
          pagiera: "Page documents.",
          rival: "Collections defined in code.",
        },
        {
          label: "Where it runs",
          pagiera: "Inside your Next.js app.",
          rival: "Inside your Next.js app.",
        },
        {
          label: "Database",
          pagiera: "PostgreSQL.",
          rival: "Your choice of supported databases.",
        },
        { label: "License", pagiera: "MIT.", rival: "MIT." },
      ],
      together:
        "Yes, and well. Keep articles and products in Payload, expose them through its API, and bind Pagiera pages to that API with Request and Repeat.",
      faq: [
        {
          q: "Is Pagiera a CMS?",
          a: "For pages, yes: drafts, publishing and revisions. It does not define arbitrary content collections the way Payload does.",
        },
        {
          q: "Can a Pagiera page show Payload content?",
          a: "Yes. Point a Repeat block at a Payload REST endpoint and bind the fields.",
        },
        {
          q: "Do they conflict in one app?",
          a: "No. Each mounts its own routes; they share only your Next.js app.",
        },
      ],
      marks: ["yes", "yes", "yes", "no", "yes", "partial"],
    },
    {
      slug: "pagiera-vs-webflow",
      name: "Webflow",
      category: "Hosted site builder",
      tagline: "a hosted visual website builder with a built-in CMS",
      headline:
        "One is a platform you join. The other is a package you install.",
      verdict:
        "Webflow is a hosted platform: you design, manage content and publish on Webflow's infrastructure. Pagiera is an npm package that puts a visual editor inside your own Next.js application, so pages render from your app and your database. Choose Webflow for a standalone marketing site with hosting included; choose Pagiera when pages belong inside a product you already run.",
      intent:
        "The decision is usually whether the site is its own platform or part of an application you already operate.",
      choosePagiera: [
        "Pages must live in your own app, next to product routes.",
        "Editing should sit behind your own authentication.",
        "Pages read from the APIs your app already uses.",
      ],
      chooseRival: [
        "You want hosting, CMS and editor in one managed product.",
        "The site is a standalone marketing site.",
        "Nobody on the team wants to operate infrastructure.",
      ],
      rows: [
        {
          label: "Where pages run",
          pagiera: "Your Next.js app on your infrastructure.",
          rival: "Webflow's hosting.",
        },
        {
          label: "Content",
          pagiera: "Your APIs, bound per element.",
          rival: "Built-in CMS collections.",
        },
        {
          label: "Embedding in a product",
          pagiera: "The editor is a component you mount.",
          rival: "Not designed for it.",
        },
        {
          label: "Operating it",
          pagiera: "You run the app and its services.",
          rival: "Managed by Webflow.",
        },
        { label: "License", pagiera: "MIT.", rival: "Proprietary SaaS." },
      ],
      together:
        "Some teams keep a Webflow marketing site and use Pagiera for editable pages inside their product.",
      faq: [
        {
          q: "Can Pagiera do what Webflow does?",
          a: "For pages in your app, much of it: visual layout, breakpoints, content, interactions. It does not host sites or manage domains.",
        },
        {
          q: "Do we need to move hosting?",
          a: "No. Pagiera runs wherever your Next.js app runs.",
        },
        {
          q: "What replaces Webflow CMS?",
          a: "Your own APIs, or a headless CMS, bound to pages with Request and Repeat.",
        },
      ],
      marks: ["no", "no", "no", "yes", "yes", "partial"],
    },
    {
      slug: "pagiera-vs-framer",
      name: "Framer",
      category: "Hosted site builder",
      tagline: "a design-led hosted website builder",
      headline:
        "A polished hosted builder, or a builder that lives in your code.",
      verdict:
        "Framer is a design-led website builder that publishes to its own hosting, with strong animation and a built-in CMS. Pagiera brings a visual editor, keyframe motion and interactions into your own Next.js app. Choose Framer for a fast, beautiful standalone site; choose Pagiera when pages must be part of your application.",
      intent:
        "Both care about design and motion; the difference is where the site lives and who controls it.",
      choosePagiera: [
        "Pages must render from your own app and database.",
        "You need the editor inside your product, behind your login.",
        "You want an open-source package rather than a hosted plan.",
      ],
      chooseRival: [
        "You want a standalone site published in minutes.",
        "Designers own the site end to end.",
        "Hosting and CMS should be managed for you.",
      ],
      rows: [
        {
          label: "Where pages run",
          pagiera: "Your Next.js app.",
          rival: "Framer's hosting.",
        },
        {
          label: "Motion",
          pagiera: "Keyframe timeline, curves, springs and effects.",
          rival: "Rich built-in animations and effects.",
        },
        {
          label: "Content",
          pagiera: "Your APIs, bound per element.",
          rival: "Built-in CMS.",
        },
        {
          label: "Embedding in a product",
          pagiera: "Yes, as a mounted editor.",
          rival: "Not designed for it.",
        },
        { label: "License", pagiera: "MIT.", rival: "Proprietary SaaS." },
      ],
      together:
        "Yes: a Framer marketing site and Pagiera-built pages inside your product can share a brand without sharing a stack.",
      faq: [
        {
          q: "Is Pagiera's motion as capable?",
          a: "It offers a keyframe timeline with curves, springs, text splitting and 34 editable effects. Framer has its own strengths; try both for your use case.",
        },
        {
          q: "Can designers use Pagiera without developers?",
          a: "After a developer installs it, yes: editing, previewing and publishing happen in the studio.",
        },
        {
          q: "Where is the site hosted?",
          a: "Wherever your Next.js app is hosted.",
        },
      ],
      marks: ["no", "no", "no", "yes", "yes", "partial"],
    },
  ],
};

const tr: CompareCopy = {
  criteria: [
    "Editör uygulamanızın içinde çalışır",
    "Açık kaynak lisans",
    "İçerik kendi veritabanınızda",
    "Serbest görsel tuval",
    "Depolama, taslak ve yayın dahil",
    "Sayfalar kendi API'lerinize bağlanır",
  ],
  pagieraMarks: ["yes", "yes", "yes", "yes", "yes", "yes"],
  legend: {
    yes: "Yerleşik",
    partial: "Kısmen ya da kendi kodunuzla",
    no: "Sunulmuyor",
  },
  matrixTitle: "Bir bakışta",
  matrixNote:
    "Her ürünün belgelenmiş temel davranışına dayanır. Ürünler değişir; karar vermeden önce kendi dokümanlarına bakın.",
  rivalsTitle: "Tek tek",
  atGlance: "Yan yana",
  chooseWhen: (name) => `${name} seçin, eğer…`,
  together: "Birlikte kullanılabilirler mi?",
  rivals: [
    {
      slug: "pagiera-vs-puck",
      name: "Puck",
      category: "Açık kaynak editör",
      tagline: "React için açık kaynak bir görsel editör",
      headline:
        "İkisi de React uygulamanıza gömülür. Biri arka ucu da getirir.",
      verdict:
        "Puck, gömülebilir ve çok iyi bir sürükle-bırak editörüdür: bileşenlerinizi kaydedersiniz, o JSON üretir; depolama, yayınlama ve işleme sizin kurmanıza kalır. Pagiera da aynı şekilde gömülür ama yığının geri kalanını da getirir: PostgreSQL depolama, taslak ve sürümler, serbest ve duyarlı bir tuval, veri bağlama, aksiyonlar, hareket ve sunucuda işleyen bir çalışma zamanı.",
      intent:
        "Bu ikisini karşılaştıran ekipler editörü zaten kendi uygulamalarında istiyor. Asıl soru, çevresindeki sistemin ne kadarını kendilerinin yazmak istediği.",
      choosePagiera: [
        "Depolama, taslak, sürüm ve yayınlamanın ilk günden çalışmasını istiyorsunuz.",
        "Editörlerin yalnızca bileşen listesi değil, kırılma noktalı serbest bir tuvale ihtiyacı var.",
        "Sayfalar özel kod yazmadan API'lere bağlanmalı, etkileşim ve hareket içermeli.",
      ],
      chooseRival: [
        "Mümkün olan en küçük editörü ve çevresindeki her şeyin tam kontrolünü istiyorsunuz.",
        "Her blok sizin kendi React bileşenlerinizden biri olmalı.",
        "Zaten bir arka ucunuz var ve yalnızca düzenleme yüzeyine ihtiyacınız var.",
      ],
      rows: [
        {
          label: "Ne kuruyorsunuz",
          pagiera: "Editör, arka uç işleyicileri ve çalışma zamanı.",
          rival: "Bir editör bileşeni ve bir işleyici.",
        },
        {
          label: "Depolama",
          pagiera: "Taslak ve sürümleriyle PostgreSQL.",
          rival: "Size kalır; Puck size JSON verir.",
        },
        {
          label: "Düzenleme modeli",
          pagiera: "Yerel bloklar ve kırılma noktalarıyla serbest tuval.",
          rival: "Kaydettiğiniz bileşenlerin sürükle-bırakı.",
        },
        {
          label: "Davranış ve hareket",
          pagiera: "Aksiyon grafiği ve keyframe zaman çizelgesi dahil.",
          rival: "Bileşenlerinizin içinde yazılır.",
        },
        { label: "Lisans", pagiera: "MIT.", rival: "MIT." },
      ],
      together:
        "Aynı sayfada pek değil. Ürün bileşenlerinizse Puck'ı, editörlerin eksiksiz bir sayfa kurucuya ihtiyacı varsa Pagiera'yı seçin.",
      faq: [
        {
          q: "Pagiera kendi React bileşenlerimi kullanabilir mi?",
          a: "Sayfalar, Pagiera'nın çalışma zamanının işlediği yerel bloklardan oluşur ve uygulamanızın içinde görünür. Ortak yapı, yeniden kullanılabilir Pagiera bileşenleri ve düzenleriyle kurulur.",
        },
        {
          q: "Pagiera, Puck'tan ağır mı?",
          a: "Daha fazlasını yapıyor: arka uç rotaları, depolama ve çalışma zamanı pakette geliyor. Yalnızca düzenleme yüzeyi gerekiyorsa Puck daha küçük.",
        },
        {
          q: "İkisi de Next.js'te çalışır mı?",
          a: "Evet. İkisi de bir React uygulamasına gömülür; Pagiera'nın tam entegrasyonu Next.js App Router'ı hedefler.",
        },
      ],
      marks: ["yes", "yes", "partial", "partial", "no", "partial"],
    },
    {
      slug: "pagiera-vs-builder-io",
      name: "Builder.io",
      category: "Barındırılan görsel CMS",
      tagline:
        "birçok framework için SDK'ları olan barındırılan bir görsel CMS",
      headline: "Aynı fikir, zıt sahiplik.",
      verdict:
        "Builder.io barındırılan bir görsel CMS'tir: editörler Builder'ın uygulamasında çalışır, siteniz içeriği bir SDK ile onun API'sinden çeker. Pagiera ise editörü ve içeriği kendi uygulamanızda ve veritabanınızda çalıştırır. Birçok framework için yönetilen bir hizmet istiyorsanız Builder.io'yu; editör, veri ve çıktı sizin yığınınızda kalmalıysa Pagiera'yı seçin.",
      intent:
        "Bu karşılaştırma genellikle özelliklerle değil, içeriğin nerede durduğu ve editörü kimin işlettiğiyle ilgilidir.",
      choosePagiera: [
        "İçerik kendi veritabanınızda ve altyapınızda kalmalı.",
        "Editör ürününüzün içinde, kendi kimlik doğrulamanızın arkasında olmalı.",
        "Barındırılan bir abonelik yerine MIT lisanslı bir paketi tercih ediyorsunuz.",
      ],
      chooseRival: [
        "İşletecek hiçbir şeyi olmayan, yönetilen bir hizmet istiyorsunuz.",
        "İçeriği tek yerden birçok framework ve platforma dağıtıyorsunuz.",
        "Barındırılan bir platformun entegrasyonlarına ve ekip özelliklerine ihtiyacınız var.",
      ],
      rows: [
        {
          label: "Editör nerede çalışır",
          pagiera: "Uygulamanızda, korumalı bir rotada.",
          rival: "Builder.io'nun barındırılan uygulamasında.",
        },
        {
          label: "İçerik nerede durur",
          pagiera: "Kendi PostgreSQL veritabanınızda.",
          rival: "Builder.io bulutunda, API ile okunur.",
        },
        {
          label: "İşleme",
          pagiera: "pagiera/runtime ile uygulamanız sunucuda işler.",
          rival: "Builder SDK'sı ile uygulamanız işler.",
        },
        {
          label: "İşletme",
          pagiera: "Postgres ve Redis'i siz çalıştırırsınız.",
          rival: "Builder.io yönetir.",
        },
        {
          label: "Lisans",
          pagiera: "MIT paket.",
          rival: "Açık kaynak SDK'larla tescilli platform.",
        },
      ],
      together:
        "Genellikle hayır; ikisi de aynı sayfaları yönetir. İçeriği kendi bünyesine taşıyan ekipler bazen kilit sayfalarını Pagiera'da yeniden kurar.",
      faq: [
        {
          q: "Pagiera kendi sunucunuzda çalışan bir Builder.io mu?",
          a: "Benzer bir alanı kapsar—uygulamanızın işlediği sayfaları görsel düzenleme—ama kendi belge modeli olan farklı bir üründür, kopya değildir.",
        },
        {
          q: "Pagiera bir sağlayıcıdan API anahtarı ister mi?",
          a: "Hayır. Yalnızca isteğe bağlı yapay zekâ özellikleri için OpenRouter; geri kalan her şey kendi hizmetlerinizde çalışır.",
        },
        {
          q: "Geliştirici olmayanlar kullanabilir mi?",
          a: "Evet. Editörler görsel tuvalde çalışır; kurulumu ve erişimi geliştiriciler yönetir.",
        },
      ],
      marks: ["no", "partial", "no", "yes", "yes", "partial"],
    },
    {
      slug: "pagiera-vs-plasmic",
      name: "Plasmic",
      category: "React için görsel kurucu",
      tagline:
        "headless ve kod üretme modları olan, React için bir görsel kurucu",
      headline: "React için iki görsel kurucu, iki farklı düzenleme yeri.",
      verdict:
        "Plasmic, React uygulamaları için bir görsel kurucudur: Plasmic Studio'da tasarlar, sonucu ya hizmetinden yükler ya da deponuza kod olarak üretirsiniz. Pagiera stüdyoyu kendi uygulamanızın içine koyar, belgeleri veritabanınızda saklar ve kendi çalışma zamanıyla işler. Stüdyosu ve kod üretme akışı için Plasmic'i; düzenlemenin kendisi ürününüzün parçası olmalıysa Pagiera'yı seçin.",
      intent:
        "Bu ikisini tartan ekipler React için görsel kurmayı seviyor; stüdyonun ve içeriğin nerede duracağına karar veriyor.",
      choosePagiera: [
        "Editör kendi uygulamanızın parçası olmalı, kendi girişinizin arkasında.",
        "Belgeler bir sağlayıcının değil, sizin veritabanınızda durmalı.",
        "Veri bağlama, aksiyon ve hareketi tek pakette istiyorsunuz.",
      ],
      chooseRival: [
        "Ayrı, barındırılan bir stüdyoda tasarlamayı tercih ediyorsunuz.",
        "Görsel tasarımların deponuza kod olarak üretilmesini istiyorsunuz.",
        "Entegrasyon ve kod bileşeni kütüphanesine güveniyorsunuz.",
      ],
      rows: [
        {
          label: "Editör nerede çalışır",
          pagiera: "Uygulamanızda.",
          rival: "Plasmic Studio'da.",
        },
        {
          label: "Çıktı",
          pagiera: "pagiera/runtime ile işlenen JSON belgeler.",
          rival: "Plasmic'ten yüklenir ya da kod olarak üretilir.",
        },
        {
          label: "İçerik nerede durur",
          pagiera: "Kendi PostgreSQL veritabanınızda.",
          rival: "Plasmic hizmetinde ya da kod üretmeyle kodunuzda.",
        },
        {
          label: "Etkileşimler",
          pagiera: "Aksiyon grafiği ve keyframe zaman çizelgesi.",
          rival: "Studio'da etkileşimler ve durumlar.",
        },
        {
          label: "Entegrasyon",
          pagiera: "Tek npm paketi ve tek bir catch-all rota.",
          rival: "Yükleyici veya kod üretme SDK'ları.",
        },
      ],
      together:
        "Aynı sayfada birleştirmek için fazla örtüşürler; proje başına birini seçin.",
      faq: [
        {
          q: "Pagiera kod üretir mi?",
          a: "Hayır. Sayfalar çalışma anında işlenen belgeler olarak kalır; editörler dağıtım yapmadan değiştirebilir.",
        },
        {
          q: "Geliştiriciler değişiklikleri yine de inceleyebilir mi?",
          a: "Belgeler JSON'dur; CLI onları dışa aktarabilir, karşılaştırabilir ve yamalayabilir, sürümler de geçmişi tutar.",
        },
        {
          q: "Tasarımcılar için hangisi daha iyi?",
          a: "Plasmic ayrı bir tasarım stüdyosu sunar; Pagiera'nın stüdyosu uygulamanızın içindeki gerçek sayfaları düzenlemeye odaklanır.",
        },
      ],
      marks: ["no", "partial", "partial", "yes", "yes", "yes"],
    },
    {
      slug: "pagiera-vs-payload",
      name: "Payload",
      category: "Headless CMS",
      tagline:
        "Next.js üzerine kurulu, açık kaynak ve kod öncelikli bir headless CMS",
      headline: "İçerik modelleri için bir CMS, sayfalar için bir kurucu.",
      verdict:
        "Payload açık kaynak ve kod öncelikli bir CMS'tir: koleksiyonları kodda tanımlarsınız, editörler Next.js uygulamanızın içindeki yönetim panelinde formları doldurur. Pagiera ise görsel bir sayfa kurucudur: editörler düzeni, veriyi, etkileşimi ve hareketi tuvalde kurar. Yapılandırılmış içerik için Payload'ı, görsel kurulan sayfalar için Pagiera'yı seçin—ya da ikisini birlikte kullanın.",
      intent:
        "İkisi de Next.js uygulamanızda çalışır, ikisi de açık kaynaktır. Asıl soru, editörlerin alan mı dolduracağı yoksa sayfayı mı tasarlayacağı.",
      choosePagiera: [
        "Editörler düzeni ve duyarlı davranışı kendileri tasarlıyor.",
        "Açılış sayfaları yeni kod yazmadan etkileşim ve hareket içermeli.",
        "Her blok için bir form yerine görsel bir tuval istiyorsunuz.",
      ],
      chooseRival: [
        "İçeriğiniz yapılandırılmış veri: yazılar, ürünler, yazarlar.",
        "Koleksiyonları, alanları ve erişim kontrolünü kodda tanımlamak istiyorsunuz.",
        "Düzen geliştiricilerde, metinler editörlerde.",
      ],
      rows: [
        {
          label: "Düzenleme modeli",
          pagiera: "Görsel tuval.",
          rival: "Alanlar ve bloklar için yönetim formları.",
        },
        {
          label: "İçerik modeli",
          pagiera: "Sayfa belgeleri.",
          rival: "Kodda tanımlanan koleksiyonlar.",
        },
        {
          label: "Nerede çalışır",
          pagiera: "Next.js uygulamanızın içinde.",
          rival: "Next.js uygulamanızın içinde.",
        },
        {
          label: "Veritabanı",
          pagiera: "PostgreSQL.",
          rival: "Desteklenen veritabanlarından seçiminiz.",
        },
        { label: "Lisans", pagiera: "MIT.", rival: "MIT." },
      ],
      together:
        "Evet, hem de iyi. Yazıları ve ürünleri Payload'da tutun, API'siyle açın ve Pagiera sayfalarını Request ve Repeat ile o API'ye bağlayın.",
      faq: [
        {
          q: "Pagiera bir CMS mi?",
          a: "Sayfalar için evet: taslaklar, yayınlama ve sürümler. Payload gibi keyfi içerik koleksiyonları tanımlamaz.",
        },
        {
          q: "Bir Pagiera sayfası Payload içeriğini gösterebilir mi?",
          a: "Evet. Bir Repeat bloğunu Payload REST uç noktasına yöneltin ve alanları bağlayın.",
        },
        {
          q: "Aynı uygulamada çakışırlar mı?",
          a: "Hayır. Her biri kendi rotalarını bağlar; ortak olan yalnızca Next.js uygulamanız.",
        },
      ],
      marks: ["yes", "yes", "yes", "no", "yes", "partial"],
    },
    {
      slug: "pagiera-vs-webflow",
      name: "Webflow",
      category: "Barındırılan site kurucu",
      tagline: "yerleşik CMS'i olan, barındırılan bir görsel site kurucu",
      headline: "Biri katıldığınız bir platform. Diğeri kurduğunuz bir paket.",
      verdict:
        "Webflow barındırılan bir platformdur: Webflow'un altyapısında tasarlar, içeriği yönetir ve yayımlarsınız. Pagiera ise kendi Next.js uygulamanızın içine görsel editör koyan bir npm paketidir; sayfalar uygulamanızdan ve veritabanınızdan işlenir. Barındırma dahil bağımsız bir pazarlama sitesi için Webflow'u, sayfalar zaten işlettiğiniz bir ürünün parçasıysa Pagiera'yı seçin.",
      intent:
        "Karar genellikle sitenin kendi başına bir platform mu, yoksa zaten işlettiğiniz bir uygulamanın parçası mı olduğudur.",
      choosePagiera: [
        "Sayfalar ürün rotalarının yanında, kendi uygulamanızda durmalı.",
        "Düzenleme kendi kimlik doğrulamanızın arkasında olmalı.",
        "Sayfalar uygulamanızın zaten kullandığı API'lerden okumalı.",
      ],
      chooseRival: [
        "Barındırma, CMS ve editörü tek yönetilen üründe istiyorsunuz.",
        "Site bağımsız bir pazarlama sitesi.",
        "Ekipte kimse altyapı işletmek istemiyor.",
      ],
      rows: [
        {
          label: "Sayfalar nerede çalışır",
          pagiera: "Kendi altyapınızdaki Next.js uygulamanızda.",
          rival: "Webflow barındırmasında.",
        },
        {
          label: "İçerik",
          pagiera: "Öğe bazında bağlanan kendi API'leriniz.",
          rival: "Yerleşik CMS koleksiyonları.",
        },
        {
          label: "Ürüne gömme",
          pagiera: "Editör, bağladığınız bir bileşendir.",
          rival: "Bunun için tasarlanmamıştır.",
        },
        {
          label: "İşletme",
          pagiera: "Uygulamayı ve hizmetlerini siz çalıştırırsınız.",
          rival: "Webflow yönetir.",
        },
        { label: "Lisans", pagiera: "MIT.", rival: "Tescilli SaaS." },
      ],
      together:
        "Bazı ekipler pazarlama sitesini Webflow'da tutar, ürünün içindeki düzenlenebilir sayfalar için Pagiera'yı kullanır.",
      faq: [
        {
          q: "Pagiera, Webflow'un yaptıklarını yapabilir mi?",
          a: "Uygulamanızdaki sayfalar için büyük kısmını: görsel düzen, kırılma noktaları, içerik, etkileşim. Site barındırmaz, alan adı yönetmez.",
        },
        {
          q: "Barındırmayı taşımamız gerekir mi?",
          a: "Hayır. Pagiera, Next.js uygulamanız nerede çalışıyorsa orada çalışır.",
        },
        {
          q: "Webflow CMS'in yerini ne alır?",
          a: "Kendi API'leriniz ya da bir headless CMS; sayfalara Request ve Repeat ile bağlanır.",
        },
      ],
      marks: ["no", "no", "no", "yes", "yes", "partial"],
    },
    {
      slug: "pagiera-vs-framer",
      name: "Framer",
      category: "Barındırılan site kurucu",
      tagline: "tasarım odaklı, barındırılan bir site kurucu",
      headline:
        "Cilalı bir barındırılan kurucu ya da kodunuzda yaşayan bir kurucu.",
      verdict:
        "Framer, kendi barındırmasında yayın yapan, güçlü animasyonları ve yerleşik CMS'i olan tasarım odaklı bir site kurucudur. Pagiera görsel editörü, keyframe hareketini ve etkileşimleri kendi Next.js uygulamanıza getirir. Hızlı ve güzel bağımsız bir site için Framer'ı, sayfalar uygulamanızın parçası olmalıysa Pagiera'yı seçin.",
      intent:
        "İkisi de tasarımı ve hareketi önemser; fark, sitenin nerede yaşadığı ve kimin kontrol ettiğidir.",
      choosePagiera: [
        "Sayfalar kendi uygulamanızdan ve veritabanınızdan işlenmeli.",
        "Editör ürününüzün içinde, kendi girişinizin arkasında olmalı.",
        "Barındırılan bir plan yerine açık kaynak bir paket istiyorsunuz.",
      ],
      chooseRival: [
        "Dakikalar içinde yayına çıkan bağımsız bir site istiyorsunuz.",
        "Site baştan sona tasarımcılara ait.",
        "Barındırma ve CMS sizin için yönetilmeli.",
      ],
      rows: [
        {
          label: "Sayfalar nerede çalışır",
          pagiera: "Next.js uygulamanızda.",
          rival: "Framer barındırmasında.",
        },
        {
          label: "Hareket",
          pagiera: "Keyframe zaman çizelgesi, eğriler, yaylar ve efektler.",
          rival: "Zengin yerleşik animasyon ve efektler.",
        },
        {
          label: "İçerik",
          pagiera: "Öğe bazında bağlanan kendi API'leriniz.",
          rival: "Yerleşik CMS.",
        },
        {
          label: "Ürüne gömme",
          pagiera: "Evet, bağlanan bir editör olarak.",
          rival: "Bunun için tasarlanmamıştır.",
        },
        { label: "Lisans", pagiera: "MIT.", rival: "Tescilli SaaS." },
      ],
      together:
        "Evet: Framer'daki pazarlama sitesi ile ürününüzdeki Pagiera sayfaları, aynı yığını paylaşmadan aynı markayı paylaşabilir.",
      faq: [
        {
          q: "Pagiera'nın hareket özellikleri aynı düzeyde mi?",
          a: "Eğriler, yaylar, metin bölme ve düzenlenebilir 34 efektle bir keyframe zaman çizelgesi sunar. Framer'ın kendi güçlü yanları var; kullanım durumunuz için ikisini de deneyin.",
        },
        {
          q: "Tasarımcılar Pagiera'yı geliştirici olmadan kullanabilir mi?",
          a: "Bir geliştirici kurduktan sonra evet: düzenleme, önizleme ve yayınlama stüdyoda yapılır.",
        },
        {
          q: "Site nerede barındırılır?",
          a: "Next.js uygulamanız nerede barındırılıyorsa orada.",
        },
      ],
      marks: ["no", "no", "no", "yes", "yes", "partial"],
    },
  ],
};

export const COMPARE: Record<Locale, CompareCopy> = { en, tr };
