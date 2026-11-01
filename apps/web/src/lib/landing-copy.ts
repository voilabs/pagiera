export type Locale = "en" | "tr";

type Item = { title: string; text: string };
type UseCase = {
  id: "studio" | "data" | "actions" | "motion" | "cli";
  tab: string;
  title: string;
  text: string;
  points: string[];
  href: string;
};

export type MenuIcon =
  | "studio"
  | "data"
  | "actions"
  | "motion"
  | "cli"
  | "ai"
  | "responsive"
  | "components"
  | "docs"
  | "guides"
  | "templates"
  | "changelog"
  | "security"
  | "github"
  | "integrations";
export type MenuItem = {
  icon: MenuIcon;
  label: string;
  text: string;
  href: string;
};
export type NavCopy = {
  label: string;
  menus: {
    id: string;
    label: string;
    items: MenuItem[];
    featured: {
      eyebrow: string;
      title: string;
      text: string;
      href: string;
      cta: string;
    };
  }[];
  github: string;
  openMenu: string;
  language: string;
  closeMenu: string;
};

export type LandingCopy = {
  menu: NavCopy;
  nav: { label: string; href: string }[];
  cta: string;
  badge: string;
  heroTitle: string;
  install: string;
  copy: string;
  copied: string;
  flowTitle: string;
  flowAccent: string;
  flowText: string;
  featuresLabel: string;
  heroText: string;
  prompt: string;
  chips: { label: string; href: string }[];
  editorTitle: string;
  editorText: string;
  editorAlt: string;
  pillars: Item[];
  useTitle: string;
  useText: string;
  useCases: UseCase[];
  stackEyebrow: string;
  stackTitle: string;
  stackText: string;
  stackLink: string;
  stackCards: (Item & { href: string; mark: string })[];
  numbersEyebrow: string;
  numbersTitle: string;
  numbers: { value: string; label: string; text: string }[];
  faqEyebrow: string;
  faqTitle: string;
  faqText: string;
  faq: { q: string; a: string }[];
  finalTitle: string;
  finalText: string;
  finalPrimary: string;
  finalSecondary: string;
  footer: { title: string; links: { label: string; href: string }[] }[];
  legal: string;
};

const GITHUB = "https://github.com/voilabs/pagiera";

