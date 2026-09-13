export const DOCS_CONTENT_TR: Record<string, string> = {
  architecture: `## Sisteme genel bakış

Pagiera, uygulamanıza gömülü olarak çalışır. Tarayıcı stüdyoyu barındırır, sunucunuz kalıcı kaydı ve veri isteklerini yönetir, PostgreSQL belgeleri saklar, Redis ise önbellek ve istek hızı sınırlaması sağlar. Kimlik doğrulama ve dağıtım, ana uygulamanın sorumluluğundadır.

## Bir belgenin sistemdeki yolculuğunu izleyin

1. Düzenleyicinin başlangıç verilerini sunucuda yükleyin ve tam stüdyoya aktarın.
2. Tarayıcıda yerel katmanları düzenleyin. Bir belge; öğeler, kök stiller ve veri kaynağı tanımları içerir.
3. Sayfanın beklenen revizyonunu kullanarak sunucu üzerinden kaydedin. Kaydetme, herkese açık sayfayı değil taslağı değiştirir.
4. İstek verilerini sunucuda çözümleyerek taslağı kimlik doğrulaması gerektiren bir rota üzerinden önizleyin.
5. Açıkça yayımlama işlemini başlatın. Herkese açık çalışma ortamı yayımlanmış belgeyi okur ve HTML oluşturur.

## Paket sınırları

| Giriş noktası | Sorumluluk |
| --- | --- |
| pagiera/full | Tam stüdyo arayüzü |
| pagiera/provider | Ana uygulamanın yazı tiplerini kaydetme |
| pagiera/server | Sunucu işleyicileri, kalıcı kayıt ve sunucuda yükleme |
| pagiera/runtime | Yayımlanmış sayfaları oluşturma |
| pagiera/data | Veri entegrasyonu dışa aktarımları |
| pagiera | Daha küçük düzenleyici, istemci ve belge API'leri |

Sunucu kodunu yalnızca sunucu modüllerine aktarın. Tam stüdyo için pagiera/full.css dosyasını içe aktarın; pagiera/styles.css daha küçük düzenleyici içindir.

## Sonraki adımınızı seçin

[Kurulum](/docs/getting-started) ile başlayın, [Next.js rotalarını](/docs/nextjs-setup) bağlayın ve ardından [stüdyo iş akışını](/docs/studio) izleyin. Uygulamayı kullanıcılara açmadan önce [dağıtım](/docs/deployment) rehberini okuyun.`,

  studio: `## İlk düzenlenebilir sayfanızı oluşturun

1. Korumalı stüdyoyu açın ve açıklayıcı bir ad ile rota kısa adına sahip bir sayfa oluşturun.
2. Bir Section ve bir Container ekleyin. Başlık, destekleyici metin ve düğme için dikey bir Stack kullanın.
3. İnsanların ve ajanların daha sonra bulabilmesi için katmanları Ana tanıtım veya Birincil eylem gibi amaçlarına göre yeniden adlandırın.
4. İçeriği ve görünümü özellik panelinde düzenlemek için her katmanı seçin.
5. Kaydetmeden önce çalışma yüzeyleri arasında geçiş yaparak satır kaymasını, boşlukları ve taşmayı kontrol edin.

## Katmanlar ve düzen

Katman ağacı iç içe geçme ilişkilerini; aynı düzeydeki öğelerin sıralaması ve düzen ise yerleşimi belirler. Yoğun metin içeren bölümlerde akış düzenlerini tercih edin. Serbest konumlandırılmış öğeler dekoratif kompozisyonlarda kullanışlıdır, ancak dar genişliklerde ayrıca kontrol edilmelidir.

Tekrarlanan arayüz parçaları için [yeniden kullanılabilir bileşenleri](/docs/components-layouts), içerik için [yerel blokları](/docs/blocks) kullanın. Düzenlenebilir bir bölümün tamamını tek bir görsele veya gömülü içeriğe dönüştürmekten kaçının.

## Kaydedin ve doğrulayın

1. Taslağı kaydedin ve onayı bekleyin.
2. Yalnızca yerel tuval durumunu değil, kalıcı kaydı doğrulamak için sayfayı yeniden yükleyin.
3. Taslak önizlemesini açın; bağlantıları, formları ve etkileşimli denetimleri test edin.
4. Yalnızca sonucu inceledikten sonra yayımlayın. Tek başına kaydetmek yayımlamaz.

## Bir sorun çıktığında

Kaydetme çakışırsa yeniden denemeden önce en son revizyonu yükleyin. Tuval doğru göründüğü hâlde önizleme farklıysa stil dosyası içe aktarımlarını, veri bağlamını ve duyarlı tasarım geçersiz kılmalarını kontrol edin. [Revizyonlar](/docs/revisions) ve [sorun giderme](/docs/troubleshooting) sayfalarına bakın.`,

  blocks: `## Düzen blokları

| Blok | Kullanım |
| --- | --- |
| Frame | Genel amaçlı gruplama ve görsel kompozisyon |
| Stack | Akış tabanlı satırlar veya sütunlar |
| Section | Sayfanın ana bölümlerinden biri |
| Container | İçerik sarmalayıcısı |
| Grid | Izgara biçiminde düzenlenmiş tekrarlanan içerik |
| Divider | Görsel ayırma |
| Spacer | Bilinçli olarak bırakılan boşluk |

Bir üst düzenle başlayın, alt öğelerini ekleyin ve ardından aralıkları ve boyutları ayarlayın. Her yere sabit boyut eklemeden önce mobil görünümü kontrol edin.

## İçerik ve medya

| Blok | Kullanım |
| --- | --- |
| Heading | Anlamlı bir hiyerarşiye sahip bölüm başlıkları |
| Text | Paragraflar ve kısa metinler |
| Image | Açıklayıcı alternatif metne sahip görseller |
| Button | Eylem çağrıları ve etkileşim tetikleyicileri |
| Video | Video içeriği |
| Icon | Kütüphane simgeleri |
| List | Liste kapsayıcısı |
| ListItem | Tek bir liste öğesi |
| Quote | Alıntılanan içerik |
| Markdown | Yapılandırılmış Markdown içeriği |
| Embed | Gömülü içerik; güven koşullarını ve tarayıcı kısıtlamalarını inceleyin |

## Formlar

Form, gönderim denetimlerini gruplar. Fieldset ve Label yapı ve adlandırma sağlar. Input, Textarea ve Select değerleri; Checkbox ve Radio seçimleri toplar. FileInput, ziyaretçinin dosya seçmesini sağlar. Dosya seçimi, barındırılan bir yükleme hizmeti değildir. [Formlar](/docs/forms) sayfasına bakın.

## Sunucu destekli içerik

Request API verisini sağlar, Repeat ise koleksiyonları görüntüler. Bir veri kaynağı tanımlayın, yanıt yapısını inceleyin, koleksiyon yolunu seçin ve alt öğelerin içeriğini bağlayın. [Veri bağlama](/docs/data-binding) sayfasına bakın.

## Birleşik etkileşimli bloklar

Döngülü slaytlar, kayan içerikler, sekmeler ve akordeonlar ek öğe türü adlarıyla değil, düzenlenebilir katmanlar ve etkileşim ayarlarıyla oluşturulur. [Hareket ve etkileşimler](/docs/interactions) sayfasına bakın.`,

  "document-model": `## Belge yapısı

Yerel bir belgede version, elements, rootStyle ve dataSources bulunur. Geçerli belge biçimi sürümü 1'dir. Bu biçim numarası, iyimser kaydetmede kullanılan sayfa revizyonu değildir.

Öğeler düz bir dizi oluşturur. Her öğenin benzersiz bir id değeri, type değeri, sayısal z sıralaması ve base stil nesnesi vardır. parentId başka bir öğeye başvurur; parentId belirtilmezse öğe kökte yer alır. İçeriğe özgü alanlar arasında content, src, href ve alt bulunur.

## Güvenli düzenleme sırası

1. Geçerli belgeyi ve sayfa revizyonunu yükleyin.
2. Kök stiller ve veri kaynağı tanımları dâhil, değiştirmeyi amaçlamadığınız alanları koruyun.
3. Başvuruların sabit kalması için mümkün olduğunda mevcut kimlikler üzerinde değişiklik yapın.
4. Her üst öğenin var olduğunu ve üst öğe ilişkilerinde döngü oluşmadığını kontrol edin.
5. Doğrulayın, beklenen sayfa revizyonuyla kaydedin ve sonucu yeniden okuyun.

## Stiller ve kırılma noktaları

base ortak stili tutar. overrides, kırılma noktası kimliğiyle anahtarlanmış, her kırılma noktasına özgü değişiklikleri saklar. rootStyle sayfa düzeyindeki düzeni, yazı tiplerini ve kırılma noktası tanımlarını kontrol eder. Her sayfanın aynı genişlikleri kullandığını varsaymak yerine tanımları belgeden okuyun.

## Ajan erişimi

[CLI](/docs/cli) aracının schema komutu, kurulu TypeScript belge sözleşmesini ve bir örneği döndürür. validate komutu yapısal bütünlüğü kontrol eder; eksiksiz bir şema, erişilebilirlik veya görsel doğrulayıcı değildir. Kaydettikten sonra her zaman oluşturulmuş bir önizlemeyi inceleyin.`,

  "responsive-design": `## Sayfanın kırılma noktalarıyla başlayın

Masaüstü, tablet ve mobil, düzenleyicide zorunlu kırılma noktası kimlikleridir. Başka bir belgeden sabit sayılar kopyalamak yerine her sayfanın yapılandırılmış genişliklerini okuyun. Ziyaretçi kırılma noktası genişliği ile tuval çalışma yüzeyi genişliği farklı olabilir: çizim alanını yeniden boyutlandırmak, yayımlanan davranışı sessizce değiştirmemelidir.

## Genişten dara doğru oluşturun

1. Ortak düzeni en geniş çalışma yüzeyinde kurun.
2. Tablete geçin ve yalnızca geçersiz kılınması gereken özellikleri değiştirin.
3. Mobile geçin; sütunları alt alta yerleştirin, aşırı boşlukları azaltın ve metinlerin satır kaymasını kontrol edin.
4. Gerçek bir önizlemeyi yalnızca çalışma yüzeylerinin tam genişliklerinde değil, bu genişliklerin arasında da yeniden boyutlandırın.

Stiller geniş kırılma noktalarından dar olanlara doğru kademeli olarak aktarılır. Daha dar bir noktadaki açık geçersiz kılma, masaüstü değeri değiştikten sonra bile bir değeri koruyabilir. Yeniden miras alınmasını istediğinizde geçersiz kılmayı kaldırın.

## Taşmayı önleyin

İçerik sarmalayıcılarında esnek genişlikleri, metinde doğal yüksekliği ve okuma için bilinçli seçilmiş azami genişlikleri tercih edin. Görselleri, uzun URL'leri, düğmeleri ve iç içe ızgaraları kontrol edin. İçerik kapsayıcısından bağımsız büyüyebileceği için mutlak konumlandırma ek özen gerektirir.

## Kabul kontrol listesi

Gezinmeyi, başlıkları, denetimleri ve formları dar, orta ve geniş boyutlarda doğrulayın. Uzun içerikleri ve veriye bağlı boş durumları test edin. Yayımlanan çalışma ortamında istenmeyen yatay kaydırma olmadığını doğrulayın.`,

  "components-layouts": `## Yeniden kullanılabilir bileşenler

Sıradan katmanlardan yeniden kullanılabilir bir parça oluşturun, ardından bir ana bileşen oluşturup gereken yerlere örneklerini yerleştirin. Ortak görsel kuralları ana bileşende; bilinçli farklılıkları örnek geçersiz kılmalarında veya varyantlarda tutun.

1. Bileşenin temel düzenini ve duyarlı davranışını tamamlayın.
2. Ana bileşene ve alt katmanlarına anlamlı adlar verin.
3. Örnekler oluşturun ve ana bileşendeki düzenlemenin bunlara yansıdığını doğrulayın.
4. Her varyantı ve geçersiz kılınmış her örneği ayrı ayrı test edin.

## Ortak sayfa düzenleri

Sayfa düzeni, düzen olarak işaretlenmiş ve tam olarak bir alt içerik yuvası içeren ana bileşendir. Yuva, sayfanın kendi kök içeriğini alır; çevresindeki katmanlar üst bilgi ve alt bilgi gibi ortak arayüzü sağlar.

1. Üst bilgi, içerik yuvası ve alt bilgi içeren ana düzen bileşenini oluşturun.
2. İçinde tam olarak bir alt içerik yuvası bulundurun.
3. Düzeni bir sayfaya atayın.
4. Hem ortak arayüzü hem sayfaya özgü içeriği önizlemede doğrulayın.

Oluşturulan düzen katmanları, yazılmış sayfa yapısı kaydedilirken kaldırılır. Düzen eksikse veya yuva yapısı geçersizse mevcut uygulama sayfa içeriğini gizlemek yerine görünür tutar.

## Şablonları bileşenlerden ayırın

Bileşen, belge sistemi içinde yeniden kullanılır. Şablon ise bir proje başlangıç noktası yükler ve proje içeriğinin yerini alabilir; mevcut çalışmanıza içe aktarmadan önce [şablon kurulumu](/docs/templates) sayfasını okuyun.`,

  forms: `## Formu oluşturun

1. Bir Form kapsayıcısı ekleyin.
2. Uygun olduğunda ilişkili alanları Fieldset ile gruplandırın.
3. Her denetim için görünür bir Label ekleyin ve anlamlı alan adları belirtin.
4. Gereken değere göre Input, Textarea, Select, Checkbox veya Radio seçin.
5. Bir gönderim denetimi ekleyin ve entegrasyonunuzun desteklediği hedefi yapılandırın.

Girdi türleri arasında text, email, password, number, tel, url, search, date, time, datetime-local, month, week, color, range ve hidden bulunur. Beklenen değerle eşleşen türleri kullanın, ancak tarayıcı doğrulamasını güvenlik önlemi saymayın.

## Alıcı uç noktanın sorumluluğunu üstlenin

Pagiera'nın görsel form denetimleri, yönetilen bir gelen kutusu veya ödeme hizmeti değildir. Uygulamanız gönderimleri alıp doğrulamalı, gerektiğinde yetkilendirmeyi uygulamalı, kötüye kullanımı önlemeli ve yararlı başarı ya da hata geri bildirimi döndürmelidir. Bir sunucu kimlik bilgisini asla gizli bir alana yerleştirmeyin.

## Dosya alanları

FileInput tarayıcıda bir dosya seçer. Yükleme uç noktanız boyut ve tür sınırlarını, depolama politikasını ve erişim denetimlerini uygulamalıdır. Gerçek gönderim kodlamasını ve yükleme akışını ana uygulamanızda test edin.

## Ziyaretçi deneyimini doğrulayın

Klavye gezinmesini, etiketleri, zorunlu alanları, geçersiz girdiyi, yinelenen gönderimi, ağ hatasını ve başarılı yanıtı test edin. Yalnızca düzenleyici tuvalini değil, herkese açık görünümün önizlemesini de kontrol edin.`,

  interactions: `## Durumlar ve hareket

Düzenleyici; giriş, döngü ve kaydırma efektlerinin yanında üzerine gelme ve basma stillerini destekler. Okunabilir, durağan bir tasarımla başlayın, her seferinde bir efekt ekleyin ve ardından önizlemede doğrulayın. Süreyi ve hız eğrisini bilinçli kullanın; temel içeriğin uzun bir animasyona bağlı olmasından kaçının.

## Tıklama eylemleri

Yerel tıklama etkileşimleri navigate, scroll-to, toggle-layer, show-layer ve hide-layer içerir. Hedefi bilinçli belirleyin ve katmanları çoğalttıktan veya sildikten sonra hâlâ var olduğunu doğrulayın. Mümkün olduğunda sıradan gezinme için gerçek bir bağlantı kullanın.

## Döngülü slaytlar ve kayan içerik

1. Etkileşimli kompozisyonu ekleyin ve yerel alt içeriğini düzenleyin.
2. Otomatik oynatmayı, aralığı ve yönü yapılandırın.
3. Döngülü slaytlar için okları, noktaları, kaydırma hareketini, döngüyü, üzerine gelince duraklatmayı ve geçiş ayarlarını inceleyin.
4. Tek öğeyle ve birden çok öğeyle önizleyin, ardından dar ekranları test edin.

Döngülü slayt ayarları kayma, solma ve yakınlaştırma geçişlerini destekler. Kayan içerik sürekli hareket eder; ziyaretçilerin hareketli metni takip etmesini gerektirmeden temel bilgiyi erişilebilir tutun.

## Sekmeler ve akordeon

Başlıklar ve paneller düzenlenebilir katmanlar olarak kalır. Bir tetikleyici ile paneli, açılır kapanır kompozisyon içinde ortak bir hedef kimliğini paylaşır. Düzenlerken eşleşen hedefleri koruyun. Oluşturulan sayfada odağı, klavye davranışını ve görünür içeriği doğrulayın.

## Efektler ve erişilebilirlik

Metin efektleri ve gölgelendirici görselleri dekoratif iyileştirmelerdir; okunabilir metnin yerini tutmaz. Kontrastı, azaltılmış hareket tercihlerini ve düşük güçlü cihazları test edin. Her efektin her erişilebilirlik gereksinimine otomatik olarak uygun olduğunu varsaymayın.`,

  "ai-mcp": `## Yapay zekâ ile üretim iş akışı

Yapay zekâ ile üretim, sunucu tarafındaki OpenRouter yapılandırmanızı kullanır. Anahtarı tarayıcı paketlerinin dışında tutun. Düzenleyici arayüzündeki hataları araştırmadan önce modeli sunucuda yapılandırın ve sağlayıcı erişimini doğrulayın.

1. Mevcut çalışmanızı kaydedin.
2. Sayfanın amacını, yapısını, içeriğini ve duyarlı tasarım beklentilerini açıklayın.
3. Stüdyoda amaçlanan düzenleme kapsamını seçin.
4. Üretilen yerel katmanları gözden geçirin ve duyarlı sonucu inceleyin.
5. Kaydedin ve önizleyin; yalnızca açık bir incelemeden sonra yayımlayın.

İstemcinin generate işlemi, akış hâlinde olayları ve iptali destekler. İptal edilen veya başarısız olan çalışmayı tamamlanmamış sayın ve yeniden denemeden önce mevcut belgeyi inceleyin. Redis, yapay zekâ istek hızı sınırlamasına katılır; sağlayıcı sınırları ve faturalandırma ayrıdır.

## MCP keşfi

Sunucu yapılandırması, işletmeciye ait MCP sunucularını stdio, HTTP veya SSE taşıma yöntemleriyle kaydedebilir. Arka uç, keşif için listeleme ve inceleme işlemleri sunar. Bu entegrasyon, tarayıcı kullanıcısına sınırsız araç çalıştırma yetkisi vermez.

İstekte bulunan kullanıcının yetkisini kontrol etmek için authorizeMcp yapılandırın. Komut yolları, argümanlar, ortam değişkenleri ve uzak uç noktalar sunucunun denetiminde olmalıdır; ziyaretçilerden keyfî bağlantı yapılandırmaları kabul etmeyin.

## Ajanla düzenleme

Terminalde çalışan bir kodlama ajanı için [CLI iş akışını](/docs/cli) kullanın. MCP keşfi ile CLI üzerinden belge düzenleme ayrı yeteneklerdir. İkisi de ana uygulamanın kimlik doğrulamasının veya yayımlamak için açık onayın yerini almaz.`,

  cli: `## Kullanılabilirlik

CLI mevcut kaynak ağacına dâhildir. Henüz yayımlanmamış bu uygulama, eski bir npm sürümünün komutu içerdiğine dair bir vaat değildir. Bu depoda paketi derledikten sonra node packages/pagiera/cli/main.mjs help çalıştırın. bin girişini içeren bir paket sürümünde pagiera komutunu paket çalıştırıcınız üzerinden kullanın.

## Düzenlemeden önce inceleyin

Bu komutları depo kökünden çalıştırın. schema komutu derlenmiş paketin sözleşmesini okur.



~~~bash
node packages/pagiera/cli/main.mjs help
node packages/pagiera/cli/main.mjs schema
node packages/pagiera/cli/main.mjs inspect --url http://localhost:3000/api/pagiera
node packages/pagiera/cli/main.mjs page get PAGE_ID
~~~

Varsayılan API tabanı http://localhost:3000/api/pagiera adresidir. --url veya PAGIERA_URL ile değiştirin. PAGIERA_TOKEN, ana uygulamanızın kabul ettiği bir taşıyıcı belirteç sağlar; CLI kimlik doğrulama oluşturmaz. Kimlik bilgilerini gönderirken localhost dışında HTTPS kullanın.

## Doğrulayın ve oluşturun

Yerel belge biçiminde bir JSON dosyası yazın, ardından sayfa oluşturmadan önce doğrulayın. Sonraki örneklerdeki yer tutucu kimliği ve sürümü sunucunuzun döndürdüğü değerlerle değiştirin.

~~~bash
node packages/pagiera/cli/main.mjs page validate --file page.json
node packages/pagiera/cli/main.mjs page create --name "About" --slug /about --file page.json
~~~

Oluşturma işlemi sayfayı oluşturur, belgeyi kaydeder ve yeniden okur. Oluşturmadan sonra kaydetme başarısız olursa hata, oluşturulan sayfanın kimliğini içerir; kopya oluşmasını önlemek için yeniden denemeden önce bu sayfayı inceleyin.

## Başka bir düzenleyicinin çalışmasının üzerine yazmadan güncelleyin

~~~bash
node packages/pagiera/cli/main.mjs page get PAGE_ID
node packages/pagiera/cli/main.mjs page update PAGE_ID --file page.json --expected-version 3
node packages/pagiera/cli/main.mjs page preview PAGE_ID
~~~

Güncellemeler belgenin tamamını değiştirir. İlgisiz alanları koruyun. Revizyon çakışmasında körlemesine yeniden denemek yerine en son sayfayı alın ve değişiklikleri uzlaştırın. preview komutu, alışılmış yapıda bir önizleme URL'si döndürür; bu rotayı ana uygulamanız uygulamalıdır.

## Yalnızca onayla yayımlayın

~~~bash
node packages/pagiera/cli/main.mjs page publish PAGE_ID
~~~

Yayımlama, kaydetmeden ayrıdır. Komutlar JSON döndürür; hatalar stderr akışına JSON yazar ve sıfırdan farklı çıkış koduyla sonlanır. Yapısal doğrulama, görsel doğruluğu veya eksiksiz stil doğrulamasını garanti etmez.`,

  revisions: `## İki farklı sürüm

document.version serileştirme biçimini belirtir. page.version kaydedilmiş sayfanın revizyonunu belirtir. Kaydederken expectedVersion olarak sayfa revizyonunu kullanın. Bunun yerine asla belge biçimi numarasını koymayın.

## Kaydetme sırası

1. En son sayfayı yükleyin ve sürümünü saklayın.
2. İlgisiz alanları atmadan belgeyi düzenleyin.
3. Bu beklenen sürümle kaydedin.
4. Yalnızca HTTP durum kodunu değil, döndürülen durumu da kontrol edin.
5. Döndürülen yeni sürümü saklayın ve önemli değişiklikleri yeniden okuyun.

HTTP isteğinin kendisi başarılı olsa bile kaydetme işlemi çakışma sonucu döndürebilir. Çakışmada yeniden yükleyin ve düzenlemeleri uzlaştırın; otomatik ve körlemesine yeniden deneme, başka birinin çalışmasının yerini alma riski taşır.

## Bir revizyonu geri yükleyin

İstemci bağdaştırıcıları listRevisions ve restoreRevision işlemlerini sunar. Hedef revizyonu inceleyin, amaçlanan kurtarmayı kullanıcıyla doğrulayın ve geri yüklemeden sonra yeniden yükleyin. Önizleme ve yayımlamayı ayrı doğrulama adımları olarak tutun; bir taslağı geri yüklemenin siteyi yeniden yayımladığını varsaymayın.

## İşletim sırasında kurtarma

Revizyon geçmişi düzenleme hatalarından kurtulmaya yardımcı olur, ancak veritabanı yedeği değildir. [Dağıtım](/docs/deployment) sayfasında anlatıldığı gibi PostgreSQL yedekleri tutun ve geri yüklemeleri test edin.`,

  "fonts-assets": `## Site yazı tiplerini kaydedin

Ana uygulamanızda kullanılabilen next/font değişkenlerini kaydetmek için pagiera/provider içindeki PagieraProvider bileşenini kullanın. Her yazı tipi kaydında variable ve title bulunur. Stüdyodaki site yazı tipi seçiminin tuvale, önizlemeye ve yayımlanmış çıktıya uygulanması amaçlanır.

1. Yazı tipini ana uygulamanızda yükleyin.
2. Değişkenini ve okunabilir başlığını sağlayıcıya kaydedin.
3. Stüdyonun tipografi ayarlarında site yazı tipini seçin.
4. Yazı tipinin hem önizleme hem herkese açık rotalarda yüklendiğini doğrulayın.

Tam düzenleyici, stüdyo arayüzü için kendi Figtree yazı tipiyle gelir; bu, web sitenizin tipografisinden ayrıdır. Entegrasyon bağlamı için [Next.js kurulumu](/docs/nextjs-setup) sayfasına bakın.

## Görseller, video ve simgeler

Uygun boyutlara ve kullanım haklarına sahip varlıklar seçin. Anlamlı görsel alternatif metni sağlayın, düzende alan ayırın ve yükleme hatalarını test edin. Semboller için simge kütüphanesini kullanın, ancak önemli denetimlerde görünür metni veya erişilebilir bir adı koruyun.

## Haricî medya

Uzak görseller, videolar ve gömülü içerikler hâlâ kaynaklarına ve uygulamanızın tarayıcı güvenlik politikasına bağlıdır. Bir URL'nin sizin bilgisayarınızda çalışmasının her ziyaretçi için erişimi garanti ettiğini varsaymayın. Yayımlanan sayfaları düzenleyici oturumu olmadan test edin.

## Teslim kontrolleri

Büyük varlıkları yavaş bağlantıda inceleyin, birincil içeriği dekoratif medyanın içine gizlemekten kaçının ve yedek yazı tipine geçişin denetimlerde taşmaya yol açmadığını doğrulayın.`,

  deployment: `## Ana uygulama ortamını hazırlayın

1. Pagiera arka ucu bağlanmış, sunucu çalıştırabilen bir Next.js uygulamasını dağıtın.
2. PostgreSQL ve Redis URL'lerini yalnızca sunucuya açık yapılandırmayla sağlayın.
3. OpenRouter'ı yalnızca yapay zekâ ile üretim gerekiyorsa yapılandırın.
4. Düzenleyici, veri değiştirme ve önizleme rotalarını ana uygulamanın kimlik doğrulaması ve yetkilendirmesiyle koruyun.
5. Hedef ortamda sağlık durumunu, kaydetmeyi, önizlemeyi ve herkese açık sayfa oluşturmayı kontrol edin.

Bir sayfayı yayımlamak uygulama verisini günceller; ana uygulamayı dağıtmaz veya altyapı sağlamaz.

## Sunucu yapılandırması

| Seçenek | Amaç |
| --- | --- |
| postgresUrl | PostgreSQL bağlantısı |
| redisUrl | Redis bağlantısı |
| openRouterApiKey / openRouterModel | Yapay zekâ sağlayıcısı yapılandırması |
| basePath | Bağlanan API'nin temel yolu |
| aiRateLimitPerMinute | Yapay zekâ istek sınırı |
| templateRegistryUrl | Şablon kayıt deposunun uzak kaynağı |
| allowPrivateHosts | Özel ağdaki veri kaynağı sunucuları için açık istisnalar |
| maxSourceBytes | Azami kaynak yanıt boyutu; varsayılan 2 MB |
| mcpServers / authorizeMcp | İşletmeciye ait MCP bağlantıları ve yetkilendirme |

Kesin imzalar için sunucu tür tanımlarını kullanın. Özel ağ sunucusu istisnalarını veya MCP komut yapılandırmasını herkese açık kullanıcı girdisi olarak sunmayın.

## Veri ve önbellek yaşam döngüsü

PostgreSQL kalıcı depolamadır. Redis; yayımlanmış sayfa önbelleğine, şablon önbelleğine ve istek hızı sınırlamasına katılır. Veritabanını yedekleyin; önbelleği kurtarma kopyanız olarak görmeyin. Dağıtımınızdaki güncelliğini yitirmiş içerik davranışını yakalamak için yayımlamayı ve yayından kaldırmayı çalışma ortamı üzerinden test edin.

## Sürüm çıkarma kontrol listesi

Yetkisiz isteklerin reddedildiğini, gizli bilgilerin sunucuda kaldığını, taslak rotalarının gizli kaldığını, veri kaynağı hatalarının öngörülebilir davrandığını ve yedeklerin geri yüklenebildiğini doğrulayın. Kimlik bilgilerini günlüğe kaydetmeden veritabanı bağlantısını, istek hatalarını ve yapay zekâ sağlayıcısı hatalarını izleyin. Üretime geçmeden önce [güvenlik](/docs/security) sayfasını okuyun.`,

  changelog: `## Henüz yayımlanmamış değişiklikler

Bu kayıtlar yayımlanmış bir npm sürümünü değil, mevcut kaynak ağacındaki çalışmaları açıklar. Pakette kullanılabilirlik, kurduğunuz sürüme göre kontrol edilmelidir.

### Dokümantasyon

- Düz renkli marka vurguları ve eylemler için Pagiera'nın mor ana rengi korundu; nötr gri biçimlendirme marka paletinin yerini almak yerine çevredeki yüzeylere uygulandı.
- Web sitesi ve el kitabı yüzeyleri nötr gri bir palette birleştirildi. Gezinme; kayan menü içeriği ve ortak animasyonlu gezinme vurgusuyla Oluştur, Entegre et ve Yayımla iş akışları etrafında yeniden düzenlendi.
- Tanıtım sayfalarının gezinme renkleri yumuşak kömür grisi cam, gri üzerine gelme yüzeyleri ve nötr açılır menülerle nötrleştirildi; dokümantasyon renkleri değişmedi.
- Tanıtım sayfalarının gezinme çubuğu üstte şeffaf, kaydırıldığında buzlu cam görünümüne getirildi; bağlantı alt çizgileri yerine üzerine gelme, odak ve etkin durumlar için yuvarlatılmış arka planlar eklendi. Dokümantasyon gezinmesi değişmedi.
- Tanıtım sayfalarının gezinmesi, ayrı animasyonlu mega menü açılır panellerine sahip ortalanmış yuvarlak bir kapsüle dönüştürüldü. Dokümantasyon gezinmesi değişmedi.
- Web sitesi gezinmesi, logo ve eylem genişliklerinden bağımsız olarak ortalandı; azaltılmış hareket desteğiyle animasyonlu üzerine gelme, odak ve etkin durum alt çizgileri eklendi.
- Gruplandırılmış gezinme ve üç sütunlu okuma düzeni korunurken mega menüler ve el kitabı, Pagiera'nın mor vurguları, açık sütunları ve daha yumuşak yüzeyleriyle iyileştirildi.
- Mobilde genişletilebilir gruplarla Ürün, Geliştiriciler ve Kaynaklar mega menüleri eklendi. Dokümantasyon, kesintisiz gezinme şeritleri ve kaynak bağlantıları içeren editoryal bir üç sütunlu el kitabı olarak yeniden biçimlendirildi.
- Ortak web sitesi gezinmesi; ortalanmış bağlantılar, bir Başlayın eylemi ve klavyeyle erişilebilen duyarlı bir menüyle yenilendi. Dokümantasyon üst bilgisi ayrı kaldı.
- Sabitlenen dokümantasyon yan şeritleri makale ve üst bilgiyle hizalandı, kaydırmaları görünür görünüm alanıyla sınırlandı ve menü sınırında kenar çubuğu kaydırmasının makaleyi hareket ettirmesi önlendi.
- Yerel el kitabı; mimari, stüdyo iş akışı, yerel bloklar, belge yapısı, duyarlı tasarım, bileşenler ve düzenler, formlar, etkileşimler, yapay zekâ ve MCP, CLI, revizyonlar, yazı tipleri ve varlıklar ile dağıtım rehberleriyle genişletildi.
- Bu değişiklik günlüğü ve bir dokümantasyon bakım politikası eklendi.
- Web sitesi derleme iş akışına katalog, içerik, iç bağlantı ve yerel blok kapsamı kontrolleri eklendi.
- Tam düzenleyici stil dosyası içe aktarımı pagiera/full.css olarak düzeltildi.
- Dokümantasyon kataloğu makine tarafından okunabilir site dizinine eklendi.

### Ajan araçları

- Sayfaları incelemek, belge sözleşmesini okumak, dosyaları doğrulamak, yerel belgeler oluşturup güncellemek, önizleme URL'si almak ve açıkça yayımlamak için kaynak ağacında bir CLI eklendi.
- Güncellemeler beklenen bir sayfa revizyonu gerektirir. Kaydetme çakışmaları başarılı yazma sayılmak yerine hata olarak bildirilir.
- CLI doğrulaması yapısaldır; oluşturulmuş önizleme ve ana uygulama yetkilendirmesi yine gereklidir.

## Yayımlanan sürüm kayıtları

Burada geçmiş sürüm notları yeniden oluşturulmaz. Bir sürüm gerçekten yayımlandığında, doğrulanmış değişikliklerini gerçek sürüm numarası ve yayımlanma tarihi altına taşıyın; ilgili yerlerde uyumluluğu bozan değişiklikleri ve geçiş adımlarını ekleyin.`,

  "getting-started": `## Başlamadan önce

Pagiera uygulamanızın içinde çalışır. Kimlik doğrulama, sayfa verisi ve dağıtım sizin denetiminizde kalır. Tam stüdyo entegrasyonu için Node.js 20 veya üzeri, React 18.3 veya üzeri, Next.js App Router, PostgreSQL ve Redis gerekir. OpenRouter isteğe bağlıdır ve yalnızca yapay zekâ destekli üretim için gereklidir.

## Paketi yükleyin

Paket yöneticinize uygun komutu seçin:

\`\`\`bash
bun add pagiera
# or
npm install pagiera
\`\`\`

### Düzenleyicinin stil dosyasını içe aktarın

Tam stüdyo stil dosyasını kendi geçersiz kılmalarınızdan önce ekleyin. Düzenleyici rotasının kullandığı kök stil dosyasında bir kez içe aktarın.

\`\`\`css
@import "tailwindcss";
@import "pagiera/full.css";
\`\`\`

## Hizmetleri yapılandırın

\`.env.local\` oluşturun ve gerekli iki hizmet URL'sini ekleyin. Bu değerleri sunucuda tutun; bunları asla bir \`NEXT_PUBLIC_\` değişkeni üzerinden açığa çıkarmayın.

\`\`\`env
PAGIERA_POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/pagiera
PAGIERA_REDIS_URL=redis://localhost:6379

# Optional: needed only for AI generation
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
\`\`\`

PostgreSQL projeleri, taslakları ve yayımlanmış belgeleri saklar. Redis, yayımlanmış sayfaları ve şablon paketlerini önbelleğe alır ve yapay zekâ istek hızı sınırlaması sağlar.

## Kurulumu doğrulayın

[Next.js kurulumu](/docs/nextjs-setup) ile devam edin, sunucu rotasını bağlayın ve ardından \`/api/pagiera/health\` adresini açın. Kimlik doğrulama kontrolünüzü eklemeden stüdyoyu herkese açmayın.`,

  "nextjs-setup": `## Sunucu rotasını oluşturun

Pagiera, düzenleyici ve çalışma ortamı işlemleri için tüm alt yolları yakalayan tek bir işleyici sunar. \`src/app/api/pagiera/[...path]/route.ts\` oluşturun:

\`\`\`ts
import { createPagieraRouteHandlers, pagieraConfigFromEnv } from "pagiera/server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const handlers = createPagieraRouteHandlers(pagieraConfigFromEnv());
export const { GET, POST, PUT, PATCH, DELETE } = handlers;
\`\`\`

### Rotayı koruyun

Pagiera sizin için bir kimlik doğrulama sağlayıcısı seçmez. Düzenleyici isteklerini iletmeden önce normal oturum veya rol kontrolünüzü çalıştırın. Herkese açık sayfa oluşturma işlemi açık kalabilir; düzenleme ve yayımlama uç noktaları açık kalmamalıdır.

## Düzenleyicinin başlangıç verilerini yükleyin

İlk belgeyi sunucuda alın. Bu, ilk oluşturmanın belirlenebilir olmasını sağlar ve yalnızca yükleniyor durumu gösteren bir düzenleyici kabuğunu önler.

\`\`\`ts
// src/lib/editor-bootstrap.ts
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

export async function editorBootstrap(pageId?: string) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const bootstrap = await server.getEditorBootstrap(pageId);
  if (!bootstrap) throw new Error("Editor page not found");
  return bootstrap;
}
\`\`\`

## Stüdyoyu bağlayın

İzin kontrolünü yapan ve başlangıç verilerini yükleyen bir sunucu sayfası oluşturun. Bu sonucu, etkileşimli düzenleyiciyi içeren küçük bir istemci sarmalayıcısına aktarın.

### Sınırı açık tutun

- Sunucu bileşeni: kimlik doğrulama, rota parametreleri ve başlangıç verilerinin yüklenmesi.
- İstemci bileşeni: stüdyo etkileşimleri ve düzenleyici içi gezinme.
- API rotası: kaydetme, önizleme, yayımlama ve varlık işlemleri.

## Sağlık kontrolünü çalıştırın

Next.js'i başlatın ve \`/api/pagiera/health\` adresini ziyaret edin. Düzenleyiciyi açmadan önce PostgreSQL veya Redis hatalarını giderin. Yapay zekâ yapılandırılmışsa seçilen OpenRouter modelinin kullanılabilir olduğunu doğrulayın.`,

  publishing: `## Üç durumu anlayın

Kaydetme, önizleme ve yayımlama bilinçli olarak ayrılmıştır. **Kaydet** taslağı günceller. **Önizle** bu taslağı korumalı bir rota üzerinden görüntüler. **Yayımla** herkese açık sürümün yerini alır. İçerik yayımlamak, Next.js uygulamanızı dağıtmaz veya alan adı yapılandırmaz.

## Yayımlanan sayfayı oluşturun

Onaylanmış belgeyi sunucuda yükleyin ve öğelerini çalışma ortamına aktarın.

\`\`\`tsx
import { notFound } from "next/navigation";
import { RenderedPage } from "pagiera/runtime";
import { getPagieraServer, pagieraConfigFromEnv } from "pagiera/server";

export async function PublishedPage({ slug }: { slug: string }) {
  const server = await getPagieraServer(pagieraConfigFromEnv());
  const page = await server.getPublishedPage(slug, { page: { slug } });
  if (!page) notFound();
  return <RenderedPage elements={page.elements} />;
}
\`\`\`

## Korumalı bir önizleme rotası ekleyin

Önizleme rotası bir sayfa kimliği kabul etmeli, mevcut kullanıcının sayfayı düzenleyebildiğini doğrulamalı, taslağı yüklemeli ve üretimde kullanılan aynı çalışma ortamıyla oluşturmalıdır. Önizleme URL'lerinin arama sonuçlarına girmemesi için \`noindex\` üst verisi ekleyin.

## Güvenle yayımlayın

1. Geçerli taslağı kaydedin.
2. Korumalı önizlemeyi masaüstü, tablet ve mobil genişliklerinde açın.
3. Dinamik veriyi gerçekçi rota ve sorgu değerleriyle doğrulayın.
4. Stüdyodan yayımlayın.
5. Herkese açık URL'ye yeni bir oturumda istek gönderin.
6. İlk HTML'nin önemli metin ve verileri içerdiğini doğrulayın.

### Geri alma stratejisi

Sayfa belgesini üretim verisi olarak değerlendirin. Veritabanı yedekleri tutun ve iş akışınız onay geçmişi gerektiriyorsa yayımlanmış revizyonları değiştirmeden önce kaydedin.`,

  "data-binding": `## Request veya Repeat seçin

Bir uç nokta tek nesne döndürdüğünde **Request** bloğu kullanın. Bir listenin her öğesi için bir görsel alt ağaç oluşturulması gerektiğinde **Repeat** bloğu kullanın. Yayımlanmış sayfalardaki istekler, HTML döndürülmeden önce sunucuda çözümlenir.

## Rota ve sorgu değerlerini kullanın

Sayfa kısa adı, \`blog/:slug\` gibi adlandırılmış parametreler içerebilir. Eşleşen değerleri yayımlanmış sayfa bağlamına aktarın:

\`\`\`ts
{
  params: { slug: "introducing-pagiera" },
  query: { preview: "true" },
  page: { slug: "blog/:slug" }
}
\`\`\`

İstek URL'lerinde, başlıklarında veya gövdelerinde bu değerlere başvurun:

\`\`\`text
https://api.example.com/posts/{{params.slug}}
https://api.example.com/search?q={{query.q}}
\`\`\`

## Döndürülen alanları bağlayın

Metinleri, görselleri, bağlantıları ve görünürlük kurallarını isteğin döndürdüğü alanlara bağlayın. Repeat bloklarında tekrarlanan her alt ağaç, geçerli öğeyi yerel veri bağlamı olarak alır.

### Yüklemeyi ve hataları ele alın

Sunucuda oluşturulan yayımlanmış çıktı için istemci tarafında bir yükleme aşaması yoktur. Boş ve hata durumlarını açıkça tasarlayın. Veri kaynağı \`page-404\` davranışını kullanıyorsa uzak kaynaktan gelen bir 404, rotanın tamamını 404 yanıtına dönüştürebilir.

## Sayfaları dizine eklenebilir tutun

Temel içeriği, istemcide etkileşimlerin bağlanmasından sonra çalışan bir efekte taşımayın. “Sayfa kaynağını görüntüle” veya bir HTTP isteğiyle başlıkların, açıklamaların ve birincil sayfa metninin döndürülen HTML'de bulunduğunu doğrulayın.`,

  templates: `## Bir şablon neler içerir?

Pagiera şablonu doğrulanmış bir belge paketidir: sayfalar, yeniden kullanılabilir bileşenler, bağlı düzenler, varlıklar ve şablon tarayıcısında sunulması için gereken üst veriler.

## Kayıt deposunu yapılandırın

Sunucuyu denetlediğiniz bir kayıt deposuna yönlendirin veya resmî kayıt deposunu kullanın:

\`\`\`env
PAGIERA_TEMPLATE_REGISTRY_URL=https://raw.githubusercontent.com/voilabs/pagiera/main/templates/registry.json
\`\`\`

## Bir şablon yükleyin

Tarayıcı arka ucunuza yalnızca seçilen şablonun kimliğini gönderir. Sunucu yapılandırılmış paketi indirir, doğrular ve projeyi atomik olarak değiştirir. Böylece kayıt deposuna duyulan güvenin yönetimi ve ağ erişimi sunucuda kalır.

### Yüklemeden önce

- Değiştirilmemesi gereken çalışmaları kaydedin veya dışa aktarın.
- Hedef projeyi doğrulayın.
- Şablonda listelenen sayfaları ve varlıkları inceleyin.
- Kayıt deposu URL'sinin HTTPS kullandığından ve güvenilir bir yayımlayıcıya ait olduğundan emin olun.

## Kendi kayıt deponuzun bakımını yapın

Paketleri sürümlendirin, kimlikleri sabit tutun ve her sürümü temiz bir projede doğrulayın. Mevcut bir sürümü yerinde değiştirmekten kaçının; kurulumların tekrarlanabilir kalması için yeni bir sürüm yayımlayın.`,

  "api-reference": `## Sunucu API'si

Yalnızca sunucuya yönelik işlevleri \`pagiera/server\` üzerinden içe aktarın. Bu giriş noktasını asla bir istemci bileşenine dâhil etmeyin.

### createPagieraRouteHandlers

Tüm alt yolları yakalayan sunucu rotasının kullandığı GET, POST, PUT, PATCH ve DELETE işleyicilerini oluşturur.

### pagieraConfigFromEnv

Belgelenmiş ortam değişkenlerinden sunucu yapılandırmasını oluşturur ve gerekli değerleri doğrular.

### getPagieraServer

Düzenleyici başlangıç verilerini, taslakları ve yayımlanmış sayfaları yüklemek için kullanılan sunucu arayüzünü döndürür.

\`\`\`ts
const server = await getPagieraServer(pagieraConfigFromEnv());
const bootstrap = await server.getEditorBootstrap(pageId);
const published = await server.getPublishedPage(slug, context);
\`\`\`

## Çalışma ortamı API'si

Onaylanmış öğeleri oluşturmak için \`RenderedPage\` bileşenini \`pagiera/runtime\` üzerinden içe aktarın. Dinamik blokların ilk HTML'ye çözümlenmesi için oluşturmadan önce istek bağlamını sunucuya aktarın.

## İstemci API'si

Stüdyo istemcisi, sunucunun ürettiği başlangıç verilerini alır. Gezinme geri çağrılarını ve yalnızca düzenleyiciye ait durumu bu sınır içinde tutun; kimlik bilgileri ve veritabanı yapılandırması sunucuda kalır.

## Paket dışa aktarımları

- \`pagiera/server\` — veritabanı, önbellek, rota işleyicileri ve belge yükleme.
- \`pagiera/runtime\` — üretim sayfalarının oluşturulması.
- \`pagiera/full.css\` — tam stüdyo stilleri.
- Hafif dışa aktarımlar — yalnızca daha sınırlı bir düzenleme yüzeyi gömerken kullanın.`,

  security: `## Güven sınırını tanımlayın

Pagiera bir kimlik doğrulama ürünü değil, düzenleyici ve yayımlama yapı taşları sunar. Projeleri kimin listeleyebileceğine, taslak açabileceğine, varlık yükleyebileceğine ve sayfa yayımlayabileceğine uygulamanız karar verir.

## Düzenleyici rotalarını koruyun

Stüdyoyu oluşturmadan önce kimliği doğrulanmış bir oturum ve açık bir düzenleyici rolü şart koşun. Yetkilendirme kontrolünü API işleyicilerinde tekrarlayın; bir gezinme bağlantısını gizlemek erişim denetimi değildir.

## Gizli bilgileri sunucuda tutun

PostgreSQL, Redis ve OpenRouter kimlik bilgileri asla \`NEXT_PUBLIC_\` önekini kullanmamalıdır. Bunları düzenleyicinin başlangıç verilerine serileştirmeyin veya sağlık uç noktalarından döndürmeyin.

## Haricî veriyi doğrulayın

Şablon kayıt depolarını ve Request bloklarının kullandığı API'leri haricî girdi olarak değerlendirin. HTTPS kullanın, mümkün olduğunda sunucuları izin listesine alın, yanıt boyutlarını sınırlayın ve kullanıcıların sağladığı keyfî başlıkları iletmekten kaçının.

## Üretim kontrol listesi

- Düzenleyici ve önizleme rotaları kimlik doğrulama gerektirir.
- Uygun olduğunda yayımlama, sıradan düzenlemeye göre daha dar kapsamlı bir rol gerektirir.
- Veritabanı ve Redis bağlantıları üretim kimlik bilgileri ve şifreleme kullanır.
- Önizleme sayfaları \`noindex\` gönderir.
- Yedekler ve bir belge kurtarma süreci vardır.
- Günlükler gizli bilgileri veya yetkilendirme başlıklarının tamamını içermez.`,

  troubleshooting: `## Sağlık uç noktası başarısız oluyor

\`/api/pagiera/health\` adresini açın ve ilk başarısız bağımlılığı ele alın. Ortam değişkenlerinin Next.js sunucu sürecinde kullanılabilir olduğunu doğrulayın, ardından PostgreSQL ve Redis'i birbirinden bağımsız test edin.

## Düzenleyicide stiller görünmüyor

\`pagiera/full.css\` dosyasını kendi stil dosyanızdan önce içe aktarın. CSS \`@import\` kuralları normal stil kurallarından önce gelmelidir. Kök stil dosyasını değiştirdikten sonra geliştirme sunucusunu yeniden başlatın.

## getEditorBootstrap bir işlev değil

Uygulamanız ve oluşturulan kilit dosyası farklı paket sürümlerini çözümlüyor olabilir. Kurulu \`pagiera\` sürümünü inceleyin, bağımlılıkları yeniden yükleyin ve Next.js'i yeniden başlatın.

## Yapay zekâ ile üretim başarısız oluyor

\`OPENROUTER_API_KEY\` değerinin sunucuda bulunduğunu ve \`OPENROUTER_MODEL\` değerinin hesabın erişebildiği bir modeli adlandırdığını doğrulayın. Yapay zekâ isteğe bağlıdır; temel düzenleyiciyi teşhis ederken yapılandırmasını kaldırın.

## Yayımlanan API verisi HTML'de eksik

Yayımlanmış belgeyi istek bağlamıyla birlikte sunucuda yükleyin. Rota parametrelerinin ve sorgu değerlerinin Request bloklarındaki yer tutucularla eşleştiğini doğrulayın. Yalnızca istemci etkileşimleri bağlanmış tarayıcı görünümünü değil, ham HTML yanıtını inceleyin.

## Sayfa kaydediliyor ancak herkese açık görünüm değişmiyor

Kaydetme yalnızca taslağı değiştirir. Taslağı doğrulamak için önizlemeyi açın, ardından yayımlayın. Herkese açık sayfa eski kalıyorsa Redis bağlantısını ve önbellek geçersiz kılmayı kontrol edin.`,

  agents: `## Amaç

Sayfaları yerel Pagiera belgeleri olarak oluşturun; böylece kodlama ajanı işini bitirdikten sonra bir insan bunları açabilir, düzenleyebilir, önizleyebilir ve yayımlayabilir. İstenen düzenlenebilir sayfanın yerine ayrı, sabit kodlanmış bir React sayfası koymayın.

## Entegrasyon sırası

1. Uygulamanın mevcut kimlik doğrulama, yönlendirme ve biçimlendirme kurallarını inceleyin.
2. Pagiera'yı yükleyin ve düzenleyici stil dosyasını içe aktarın.
3. PostgreSQL ve Redis'i yalnızca sunucuya açık ortam değişkenleriyle yapılandırın.
4. Tüm alt yolları yakalayan sunucu rotasını bağlayın.
5. Korumalı bir stüdyo rotası ve sunucuda başlangıç verisi yükleme işlemi ekleyin.
6. Yerel sayfa belgeleri oluşturun veya içe aktarın.
7. Kaydetmeyi, önizlemeyi ve yayımlamayı ayrı ayrı doğrulayın.

## Düzenlenebilirliği koruyun

Yerel öğeleri, bileşenleri, varyantları ve bağlı düzenleri kullanın. Ortak gezinmeyi ve alt bilgileri alt içerik yer tutucusu olan bir düzene koyun. Veri alma mantığını ilgisiz bir istemci bileşeninde gizlemek yerine veri için Request ve Repeat bloklarını kullanın.

## Doğrulama sözleşmesi

- Düzenleyici kimlik doğrulaması arkasında açılır.
- Sayfa belgesi görsel olarak seçilebilir ve değiştirilebilir.
- Kaydetme sessizce yayımlamaz.
- Önizleme geçerli taslağı oluşturur.
- Yayımlama herkese açık sayfayı günceller.
- Temel dinamik içerik sunucuda oluşturulan HTML'de bulunur.
- Hiçbir gizli bilgi tarayıcıya açılmaz.

## Sonucu bildirin

Hangi dosyaların değiştiğini, hangi ortam değişkenlerinin gerektiğini, düzenleyici rotasının nerede olduğunu ve kullanıcının nasıl önizleyip yayımlayabileceğini belirtin. Doğrulanmamış haricî bağımlılıkları açıkça bildirin.`,
};
