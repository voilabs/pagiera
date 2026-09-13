import type { FaqEntry, FaqGroup } from "./faq";
import { productFaqTr } from "./product-content-tr";

const pick = (...questions: string[]): FaqEntry[] => questions.map((question) => {
  const entry = productFaqTr.find((item) => item.question === question);
  if (!entry) throw new Error(`Unknown product FAQ question: ${question}`);
  return entry;
});

export const FAQ_GROUPS_TR: FaqGroup[] = [
  {
    title: "Pagiera nedir?", blurb: "Kurulum ayrıntılarından önce kısa bir açıklama.",
    entries: [
      ...pick("Pagiera nedir?", "Pagiera'yı kullanmak ücretsiz mi?"),
      { question: "Pagiera bir CMS mi?", answer: "Sayfalar için evet. Pagiera her sayfayı kendi PostgreSQL veritabanınızda bir belge olarak saklar, taslakları yayımlanmış revizyonlardan ayrı tutar ve geliştirici olmayan kişilere bunları değiştirebilecekleri bir görsel editör sunar; bir CMS'nin yaptığı iş de budur. İçerik modelleme anlamında bir headless CMS değildir: istediğiniz koleksiyonları tanımlayıp bir API üzerinden sorgulamazsınız. Bunun yerine sayfalar, Request ve Repeat blokları aracılığıyla mevcut API'lerinize bağlanır." },
      { question: "Pagiera'yı bir Next.js sitesi için CMS olarak kullanabilir miyim?", answer: "Evet, yaygın kullanım şekli de budur. Paketi Next.js uygulamanıza yükleyin, editörü kimlik doğrulamanızın arkasına yerleştirin ve yayımlanan belgeleri sunucuda pagiera/runtime ile işleyin. Pazarlama ekibi bir sayfayı görsel olarak düzenler, taslağı önizler ve yayımlar; içerik altyapınızdan hiç ayrılmaz ve istek yolunda ayrı bir CMS hizmeti bulunmaz." },
      { question: "Pagiera bir web sitesi oluşturucusu mu, yoksa geliştirici aracı mı?", answer: "Bilinçli olarak her ikisi de. Pagiera, bir geliştiricinin React ve Next.js uygulamasına kurduğu bir npm paketidir; kurduğu şey ise geliştirici olmayan kişilerin kullanabildiği bir görsel editördür. Entegrasyon geliştiricinin sorumluluğundadır; sayfalar editörde tasarlanır." },
      { question: "Pagiera'nın barındırılan bir web sitesi oluşturucusundan farkı nedir?", answer: "Barındırılan bir oluşturucu, sayfalarınızı kendi platformunda tutar ve kendi altyapısından sunar. Pagiera uygulamanızın içinde çalışır: belgeler PostgreSQL veritabanınızda saklanır, sayfalar kendi Next.js sunucunuz tarafından işlenir ve paket MIT lisanslıdır; dolayısıyla sizinle siteniz arasında bir sağlayıcı hesabı bulunmaz." },
    ],
  },
  {
    title: "Kurulum ve barındırma", blurb: "Editörü açmadan önce gerekenler.",
    entries: [
      ...pick("Pagiera'yı kendi Next.js uygulamamda barındırabilir miyim?"),
      { question: "Pagiera'yı çalıştırmak için gereksinimler nelerdir?", answer: "Node.js 20 veya üzeri, React 18.3 veya üzeri, tam yığın entegrasyonu için Next.js App Router, PostgreSQL ve Redis. OpenRouter API anahtarı yalnızca yapay zekâ ile üretim için gereklidir." },
      { question: "Veritabanı geçişlerini çalıştırmam gerekiyor mu?", answer: "Hayır. Pagiera, sunucu başlatılırken ihtiyaç duyduğu PostgreSQL tablolarını oluşturur. Redis; yayımlanan sayfaları ve şablon paketlerini önbelleğe almak ve yapay zekâ istek hızını sınırlamak için kullanılır." },
      { question: "Kurulumumun çalıştığını nasıl kontrol ederim?", answer: "Uygulamayı başlattıktan sonra /api/pagiera/health adresini açın. PostgreSQL, Redis ve yapılandırılmış OpenRouter modelini doğrular; böylece sessiz bir yapılandırma hatasını okunabilir bir yanıta dönüştürür." },
      { question: "Pagiera kimlik doğrulamayı yönetir mi?", answer: "Hayır. Pagiera bir kimlik doğrulama katmanı sunmaz. Editör rotasını ve /api/pagiera rotasını kendi uygulamanızın içine ekler, mevcut kimlik doğrulama ve yetkilendirme mekanizmalarınızla korursunuz." },
    ],
  },
  {
    title: "Tasarım ve yeniden kullanım", blurb: "Bir sayfa ilk taslaktan sonra nasıl düzenlenebilir kalır?",
    entries: [
      ...pick("Gezinme ve alt bilgi tasarımlarını yeniden kullanabilir miyim?", "Hangi etkileşimli içerikleri oluşturabilirim?"),
      { question: "Her kırılma noktası için farklı düzenler tasarlayabilir miyim?", answer: "Evet. Tuval, duyarlı çalışma yüzeylerini yan yana gösterir ve kırılma noktaları birbirinden bağımsız geçersiz kılma değerleri taşır; böylece bir genişlikte yapılan değişiklik diğerlerini sessizce yeniden yazmaz." },
    ],
  },
  {
    title: "Veri ve yayınlama", blurb: "İçeriğin nereden geldiği ve ne zaman yayına girdiği.",
    entries: [
      ...pick("Bir sayfayı kaydetmek onu herkese açık hâle getirir mi?"),
      { question: "Bir Pagiera sayfası API'den veri okuyabilir mi?", answer: "Evet. Request blokları döndürülen tek bir nesneyi alt öğelerine bağlar, Repeat blokları ise dizi sonuçları üzerinde yinelenir. Her ikisi de GET, POST, PUT, PATCH ve DELETE kaynaklarını destekler; istek URL'leri, üst bilgileri, sorgu alanları ve gövdeleri rota parametrelerine ve sorgu değerlerine başvurabilir." },
      { question: "API destekli içerik arama motorlarına görünür mü?", answer: "Yayımlanan sayfalarda evet. Request blokları sunucuda çözümlenir ve HTML döndürülmeden önce tamamlanır; bu nedenle API destekli içerik daha sonra tarayıcıda getirilmek yerine ilk yanıtın bir parçasıdır." },
      { question: "Bir sayfayı yayımlamak uygulamamı dağıtır mı?", answer: "Hayır. Yayınlama, herkese açık sayfanın içeriğini günceller ve önbellekteki revizyonu yeniler. Ana uygulamanızı dağıtmak, DNS'i yapılandırmak ve alan adınızı yönetmek kendi dağıtım sürecinizin sorumluluğunda kalır." },
    ],
  },
  {
    title: "Yapay zekâ ve kodlama ajanları", blurb: "Modelin neyi, ne zaman değiştirmesine izin verildiği.",
    entries: [
      ...pick("Bir yapay zekâ kodlama ajanı düzenlenebilir bir Pagiera web sitesi tasarlayabilir mi?", "Hedefli yapay zekâ düzenlemeleri nasıl çalışır?"),
      { question: "Pagiera'yı hiçbir yapay zekâ özelliği olmadan kullanabilir miyim?", answer: "Evet. Yapay zekâ ile üretim bir OpenRouter anahtarı gerektirir; tuval, bileşenler, düzenler, veri bağlama, önizleme ve yayınlama dâhil diğer her şey bu anahtar olmadan çalışır." },
    ],
  },
];

export const ALL_FAQ_TR: FaqEntry[] = FAQ_GROUPS_TR.flatMap((group) => group.entries);