const en: LandingCopy = {
  menu: {
    label: "Main navigation",
    menus: [
      {
        id: "features",
        label: "Features",
        items: [
          {
            icon: "integrations",
            label: "Integrations",
            text: "Frameworks, services and AI tools",
            href: "/integrations",
          },
          {
            icon: "studio",
            label: "Studio",
            text: "Layers, styles and assets on one canvas",
            href: "/features",
          },
          {
            icon: "data",
            label: "Data",
            text: "Bind pages to your API and routes",
            href: "/features/data",
          },
          {
            icon: "actions",
            label: "Action Workflow",
            text: "Behaviour as a node graph",
            href: "/features/action-workflow",
          },
          {
            icon: "motion",
            label: "Motion Editor",
            text: "Keyframes, curves and effects",
            href: "/features/motion-editor",
          },
          {
            icon: "components",
            label: "Components",
            text: "Reusable masters and layouts",
            href: "/docs/components-layouts",
          },
          {
            icon: "responsive",
            label: "Responsive",
            text: "Breakpoints and artboards",
            href: "/docs/responsive-design",
          },
          {
            icon: "ai",
            label: "Luma AI",
            text: "Describe a change, review the result",
            href: "/docs/ai-mcp",
          },
          {
            icon: "cli",
            label: "CLI & MCP",
            text: "Pages your agents can edit",
            href: "/docs/cli",
          },
        ],
        featured: {
          eyebrow: "New",
          title: "Motion Editor",
          text: "After Effects-style keyframes, springs and 34 editable effects.",
          href: "/features/motion-editor",
          cta: "See it in action",
        },
      },
      {
        id: "resources",
        label: "Resources",
        items: [
          {
            icon: "docs",
            label: "Documentation",
            text: "Install, integrate and operate",
            href: "/docs",
          },
          {
            icon: "guides",
            label: "Guides",
            text: "Step-by-step walkthroughs",
            href: "/guides",
          },
          {
            icon: "templates",
            label: "Templates",
            text: "Start from a finished site",
            href: "/templates",
          },
          {
            icon: "changelog",
            label: "Changelog",
            text: "What changed and when",
            href: "/docs/changelog",
          },
          {
            icon: "security",
            label: "Security",
            text: "Checks before production",
            href: "/docs/security",
          },
          {
            icon: "github",
            label: "GitHub",
            text: "Source, issues and releases",
            href: "https://github.com/voilabs/pagiera",
          },
        ],
        featured: {
          eyebrow: "Start here",
          title: "Getting started",
          text: "Install the package, mount the API and open the studio.",
          href: "/docs/getting-started",
          cta: "Read the guide",
        },
      },
    ],
    github: "Pagiera on GitHub",
    openMenu: "Open menu",
    language: "Language",
    closeMenu: "Close menu",
  },
  nav: [
    { label: "Features", href: "/features" },
    { label: "Templates", href: "/templates" },
    { label: "Integrations", href: "/integrations" },
    { label: "Guides", href: "/guides" },
    { label: "Docs", href: "/docs" },
    { label: "GitHub", href: GITHUB },
  ],
  cta: "Get started",
  badge: "Open source · MIT",
  heroTitle: "Visual editing\nbuilt into your app",
  install: "bun add pagiera",
  copy: "Copy install command",
  copied: "Copied",
  flowTitle: "Build your pages",
  flowAccent: "/visually",
  flowText:
    "Design in the studio, wire behaviour in a graph, animate on a timeline and script it all from the terminal. Every change is a plain document your app owns.",
  featuresLabel: "Features",
  heroText:
    "Design pages visually, bind them to your data and publish from your own application. Your auth, your database, your deploy.",
  prompt: "Describe a page for Luma to build…",
  chips: [
    { label: "Landing page", href: "/docs/studio" },
    { label: "Pricing", href: "/docs/components-layouts" },
    { label: "Blog list", href: "/docs/data-binding" },
    { label: "Contact form", href: "/docs/forms" },
    { label: "More", href: "/docs" },
  ],
  editorTitle: "A studio that turns into\nfinished pages",
  editorText:
    "Layers, styles, breakpoints and assets in one canvas. Every change is a plain document your app saves and renders.",
  editorAlt:
    "The Pagiera studio editing a page, with the layers panel and inspector open",
  pillars: [
    {
      title: "Lives in your app",
      text: "Mount the studio on a protected route. Authentication, storage and deployment stay yours.",
    },
    {
      title: "Native, not screenshots",
      text: "Pages render as real React elements with responsive overrides, forms and data.",
    },
    {
      title: "Safe to hand over",
      text: "Drafts, previews and revisions keep editors from breaking what is live.",
    },
  ],
  useTitle: "How teams build\nwith Pagiera",
  useText:
    "From a single marketing page to data-driven routes with motion and behaviour.",
  useCases: [
    {
      id: "studio",
      tab: "Studio",
      title: "Edit like a designer, ship like a developer",
      text: "Arrange layers, tune styles per breakpoint and reuse components across pages.",
      points: [
        "Layers, inspector and assets",
        "Breakpoints and artboards",
        "Reusable components and layouts",
      ],
      href: "/docs/studio",
    },
    {
      id: "data",
      tab: "Data",
      title: "Bind pages to your API",
      text: "Request and Repeat blocks turn API responses into lists, detail pages and route tokens.",
      points: [
        "Dynamic routes from one template",
        "Safe formatting expressions",
        "Server-side requests",
      ],
      href: "/docs/data-binding",
    },
    {
      id: "actions",
      tab: "Action Workflow",
      title: "Behaviour without writing scripts",
      text: "Connect events, branches and actions in a node graph to open panels, set variables or morph layers.",
      points: [
        "Events, flow, actions and data nodes",
        "Scoped graph per layer",
        "Morph transitions between layers",
      ],
      href: "/docs/action-workflow",
    },
    {
      id: "motion",
      tab: "Motion Editor",
      title: "Keyframes with real freedom",
      text: "Animate any property on a timeline, shape it with curves and springs, or start from an effect preset.",
      points: [
        "Keyframes, curves and springs",
        "Text split and stagger",
        "Effect presets you can edit",
      ],
      href: "/docs/motion-editor",
    },
    {
      id: "cli",
      tab: "CLI & MCP",
      title: "Pages your agents can edit",
      text: "Validate, create and update documents from a terminal, CI or an MCP-connected agent, with version checks so nobody overwrites another editor.",
      points: [
        "Validate before saving",
        "Optimistic version checks",
        "Same API for agents and people",
      ],
      href: "/docs/cli",
    },
  ],
  stackEyebrow: "Integrations",
  stackTitle: "Works with your stack",
  stackText:
    "Pagiera plugs into the tools you already run. No hosted service, no lock-in.",
  stackLink: "Explore integrations",
  stackCards: [
    {
      mark: "MCP",
      title: "MCP discovery",
      text: "Discover tools on approved MCP servers with host-controlled authorization.",
      href: "/docs/ai-mcp",
    },
    {
      mark: ">_",
      title: "CLI",
      text: "Inspect, diff and patch page documents from your terminal or CI.",
      href: "/docs/cli",
    },
  ],
  numbersEyebrow: "In the box",
  numbersTitle: "Built in, not bolted on",
  numbers: [
    {
      value: "34",
      label: "motion effects",
      text: "Entrances, text reveals, attention seekers, loops and exits, all editable as keyframes.",
    },
    {
      value: "300",
      label: "nodes per graph",
      text: "A bounded interpreter runs each workflow; no arbitrary JavaScript reaches visitors.",
    },
    {
      value: "MIT",
      label: "licensed",
      text: "Read the code, fork it, ship it. The studio and runtime are open source.",
    },
    {
      value: "2",
      label: "languages",
      text: "English and Turkish across the studio, docs and site.",
    },
  ],
  faqEyebrow: "FAQ",
  faqTitle: "Frequently asked\nquestions",
  faqText: "Quick answers about how Pagiera works and how to get started.",
  faq: [
    {
      q: "What is Pagiera?",
      a: "An open-source visual website builder for React and Next.js. You install it as a package and mount the studio inside your own application.",
    },
    {
      q: "Where is my content stored?",
      a: "In your own PostgreSQL database. Redis caches published pages. Nothing is sent to a Pagiera-hosted service.",
    },
    {
      q: "Do I need AI to use it?",
      a: "No. Luma, the AI assistant, is optional and only needs an OpenRouter key if you turn it on.",
    },
    {
      q: "Can editors break the live site?",
      a: "Saving updates a draft. Preview and publish are separate steps, and revisions let you roll back.",
    },
    {
      q: "Who controls access to the studio?",
      a: "Your application. Pagiera calls your authentication check before every studio and API request.",
    },
    {
      q: "How do I get started?",
      a: "Install the package, add the stylesheet, mount the API route and open the studio. The getting-started guide walks through each step.",
    },
  ],
  finalTitle: "Say hi to Pagiera and\nbuild your first page",
  finalText: "Install the package and have the studio running in minutes.",
  finalPrimary: "Read the docs",
  finalSecondary: "Star on GitHub",
  footer: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Templates", href: "/templates" },
        { label: "Integrations", href: "/integrations" },
        { label: "Compare", href: "/compare" },
      ],
    },
    {
      title: "Build",
      links: [
        { label: "Action Workflow", href: "/docs/action-workflow" },
        { label: "Motion Editor", href: "/docs/motion-editor" },
        { label: "Dynamic data", href: "/docs/data-binding" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "Guides", href: "/guides" },
        { label: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "Project",
      links: [
        { label: "GitHub", href: GITHUB },
        { label: "Changelog", href: "/docs/changelog" },
        { label: "Security", href: "/docs/security" },
      ],
    },
  ],
  legal: "Open source under the MIT license.",
};

