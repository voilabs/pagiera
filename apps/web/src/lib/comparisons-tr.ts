import type { Comparison } from "./comparisons";

const OWNERSHIP_ROW = {
  label: "Çıktının sahibi kim?",
  pagiera: "Sizsiniz. Sayfalar, deponuzdaki JSON belgeleridir ve kendi uygulamanız tarafından işlenir.",
};

export const COMPARISONS_TR: Comparison[] = [
  {
    choosePagiera: [
      "Görsel editörün kendi ürününüzün içinde, kendi kimlik doğrulamanızın arkasında bulunması gerekiyor.",
      "Pazarlama ekibinin, uygulamanızla aynı API'lerden veri okuyan sayfaları düzenlemesi gerekiyor.",
      "Sayfa kaynağının git'te tutulmasını ve bir pull request içinde incelenebilmesini istiyorsunuz.",
    ],
    chooseRival: [
      "Yapılan iş tasarım keşfi: sistemler, prototipler, geliştiriciye aktarım ve değerlendirme.",
      "Ekibiniz, herhangi bir şey geliştirilmeden çok önce görsel fikirler üzerinde birlikte çalışıyor.",
      "Birçok ürün için temel başvuru kaynağı olacak ortak bir tasarım dosyasına ihtiyacınız var.",
    ],
    faq: [
      { answer: "Hayır. Figma bir tasarım aracıdır; Pagiera ise Next.js uygulamanızın içinde üretim sayfalarını işleyen bir oluşturucudur. Çoğu ekip Figma'da tasarlamaya devam eder ve sayfanın gerçekten yayımlandığı yerde Pagiera'yı kullanır.", question: "Pagiera, Figma'nın yerini alır mı?" },
      { answer: "Figma Sites bir tasarımı Figma'nın altyapısında barındırılan bir site olarak yayımlayabilir. Pagiera, deponuzda tuttuğunuz belgelerden sayfaları kendi uygulamanız ve kendi barındırma ortamınız üzerinden işler.", question: "Bunun Figma Sites'tan farkı nedir?" },
      { answer: "Evet. Pagiera sayfaları standart React çıktısıdır; dolayısıyla kod tabanınızda zaten tanımlanmış yazı tiplerini, tasarım değişkenlerini ve bileşenleri kullanır. Bir Figma tasarım sistemi de genellikle üretime bu şekilde taşınır.", question: "Pagiera sayfaları Figma tasarım sistemimize uyabilir mi?" },
    ],
    headline: "Tasarım tuvali ile üretim tuvali aynı araç değildir.",
    intent: "Bu ikisini karşılaştıran ekipler genellikle bir tasarım dosyasının gerçek web sitesine dönüşüp dönüşemeyeceğini veya tasarım ile teslimatın ayrı adımlar olarak kalıp kalmayacağını sorar.",
    rival: "Figma",
    rivalTagline: "sektör standardı olan iş birliğine dayalı tasarım aracı",
    rows: [
      { label: "Temel işlev", pagiera: "Kullanıcıların yüklediği sayfayı oluşturmak ve yayımlamak.", rival: "Arayüzleri ve tasarım sistemlerini iş birliği içinde tasarlamak." },
      { label: "Tuvalin ürettiği çıktı", pagiera: "Kendi uygulamanızda sunucuda işlenen bir React sayfası.", rival: "Bir tasarım dosyası ve Figma Sites aracılığıyla yayımlanan siteler." },
      { ...OWNERSHIP_ROW, rival: "Figma. Tasarımlar Figma'nın bulut çalışma alanında saklanır." },
      { label: "Gerçek veri", pagiera: "API'lerinize, rota parametrelerine ve form gönderimlerine bağlanır.", rival: "Yer tutucu içerik ve eklentilerle sağlanan örnek veriler." },
      { label: "Lisans", pagiera: "MIT; npm üzerinden kurulur.", rival: "Kullanıcı koltuğu bazında lisanslanan, tescilli SaaS." },
      { label: "Kendi sunucunuzda barındırma", pagiera: "Uygulamanızın çalıştığı her yerde çalışır.", rival: "Geçerli değil; Figma, Figma tarafından barındırılır." },
    ],
    slug: "pagiera-vs-figma",
    verdict: "Figma bir web sitesinin tasarlandığı yerdir; Pagiera ise oluşturulup yayımlandığı yerdir. Figma size ortak çalışılan bir tasarım dosyası ve Figma Sites aracılığıyla bu dosyadan yayımlanan, barındırılan bir sayfa sunar. Pagiera, kendi Next.js uygulamanıza kurduğunuz MIT lisanslı bir pakettir; böylece aynı görsel tuval, sunucuda işlenen, gerçek API'lerinize bağlı ve sayfa belgesi deponuzda saklanan üretim sayfasını oluşturur. Sayfanın nasıl olması gerektiğine karar vermek için Figma'yı; bu sayfanın sahibi olduğunuz bir ürünün içinde çalışması gerektiğinde Pagiera'yı kullanın.",
  },
  {
    choosePagiera: [
      "Oluşturucunun ürününüzün yerine geçmesi değil, ürününüze gömülmesi gerekiyor.",
      "Sayfaların kendi API'lerinizden ve kendi dağıtım ortamınızdan işlenmesi gerekiyor.",
      "Sayfa içeriğinin tek bir sağlayıcının barındırma hizmetine bağımlı kalmasını istemiyorsunuz.",
    ],
    chooseRival: [
      "CMS içeren, barındırılan bir pazarlama sitesi istiyor ve bakımını yapacağınız bir uygulama istemiyorsunuz.",
      "Ekip teknik değil ve her şeyin tek bir yönetilen üründe bulunmasına ihtiyaç duyuyor.",
      "Yerleşik barındırma, formlar ve analizler, çalışma zamanına sahip olmaktan daha önemli.",
    ],
    faq: [
      { answer: "Her ikisinin de duyarlı sayfaları görsel olarak oluşturmanıza izin vermesi anlamında evet. Fark, sayfanın nerede çalıştığıdır: Webflow sayfayı Webflow'dan sunar, Pagiera ise kendi uygulamanızdan işler.", question: "Pagiera, Webflow'un yaptıklarını yapabilir mi?" },
      { answer: "Pagiera'nın taşınmanız gereken bir barındırma hizmeti yoktur. Onu mevcut bir Next.js uygulamasına kurar ve bu uygulamayı her zamanki gibi dağıtırsınız.", question: "Pagiera kullanmak için barındırma hizmetimizi taşımamız gerekiyor mu?" },
      { answer: "Webflow'un CMS'si platformun bir parçasıdır. Pagiera, sayfaları zaten sahip olduğunuz herhangi bir veri kaynağına bağlar: bir REST uç noktası, bir API rotası üzerinden veritabanınız veya rota parametreleri.", question: "Webflow CMS'nin yerini ne alır?" },
    ],
    headline: "Biri barındırılan bir platform. Diğeri kurduğunuz bir paket.",
    intent: "Buradaki asıl soru, yönetilen bir web sitesi platformu mu yoksa zaten çalıştırdığınız yazılımın içinde bir görsel katman mı istediğinizdir.",
    rival: "Webflow",
    rivalTagline: "kendi CMS'sine sahip, barındırılan bir görsel web sitesi platformu",
    rows: [
      { label: "Sayfaların çalıştığı yer", pagiera: "Kendi altyapınızdaki Next.js uygulamanız.", rival: "Webflow'un barındırma ortamı." },
      { ...OWNERSHIP_ROW, rival: "Webflow; ücretli planlarda kod dışa aktarma kullanılabilir." },
      { label: "İçerik modeli", pagiera: "Öğe bazında bağlanan mevcut API'leriniz ve veri kaynaklarınız.", rival: "Yerleşik CMS koleksiyonları." },
      { label: "Ürününüze gömülme", pagiera: "Evet; editör, kimlik doğrulamanızın arkasına yerleştirdiğiniz bir bileşendir.", rival: "Hayır. Tasarım aracı Webflow'un kendi uygulamasıdır." },
      { label: "Lisans", pagiera: "MIT; npm üzerinden kurulur.", rival: "Plan bazında sunulan, tescilli SaaS." },
      { label: "En uygun kullanım", pagiera: "Bakımını yaptıkları bir uygulamanın içinde sayfalar yayımlayan ürün ekipleri.", rival: "Barındırma ve CMS'yi tek yerde isteyen pazarlama siteleri." },
    ],
    slug: "pagiera-vs-webflow",
    verdict: "Webflow, barındırılan eksiksiz bir platformdur: Webflow içinde tasarlar, içeriği yönetir ve yayımlarsınız; sonucu da Webflow sunar. Pagiera bunun tersindeki tercihtir: kendi Next.js uygulamanıza kurduğunuz MIT lisanslı bir pakettir; böylece sayfalar altyapınızdan işlenir, gerçek API'lerinizi okur ve deponuzda JSON belgeleri olarak bulunur. Barındırma ve CMS dâhil yönetilen bir web sitesi istediğinizde Webflow'u seçin. Görsel editörün zaten çalıştırıp dağıttığınız bir ürünün içinde bulunması gerektiğinde Pagiera'yı seçin.",
  },
  {
    choosePagiera: [
      "Dışarı bağlantı vereceğiniz ayrı bir siteye değil, uygulamanızın içinde bir editöre ihtiyacınız var.",
      "Sayfaların yalnızca yayımlanmış içeriği değil, canlı uygulama verilerini de okuması gerekiyor.",
      "Açık kaynak ve kendi sunucunuzda barındırma birer tercih değil, gereksinim.",
    ],
    chooseRival: [
      "Çok az kurulumla özenli animasyonlar ve barındırılan bir site istiyorsunuz.",
      "Site bir ürünün parçası değil, bağımsız bir pazarlama sitesi.",
      "Hazır gelen yönetilen CDN, formlar ve analizler, sağlayıcıya bağımlılığı kabul etmeye değer.",
    ],
    faq: [
      { answer: "Barındırma ve şablonlar dâhil olduğundan Framer ile yayımlanmış bir siteye ulaşmak genellikle daha hızlıdır. Sayfanın zaten dağıttığınız bir uygulamanın içinde yer alması gerektiğinde Pagiera daha hızlıdır.", question: "Hangisiyle daha hızlı yayına çıkılır?" },
      { answer: "Pagiera'da hareket, sayfa belgesinin bir parçası olarak oluşturulur ve uygulamanızda işlenir. Framer'ın hareket araçları daha kapsamlıdır ve bağımsız sitelere göre uyarlanmıştır.", question: "Pagiera animasyonu destekler mi?" },
      { answer: "Evet. Pagiera MIT lisanslıdır ve npm üzerinden kurulur; dolayısıyla bir sağlayıcı hesabına ihtiyaç duymadan kendi barındırma ortamınızda çalışır.", question: "Pagiera'yı kendi sunucumuzda barındırabilir miyiz?" },
    ],
    headline: "Barındırılan, özenli bir deneyim ile kod tabanınızda yaşayan bir oluşturucu.",
    intent: "Bu ikisini değerlendirenler, güzel bir bağımsız siteye ulaşmanın en hızlı yolu ile kendi ürünlerinin bir parçası hâline gelen bir oluşturucu arasında seçim yapıyor.",
    rival: "Framer",
    rivalTagline: "animasyonları ve şablonlarıyla tanınan, barındırılan bir site oluşturucusu",
    rows: [
      { label: "Sayfaların çalıştığı yer", pagiera: "Kendi altyapınızdaki Next.js uygulamanız.", rival: "Framer'ın barındırma ortamı." },
      { ...OWNERSHIP_ROW, rival: "Framer; kendi proje biçimi içinde." },
      { label: "Hareket", pagiera: "Belgelerde oluşturulur, uygulamanız tarafından işlenir.", rival: "Geniş bir hazır ayar ve efekt kütüphanesiyle kapsamlıdır." },
      { label: "Uygulama verileri", pagiera: "API'lerinize, rota parametrelerine ve formlara bağlanır.", rival: "CMS koleksiyonları ve entegrasyonlar." },
      { label: "Lisans", pagiera: "MIT; npm üzerinden kurulur.", rival: "Plan bazında sunulan, tescilli SaaS." },
      { label: "En uygun kullanım", pagiera: "Bakımını yaptığınız bir ürünün parçası olan sayfalar.", rival: "Hızla etkileyici görünmesi gereken bağımsız pazarlama siteleri." },
    ],
    slug: "pagiera-vs-framer",
    verdict: "Framer; barındırma, şablonlar ve hareket araçlarıyla birlikte özenli, animasyonlu bir pazarlama sitesini hızla yayına alır. Pagiera ise barındırılan bir ürün değildir: aynı tür görsel tuvali kendi Next.js uygulamanıza yerleştiren, kendi API'lerinizden sunucu tarafında işleyen ve sayfayı deponuzda saklayan MIT lisanslı bir pakettir. Bu hafta yayına almak istediğiniz bağımsız bir site için Framer'ı seçin. Sayfanın ürününüzün içinde, kendi barındırma ortamınızda ve mevcut içerik modelinizle çalışması gerektiğinde Pagiera'yı seçin.",
  },
  {
    choosePagiera: [
      "Barındırılan bir hizmete bağımlı olmak yerine bir paket kurmayı tercih ediyorsunuz.",
      "Sayfa belgelerinin deponuzda ve inceleme sürecinizde yer alması gerekiyor.",
      "Düzenleme arayüzünün tamamının MIT lisanslı olmasını istiyorsunuz.",
    ],
    chooseRival: [
      "Roller, zamanlama ve analizler içeren, yönetilen bir görsel CMS istiyorsunuz.",
      "Farklı framework'lerdeki birden çok ön yüz aynı içeriği kullanıyor.",
      "Sağlayıcı tarafından işletilen bir editör ve destek sözleşmesi aboneliğe değer.",
    ],
    faq: [
      { answer: "Her ikisi de kendi React bileşenlerinizin üzerine bir görsel editör yerleştirir. Builder.io içeriği kendi bulutunda saklar ve sunar; Pagiera belgeyi deponuzda tutar ve uygulamanızdan işler.", question: "Pagiera'nın Builder.io'dan farkı nedir?" },
      { answer: "Çağrılacak harici bir içerik API'si yoktur. Bir Pagiera sayfası, uygulamanızın doğrudan yüklediği bir JSON belgesidir; dolayısıyla ek bir ağ geçişi veya bağımlı olacağınız bir sağlayıcı erişilebilirliği yoktur.", question: "İçerik nerede saklanır?" },
      { answer: "Pagiera, React ve Next.js'i hedefler. Birden fazla farklı framework'ün aynı içeriği kullanması gerektiğinde Builder.io gibi bir headless platform daha uygundur.", question: "Pagiera, React dışındaki ön yüzleri destekler mi?" },
    ],
    headline: "Aynı fikir, zıt bağımlılık: SaaS içerik API'si veya kendi deponuz.",
    intent: "Her iki araç da geliştirici olmayan kişilerin gerçek bileşenlerinizden sayfalar oluşturmasını sağlar; karar, içeriğin bir sağlayıcının bulutunda mı yoksa kod tabanınızda mı tutulacağıdır.",
    rival: "Builder.io",
    rivalTagline: "birleştirilebilir ön yüzler için barındırılan bir headless görsel CMS",
    rows: [
      { label: "İçerik depolama", pagiera: "Deponuzda veya kendi veritabanınızda JSON belgeleri.", rival: "Builder.io'nun barındırılan içerik API'si." },
      { ...OWNERSHIP_ROW, rival: "Bileşenlerin sahibi sizsiniz; içeriği Builder barındırır." },
      { label: "Editörün barındırılması", pagiera: "Uygulamanızın içinde, kimlik doğrulamanızın arkasına yerleştirilir.", rival: "Builder.io'nun barındırılan stüdyosu." },
      { label: "Framework desteği", pagiera: "React ve Next.js.", rival: "Framework'e özel SDK'lar aracılığıyla birçok framework." },
      { label: "Lisans", pagiera: "MIT; npm üzerinden kurulur.", rival: "Ücretsiz katmanı olan, tescilli SaaS." },
      { label: "En uygun kullanım", pagiera: "Çalışma zamanında sağlayıcı bağımlılığı istemeyen ekipler.", rival: "Yönetilen yönetişim ve iş akışları isteyen kuruluşlar." },
    ],
    slug: "pagiera-vs-builder-io",
    verdict: "Builder.io ve Pagiera aynı sorunu çözer: insanların gerçek bileşenlerinizden sayfalar oluşturmasını sağlarlar; ancak zıt bağımlılıklar kurarlar. Builder.io barındırılan bir görsel CMS'dir: içerik Builder'ın bulutunda bulunur ve uygulamanız bunu API ve SDK'ları üzerinden getirir. Pagiera MIT lisanslı bir pakettir: editör kendi uygulamanızın içine yerleştirilir ve sayfa, deponuzda tuttuğunuz ve sunucu tarafında işlediğiniz bir JSON belgesidir. Yönetilen yönetişim, iş akışları ve birden çok framework'e içerik sunumu için Builder.io'yu seçin. Düzenleme arayüzünün ve içeriğinin tamamını kod tabanınızda, çalışma zamanında araya giren bir sağlayıcı olmadan tutmak istediğinizde Pagiera'yı seçin.",
  },
];
