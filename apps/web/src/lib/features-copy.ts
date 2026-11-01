import type { Locale } from "@/lib/landing-copy";

export type FeatureSlug = "data" | "action-workflow" | "motion-editor";

type Pair = { title: string; text: string };

export type FeatureCopy = {
  slug: FeatureSlug;
  name: string;
  eyebrow: string;
  title: string;
  accent: string;
  lede: string;
  docs: string;
  windowTitle: string;
  caption: string;
  steps: Pair[];
  capabilities: (Pair & { label: string })[];
  limits: { value: string; label: string }[];
  limitsNote: string;
  faq: { q: string; a: string }[];
};

export type FeaturesUi = {
  indexEyebrow: string;
  indexTitle: string;
  indexAccent: string;
  indexLede: string;
  featuredLabel: string;
  moreLabel: string;
  more: { label: string; text: string; href: string }[];
  breadcrumb: string;
  readDocs: string;
  getStarted: string;
  stepsTitle: string;
  capabilitiesTitle: string;
  limitsTitle: string;
  faqTitle: string;
  next: string;
  ctaTitle: string;
  ctaText: string;
  explore: string;
};

const en: { ui: FeaturesUi; features: FeatureCopy[] } = {
  ui: {
    indexEyebrow: "Features",
    indexTitle: "Everything a page needs,",
    indexAccent: "/in one studio",
    indexLede:
      "Layout, data, behaviour and motion are edited on the same canvas and saved as one plain document your application renders.",
    featuredLabel: "In depth",
    moreLabel: "And the rest of the studio",
    more: [
      {
        label: "Studio",
        text: "Layers, inspector, assets and an infinite canvas.",
        href: "/docs/studio",
      },
      {
        label: "Components and layouts",
        text: "Reusable masters, instances and page slots.",
        href: "/docs/components-layouts",
      },
      {
        label: "Responsive design",
        text: "Breakpoints, artboards and per-width overrides.",
        href: "/docs/responsive-design",
      },
      {
        label: "Forms",
        text: "Native inputs that submit to your own endpoints.",
        href: "/docs/forms",
      },
      {
        label: "Luma AI",
        text: "Describe a change, review it, keep what you like.",
        href: "/docs/ai-mcp",
      },
      {
        label: "CLI and MCP",
        text: "Pages your scripts and agents can edit safely.",
        href: "/docs/cli",
      },
      {
        label: "Revisions",
        text: "Drafts, previews and a history you can restore.",
        href: "/docs/revisions",
      },
      {
        label: "Translations",
        text: "Host-owned strings in every locale.",
        href: "/docs/translations",
      },
    ],
    breadcrumb: "Features",
    readDocs: "Read the docs",
    getStarted: "Get started",
    stepsTitle: "How it works",
    capabilitiesTitle: "What you can do",
    limitsTitle: "Built-in limits",
    faqTitle: "Questions",
    next: "Next feature",
    ctaTitle: "Try it in your own app",
    ctaText: "Install the package and open the studio on a protected route.",
    explore: "Explore",
  },
  features: [
    {
      slug: "data",
      name: "Data",
      eyebrow: "Dynamic data",
      title: "Bind pages to",
      accent: "/your API",
      lede: "Request and Repeat blocks turn JSON from your endpoints into lists, detail pages and route-driven content, resolved on the server before HTML is sent.",
      docs: "/docs/data-binding",
      windowTitle: "Repeat · posts",
      caption:
        "A Repeat block renders one designed row per item returned by the request.",
      steps: [
        {
          title: "Add a source",
          text: "Point a Request or Repeat block at a JSON endpoint and choose the method.",
        },
        {
          title: "Pick the list",
          text: "Send the request once, then choose the array to repeat, such as $.items.",
        },
        {
          title: "Bind fields",
          text: "Connect text, images, links and visibility to fields of the current row.",
        },
        {
          title: "Publish",
          text: "Published requests resolve on the server, so content is in the returned HTML.",
        },
      ],
      capabilities: [
        {
          label: "Routes",
          title: "Route and query tokens",
          text: "Use {{params.slug}} and {{query.q}} in URLs, headers and bodies for dynamic pages.",
        },
        {
          label: "Format",
          title: "Dates, numbers, currency",
          text: "Formats store their locale and time zone, so every visitor reads the same text.",
        },
        {
          label: "Pipes",
          title: "Safe expressions",
          text: "Pipes and JavaScript-shaped expressions are interpreted, never executed.",
        },
        {
          label: "Methods",
          title: "GET to DELETE",
          text: "GET, POST, PUT, PATCH and DELETE with query pairs, headers and bodies.",
        },
        {
          label: "404",
          title: "Missing records",
          text: "An upstream 404 can turn the whole route into a 404 response.",
        },
        {
          label: "SEO",
          title: "Indexable output",
          text: "Server-resolved content is present in the HTML that search engines read.",
        },
      ],
      limits: [
        { value: "200", label: "rows per source" },
        { value: "8 s", label: "request timeout" },
        { value: "3", label: "redirects followed" },
        { value: "2 MB", label: "default response limit" },
      ],
      limitsNote:
        "Private hosts are refused unless an operator allows them on the server.",
      faq: [
        {
          q: "Can I call my local API during development?",
          a: "Yes. Set PAGIERA_ALLOW_PRIVATE_HOSTS on the host server, for example localhost,127.0.0.1, and restart it.",
        },
        {
          q: "Where should API keys go?",
          a: "Not in the page. Source URLs and headers are visible to editors; put secrets behind a proxy your application owns.",
        },
        {
          q: "Does it work without JavaScript?",
          a: "Published requests resolve on the server, so the content arrives in the HTML.",
        },
      ],
    },
    {
      slug: "action-workflow",
      name: "Action Workflow",
      eyebrow: "Behaviour",
      title: "Interactions,",
      accent: "/without scripts",
      lede: "Connect events, branches and actions in a node graph to open panels, set variables, navigate or morph one layer into another.",
      docs: "/docs/action-workflow",
      windowTitle: "Actions · toggle panel",
      caption:
        "A click branches on the panel's visibility, then shows or hides it.",
      steps: [
        {
          title: "Pick an event",
          text: "Start from page load, click, hover, scroll into view, input change or a timer.",
        },
        {
          title: "Add the flow",
          text: "Branch, sequence, delay or run once; data wires feed conditions and values.",
        },
        {
          title: "Choose actions",
          text: "Show, hide, toggle, navigate, set variables, copy, animate or morph.",
        },
        {
          title: "Preview",
          text: "Test in the protected page preview, then save and publish.",
        },
      ],
      capabilities: [
        {
          label: "Scope",
          title: "Per-layer graphs",
          text: "Alt + double-click a layer to open a split view with only its actions.",
        },
        {
          label: "State",
          title: "Variables",
          text: "Named variables, optionally kept in the visitor's browser between visits.",
        },
        {
          label: "Morph",
          title: "Morph into layer",
          text: "Transition one layer into another; surrounding content resizes smoothly.",
        },
        {
          label: "Motion",
          title: "Named animations",
          text: "Show, hide and toggle play custom animations forward or backward.",
        },
        {
          label: "Safety",
          title: "Bounded runtime",
          text: "A small interpreter runs each flow; no arbitrary JavaScript reaches visitors.",
        },
        {
          label: "Links",
          title: "Safe navigation",
          text: "Navigation accepts HTTP(S), site paths, fragments, mail and phone links.",
        },
      ],
      limits: [
        { value: "300", label: "nodes per graph" },
        { value: "600", label: "links per graph" },
        { value: "50", label: "variables" },
        { value: "2,000", label: "steps per run" },
      ],
      limitsNote:
        "Graphs never replace server authorization; a hidden panel does not protect its data.",
      faq: [
        {
          q: "Do I need to write JavaScript?",
          a: "No. Every flow is built from nodes, and the runtime interprets them instead of executing code.",
        },
        {
          q: "Can state survive a reload?",
          a: "Turn on Keep for a variable to store it in the visitor's browser for that page.",
        },
        {
          q: "Is morph a video effect?",
          a: "No. It is a layout transition between two layers; use the Motion Editor for keyframes.",
        },
      ],
    },
    {
      slug: "motion-editor",
      name: "Motion Editor",
      eyebrow: "Motion",
      title: "Keyframes with",
      accent: "/real freedom",
      lede: "Animate any property on a timeline, shape every interval with curves or springs, split text into letters, and start from 34 effects you can edit.",
      docs: "/docs/motion-editor",
      windowTitle: "Motion · heading entrance",
      caption:
        "Each property has its own lane; curves control the interval to the next key.",
      steps: [
        {
          title: "Select a layer",
          text: "Open Motion in the editor rail and pick a layer whose layout already works.",
        },
        {
          title: "Set keys",
          text: "Start the stopwatch, move the playhead, change the value; a key is added.",
        },
        {
          title: "Shape the curve",
          text: "Pick a preset ease, drag bezier handles or switch to a spring.",
        },
        {
          title: "Choose a trigger",
          text: "Play on load or when scrolled into view, once, looping or ping-pong.",
        },
      ],
      capabilities: [
        {
          label: "Props",
          title: "Seven property groups",
          text: "Transform, 3D and skew, appearance, shadow, filters, mask and text.",
        },
        {
          label: "Ease",
          title: "Curves and springs",
          text: "Bezier handles, preset eases, hold keys, or spring stiffness and damping.",
        },
        {
          label: "Text",
          title: "Split and stagger",
          text: "Animate letters or words forward, backward, from the centre or randomly.",
        },
        {
          label: "Noise",
          title: "Wiggle",
          text: "Smooth random variation with amount and speed, layered on any track.",
        },
        {
          label: "FX",
          title: "Editable effects",
          text: "Entrances, text reveals, attention, loops and exits become normal keyframes.",
        },
        {
          label: "Web",
          title: "CSS on the site",
          text: "Published motion is CSS; reduced motion leaves content readable at rest.",
        },
      ],
      limits: [
        { value: "34", label: "effect presets" },
        { value: "120", label: "keys per property" },
        { value: "60 s", label: "maximum time" },
        { value: "40", label: "named animations" },
      ],
      limitsNote:
        "The timeline previews page motion; it does not export a rendered video.",
      faq: [
        {
          q: "Is it the same as an entrance preset?",
          a: "Keyframes replace a layer's preset entrance; enabling them converts the entrance into editable tracks.",
        },
        {
          q: "What happens with reduced motion?",
          a: "Visitors who prefer reduced motion see the layer in its readable resting state.",
        },
        {
          q: "Can Actions trigger an animation?",
          a: "Yes. Named animations from the Motion panel can be played from the action graph.",
        },
      ],
    },
  ],
};