const tr: LandingCopy = {
  menu: {
    label: "Ana gezinme",
    menus: [
      {
        id: "features",
        label: "Özellikler",
        items: [
          {
            icon: "integrations",
            label: "Entegrasyonlar",
            text: "Uygulamalar, servisler ve yapay zekâ araçları",
            href: "/integrations",
          },
          {
            icon: "studio",
            label: "Stüdyo",
            text: "Katmanlar, stiller ve varlıklar tek tuvalde",
            href: "/features",
          },
          {
            icon: "data",
            label: "Veri",
            text: "Sayfaları API'nize ve rotalarınıza bağlayın",
            href: "/features/data",
          },
          {
            icon: "actions",
            label: "Aksiyon akışı",
            text: "Davranışı düğüm grafiğiyle kurun",
            href: "/features/action-workflow",
          },
          {
            icon: "motion",
            label: "Motion editörü",
            text: "Keyframe, eğri ve efektler",
            href: "/features/motion-editor",
          },
          {
            icon: "components",
            label: "Bileşenler",
            text: "Ortak master'lar ve düzenler",
            href: "/docs/components-layouts",
          },
          {
            icon: "responsive",
            label: "Duyarlı tasarım",
            text: "Kırılma noktaları ve çizim alanları",
            href: "/docs/responsive-design",
          },
          {
            icon: "ai",
            label: "Luma AI",
            text: "Değişikliği anlatın, sonucu inceleyin",
            href: "/docs/ai-mcp",
          },
          {
            icon: "cli",
            label: "CLI ve MCP",
            text: "Ajanların düzenleyebildiği sayfalar",
            href: "/docs/cli",
          },
        ],
        featured: {
          eyebrow: "Yeni",
          title: "Motion editörü",
          text: "After Effects tarzı keyframe'ler, yaylar ve düzenlenebilir 34 efekt.",
          href: "/features/motion-editor",
          cta: "Yakından bakın",
        },
      },
      {
        id: "resources",
        label: "Kaynaklar",
        items: [
          {
            icon: "docs",
            label: "Dokümantasyon",
            text: "Kurun, entegre edin, işletin",
            href: "/docs",
          },
          {
            icon: "guides",
            label: "Rehberler",
            text: "Adım adım anlatımlar",
            href: "/guides",
          },
          {
            icon: "templates",
            label: "Şablonlar",
            text: "Hazır bir siteyle başlayın",
            href: "/templates",
          },
          {
            icon: "changelog",
            label: "Değişiklik günlüğü",
            text: "Neyin ne zaman değiştiği",
            href: "/docs/changelog",
          },
          {
            icon: "security",
            label: "Güvenlik",
            text: "Üretim öncesi kontroller",
            href: "/docs/security",
          },
          {
            icon: "github",
            label: "GitHub",
            text: "Kaynak kod, issue'lar ve sürümler",
            href: "https://github.com/voilabs/pagiera",
          },
        ],
        featured: {
          eyebrow: "Buradan başlayın",
          title: "Başlarken",
          text: "Paketi kurun, API'yi bağlayın ve stüdyoyu açın.",
          href: "/docs/getting-started",
          cta: "Rehberi okuyun",
        },
      },
    ],
    github: "GitHub'da Pagiera",
    openMenu: "Menüyü aç",
    language: "Dil",
    closeMenu: "Menüyü kapat",
  },
  nav: [
    { label: "Özellikler", href: "/features" },
    { label: "Şablonlar", href: "/templates" },
    { label: "Entegrasyonlar", href: "/integrations" },
    { label: "Rehberler", href: "/guides" },
    { label: "Doküman", href: "/docs" },
    { label: "GitHub", href: GITHUB },
  ],
  cta: "Başlayın",
  badge: "Açık kaynak · MIT",
  heroTitle: "Uygulamanızın içinde\ngörsel düzenleme",
  install: "bun add pagiera",
  copy: "Kurulum komutunu kopyala",
  copied: "Kopyalandı",
  flowTitle: "Sayfalarınızı",
  flowAccent: "/görsel kurun",
  flowText:
    "Stüdyoda tasarlayın, davranışı grafikte bağlayın, zaman çizelgesinde canlandırın ve hepsini terminalden yönetin. Her değişiklik uygulamanıza ait sade bir belgedir.",
  featuresLabel: "Özellikler",
  heroText:
    "Sayfaları görsel olarak tasarlayın, verinize bağlayın ve kendi uygulamanızdan yayımlayın. Kimlik doğrulama, veritabanı ve dağıtım sizde kalır.",
  prompt: "Luma'ya oluşturmasını istediğiniz sayfayı anlatın…",
  chips: [
    { label: "Açılış sayfası", href: "/docs/studio" },
    { label: "Fiyatlandırma", href: "/docs/components-layouts" },
    { label: "Blog listesi", href: "/docs/data-binding" },
    { label: "İletişim formu", href: "/docs/forms" },
    { label: "Daha fazla", href: "/docs" },
  ],
  editorTitle: "Bitmiş sayfalara dönüşen\nbir stüdyo",
  editorText:
    "Katmanlar, stiller, kırılma noktaları ve varlıklar tek tuvalde. Her değişiklik, uygulamanızın kaydedip işlediği sade bir belgedir.",
  editorAlt:
    "Katmanlar paneli ve denetçi açıkken bir sayfayı düzenleyen Pagiera stüdyosu",
  pillars: [
    {
      title: "Uygulamanızın içinde",
      text: "Stüdyoyu korumalı bir rotaya bağlayın. Kimlik doğrulama, depolama ve dağıtım sizde kalır.",
    },
    {
      title: "Gerçek bileşenler",
      text: "Sayfalar duyarlı ayarlar, formlar ve verilerle gerçek React öğeleri olarak işlenir.",
    },
    {
      title: "Güvenle devredin",
      text: "Taslaklar, önizlemeler ve sürümler, editörlerin yayındaki sayfayı bozmasını engeller.",
    },
  ],
  useTitle: "Ekipler Pagiera ile\nneler yapıyor",
  useText:
    "Tek bir tanıtım sayfasından hareketli, veriye bağlı dinamik rotalara kadar.",
  useCases: [
    {
      id: "studio",
      tab: "Stüdyo",
      title: "Tasarımcı gibi düzenleyin, geliştirici gibi yayımlayın",
      text: "Katmanları düzenleyin, stilleri kırılma noktasına göre ayarlayın ve bileşenleri sayfalar arasında yeniden kullanın.",
      points: [
        "Katmanlar, denetçi ve varlıklar",
        "Kırılma noktaları ve çizim alanları",
        "Yeniden kullanılabilir bileşenler ve düzenler",
      ],
      href: "/docs/studio",
    },
    {
      id: "data",
      tab: "Veri",
      title: "Sayfaları API'nize bağlayın",
      text: "Request ve Repeat blokları API yanıtlarını listelere, detay sayfalarına ve rota token'larına dönüştürür.",
      points: [
        "Tek şablondan dinamik rotalar",
        "Güvenli biçimlendirme ifadeleri",
        "Sunucu tarafı istekler",
      ],
      href: "/docs/data-binding",
    },
    {
      id: "actions",
      tab: "Aksiyon akışı",
      title: "Kod yazmadan davranış",
      text: "Panelleri açmak, değişken ayarlamak veya katmanları dönüştürmek için olayları, dalları ve aksiyonları bir düğüm grafiğinde bağlayın.",
      points: [
        "Olay, akış, aksiyon ve veri düğümleri",
        "Katmana özel grafik",
        "Katmanlar arası morph geçişleri",
      ],
      href: "/docs/action-workflow",
    },
    {
      id: "motion",
      tab: "Motion editörü",
      title: "Gerçek özgürlükle keyframe",
      text: "Her özelliği zaman çizelgesinde canlandırın, eğri ve yaylarla şekillendirin ya da bir efekt hazır ayarıyla başlayın.",
      points: [
        "Keyframe, eğri ve yay",
        "Metni bölme ve kademelendirme",
        "Düzenlenebilir efekt hazır ayarları",
      ],
      href: "/docs/motion-editor",
    },
    {
      id: "cli",
      tab: "CLI ve MCP",
      title: "Ajanlarınızın düzenleyebildiği sayfalar",
      text: "Belgeleri terminalden, CI'dan veya MCP'ye bağlı bir ajandan doğrulayın, oluşturun ve güncelleyin; sürüm kontrolü kimsenin başka bir editörün işini ezmesine izin vermez.",
      points: [
        "Kaydetmeden önce doğrulama",
        "İyimser sürüm kontrolü",
        "Ajanlar ve insanlar için aynı API",
      ],
      href: "/docs/cli",
    },
  ],
  stackEyebrow: "Entegrasyonlar",
  stackTitle: "Kullandığınız araçlarla çalışır",
  stackText:
    "Pagiera zaten kullandığınız araçlara bağlanır. Barındırılan servis yok, bağımlılık yok.",
  stackLink: "Entegrasyonları keşfedin",
  stackCards: [
    {
      mark: "MCP",
      title: "MCP keşfi",
      text: "Onaylı MCP sunucularındaki araçları uygulamanızın yetkilendirme kontrolüyle keşfedin.",
      href: "/docs/ai-mcp",
    },
    {
      mark: ">_",
      title: "CLI",
      text: "Sayfa belgelerini terminalinizden veya CI'dan inceleyin, karşılaştırın ve yamalayın.",
      href: "/docs/cli",
    },
  ],
  numbersEyebrow: "Kutudan çıkanlar",
  numbersTitle: "Sonradan eklenmiş değil, içinde",
  numbers: [
    {
      value: "34",
      label: "hareket efekti",
      text: "Girişler, metin efektleri, dikkat çekiciler, döngüler ve çıkışlar; hepsi keyframe olarak düzenlenebilir.",
    },
    {
      value: "300",
      label: "düğüm / grafik",
      text: "Her akışı sınırlı bir yorumlayıcı çalıştırır; ziyaretçiye keyfi JavaScript ulaşmaz.",
    },
    {
      value: "MIT",
      label: "lisanslı",
      text: "Kodu okuyun, çatallayın, yayımlayın. Stüdyo ve çalışma zamanı açık kaynaktır.",
    },
    {
      value: "2",
      label: "dil",
      text: "Stüdyo, dokümantasyon ve sitede İngilizce ve Türkçe.",
    },
  ],
  faqEyebrow: "SSS",
  faqTitle: "Sıkça sorulan\nsorular",
  faqText:
    "Pagiera'nın nasıl çalıştığı ve nasıl başlanacağı hakkında kısa yanıtlar.",
  faq: [
    {
      q: "Pagiera nedir?",
      a: "React ve Next.js için açık kaynak bir görsel site oluşturucu. Paket olarak kurar, stüdyoyu kendi uygulamanızın içine bağlarsınız.",
    },
    {
      q: "İçeriğim nerede saklanıyor?",
      a: "Kendi PostgreSQL veritabanınızda. Redis yayımlanan sayfaları önbelleğe alır. Pagiera'nın barındırdığı bir servise hiçbir şey gönderilmez.",
    },
    {
      q: "Kullanmak için yapay zekâ gerekli mi?",
      a: "Hayır. Yapay zekâ asistanı Luma isteğe bağlıdır; yalnızca açarsanız bir OpenRouter anahtarı gerekir.",
    },
    {
      q: "Editörler yayındaki siteyi bozabilir mi?",
      a: "Kaydetmek yalnızca taslağı günceller. Önizleme ve yayımlama ayrı adımlardır; sürümlerle geri dönebilirsiniz.",
    },
    {
      q: "Stüdyoya erişimi kim kontrol ediyor?",
      a: "Uygulamanız. Pagiera her stüdyo ve API isteğinden önce sizin kimlik doğrulama kontrolünüzü çağırır.",
    },
    {
      q: "Nasıl başlarım?",
      a: "Paketi kurun, stil dosyasını ekleyin, API rotasını bağlayın ve stüdyoyu açın. Başlarken rehberi her adımı anlatır.",
    },
  ],
  finalTitle: "Pagiera'ya merhaba deyin,\nilk sayfanızı oluşturun",
  finalText: "Paketi kurun, stüdyo dakikalar içinde çalışsın.",
  finalPrimary: "Dokümanı okuyun",
  finalSecondary: "GitHub'da yıldızlayın",
  footer: [
    {
      title: "Ürün",
      links: [
        { label: "Özellikler", href: "/features" },
        { label: "Şablonlar", href: "/templates" },
        { label: "Entegrasyonlar", href: "/integrations" },
        { label: "Karşılaştır", href: "/compare" },
      ],
    },
    {
      title: "Oluştur",
      links: [
        { label: "Aksiyon akışı", href: "/docs/action-workflow" },
        { label: "Motion editörü", href: "/docs/motion-editor" },
        { label: "Dinamik veri", href: "/docs/data-binding" },
      ],
    },
    {
      title: "Kaynaklar",
      links: [
        { label: "Dokümantasyon", href: "/docs" },
        { label: "Rehberler", href: "/guides" },
        { label: "SSS", href: "/faq" },
      ],
    },
    {
      title: "Proje",
      links: [
        { label: "GitHub", href: GITHUB },
        { label: "Değişiklik günlüğü", href: "/docs/changelog" },
        { label: "Güvenlik", href: "/docs/security" },
      ],
    },
  ],
  legal: "MIT lisansıyla açık kaynak.",
};

export const LANDING: Record<Locale, LandingCopy> = { en, tr };

export const STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "PostgreSQL",
  "Redis",
  "Tailwind CSS",
  "OpenRouter",
  "MCP",
  "Vercel",
  "Docker",
  "Bun",
  "Node.js",
] as const;
export type StackName = (typeof STACK)[number];
