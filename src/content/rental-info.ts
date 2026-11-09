/**
 * Translations of the "rental information" text that every car carried on the WordPress site.
 * All variants in the export are the same text with different formatting, so a non-English page shows
 * the translation whenever the English source is that standard text (same excess and fuel amounts).
 * Anything else falls back to the English source unchanged.
 */
type L = "tr" | "de" | "ru";

const TEMPLATE: Record<L, (excess: string, fuel: string) => string> = {
  tr: (x, f) => `<h3>Sürücü ve ehliyet şartları</h3>
<p>Aracı teslim alırken yanınızda bulunması gerekenler:</p>
<ul><li>Pasaport veya kimlik kartı</li><li>Sürücü belgesi</li></ul>
<p>Tüm sürücüler 25 yaş ve üzerinde olmalıdır.</p>
<h3>Hasar muafiyeti: ${x}</h3>
<p>Aracın kaportası hasar görürse, Çarpışma Hasarı Muafiyeti (CDW) kapsamındaki onarımlar için ödeyeceğiniz en yüksek tutar hasar muafiyeti kadardır (${x}). Bu güvence yalnızca kiralama sözleşmesinin şartlarına uymanız halinde geçerlidir. Aracın diğer parçalarını (ör. camlar, jantlar, iç döşeme veya alt kısım), ücretleri (ör. çekici veya aracın kullanılamadığı süre) ya da araç içindeki eşyaları (ör. çocuk koltuğu, GPS cihazı veya kişisel eşyalar) kapsamaz.</p>
<h3>Yakıt politikası</h3>
<p>Yakıt politikamız ön ödemelidir: kiralık araç içinde ${f} değerinde yakıtla teslim edilir. Yakıt bedeli peşin ve nakit olarak ödenir; ödendikten sonra araç boş depoyla iade edilebilir. ${f} yakıt bedeli, nihai onay belgenizdeki toplam tutara yansıtılır.</p>
<p>Kalan yakıt için iade yapılmaz.</p>
<h3>Kilometre: Sınırsız</h3>
<p>Kiralama ücretinize sınırsız ücretsiz kilometre dahildir.</p>`,
  de: (x, f) => `<h3>Voraussetzungen für Fahrer und Führerschein</h3>
<p>Bei der Abholung des Fahrzeugs benötigen Sie:</p>
<ul><li>Reisepass oder Personalausweis</li><li>Führerschein</li></ul>
<p>Alle Fahrer müssen mindestens 25 Jahre alt sein.</p>
<h3>Selbstbeteiligung: ${x}</h3>
<p>Wird die Karosserie des Fahrzeugs beschädigt, zahlen Sie für Reparaturen, die durch die Vollkaskoversicherung (CDW) abgedeckt sind, höchstens die Selbstbeteiligung (${x}). Dieser Schutz gilt nur, wenn Sie die Bedingungen des Mietvertrags einhalten. Er deckt keine anderen Fahrzeugteile (z. B. Scheiben, Räder, Innenraum oder Unterboden), keine Gebühren (z. B. für Abschleppen oder Ausfallzeiten) und nichts, was sich im Fahrzeug befindet (z. B. Kindersitze, Navigationsgeräte oder persönliche Gegenstände).</p>
<h3>Tankregelung</h3>
<p>Unsere Tankregelung ist vorausbezahlt: Der Mietwagen wird mit Kraftstoff im Wert von ${f} übergeben. Der Kraftstoff ist im Voraus bar zu bezahlen; danach kann das Fahrzeug mit leerem Tank zurückgegeben werden. Die Kraftstoffgebühr von ${f} ist im Gesamtbetrag Ihrer endgültigen Buchungsbestätigung enthalten.</p>
<p>Restkraftstoff wird nicht erstattet.</p>
<h3>Kilometer: Unbegrenzt</h3>
<p>Ihre Miete beinhaltet unbegrenzte Freikilometer.</p>`,
  ru: (x, f) => `<h3>Требования к водителю и правам</h3>
<p>При получении автомобиля вам понадобятся:</p>
<ul><li>Паспорт или удостоверение личности</li><li>Водительское удостоверение</li></ul>
<p>Всем водителям должно быть не менее 25 лет.</p>
<h3>Франшиза: ${x}</h3>
<p>Если кузов автомобиля будет повреждён, максимальная сумма, которую вы заплатите за ремонт, покрываемый страховкой CDW (отказ от возмещения ущерба при столкновении), равна франшизе (${x}). Это покрытие действует только при соблюдении условий договора аренды. Оно не распространяется на другие части автомобиля (например, стёкла, колёса, салон или днище), на сборы (например, за эвакуацию или простой) и на вещи в автомобиле (например, детские кресла, GPS-навигаторы или личные вещи).</p>
<h3>Топливная политика</h3>
<p>Топливо оплачивается заранее: автомобиль передаётся с топливом на сумму ${f}. Топливо оплачивается наличными вперёд, после чего автомобиль можно вернуть с пустым баком. Стоимость топлива ${f} включается в итоговую сумму вашего подтверждения бронирования.</p>
<p>Остаток топлива не возмещается.</p>
<h3>Пробег: без ограничений</h3>
<p>В стоимость аренды входит неограниченный бесплатный пробег.</p>`,
};

/** `excessOverride`: the class-based excess (see damage-excess.ts) replaces the amount stored in the WP text. */
export function localizedRentalInfo(enHtml: string, locale: string, excessOverride?: string): { html: string; lang: string } {
  const stored = enHtml.match(/damage excess \((£[\d.,]+)\)/)?.[1];
  if (stored && excessOverride) enHtml = enHtml.split(stored).join(excessOverride);
  if (locale === "en" || !(locale in TEMPLATE) || !/Collision Damage Waiver/.test(enHtml) || !/unlimited free kilometres/.test(enHtml)) return { html: enHtml, lang: "en" };
  const excess = excessOverride ?? stored;
  const fuel = enHtml.match(/delivered with (£[\d.,]+) worth of fuel/)?.[1];
  if (!excess || !fuel) return { html: enHtml, lang: "en" };
  return { html: TEMPLATE[locale as L](excess, fuel), lang: locale };
}
