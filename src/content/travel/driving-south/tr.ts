import type { TravelPage } from "../types";

const tr: TravelPage = {
  meta: {
    title: "Atoll kiralık aracıyla Güney Kıbrıs'ta araç kullanımı: izin, sigorta ve kurallar",
    description: "Atoll kiralık aracınızı Güney Kıbrıs'a nasıl götürürsünüz: £50 izin belgesi, Metehan geçişinde Rum sigortası, çalışma saatleri, belgeler, geçiş noktaları ve trafik kuralları.",
  },
  breadcrumb: "Güney Kıbrıs'ta Sürüş",
  heroPhoto: "cyprus-road-sign",
  hero: {
    title: "Atoll aracınızla Güney Kıbrıs'a",
    lead: "Atoll araçları Kuzey Kıbrıs'tan Güney Kıbrıs'a geçebilir. Bunun için bizden alacağınız geçiş izin belgesine ve sınırda satın alacağınız Rum sigortasına ihtiyacınız var. Yola çıkmadan bilmeniz gereken her şey burada.",
    primary: { label: "Araç bul", href: "/#search" },
    secondary: { label: "Güney Kıbrıs gezi rehberi", href: "/south-cyprus-guide" },
    updated: "Güncellendi:",
    updatedDate: "12 Kasım 2026",
  },
  facts: {
    title: "Bir bakışta",
    items: [
      ["Geçiş izin belgesi", "£50; yola çıkmadan Atoll Rent A Car'dan alınır."],
      ["Sigorta ve yol vergisi", "Yaklaşık £21; Rum sınır kapısında satın alınır (sınırda ödenir, değişebilir)."],
      ["Nereden alınır", "Yalnızca Lefkoşa'daki Metehan (Agios Dometios) geçişinde, hafta içi saat 14:00'e kadar."],
      ["Kapalı", "Hafta içi 14:00'ten sonra, hafta sonları ve Rum resmi tatillerinde."],
      ["Güney'deki kapsam", "Yalnızca 3. şahıs sigortası. Kiralık aracın kendisi kapsanmaz."],
      ["Belgeler", "Pasaport veya AB kimlik kartı, ehliyet, kira sözleşmesi ve geçiş izin belgemiz."],
      ["Hız sınırları", "Yerleşim yerinde 50 km/s, açık yolda 80 km/s, otoyolda 100 km/s (en az 65 km/s)."],
      ["Acil durum", "Güney'de 112 veya 199."],
    ],
  },
  sections: [
    {
      kind: "callout",
      id: "insurance",
      tone: "warn",
      title: "Güney'de sigortanız",
      text: "Araç Güney Kıbrıs sınırını geçtiği andan itibaren artık Atoll Rent A Car tarafından tam olarak sigortalı değildir. Rum sınır kapısında yalnızca 3. şahıs (trafik) sigortası olan bir sigorta satın almanız gerekir. Satın aldığınız 3. şahıs sigortası kiralık aracı kapsamaz. Lütfen sınırda satın aldığınız sigortanın şartlarını mutlaka okuyun.",
    },
    {
      kind: "steps",
      id: "steps",
      title: "Kiralık aracı Güney Kıbrıs'a götürmek için adım adım",
      items: [
        { title: "İzin belgesini bizden alın", text: "Geçiş izin belgesinin ücreti £50'dır. Belge, aracı Türk sınır kapısından Rum sınır kapısına kadar götürmenize izin verir." },
        { title: "Türk sınır kapısında gösterin", text: "İzin belgesini geçişin Türk tarafındaki görevliye gösterin." },
        { title: "Rum tarafında pasaportları gösterin", text: "Türk sınır kapısından sonra Rum sınır kapısına varırsınız; araçtaki herkes pasaportunu veya AB kimlik kartını gösterir." },
        { title: "Sigortayı ve yol vergisini alın", text: "Rum sigortasını ve yol vergisini sınır kapısındaki ofislerden satın alın: yaklaşık £21, sınırda ödenir (ücret değişebilir)." },
        { title: "Güney Kıbrıs'ta sürüşe başlayın", text: "İzin belgesini ve sigorta evraklarını araçta saklayın ve yolculuğun tadını çıkarın." },
      ],
    },
    {
      kind: "callout",
      id: "hours",
      tone: "info",
      title: "Gezinizi ofis saatlerine göre planlayın",
      text: "Rum sigorta ofisleri yalnızca Lefkoşa'daki Metehan sınır kapısında bulunur, hafta içi yalnızca saat 14:00'e kadar açıktır ve Rum resmi tatillerinde kapalıdır. Gerekli belgeleri satın almazsanız Güney Kıbrıs'ta araç kullanmanıza izin verilmez. Ofislerin açık olup olmadığını öğrenmek için Rum sigorta ofisini +357 22 454700, yerel polisi +357 22 802838 numarasından arayabilirsiniz. Herhangi bir nedenle sınırı geçememeniz durumunda Atoll Rent A Car sorumlu tutulamaz.",
    },
    {
      kind: "rules",
      id: "crossings",
      title: "Geçiş noktaları",
      lead: "Atoll aracıyla sigorta ofislerinin bulunduğu Metehan'dan geçin. Diğer geçiş noktaları seçenekleri bilmeniz için listelenmiştir; birini kullanmayı planlıyorsanız önce bize danışın.",
      items: [
        { strong: "Metehan (Agios Dometios), Lefkoşa:", text: "araç ve yaya. Rum sigorta ofislerinin bulunduğu tek geçiş; Atoll aracıyla bunu kullanın." },
        { strong: "Lokmacı (Ledra Caddesi) ve Ledra Palace, Lefkoşa:", text: "yalnızca yaya. Eski şehrin iki yarısı arasında yürüyüş için pratik; aracı kuzey tarafta park edin." },
        { strong: "Bostancı (Zodia) ve Yeşilırmak (Limnitis):", text: "batıdaki araç geçişleri; Trodos ve Baf yönüne." },
        { strong: "Beyarmudu (Pergamos), Akyar (Strovilia) ve Derinya (Deryneia):", text: "doğudaki araç geçişleri; Larnaka ve Ayia Napa yönüne." },
      ],
    },
    {
      kind: "rules",
      id: "rules",
      title: "Güney'de trafik kuralları",
      items: [
        { strong: "Hız:", text: "yerleşim yerinde 50 km/s, açık yolda 80 km/s, otoyolda 100 km/s; otoyolda en düşük hız 65 km/s. Sabit ve mobil kameralar yaygındır, cezalar otomatik kesilir." },
        { strong: "Alkol:", text: "sınır 100 ml nefeste 22 µg; ehliyeti üç yıldan yeni olan sürücüler için 9 µg. En güvenlisi hiç içmemek." },
        { strong: "Emniyet kemeri ve telefon:", text: "tüm koltuklarda emniyet kemeri zorunludur, sürüş sırasında telefonu elde tutmak yasaktır." },
        { strong: "Çocuklar:", text: "uygun bir çocuk koltuğunda oturmalıdır. Rezervasyon yaparken bebek veya yükseltici koltuk isteyin." },
        { strong: "Döner kavşaklar:", text: "Kuzey'de olduğu gibi sağdan gelen trafiğe yol verin." },
        { strong: "Park:", text: "sarı çizgili yerlere park etmeyin; işaretli park yerlerini ve otoparkları kullanın, çoğu bozuk para veya kartla çalışır." },
      ],
      photo: "cyprus-speed-sign",
    },
    {
      kind: "rules",
      id: "tips",
      title: "Pratik ipuçları",
      items: [
        { strong: "Hafta içi sabah gidin.", text: "Sigorta ofisleri 14:00'te kapanır ve tatil öncesi kuyruklar uzar." },
        { strong: "Yanınızda Euro bulundurun.", text: "Güney'de fiyatlar Euro'dur; sınır, park ve küçük dükkânlar için biraz nakit taşıyın." },
        { strong: "Telefon tarifenize dikkat edin.", text: "Kuzey Kıbrıs SIM kartları Güney'de ek ücretle dolaşımda çalışır. Geçmeden önce çevrimdışı harita indirin." },
        { strong: "Otoyol ücretsizdir.", text: "Güney'de otoyollar ücretsizdir; yol tabelaları Yunanca ve İngilizcedir." },
        { strong: "Bir şey olursa", text: "112'yi arayın, fotoğraf çekin, sonra bizi +90 539 103 61 66 numarasından arayın." },
        { strong: "Evrakları araçta tutun.", text: "Geçiş izin belgesini ve sınır sigortası evraklarını Kuzey'e dönene kadar araçta saklayın." },
      ],
    },
    {
      kind: "split",
      id: "where",
      title: "Geçtikten sonra nereye gidilir",
      paragraphs: [
        "Metehan geçişinden güney Lefkoşa birkaç dakika, Larnaka yaklaşık 45 dakika, Limasol bir saat, Baf ise otoyoldan yaklaşık bir saat 45 dakika uzaklıktadır.",
        "Güney Kıbrıs rehberimiz bölgeleri, en güzel yerleri ve plajları, mevsimleri ve yemekleri Alsancak ofisimizden sürüş süreleriyle anlatıyor.",
      ],
      photo: "aphrodite-rock",
      caption: "Limasol ile Baf arasında Afrodit Kayası.",
      link: { label: "Güney Kıbrıs gezi rehberini okuyun", href: "/south-cyprus-guide" },
    },
  ],
  faq: {
    title: "Sık sorulan sorular",
    items: [
      { q: "Atoll kiralık aracını Güney Kıbrıs'a götürebilir miyim?", a: "Evet. Atoll araçları KKTC dışına yalnızca Güney Kıbrıs'a geçmek için çıkabilir. Geçiş izin belgemize (£50) ve Metehan geçişinde satın alınan Rum sigortası ile yol vergisine (yaklaşık £21) ihtiyacınız var." },
      { q: "Hafta sonu geçebilir miyim?", a: "Sigortayı hafta içi saat 14:00'ten önce almayı planlayın; Metehan'daki ofisler hafta sonları ve Rum resmi tatillerinde kapalıdır." },
      { q: "Araç Güney'de Atoll'un sigortasıyla sigortalı mı?", a: "Hayır. Güney'de araçta yalnızca sınırda satın aldığınız 3. şahıs sigortası vardır ve bu sigorta kiralık araçtaki hasarı kapsamaz." },
      { q: "Sınırda hangi belgeler gerekir?", a: "Pasaportunuz veya AB kimlik kartınız, ehliyetiniz, kira sözleşmesi ve geçiş izin belgemiz. Araçtaki herkes pasaport veya kimlik kartı gösterir." },
      { q: "Aracı başka bir ülkeye götürebilir miyim?", a: "Hayır. Atoll araçları KKTC dışına yalnızca Güney Kıbrıs'a geçmek için çıkabilir." },
      { q: "Güney'de kaza yaparsam ne yapmalıyım?", a: "112 veya 199'u arayın, olay yerinin ve araçların fotoğraflarını çekin, sınır sigortası evraklarını yanınızda tutun, ardından bizi +90 539 103 61 66 numarasından arayın." },
    ],
  },
  blog: { title: "Seyahat blogumuzdan", all: "Tüm blog yazıları" },
  cta: { title: "Güney'e de götürebileceğiniz bir araç kiralayın", text: "Sınırsız kilometre, Ercan Havalimanı ve Girne'ye ücretsiz teslimat, günlük {price}{abl} başlayan fiyatlarla.", button: "Müsaitliği kontrol et" },
  credits: { title: "Fotoğraf kaynakları" },
};

export default tr;
