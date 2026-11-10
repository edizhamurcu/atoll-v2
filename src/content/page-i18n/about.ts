import type { PageTranslation } from "./index";

/**
 * About us — written 2026-11-09 for Atoll Rent A Car + OSK (owner brief: car rental; new and used car sales;
 * car wash; body and paint; mechanical repair; auto electrics). Facts only from the brief and the site video.
 * English is code-owned for this page (overrides the WP text in the Page table).
 */
const contact = {
  en: `<p>Find us at <strong>157 Karaoğlanoğlu Caddesi, Alsancak, Girne</strong>, or call or WhatsApp <a href="tel:+905391036166">+90 539 103 61 66</a>.</p>`,
  tr: `<p>Bizi <strong>157 Karaoğlanoğlu Caddesi, Alsancak, Girne</strong> adresinde bulabilir; <a href="tel:+905391036166">+90 539 103 61 66</a> numarasından arayabilir veya WhatsApp'tan yazabilirsiniz.</p>`,
  de: `<p>Sie finden uns in der <strong>157 Karaoğlanoğlu Caddesi, Alsancak, Girne</strong>. Anrufen oder per WhatsApp schreiben: <a href="tel:+905391036166">+90 539 103 61 66</a>.</p>`,
  ru: `<p>Мы находимся по адресу <strong>157 Karaoğlanoğlu Caddesi, Алсанджак, Кирения</strong>. Звоните или пишите в WhatsApp: <a href="tel:+905391036166">+90 539 103 61 66</a>.</p>`,
};

