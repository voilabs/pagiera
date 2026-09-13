import type { Guide } from "./guides";

export const GUIDES_TR: Guide[] = [
  {
    slug: "add-a-visual-editor-to-nextjs",
    navLabel: "Next.js kurulumu",
    category: "Entegrasyon",
    title: "Bir Next.js uygulamasına görsel sayfa editörü ekleyin",
    question: "Bir Next.js uygulamasına görsel sayfa editörü nasıl eklenir?",
    answer: "pagiera paketini yükleyin, PostgreSQL ve Redis'e bağlayın, tüm yolları yakalayan API rotasını /api/pagiera altına ekleyin, editörün başlangıç verilerini sunucuda yükleyin ve stüdyoyu kendi kimlik doğrulamanızın arkasında işleyin. Editör, ayrı bir barındırılan hesap yerine uygulamanızın içinde çalışır; dolayısıyla ürettiği sayfalar kendi Next.js sunucunuz tarafından işlenir.",
    description: "Pagiera'yı bir Next.js App Router projesine kurun: ortam değişkenleri, tüm yolları yakalayan arka uç rotası, sunucuda başlangıç verilerinin yüklenmesi ve stüdyonun kendi kimlik doğrulamanızın arkasına yerleştirilmesi.",
    updated: "2026-09-12", minutes: 6,
    takeaways: [
      "Pagiera, barındırılan bir editör hesabı değil, bir npm paketidir; kendi Next.js uygulamanızın içinde çalışır.",
      "PostgreSQL belgeleri ve revizyonları saklar; Redis yayımlanan sayfaları, şablon paketlerini ve yapay zekâ hız sınırlarını önbelleğe alır.",
      "/api/pagiera/[...path] konumundaki tek bir tüm yolları yakalayan rota işleyicisi, editörün arka ucunun tamamına hizmet verir.",
      "Editör rotasını korumak size aittir: Pagiera bir kimlik doğrulama katmanı sunmaz.",
    ],
    steps: [
      { title: "Paketi yükleyin", body: "Pagiera; editörü, çalışma zamanını ve sunucu işleyicilerini tek pakette sunar. Tam yığın entegrasyonu için Node.js 20+, React 18.3+ ve Next.js App Router gereklidir.", blocks: [{ type: "code", lang: "bash", source: "bun add pagiera" }] },
      {
        title: "Hizmetleri yapılandırın", body: "PostgreSQL ve Redis bağlantıları içeren bir .env.local dosyası oluşturun. OpenRouter anahtarı yalnızca yapay zekâ ile üretim istiyorsanız gereklidir; diğer her şey bu anahtar olmadan çalışır.",
        blocks: [
          { type: "code", lang: "env", source: `PAGIERA_POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/pagiera
PAGIERA_REDIS_URL=redis://localhost:6379
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5` },
          { type: "note", body: "Pagiera, sunucu ilk kez başlatıldığında ihtiyaç duyduğu PostgreSQL tablolarını oluşturur. Ayrı bir veritabanı geçiş adımı çalıştırmanız gerekmez." },
        ],
      },
      {
        title: "Arka ucu ekleyin", body: "Tüm yolları yakalayan tek bir rota işleyicisi, editörün tüm uç noktalarını sunar. Döndürdüğü HTTP yöntemlerini dışa aktarın; geri kalan yönlendirmeyi Next.js yapar.",
        blocks: [
          { type: "code", lang: "ts", source: `// src/app/api/pagiera/[...path]/route.ts
import {
  createPagieraRouteHandlers,
  pagieraConfigFromEnv,
} from "pagiera/server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const handlers = createPagieraRouteHandlers(pagieraConfigFromEnv());
export const { GET, POST, PUT, PATCH, DELETE } = handlers;` },
          { type: "text", body: "Uygulamayı başlattıktan sonra /api/pagiera/health adresini açın. PostgreSQL, Redis ve yapılandırılmış OpenRouter modelinin erişilebilir olup olmadığını bildirir; böylece sessiz bir yapılandırma hatasını okunabilir bir yanıta dönüştürür." },
        ],
      },
      {
        title: "Editör verilerini sunucuda yükleyin", body: "İlk belge sunucuda işlenir; böylece stüdyo bir yüklenme durumu yerine içerikle açılır.",
        blocks: [{ type: "code", lang: "ts", source: `// src/lib/editor-bootstrap.ts
import {
  getPagieraServer,
  pagieraConfigFromEnv,
} from "pagiera/server";

export async function editorBootstrap(pageId?: string) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const bootstrap = await server.getEditorBootstrap(pageId);

  if (!bootstrap) throw new Error("Editor page not found");
  return bootstrap;
}` }],
      },
      {
        title: "Stüdyoyu kendi kimlik doğrulamanızın arkasına yerleştirin", body: "Stüdyoyu yalnızca ekibinizin erişebildiği bir rotada işleyin. Pagiera bilinçli olarak bir kimlik doğrulama katmanı sunmaz; editör rotası ve API rotası, uygulamanızın zaten uyguladığı kuralları devralır.",
        blocks: [{ type: "list", items: [
          "Hem editör sayfasını hem de /api/pagiera yolunu aynı denetimle koruyun.",
          "Editör stil dosyasını kendi CSS'inizden önce içe aktarın: @import kuralları diğer kurallardan önce gelmelidir.",
          "next/font ailelerinin Tipografi panelinde görünmesi için yazı tipi sağlayıcısını ekleyin.",
        ] }],
      },
    ],
    sections: [{ heading: "Her hizmetin sorumluluğu", blocks: [{ type: "table", head: ["Hizmet", "Sakladıkları"], rows: [
      ["PostgreSQL", "Sayfa belgeleri, taslaklar ve yayımlanmış revizyonlar; kalıcı temel veri kaynağı."],
      ["Redis", "Yayımlanan sayfa önbelleği, şablon paketi önbelleği ve yapay zekâ istek hızı sınırlaması."],
      ["OpenRouter", "İsteğe bağlıdır. Yalnızca yapay zekâ panelinden bir değişiklik önermesini istediğinizde kullanılır."],
    ] }] }],
    faq: [
      { question: "Pagiera barındırılan bir hesap gerektirir mi?", answer: "Hayır. Pagiera, MIT lisanslı bir npm paketi olarak dağıtılır. Kendi uygulamanıza kurar ve kendi altyapınızda çalıştırırsınız; kaydolmanız gereken ayrı bir web sitesi hesabı yoktur." },
      { question: "Pagiera'yı Redis olmadan çalıştırabilir miyim?", answer: "Yayımlanan sayfa önbelleği, şablon paketi önbelleği ve yapay zekâ istek hızı sınırlaması Redis'e bağlı olduğundan Redis bir gereksinim olarak listelenir. Kısıtlı işlevlerle çalışma modu bulunduğunu varsaymadan önce kurduğunuz sürümü kontrol edin." },
      { question: "Pagiera editör için oturum açmayı yönetir mi?", answer: "Hayır. Pagiera bir kimlik doğrulama katmanı sunmaz. Editör rotasını ve API rotasını uygulamanızın içine ekler ve zaten kullandığınız kimlik doğrulamayla korursunuz." },
    ],
    related: ["use-pagiera-as-a-cms", "bind-api-data-to-a-page"],
  },
  {
    slug: "bind-api-data-to-a-page", navLabel: "API verisi bağlama", category: "Veri",
    title: "API verilerini görsel olarak tasarlanmış bir sayfaya bağlayın",
    question: "Pagiera'da canlı API verileri bir sayfaya nasıl bağlanır?",
    answer: "Tek bir nesne getirmek için Request bloğu veya bir dizi üzerinde yinelemek için Repeat bloğu ekleyin; ardından {{params.x}} ve {{query.x}} yer tutucularını kullanarak URL, üst bilgiler veya gövde içinde rota parametrelerine ve sorgu alanlarına başvurun. Yayımlanan sayfalarda her ikisi de HTML döndürülmeden önce sunucuda çözümlenir; böylece API destekli içerik sonradan doldurulmak yerine ilk yanıtta bulunur.",
    description: "Rota parametreleri, sorgu alanları ve sunucu tarafında çözümleme ile GET, POST, PUT, PATCH ve DELETE veri kaynaklarını bir Pagiera sayfasına bağlamak için Request ve Repeat bloklarını kullanın.",
    updated: "2026-09-12", minutes: 5,
    takeaways: [
      "Request blokları döndürülen tek bir nesneyi alt öğelerine sunar; Repeat blokları bir dizi sonucu üzerinde yinelenir.",
      "{{params.slug}} ve {{query.q}} gibi yer tutucular URL'lerde, üst bilgilerde, sorgu alanlarında ve gövdelerde çalışır.",
      "Yayımlanan sayfalar her iki blok türünü sunucuda çözümler; bu nedenle veriler tarayıcı botlarının aldığı HTML'de bulunur.",
      "Kaynak page-404 davranışını kullandığında, üst API'den gelen bir 404 tüm rotayı 404'e dönüştürebilir.",
    ],
    sections: [
      { heading: "Sayfaya dinamik bir slug verin", blocks: [
        { type: "text", body: "Bir sayfa slug'ı adlandırılmış parametreler taşıyabilir. Eşleşen değerler, sayfa işlenirken sunucu bağlamına aktarılır." },
        { type: "code", lang: "text", source: "blog/:slug" },
        { type: "text", body: "/blog/1 adresine yapılan bir istek için sunucuya aktarılan bağlam şöyle görünür:" },
        { type: "code", lang: "ts", source: `{
  params: { slug: "1" },
  query: { preview: "true" }
}` },
      ] },
      { heading: "Veri kaynağından bağlama başvurun", blocks: [
        { type: "text", body: "İstek URL'leri, üst bilgileri, sorgu alanları ve gövdeleri, çift süslü parantezli yer tutucularla bağlam değerlerine başvurabilir." },
        { type: "code", lang: "text", source: `https://dummyjson.com/posts/{{params.slug}}
https://api.example.com/search?q={{query.q}}` },
      ] },
      { heading: "Request ile Repeat arasında seçim yapın", blocks: [
        { type: "table", head: ["Blok", "Ne zaman kullanılır?"], rows: [
          ["Request", "Uç nokta tek bir nesne döndürüyor ve alanlarını doğrudan öğelere bağlamak istiyorsanız."],
          ["Repeat", "Uç nokta bir dizi döndürüyor ve her öğeyi aynı tasarımla işlemek istiyorsanız."],
        ] },
        { type: "note", body: "Repeat yalnızca bir listedeki her öğeyi işlemek istediğinizde gereklidir. Tek bir kaydı bağlıyorsanız yalnızca bir Request bloğu yeterlidir." },
      ] },
      { heading: "Sunucu tarafında çözümleme neden önemlidir?", blocks: [
        { type: "text", body: "İstemci tarafında veri getirme, ilk yanıtı boş bırakır; görsel olarak oluşturulmuş birçok sayfayı tarayıcı botları ve yanıt motorları için görünmez kılan da budur. Pagiera, HTML döndürülmeden önce Request bloklarını tamamlar; böylece bir tarayıcı botunun okuduğu içerik, ziyaretçinin gördüğü içerikle aynıdır." },
      ] },
    ],
    faq: [
      { question: "Bir veri kaynağı hangi HTTP yöntemlerini kullanabilir?", answer: "GET, POST, PUT, PATCH ve DELETE veri kaynakları desteklenir; istek URL'leri, üst bilgileri, sorgu alanları ve gövdeleri rota parametrelerine ve sorgu değerlerine başvurabilir." },
      { question: "API verileri arama motorlarına görünür mü?", answer: "Yayımlanan sayfalarda evet. Request blokları sunucuda çözümlenir ve HTML döndürülmeden önce tamamlanır; bu nedenle API destekli içerik daha sonra tarayıcıda yüklenmek yerine ilk yanıtın bir parçasıdır." },
      { question: "Üst API 404 döndürdüğünde ne olur?", answer: "Veri kaynağı page-404 davranışını kullandığında, üst API'den gelen 404 boş bir düzen işlemek yerine rotanın tamamını bir 404 sayfasına dönüştürür." },
    ],
    related: ["add-a-visual-editor-to-nextjs", "preview-and-publish-pages"],
  },
  {
    slug: "preview-and-publish-pages", navLabel: "Önizleme ve yayınlama", category: "İş akışı",
    title: "Bir taslağı önizleyin ve güvenle yayımlayın",
    question: "Pagiera'da bir sayfayı kaydetmek onu herkese açık hâle getirir mi?",
    answer: "Hayır. Kaydetmek yalnızca taslağı günceller. Taslağı bir önizleme rotasında önizlersiniz ve sayfa yalnızca yayımladığınızda herkese açık olur. home slug'ı / yoluna karşılık gelir. Yayınlama sayfa içeriğini günceller; ana uygulamanızı dağıtmaz veya bir alan adı yapılandırmaz.",
    description: "Pagiera'nın kaydetme, önizleme ve yayınlama iş akışını anlayın: her adımın neyi değiştirdiği, taslakların nerede tutulduğu ve yayınlamanın neleri yapıp yapmadığı.",
    updated: "2026-09-12", minutes: 4,
    takeaways: [
      "Kaydetme bir taslak yazar. Yayınlama ayrı ve bilinçli bir adımdır.",
      "Önizleme rotaları taslağı işler; böylece başkalarından önce kontrol edebilirsiniz.",
      "home sayfa slug'ı sitenin kök yoluna karşılık gelir.",
      "İçerik yayımlamak, uygulamanızı dağıtmakla aynı şey değildir.",
    ],
    steps: [
      { title: "Taslağı kaydedin", body: "Kaydetme, belge revizyonunu PostgreSQL'de saklar. Bu aşamada herkese açık sitede hiçbir şey değişmez; dolayısıyla tamamlanmamış bir düzen editörde gerektiği kadar kalabilir." },
      { title: "Önizleme rotasını açın", body: "Bir önizleme rotası, taslak belgeyi yayımlanan sayfanın kullandığı çalışma zamanıyla işler; böylece onayladığınız şey yayına çıkacak şeydir.", blocks: [
        { type: "code", lang: "tsx", source: `// src/app/preview/[pageId]/page.tsx
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import {
  getPagieraServer,
  pagieraConfigFromEnv,
} from "pagiera/server";` },
        { type: "note", body: "Önizleme rotaları yayımlanmamış çalışmaları gösterir. Onları editörü koruduğunuz şekilde koruyun." },
      ] },
      { title: "Yayımlayın", body: "Yayınlama, onaylanan taslağı herkese açık sayfaya dönüştürür ve Redis destekli yayın önbelleğini yeniler. Ardından herkese açık rota yeni revizyonu sunar." },
      { title: "Yayımlanan sayfayı işleyin", body: "Yayımlanan belgeler sunucuda yüklenir; böylece Request blokları HTML döndürülmeden önce tamamlanır.", blocks: [
        { type: "code", lang: "tsx", source: `const server = await getPagieraServer(pagieraConfigFromEnv());
const page = await server.getPublishedPage(slug, {
  query,
  params,
  page: { slug },
});

if (!page) notFound();` },
      ] },
    ],
    sections: [{ heading: "Yayınlamanın yapmadıkları", blocks: [{ type: "list", items: [
      "Ana uygulamanızı dağıtmaz; bunun sorumluluğu kendi dağıtım sürecinizde kalır.",
      "DNS'i veya bir alan adını yapılandırmaz.",
      "Kimlik doğrulamanızı veya altyapınızı değiştirmez.",
    ] }] }],
    faq: [
      { question: "Bir sayfayı kaydetmek onu herkese açık hâle getirir mi?", answer: "Hayır. Kaydetmek taslağı günceller. Taslağı önizler, ardından herkese açık sayfayı güncellemek için yayımlarsınız. home slug'ı / yoluna karşılık gelir." },
      { question: "Yayımlanan bir sayfayı önceki hâline döndürebilir miyim?", answer: "Pagiera sayfa belgelerini ve revizyonları PostgreSQL'de tutar ve editörde bir Geçmiş sekmesi sunar. Belirli bir geri alma akışına güvenmeden önce kurduğunuz sürümün davranışını kontrol edin." },
    ],
    related: ["add-a-visual-editor-to-nextjs", "use-pagiera-as-a-cms"],
  },
  {
    slug: "build-with-a-coding-agent", navLabel: "Kodlama ajanları", category: "Yapay zekâ",
    title: "Bir kodlama ajanıyla düzenlenebilir bir web sitesi oluşturun",
    question: "Bir yapay zekâ kodlama ajanı, sonradan görsel olarak düzenleyebileceğiniz bir web sitesi oluşturabilir mi?",
    answer: "Evet, ajan ayrı ve doğrudan kodlanmış bir sayfa yerine yerel Pagiera belge öğeleri oluşturursa. Paket tam da bunun için bir AGENTS.md entegrasyon kılavuzu sunar. Bu şekilde üretilen bir belge, diğer tüm sayfalar gibi kaydedilebilir, görsel editörde açılabilir, önizlenebilir ve yayımlanabilir; ajan işini bitirdikten sonra sonucun düzenlenebilir kalmasını sağlayan da budur.",
    description: "Bir kodlama ajanını doğrudan kodlanmış JSX yerine yerel bir Pagiera belgesi üretmeye yönlendirin; böylece oluşturduğu sayfa daha sonra görsel tuvalde düzenlenebilir kalır.",
    updated: "2026-09-12", minutes: 5,
    takeaways: [
      "Paket, kodlama ajanları için yazılmış bir AGENTS.md kılavuzu içerir.",
      "Yerel Pagiera belge öğeleri isteyin; doğrudan kodlanmış bir sayfa tuvalde düzenlenemez.",
      "Ajan çıktısı, elle tasarlanmış sayfalarla aynı kaydetme, önizleme ve yayınlama iş akışından geçer.",
      "Editör içindeki yapay zekâ önerileri uygulanmadan önce incelenir; hiçbir şey sessizce değişmez.",
    ],
    sections: [
      { heading: "Sonucu değiştiren talimat", blocks: [
        { type: "text", body: "Düzenlemeye devam edebileceğiniz bir sayfa ile yeniden oluşturmanız gereken bir sayfa arasındaki fark tek bir talimattır. Ajandan yerel Pagiera belge öğeleri oluşturmasını isteyin. Bunun yerine doğrudan kodlanmış işaretleme içeren bir React bileşeni yazarsa görsel tuvalin düzenleyeceği hiçbir şey kalmaz; tasarım, editörün yönetmediği kodda bulunur." },
        { type: "list", items: [
          "Ajanı, paketin AGENTS.md dosyasını görüntüleyen /docs/agents adresine yönlendirin.",
          "Hedefi belirtin: statik bir sayfa bileşeni değil, düzenlenebilir bir belge.",
          "Ajanın bir taslak kaydetmesine izin verin; ardından yayımlamadan önce bunu editörde inceleyin.",
        ] },
      ] },
      { heading: "Editör içindeki yapay zekâ düzenlemeleri nasıl farklılaşır?", blocks: [
        { type: "text", body: "Editörün içinde Luma, seçtiğiniz bir hedef üzerinde çalışır: bir katman seçin veya @ ile ona başvurun. Metin, stil, üzerine gelme ve öğe değişiklikleri önerir; eski ve yeni değerleri gösterir. Böylece değişikliği sonradan fark etmek yerine önceden onaylarsınız." },
        { type: "table", head: ["Adım", "Ne olur?"], rows: [
          ["Hedefle", "Bir katman seçer veya @ ile ona başvurursunuz."],
          ["Öner", "Değişiklik, önceki ve sonraki değerleriyle açıklanır."],
          ["Uygula", "Siz kabul edene kadar sayfada hiçbir şey değişmez."],
        ] },
        { type: "note", body: "Yapay zekâ ile üretim bir OpenRouter anahtarı gerektirir ve desteklenen işlemler kurduğunuz sürüme bağlıdır. Belirli bir kırılma noktasını hedefleyen istekler, desteklenen düzen güncellemeleriyle sınırlıdır." },
      ] },
    ],
    faq: [
      { question: "Bir yapay zekâ kodlama ajanı düzenlenebilir bir Pagiera web sitesi tasarlayabilir mi?", answer: "Evet. Paket, kodlama ajanları için bir AGENTS.md entegrasyon kılavuzu içerir. Ajanınızdan ayrı, doğrudan kodlanmış bir sayfa yerine yerel Pagiera belge öğeleri oluşturmasını isteyin. Oluşan belge kaydedilebilir, görsel editörde açılabilir, önizlenebilir ve yayımlanabilir." },
      { question: "Yapay zekâ düzenlemeleri otomatik olarak uygulanır mı?", answer: "Hayır. Desteklenen istekler, inceleyebilmeniz için eski ve yeni değerleriyle önerilir; siz değişikliği uygulayana kadar mevcut sayfa olduğu gibi kalır." },
      { question: "Yapay zekâ özellikleri için API anahtarı gerekir mi?", answer: "Yapay zekâ ile üretim bir OpenRouter anahtarı gerektirir. Editörün geri kalanı; tuval, bileşenler, düzenler, veri bağlama ve yayınlama bu anahtar olmadan çalışır." },
    ],
    related: ["add-a-visual-editor-to-nextjs", "reuse-layouts-and-components"],
  },
  {
    slug: "reuse-layouts-and-components", navLabel: "Düzenler ve bileşenler", category: "Tasarım sistemi",
    title: "Gezinmeyi, alt bilgileri ve düzenleri sayfalar arasında yeniden kullanın",
    question: "Gezinmeyi ve alt bilgileri her sayfada yeniden oluşturmaktan nasıl kaçınırsınız?",
    answer: "Ortak yapıyı bağlantılı bir düzen olarak bir kez tasarlayın ve sayfaya özel içeriğin geleceği yere bir children yer tutucusu yerleştirin. Daha küçük, tekrarlanan parçalar için bunu yeniden kullanılabilir bileşenler ve varyantlarla birleştirin. Düzeni kullanan her sayfa, düzende yapılan değişiklikleri devralır; böylece gezinme düzenlemesi her sayfada ayrı ayrı değil, tek bir yerde yapılır.",
    description: "Bir Pagiera sitesinde ortak sayfa yapısını tutarlı tutmak için children yer tutucuları içeren bağlantılı düzenler, yeniden kullanılabilir bileşenler ve varyantlar kullanın.",
    updated: "2026-09-12", minutes: 4,
    takeaways: [
      "Bağlantılı düzen ortak yapıyı tutar; children yer tutucusu her sayfanın farklılaştığı yeri işaretler.",
      "Varyantlı bileşenler, küçük farklılıklar gerektiren tekrarlanan parçaları kapsar.",
      "Düzenler ve bileşenler, belgenin geri kalanıyla birlikte Varlıklar panelinde bulunur.",
      "Düzeni değiştirmek, ona bağlı tüm sayfaları değiştirir.",
    ],
    sections: [
      { heading: "Düzenler ve bileşenler", blocks: [{ type: "table", head: ["Bağlantılı düzen kullanın", "Bileşen kullanın"], rows: [
        ["Yapı tüm sayfayı çevreliyorsa: gezinme, alt bilgi, sayfanın çevre arayüzü.", "Parça sayfaların içinde tekrarlanıyorsa: kart, düğme, kayan şerit satırı."],
        ["Her sayfanın ortaya kendi içeriğini yerleştirmesi gerekiyorsa.", "Her örnek küçük değişikliklerle aynı tasarıma ihtiyaç duyuyorsa."],
      ] }] },
      { heading: "children yer tutucusu", blocks: [
        { type: "text", body: "children yer tutucusu olmayan bir düzen yalnızca bir sayfadır. Düzeni yeniden kullanılabilir kılan yer tutucudur: bağlantılı her sayfanın kendi içeriğiyle doldurduğu yuvayı işaretler; çevresindeki gezinme ve alt bilgi ise düzenin yönetiminde kalır." },
        { type: "ordered", items: [
          "Ortak gezinmeyi ve alt bilgiyi bir kez tasarlayın.",
          "Aralarına bir children yer tutucusu ekleyin.",
          "Her sayfayı düzene bağlayın ve yalnızca farklı olan kısmı tasarlayın.",
        ] },
      ] },
      { heading: "Görsel ifadeyi tutarlı tutmak", blocks: [
        { type: "text", body: "Ortak yapı, tek tip sayfalar anlamına gelmek zorunda değildir. Shader renkleri, Tabler, Lucide ve Remix simge setleri, metin üzerine gelme efektleri ve giriş ya da kaydırmaya bağlı hareketler öğe bazında düzenlenebilir; böylece sayfalar ortak bir iskeleti paylaşırken kendilerine özgü kalabilir." },
      ] },
    ],
    faq: [
      { question: "Gezinme ve alt bilgi tasarımlarını sayfalar arasında yeniden kullanabilir miyim?", answer: "Evet. Ortak yapı için yeniden kullanılabilir bileşenler ve bağlantılı düzenler kullanın. Düzenler, sayfaya özel içerik için bir children yer tutucusu içerebilir; böylece gezinmeyi ve alt bilgileri her sayfa için yeniden oluşturmanız gerekmez." },
      { question: "Bir düzeni düzenlemek onu kullanan tüm sayfaları günceller mi?", answer: "Bağlantılı düzenlerin amacı ortak yapının bir kez düzenlenmesidir. Düzene bağlı sayfalar onun yapısını devralırken kendi içerikleri children yuvasında kalır." },
    ],
    related: ["add-a-visual-editor-to-nextjs", "build-with-a-coding-agent"],
  },
  {
    slug: "use-pagiera-as-a-cms", navLabel: "CMS olarak Pagiera", category: "CMS",
    title: "Pagiera'yı bir Next.js sitesi için kendi sunucunuzda barındırılan CMS olarak kullanın",
    question: "Pagiera'yı bir Next.js sitesi için CMS olarak kullanabilir misiniz?",
    answer: "Evet, sayfalar için. Pagiera her sayfayı kendi PostgreSQL veritabanınızda bir belge olarak saklar, taslakları yayımlanmış revizyonlardan ayırır ve geliştirici olmayan kişilere bunları değiştirebilecekleri bir görsel editör sunar; bir CMS'nin yaptığı iş budur. İçerik modelleme anlamında bir headless CMS değildir: koleksiyonlar tanımlayıp bunları bir API üzerinden sorgulamak yerine sayfalar mevcut API'lerinize bağlanır. Hiçbir şey altyapınızdan ayrılmaz ve istek yolunda bir CMS hizmeti bulunmaz.",
    description: "Pagiera'yı bir Next.js sitesinin arkasındaki CMS olarak çalıştırın: sayfa içeriğinin nerede saklandığı, kimin neyi düzenlediği, taslakların ve yayınlamanın nasıl çalıştığı ve headless CMS'den farkı.",
    updated: "2026-09-13", minutes: 5,
    takeaways: [
      "Sayfa belgeleri bir sağlayıcının bulutunda değil, PostgreSQL veritabanınızda saklanır.",
      "Taslaklar yayımlanana kadar gizlidir ve revizyonlar saklanır.",
      "İçerik modelleri veya koleksiyonlar yoktur; sayfalar zaten çalıştırdığınız API'leri okur.",
      "Yayımlanan sayfalar sunucuda işlenir; böylece editörlerin değişiklikleri ilk HTML yanıtında bulunur.",
    ],
    sections: [
      { heading: "Pagiera'nın yönettikleri ve yönetmedikleri", blocks: [
        { type: "table", head: ["Pagiera'nın sorumluluğunda", "Sizin sorumluluğunuzda kalır"], rows: [
          ["Sayfa belgeleri, taslaklar, yayımlanmış revizyonlar", "Ürün verileri, kullanıcılar, siparişler; API'lerinizin zaten tuttuğu her şey"],
          ["Görsel editör ve yayınlama adımı", "Kimlik doğrulama, barındırma, dağıtım ve alan adınız"],
          ["Bir sayfanın veri bloklarının sunucu tarafında çözümlenmesi", "Bu blokların çağırdığı uç noktalar"],
        ] },
        { type: "note", body: "Kendi şemaları ve sorgu API'si olan, istediğiniz içerik türlerini tanımlamaya ihtiyaç duyuyorsanız aradığınız şey bir headless CMS'dir; Pagiera bunlardan biri değildir. Pazarlama ekibinin düzenleyebileceği ve mevcut verilerinizi okuyan sayfalara ihtiyacınız varsa Pagiera tam da bunu sağlar." },
      ] },
      { heading: "Headless CMS ile karşılaştırma", blocks: [{ type: "table", head: ["Headless CMS", "Pagiera"], rows: [
        ["İçerik sağlayıcının bulutunda bulunur ve API'si üzerinden getirilir.", "İçerik veritabanınızda bulunur ve kendi sunucunuz tarafından okunur."],
        ["Editörler alanları doldurur; bunların nasıl işleneceğine geliştirici karar verir.", "Editörler, sayfayı üreten tuval üzerinde doğrudan sayfanın kendisini değiştirir."],
        ["Yeni bir düzen genellikle geliştiricinin kod yayımlaması anlamına gelir.", "Yeni bir düzen görsel bir düzenlemedir ve dağıtım yapmadan yayımlanır."],
        ["Kullanıcı koltuğu, kayıt veya API çağrısı başına ücretlendirilir.", "MIT lisanslıdır; kendi Postgres ve Redis hizmetlerinizin ücretini ödersiniz."],
      ] }] },
      { heading: "Kim ne yapar?", blocks: [
        { type: "ordered", items: [
          "Bir geliştirici paketi yükler, API rotasını ekler ve editörü kimlik doğrulamanızın arkasına yerleştirir.",
          "Bir editör stüdyoyu açar, sayfayı değiştirir ve kaydeder; bu işlem yalnızca taslağı günceller.",
          "Erişimi olan herkes, taslak herkese açılmadan önce onu bir önizleme rotasında inceler.",
          "Yayınlama, onaylanan revizyonu yayına alır ve önbellekteki sayfayı yeniler.",
        ] },
        { type: "text", body: "Yayınlama kodu değil sayfa içeriğini değiştirdiğinden bir içerik düzenlemesi dağıtımı beklemez; ancak uygulamanızı da dağıtmaz, dolayısıyla sürüm yayınlama süreciniz olduğu gibi kalır." },
      ] },
      { heading: "Editörde oluşturulan sayfaların dizine eklenebilir kalması", blocks: [
        { type: "text", body: "Görsel olarak oluşturulan sayfalardaki yaygın sorun, içeriklerinin ilk yanıttan sonra gelmesidir; bu yüzden tarayıcı botları ve yanıt motorları boş bir kabuk görür. Yayımlanan Pagiera sayfaları sunucuda yüklenir ve Request blokları HTML döndürülmeden önce tamamlanır; böylece bir tarayıcı botunun okuduğu şey, editörün yayımladığı şeydir." },
      ] },
    ],
    faq: [
      { question: "Pagiera bir CMS mi?", answer: "Sayfalar için evet. Sayfa belgelerini kendi PostgreSQL veritabanınızda saklar, taslakları yayımlanmış revizyonlardan ayrı tutar ve geliştirici olmayan kişilere bir görsel editör sunar. İçerik modelleme anlamında bir headless CMS değildir: istediğiniz koleksiyonları tanımlayıp bir API üzerinden sorgulamazsınız." },
      { question: "İçerik nerede saklanır?", answer: "PAGIERA_POSTGRES_URL ile yapılandırdığınız PostgreSQL veritabanında. Redis, yayımlanan sayfaları önbelleğe alır. Her ikisi de kendi altyapınızda çalışır; Pagiera tarafından barındırılan bir içerik hizmeti yoktur." },
      { question: "Geliştirici olmayan kişiler dağıtım yapmadan yayımlayabilir mi?", answer: "Evet. Kaydetmek taslağı günceller, yayınlamak ise onu herkese açık sayfaya dönüştürür; bu bir kod değişikliği değil, içerik değişikliğidir. Ana uygulamayı dağıtmak, geliştiricinin sorumluluğunda ayrı bir adım olarak kalır." },
      { question: "Başka bir sisteme geçebilir miyim?", answer: "Paket MIT lisanslıdır ve sayfalar kendi veritabanınızdaki JSON belgeleridir; dolayısıyla içerik Pagiera çalışmadan da okunabilir. Kapatılacak bir sağlayıcı hesabı veya beklenecek bir dışa aktarma kuyruğu yoktur." },
    ],
    related: ["add-a-visual-editor-to-nextjs", "preview-and-publish-pages"],
  },
];
