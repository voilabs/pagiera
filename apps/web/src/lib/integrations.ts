import type { Locale, StackName } from "./landing-copy";

type Copy = { en: string; tr: string };
export const INTEGRATION_CATEGORIES = [
  { id: "framework", en: "Frameworks", tr: "Uygulama" },
  { id: "data", en: "Data & services", tr: "Veri ve servisler" },
  { id: "ai", en: "AI & agents", tr: "Yapay zekâ ve ajanlar" },
  { id: "access", en: "Access", tr: "Erişim" },
] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number]["id"];
type Integration = {
  id: string;
  name: string;
  brand?: StackName;
  mark?: string;
  category: IntegrationCategory;
  mode: "required" | "optional" | "host";
  summary: Copy;
  steps: Copy[];
  docs: string;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: "nextjs",
    name: "Next.js",
    brand: "Next.js",
    category: "framework",
    mode: "host",
    summary: {
      en: "Mount the complete studio and backend inside your App Router application.",
      tr: "Stüdyoyu ve sunucuyu App Router uygulamanızın içine bağlayın.",
    },
    steps: [
      {
        en: "Install pagiera and import pagiera/full.css.",
        tr: "pagiera paketini kurun ve pagiera/full.css dosyasını içe aktarın.",
      },
      {
        en: "Protect the Node.js API route with your application's session check.",
        tr: "Node.js API rotasını uygulamanızın oturum kontrolüyle koruyun.",
      },
      {
        en: "Load the server bootstrap, mount the studio and verify save after reload.",
        tr: "Sunucudan başlangıç verisini yükleyin, stüdyoyu bağlayın ve kaydı sayfayı yenileyerek doğrulayın.",
      },
    ],
    docs: "/docs/nextjs-setup",
  },
  {
    id: "react",
    name: "React",
    brand: "React",
    category: "framework",
    mode: "host",
    summary: {
      en: "Render native page documents with your host's resolved data and route context.",
      tr: "Sayfa belgelerini uygulamanızın çözdüğü veri ve rota bağlamıyla render edin.",
    },
    steps: [
      {
        en: "Load a published document through your protected server integration.",
        tr: "Yayımlanmış belgeyi korumalı sunucu entegrasyonunuzla yükleyin.",
      },
      {
        en: "Pass document, page styles, data and route context to the renderer.",
        tr: "Belgeyi, sayfa stillerini, veriyi ve rota bağlamını render bileşenine aktarın.",
      },
      {
        en: "Verify the returned HTML; a standalone React app still needs a backend adapter.",
        tr: "Dönen HTML'i kontrol edin; bağımsız bir React uygulaması yine sunucu adaptörü gerektirir.",
      },
    ],
    docs: "/docs/publishing",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    brand: "PostgreSQL",
    category: "data",
    mode: "required",
    summary: {
      en: "Keep pages, drafts, revisions and uploaded assets in your own database.",
      tr: "Sayfaları, taslakları, revizyonları ve yüklenen varlıkları kendi veritabanınızda tutun.",
    },
    steps: [
      {
        en: "Provision a development database with schema initialization permissions.",
        tr: "Şema oluşturma izinleri olan bir geliştirme veritabanı hazırlayın.",
      },
      {
        en: "Set PAGIERA_POSTGRES_URL on the server and check the protected health endpoint.",
        tr: "Sunucuda PAGIERA_POSTGRES_URL tanımlayın ve korumalı sağlık uç noktasını kontrol edin.",
      },
      {
        en: "Save and reload a page; test backups before moving to production.",
        tr: "Bir sayfayı kaydedip yeniden açın; canlıya geçmeden yedekleri test edin.",
      },
    ],
    docs: "/docs/deployment#data-and-cache-lifecycle",
  },
  {
    id: "redis",
    name: "Redis",
    brand: "Redis",
    category: "data",
    mode: "required",
    summary: {
      en: "Cache published pages and template bundles, and enforce AI request limits.",
      tr: "Yayımlanan sayfa ve şablonları önbelleğe alın, yapay zekâ istek sınırlarını uygulayın.",
    },
    steps: [
      {
        en: "Provision a private Redis service reachable by your application server.",
        tr: "Uygulama sunucunuzun erişebildiği özel bir Redis servisi hazırlayın.",
      },
      {
        en: "Set PAGIERA_REDIS_URL as a server-only environment variable.",
        tr: "PAGIERA_REDIS_URL değerini yalnızca sunucuda tanımlayın.",
      },
      {
        en: "Check health and publish a test page. Redis is a cache, not a database backup.",
        tr: "Sağlık kontrolünü ve test sayfasının yayımını doğrulayın. Redis veritabanı yedeği değildir.",
      },
    ],
    docs: "/docs/getting-started#configure-the-services",
  },
  {
    id: "json-api",
    name: "JSON API",
    mark: "{ }",
    category: "data",
    mode: "host",
    summary: {
      en: "Bring your CMS or application data into Request and Repeat blocks through JSON endpoints.",
      tr: "CMS veya uygulama verilerinizi JSON uç noktalarıyla Request ve Repeat bloklarına taşıyın.",
    },
    steps: [
      {
        en: "Add an approved JSON endpoint as a data source and inspect its response.",
        tr: "İzin verilen bir JSON uç noktasını veri kaynağı olarak ekleyip yanıtını inceleyin.",
      },
      {
        en: "Select the array path, such as $.items, and bind fields inside Repeat.",
        tr: "$.items gibi bir liste yolu seçin ve Repeat içindeki alanları bağlayın.",
      },
      {
        en: "Use a host-owned proxy for secrets; test empty, error and not-found responses.",
        tr: "Gizli anahtarlar için uygulamanıza ait bir proxy kullanın; boş, hatalı ve bulunamayan yanıtları test edin.",
      },
    ],
    docs: "/docs/data-binding",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    brand: "OpenRouter",
    category: "ai",
    mode: "optional",
    summary: {
      en: "Enable Luma's AI generation with a server-side provider key and a model you choose.",
      tr: "Sunucudaki sağlayıcı anahtarı ve seçtiğiniz modelle Luma'nın yapay zekâ üretimini açın.",
    },
    steps: [
      {
        en: "Set OPENROUTER_API_KEY and OPENROUTER_MODEL on the server.",
        tr: "Sunucuda OPENROUTER_API_KEY ve OPENROUTER_MODEL tanımlayın.",
      },
      {
        en: "Verify model access, provider billing and Redis rate limiting.",
        tr: "Model erişimini, sağlayıcı ücretlendirmesini ve Redis istek sınırını kontrol edin.",
      },
      {
        en: "Generate in a limited scope, inspect the layers and preview before publishing.",
        tr: "Sınırlı bir kapsamda üretin, katmanları inceleyin ve yayımlamadan önce önizleyin.",
      },
    ],
    docs: "/docs/ai-mcp#ai-generation-workflow",
  },
  {
    id: "mcp",
    name: "MCP",
    brand: "MCP",
    category: "ai",
    mode: "optional",
    summary: {
      en: "Discover tools from operator-configured MCP servers through authorized list and inspect operations.",
      tr: "İşletici tarafından yapılandırılan MCP sunucularındaki araçları yetkili listeleme ve inceleme işlemleriyle keşfedin.",
    },
    steps: [
      {
        en: "Register approved stdio, HTTP or SSE servers in mcpServers.",
        tr: "Onaylı stdio, HTTP veya SSE sunucularını mcpServers içinde tanımlayın.",
      },
      {
        en: "Implement authorizeMcp; discovery is denied without this check.",
        tr: "authorizeMcp kontrolünü uygulayın; bu kontrol olmadan keşif engellenir.",
      },
      {
        en: "Verify list and inspect access. Discovery does not automatically execute tools.",
        tr: "Listeleme ve inceleme erişimini doğrulayın. Keşif, araçları otomatik çalıştırmaz.",
      },
    ],
    docs: "/docs/ai-mcp#mcp-discovery",
  },
  {
    id: "authentication",
    name: "Authentication",
    mark: "↳",
    category: "access",
    mode: "host",
    summary: {
      en: "Keep your current identity provider and enforce editor permissions in your application.",
      tr: "Mevcut kimlik sağlayıcınızı koruyun ve editör izinlerini kendi uygulamanızda yönetin.",
    },
    steps: [
      {
        en: "Implement a host session helper that checks editor permissions.",
        tr: "Editör yetkisini kontrol eden bir oturum yardımcısı uygulayın.",
      },
      {
        en: "Guard studio routes, preview routes and every API mutation.",
        tr: "Stüdyo, önizleme ve tüm API değişiklik rotalarını koruyun.",
      },
      {
        en: "Sign out and verify access is rejected. There is no bundled identity provider.",
        tr: "Çıkış yapıp erişimin reddedildiğini doğrulayın. Pakete gömülü bir kimlik sağlayıcı yoktur.",
      },
    ],
    docs: "/docs/security",
  },
];