export const ABOUT: Record<"en" | "tr" | "de" | "ru", PageTranslation> = {
  en: {
    title: "About Us",
    metaDescription: "Atoll Rent A Car and OSK in Alsancak, Kyrenia: car rental, new and used car sales, car wash, body and paint, mechanical repair and auto electrics under one roof.",
    html: `<h2>Atoll Rent A Car and OSK: everything for your car under one roof</h2>
<p>At our Atoll Auto &amp; Rent A Car building in Alsancak, Kyrenia, Atoll Rent A Car and OSK work side by side. We rent cars to visitors exploring North Cyprus, and for everyone who lives on the island we cover the whole life of a car, from buying one to keeping it looking good and running well.</p>
<h3>Car rental</h3>
<p>From economical city cars to mid-size, SUV and luxury models, our rental fleet is kept clean and well maintained. We deliver to your hotel or villa and arrange airport pick-ups and transfers from Ercan, Larnaca and Paphos, with the lowest guaranteed prices in North Cyprus.</p>
<h3>New and used car sales</h3>
<p>Our showroom has new and used cars on display. Come and see the car in person, take your time, and talk to us about the model that suits you.</p>
<h3>Car wash</h3>
<p>Inside and out, our car wash team gets your car properly clean, whether you are a rental customer or simply passing by.</p>
<h3>Body and paint</h3>
<p>From small scratches and dents to larger bodywork, our body and paint workshop repairs and refinishes your car.</p>
<h3>Mechanical repair</h3>
<p>Servicing, maintenance and mechanical repairs are carried out in our own workshop in the same building.</p>
<h3>Auto electrics</h3>
<p>We diagnose and repair electrical faults, from lighting and batteries to the car's electronic systems.</p>
<h3>Why customers choose us</h3>
<ul>
<li>Rental, sales and service at one address in Alsancak</li>
<li>A team that knows cars, not just paperwork</li>
<li>Honest prices and clear information</li>
</ul>
${contact.en}`,
  },
  tr: {
    title: "Hakkımızda",
    metaDescription: "Alsancak, Girne'de Atoll Rent A Car ve OSK: araç kiralama, yeni ve ikinci el araç satışı, araç yıkama, kaporta ve boya, mekanik onarım ve oto elektrik tek çatı altında.",
    html: `<h2>Atoll Rent A Car ve OSK: aracınızla ilgili her şey tek çatı altında</h2>
<p>Alsancak, Girne'deki Atoll Auto &amp; Rent A Car binamızda Atoll Rent A Car ve OSK birlikte çalışıyor. Kuzey Kıbrıs'ı keşfetmeye gelen misafirlerimize araç kiralıyor; adada yaşayanlara ise aracın satın alınmasından temizliğine ve bakımına kadar her aşamada hizmet veriyoruz.</p>
<h3>Araç kiralama</h3>
<p>Ekonomik şehir araçlarından orta sınıf, SUV ve lüks modellere kadar kiralık filomuz temiz ve bakımlıdır. Aracı otelinize veya villanıza teslim ediyor; Ercan, Larnaka ve Baf havalimanlarından karşılama ve transfer ayarlıyoruz. Kuzey Kıbrıs'ta en düşük fiyat garantisi sunuyoruz.</p>
<h3>Yeni ve ikinci el araç satışı</h3>
<p>Showroom'umuzda yeni ve ikinci el araçlar sergileniyor. Aracı yerinde görün, acele etmeden inceleyin ve size uygun model için bizimle konuşun.</p>
<h3>Araç yıkama</h3>
<p>İç ve dış temizlikte ekibimiz aracınızı gerçekten temiz teslim eder; kiralama müşterimiz olun ya da olmayın.</p>
<h3>Kaporta ve boya</h3>
<p>Küçük çizik ve göçüklerden büyük kaporta hasarlarına kadar kaporta ve boya atölyemiz aracınızı onarır ve boyar.</p>
<h3>Mekanik onarım</h3>
<p>Periyodik bakım, servis ve mekanik onarımlar aynı binadaki kendi atölyemizde yapılır.</p>
<h3>Oto elektrik</h3>
<p>Aydınlatma ve aküden aracın elektronik sistemlerine kadar elektrik arızalarını tespit edip onarıyoruz.</p>
<h3>Müşterilerimiz neden bizi tercih ediyor?</h3>
<ul>
<li>Alsancak'ta tek adreste kiralama, satış ve servis</li>
<li>Sadece evrak değil, aracı da bilen bir ekip</li>
<li>Dürüst fiyat ve açık bilgilendirme</li>
</ul>
${contact.tr}`,
  },
  de: {
    title: "Über uns",
    metaDescription: "Atoll Rent A Car und OSK in Alsancak, Kyrenia: Autovermietung, Neu- und Gebrauchtwagenverkauf, Autowäsche, Karosserie und Lack, Mechanik und Autoelektrik unter einem Dach.",
    html: `<h2>Atoll Rent A Car und OSK: alles rund ums Auto unter einem Dach</h2>
<p>In unserem Gebäude Atoll Auto &amp; Rent A Car in Alsancak, Kyrenia, arbeiten Atoll Rent A Car und OSK Seite an Seite. Wir vermieten Autos an Gäste, die Nordzypern entdecken, und für alle, die auf der Insel leben, kümmern wir uns um das ganze Autoleben, vom Kauf bis zu Pflege und Werkstatt.</p>
<h3>Autovermietung</h3>
<p>Vom sparsamen Stadtauto über Mittelklasse und SUV bis zum Luxusmodell ist unsere Mietflotte sauber und gut gewartet. Wir liefern ins Hotel oder zur Villa und organisieren Abholung und Transfer ab Ercan, Larnaka und Paphos, mit garantiert niedrigsten Preisen in Nordzypern.</p>
<h3>Neu- und Gebrauchtwagenverkauf</h3>
<p>In unserem Showroom stehen Neu- und Gebrauchtwagen. Sehen Sie sich das Auto vor Ort in Ruhe an und sprechen Sie mit uns über das passende Modell.</p>
<h3>Autowäsche</h3>
<p>Innen wie außen macht unser Waschteam Ihr Auto richtig sauber, ob Sie bei uns mieten oder einfach vorbeikommen.</p>
<h3>Karosserie und Lack</h3>
<p>Von kleinen Kratzern und Dellen bis zu größeren Karosserieschäden repariert und lackiert unsere Karosserie- und Lackwerkstatt Ihr Auto.</p>
<h3>Mechanische Reparaturen</h3>
<p>Inspektion, Wartung und mechanische Reparaturen erledigen wir in unserer eigenen Werkstatt im selben Gebäude.</p>
<h3>Autoelektrik</h3>
<p>Wir finden und beheben elektrische Fehler, von Beleuchtung und Batterie bis zur Fahrzeugelektronik.</p>
<h3>Warum Kunden uns wählen</h3>
<ul>
<li>Vermietung, Verkauf und Service an einer Adresse in Alsancak</li>
<li>Ein Team, das Autos kennt, nicht nur Formulare</li>
<li>Faire Preise und klare Informationen</li>
</ul>
${contact.de}`,
  },
  ru: {
    title: "О нас",
    metaDescription: "Atoll Rent A Car и OSK в Алсанджаке, Кирения: прокат автомобилей, продажа новых и подержанных авто, автомойка, кузовной ремонт и покраска, механика и автоэлектрика под одной крышей.",
    html: `<h2>Atoll Rent A Car и OSK: всё для вашего автомобиля под одной крышей</h2>
<p>В нашем здании Atoll Auto &amp; Rent A Car в Алсанджаке (Кирения) Atoll Rent A Car и OSK работают вместе. Мы сдаём автомобили гостям, которые приезжают открывать Северный Кипр, а жителям острова помогаем на каждом этапе — от покупки машины до мойки и ремонта.</p>
<h3>Прокат автомобилей</h3>
<p>От экономичных городских машин до среднего класса, внедорожников и люкса — наш прокатный парк чистый и ухоженный. Доставляем автомобиль в отель или на виллу, организуем встречу и трансфер из аэропортов Эрджан, Ларнака и Пафос. Гарантируем самые низкие цены на Северном Кипре.</p>
<h3>Продажа новых и подержанных автомобилей</h3>
<p>В нашем шоуруме представлены новые и подержанные автомобили. Приходите посмотреть машину вживую, не торопитесь и обсудите с нами подходящую модель.</p>
<h3>Автомойка</h3>
<p>Снаружи и внутри — наша команда мойки вернёт вам по-настоящему чистый автомобиль, даже если вы не арендуете у нас.</p>
<h3>Кузовной ремонт и покраска</h3>
<p>От мелких царапин и вмятин до серьёзных повреждений кузова — наш кузовной цех отремонтирует и покрасит ваш автомобиль.</p>
<h3>Механический ремонт</h3>
<p>Техобслуживание, сервис и механический ремонт выполняются в нашей собственной мастерской в том же здании.</p>
<h3>Автоэлектрика</h3>
<p>Находим и устраняем электрические неисправности — от освещения и аккумулятора до электронных систем автомобиля.</p>
<h3>Почему выбирают нас</h3>
<ul>
<li>Прокат, продажа и сервис по одному адресу в Алсанджаке</li>
<li>Команда, которая разбирается в автомобилях, а не только в бумагах</li>
<li>Честные цены и понятная информация</li>
</ul>
${contact.ru}`,
  },
};