const tr: { ui: FeaturesUi; features: FeatureCopy[] } = {
  ui: {
    indexEyebrow: "Özellikler",
    indexTitle: "Bir sayfanın ihtiyacı olan her şey,",
    indexAccent: "/tek stüdyoda",
    indexLede:
      "Düzen, veri, davranış ve hareket aynı tuvalde düzenlenir ve uygulamanızın işlediği tek, sade bir belge olarak kaydedilir.",
    featuredLabel: "Yakından",
    moreLabel: "Stüdyonun geri kalanı",
    more: [
      {
        label: "Stüdyo",
        text: "Katmanlar, denetçi, varlıklar ve sonsuz tuval.",
        href: "/docs/studio",
      },
      {
        label: "Bileşenler ve düzenler",
        text: "Ortak master'lar, instance'lar ve sayfa yuvaları.",
        href: "/docs/components-layouts",
      },
      {
        label: "Duyarlı tasarım",
        text: "Kırılma noktaları, çizim alanları ve genişliğe özel ayarlar.",
        href: "/docs/responsive-design",
      },
      {
        label: "Formlar",
        text: "Kendi uç noktalarınıza gönderilen yerel alanlar.",
        href: "/docs/forms",
      },
      {
        label: "Luma AI",
        text: "Değişikliği anlatın, inceleyin, beğendiğinizi tutun.",
        href: "/docs/ai-mcp",
      },
      {
        label: "CLI ve MCP",
        text: "Betiklerin ve ajanların güvenle düzenleyebildiği sayfalar.",
        href: "/docs/cli",
      },
      {
        label: "Sürümler",
        text: "Taslaklar, önizlemeler ve geri yüklenebilir geçmiş.",
        href: "/docs/revisions",
      },
      {
        label: "Çeviriler",
        text: "Uygulamanıza ait metinler her dilde.",
        href: "/docs/translations",
      },
    ],
    breadcrumb: "Özellikler",
    readDocs: "Dokümanı okuyun",
    getStarted: "Başlayın",
    stepsTitle: "Nasıl çalışır",
    capabilitiesTitle: "Neler yapabilirsiniz",
    limitsTitle: "Yerleşik sınırlar",
    faqTitle: "Sorular",
    next: "Sonraki özellik",
    ctaTitle: "Kendi uygulamanızda deneyin",
    ctaText: "Paketi kurun ve stüdyoyu korumalı bir rotada açın.",
    explore: "İnceleyin",
  },
  features: [
    {
      slug: "data",
      name: "Veri",
      eyebrow: "Dinamik veri",
      title: "Sayfaları bağlayın:",
      accent: "/kendi API'nize",
      lede: "Request ve Repeat blokları uç noktalarınızdan gelen JSON'u listelere, detay sayfalarına ve rotaya bağlı içeriğe dönüştürür; HTML gönderilmeden önce sunucuda çözülür.",
      docs: "/docs/data-binding",
      windowTitle: "Repeat · yazılar",
      caption:
        "Repeat bloğu, istekten dönen her öğe için tasarlanmış bir satır üretir.",
      steps: [
        {
          title: "Kaynak ekleyin",
          text: "Request veya Repeat bloğunu bir JSON uç noktasına bağlayın, yöntemi seçin.",
        },
        {
          title: "Listeyi seçin",
          text: "İsteği bir kez gönderin, tekrarlanacak diziyi seçin; örneğin $.items.",
        },
        {
          title: "Alanları bağlayın",
          text: "Metni, görselleri, bağlantıları ve görünürlüğü satırın alanlarına bağlayın.",
        },
        {
          title: "Yayımlayın",
          text: "Yayındaki istekler sunucuda çözülür; içerik dönen HTML'de yer alır.",
        },
      ],
      capabilities: [
        {
          label: "Rota",
          title: "Rota ve sorgu token'ları",
          text: "{{params.slug}} ve {{query.q}} değerlerini URL, başlık ve gövdede kullanın.",
        },
        {
          label: "Biçim",
          title: "Tarih, sayı, para birimi",
          text: "Biçimler dil ve saat dilimini saklar; her ziyaretçi aynı metni okur.",
        },
        {
          label: "Pipe",
          title: "Güvenli ifadeler",
          text: "Pipe'lar ve JavaScript benzeri ifadeler yorumlanır, asla çalıştırılmaz.",
        },
        {
          label: "Yöntem",
          title: "GET'ten DELETE'e",
          text: "Sorgu çiftleri, başlıklar ve gövdeyle GET, POST, PUT, PATCH ve DELETE.",
        },
        {
          label: "404",
          title: "Eksik kayıtlar",
          text: "Kaynaktaki 404, isterseniz tüm rotayı 404 yanıtına çevirir.",
        },
        {
          label: "SEO",
          title: "Dizinlenebilir çıktı",
          text: "Sunucuda çözülen içerik, arama motorlarının okuduğu HTML'de bulunur.",
        },
      ],
      limits: [
        { value: "200", label: "satır / kaynak" },
        { value: "8 sn", label: "istek zaman aşımı" },
        { value: "3", label: "yönlendirme" },
        { value: "2 MB", label: "varsayılan yanıt sınırı" },
      ],
      limitsNote: "Özel ağdaki sunucular, operatör izin vermedikçe reddedilir.",
      faq: [
        {
          q: "Geliştirirken yerel API'mi çağırabilir miyim?",
          a: "Evet. Sunucuda PAGIERA_ALLOW_PRIVATE_HOSTS değerini (örneğin localhost,127.0.0.1) ayarlayıp yeniden başlatın.",
        },
        {
          q: "API anahtarları nereye konmalı?",
          a: "Sayfaya değil. Kaynak URL'leri ve başlıklar editörlere görünür; gizli bilgileri uygulamanıza ait bir proxy'nin arkasına koyun.",
        },
        {
          q: "JavaScript olmadan çalışır mı?",
          a: "Yayındaki istekler sunucuda çözüldüğü için içerik HTML ile birlikte gelir.",
        },
      ],
    },
    {
      slug: "action-workflow",
      name: "Aksiyon akışı",
      eyebrow: "Davranış",
      title: "Etkileşimler,",
      accent: "/kod yazmadan",
      lede: "Panelleri açmak, değişken ayarlamak, sayfa değiştirmek veya bir katmanı diğerine dönüştürmek için olayları, dalları ve aksiyonları bir düğüm grafiğinde bağlayın.",
      docs: "/docs/action-workflow",
      windowTitle: "Aksiyonlar · paneli aç/kapat",
      caption:
        "Tıklama, panelin görünürlüğüne göre dallanır; paneli gösterir ya da gizler.",
      steps: [
        {
          title: "Olayı seçin",
          text: "Sayfa yüklenmesi, tıklama, üzerine gelme, görünür olma, girdi değişimi veya zamanlayıcı.",
        },
        {
          title: "Akışı kurun",
          text: "Dal, sıra, gecikme veya tek seferlik; veri bağlantıları koşulları besler.",
        },
        {
          title: "Aksiyonu seçin",
          text: "Göster, gizle, aç/kapat, git, değişken ayarla, kopyala, canlandır veya dönüştür.",
        },
        {
          title: "Önizleyin",
          text: "Korumalı sayfa önizlemesinde deneyin, sonra kaydedip yayımlayın.",
        },
      ],
      capabilities: [
        {
          label: "Kapsam",
          title: "Katmana özel grafikler",
          text: "Bir katmana Alt + çift tıklayınca yalnızca onun aksiyonları bölünmüş görünümde açılır.",
        },
        {
          label: "Durum",
          title: "Değişkenler",
          text: "Adlandırılmış değişkenler; isterseniz ziyaretçinin tarayıcısında saklanır.",
        },
        {
          label: "Morph",
          title: "Katmana dönüştür",
          text: "Bir katmanı diğerine dönüştürün; çevredeki içerik yumuşakça yeniden boyutlanır.",
        },
        {
          label: "Hareket",
          title: "Adlandırılmış animasyonlar",
          text: "Göster, gizle ve aç/kapat özel animasyonları ileri veya geri oynatır.",
        },
        {
          label: "Güvenlik",
          title: "Sınırlı çalışma zamanı",
          text: "Her akışı küçük bir yorumlayıcı çalıştırır; ziyaretçiye keyfi JavaScript ulaşmaz.",
        },
        {
          label: "Bağlantı",
          title: "Güvenli yönlendirme",
          text: "HTTP(S), site yolları, fragment, e-posta ve telefon bağlantıları kabul edilir.",
        },
      ],
      limits: [
        { value: "300", label: "düğüm / grafik" },
        { value: "600", label: "bağlantı / grafik" },
        { value: "50", label: "değişken" },
        { value: "2.000", label: "adım / çalıştırma" },
      ],
      limitsNote:
        "Grafikler sunucu yetkilendirmesinin yerini tutmaz; gizli bir panel verisini korumaz.",
      faq: [
        {
          q: "JavaScript yazmam gerekir mi?",
          a: "Hayır. Her akış düğümlerden kurulur; çalışma zamanı kod çalıştırmak yerine onları yorumlar.",
        },
        {
          q: "Durum yeniden yüklemede korunur mu?",
          a: "Değişken için Keep'i açın; değer o sayfa için ziyaretçinin tarayıcısında saklanır.",
        },
        {
          q: "Morph bir video efekti mi?",
          a: "Hayır. İki katman arasında bir düzen geçişidir; keyframe için Motion editörünü kullanın.",
        },
      ],
    },
    {
      slug: "motion-editor",
      name: "Motion editörü",
      eyebrow: "Hareket",
      title: "Keyframe'ler,",
      accent: "/gerçek özgürlükle",
      lede: "Her özelliği zaman çizelgesinde canlandırın, her aralığı eğri veya yayla şekillendirin, metni harflere bölün ve düzenlenebilir 34 efektle başlayın.",
      docs: "/docs/motion-editor",
      windowTitle: "Motion · başlık girişi",
      caption:
        "Her özelliğin kendi şeridi var; eğri, bir sonraki keyframe'e kadarki aralığı yönetir.",
      steps: [
        {
          title: "Katman seçin",
          text: "Editör rayından Motion'ı açın, düzeni hazır olan bir katman seçin.",
        },
        {
          title: "Keyframe koyun",
          text: "Kronometreyi başlatın, oynatma kafasını taşıyın, değeri değiştirin.",
        },
        {
          title: "Eğriyi şekillendirin",
          text: "Hazır bir yumuşatma seçin, bezier tutamaçlarını sürükleyin veya yaya geçin.",
        },
        {
          title: "Tetikleyiciyi seçin",
          text: "Yüklenince veya görününce; bir kez, döngüde ya da ileri-geri.",
        },
      ],
      capabilities: [
        {
          label: "Özellik",
          title: "Yedi özellik grubu",
          text: "Dönüşüm, 3B ve eğme, görünüm, gölge, filtreler, maske ve metin.",
        },
        {
          label: "Eğri",
          title: "Eğriler ve yaylar",
          text: "Bezier tutamaçları, hazır eğriler, bekletme veya yay sertliği ve sönümü.",
        },
        {
          label: "Metin",
          title: "Bölme ve kademelendirme",
          text: "Harfleri veya kelimeleri ileri, geri, ortadan ya da rastgele canlandırın.",
        },
        {
          label: "Gürültü",
          title: "Wiggle",
          text: "Miktar ve hızla yumuşak rastgele salınım; her şeride eklenebilir.",
        },
        {
          label: "Efekt",
          title: "Düzenlenebilir efektler",
          text: "Girişler, metin efektleri, dikkat, döngü ve çıkışlar sıradan keyframe'e dönüşür.",
        },
        {
          label: "Web",
          title: "Sitede CSS",
          text: "Yayındaki hareket CSS'tir; azaltılmış harekette içerik okunur hâlde kalır.",
        },
      ],
      limits: [
        { value: "34", label: "efekt" },
        { value: "120", label: "keyframe / özellik" },
        { value: "60 sn", label: "en uzun süre" },
        { value: "40", label: "adlandırılmış animasyon" },
      ],
      limitsNote:
        "Zaman çizelgesi sayfa hareketini önizler; video dışa aktarmaz.",
      faq: [
        {
          q: "Giriş hazır ayarıyla aynı mı?",
          a: "Keyframe'ler katmanın hazır girişinin yerini alır; açtığınızda giriş düzenlenebilir şeritlere dönüşür.",
        },
        {
          q: "Azaltılmış hareket tercih edilirse ne olur?",
          a: "Bu ziyaretçiler katmanı okunur, dinlenme hâlinde görür.",
        },
        {
          q: "Aksiyonlar bir animasyonu tetikleyebilir mi?",
          a: "Evet. Motion panelindeki adlandırılmış animasyonlar aksiyon grafiğinden oynatılabilir.",
        },
      ],
    },
  ],
};

export const FEATURES: Record<
  Locale,
  { ui: FeaturesUi; features: FeatureCopy[] }
> = { en, tr };