export const INTEGRATIONS_UI = {
  en: {
    title: "Your tools.",
    accent: "One workspace.",
    eyebrow: "Integrations",
    lede: "Connect the application you already own. Keep your data, choose your AI tools and bring your own access rules.",
    search: "Search integrations",
    placeholder: "Framework, database, AI…",
    all: "All integrations",
    results: "integrations",
    empty: "No integrations match your search.",
    reset: "Clear filters",
    setup: "Setup steps",
    guide: "Read the guide",
    required: "Required service",
    optional: "Optional",
    host: "Host integration",
    flowTitle: "Built into your application",
    flowText:
      "Your framework hosts the studio. Your services store the work. Your APIs supply the content.",
    flowHost: "Your application",
    flowStudio: "Visual studio + runtime",
    flowData: "Database · Cache · JSON APIs",
    note: "Framework and service connections are configured in your application. JSON APIs use the data-source interface; this catalog does not install third-party plugins.",
    start: "Start with the integration guide",
  },
  tr: {
    title: "Sizin araçlarınız.",
    accent: "Tek çalışma alanı.",
    eyebrow: "Entegrasyonlar",
    lede: "Zaten sahip olduğunuz uygulamaya bağlayın. Veriniz sizde kalsın; yapay zekâ araçlarını ve erişim kurallarını siz seçin.",
    search: "Entegrasyon ara",
    placeholder: "Uygulama, veritabanı, yapay zekâ…",
    all: "Tüm entegrasyonlar",
    results: "entegrasyon",
    empty: "Aramanıza uygun entegrasyon bulunamadı.",
    reset: "Filtreleri temizle",
    setup: "Kurulum adımları",
    guide: "Rehberi oku",
    required: "Gerekli servis",
    optional: "İsteğe bağlı",
    host: "Uygulama entegrasyonu",
    flowTitle: "Uygulamanızın içinde çalışır",
    flowText:
      "Uygulamanız stüdyoyu sunar. Servisleriniz çalışmayı saklar. API'leriniz içeriği sağlar.",
    flowHost: "Sizin uygulamanız",
    flowStudio: "Görsel stüdyo + runtime",
    flowData: "Veritabanı · Önbellek · JSON API'ler",
    note: "Uygulama ve servis bağlantıları kendi uygulamanızda yapılandırılır. JSON API'ler veri kaynağı arayüzünü kullanır; bu katalog üçüncü taraf eklenti yüklemez.",
    start: "Entegrasyon rehberiyle başlayın",
  },
} satisfies Record<Locale, Record<string, string>>;
