import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { JsonLd } from "@/components/json-ld";
import { CyprusMap, type MapPoint } from "@/components/cyprus-map";
import { PhotoCredit, PhotoFigure } from "@/components/photo-figure";
import { PHOTOS, LICENSE_URL, photo, type PhotoKey } from "@/content/photos";
import { posts } from "@/content/blog";
import { SITE } from "@/lib/site";

const PATH = "/north-cyprus-guide";
const UPDATED = "2026-11-08";
const TITLE = "North Cyprus Travel Guide: things to do, beaches, driving and tips";
const DESCRIPTION =
  "Plan your trip to North Cyprus: regions, castles and ancient sites, the best beaches, when to go, festivals, entry rules, driving and money tips, updated for 2026.";

export async function generateMetadata({ params }: PageProps<"/[locale]/north-cyprus-guide">): Promise<Metadata> {
  const { locale } = await params;
  const hero = photo("kyrenia-harbour");
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: `/en${PATH}`, languages: { en: `/en${PATH}`, "x-default": `/en${PATH}` } },
    robots: locale === "en" ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, url: `/en${PATH}`, type: "article", images: [{ url: hero.src, width: hero.w, height: hero.h, alt: hero.alt }] },
    twitter: { card: "summary_large_image", images: [hero.src] },
  };
}

const FACTS: [string, string][] = [
  ["Currency", "Turkish lira (TRY). Cards are widely accepted; ATMs in every town."],
  ["Driving", "On the left, right-hand-drive cars, distances in km."],
  ["Plugs", "UK-style three-pin (type G), 230 V."],
  ["Language", "Turkish. English is widely spoken in tourist areas."],
  ["Time zone", "Eastern European Time, UTC+2 (UTC+3 in summer)."],
  ["Entry", "No visa for UK, EU and US visitors for up to 90 days. EU citizens can use an ID card."],
  ["Health cover", "EHIC and GHIC are not valid here. Take travel insurance."],
  ["Emergencies", "Police 155 · Ambulance 112 · Fire 199"],
];

const REGIONS: { name: string; local: string; img: PhotoKey; drive: string; text: string; see: string[]; post?: string }[] = [
  {
    name: "Kyrenia",
    local: "Girne",
    img: "kyrenia-castle",
    drive: "10 minutes from our Alsancak office",
    text: "The prettiest town in the North: a horseshoe harbour under the castle, with mountains rising straight behind. Most visitors base themselves on this coast.",
    see: ["Kyrenia Castle and Shipwreck Museum", "St Hilarion Castle", "Bellapais Abbey and village", "Alagadi turtle beach"],
    post: "kyrenia-day-itinerary",
  },
  {
    name: "Nicosia",
    local: "Lefkoşa",
    img: "selimiye",
    drive: "About 30 minutes",
    text: "The world's last divided capital. The old town inside the Venetian walls mixes Gothic churches, Ottoman inns and busy bazaars, and you can walk across to the South at Ledra Street.",
    see: ["Selimiye Mosque (St Sophia Cathedral)", "Büyük Han, the Great Inn", "The Venetian walls and Kyrenia Gate", "Ledra Street crossing"],
  },
  {
    name: "Famagusta",
    local: "Gazimağusa",
    img: "famagusta-mosque",
    drive: "About 1 hour",
    text: "A medieval walled port that was once one of the richest cities in the Mediterranean, with the Roman ruins of Salamis and the reopened streets of Varosha close by.",
    see: ["Lala Mustafa Pasha Mosque", "Othello Castle", "Salamis ancient city", "Varosha (Maraş)"],
    post: "famagusta-salamis-varosha-day-trip",
  },
  {
    name: "Karpaz Peninsula",
    local: "Kırpaşa",
    img: "golden-beach",
    drive: "2½ to 3 hours to the tip",
    text: "Cyprus's wild east: a long finger of land with olive groves, empty beaches, wild donkeys and almost no development. Worth an overnight stay.",
    see: ["Golden Beach", "Wild donkeys of the national park", "Apostolos Andreas Monastery", "Kantara Castle"],
    post: "karpaz-peninsula-road-trip",
  },
  {
    name: "Güzelyurt and Lefke",
    local: "Morphou",
    img: "soli",
    drive: "About 45 minutes",
    text: "The green west, surrounded by orange and lemon groves, with quiet villages, the ancient city of Soli and the hilltop palace of Vouni looking over the bay.",
    see: ["Güzelyurt Orange Festival (June to July)", "Soli and its mosaics", "Vouni Palace", "Güzelyurt Bay sunsets"],
  },
];

const SIGHTS: { name: string; where: string; img?: PhotoKey; text: string }[] = [
  { name: "St Hilarion Castle", where: "Kyrenia mountains", img: "st-hilarion", text: "A fairy-tale castle climbing over three levels of rocky peaks, with views along the whole north coast." },
  { name: "Bellapais Abbey", where: "Bellapais, above Kyrenia", img: "bellapais", text: "Gothic cloisters and a refectory overlooking the sea; host of the International Bellapais Music Festival." },
  { name: "Kyrenia Castle", where: "Kyrenia harbour", img: "kyrenia-castle", text: "Venetian ramparts and a museum holding a Greek merchant ship more than 2,000 years old." },
  { name: "Büyük Han and old Nicosia", where: "North Nicosia", img: "buyuk-han", text: "A 16th-century Ottoman inn with craft shops and cafés, a short walk from Selimiye Mosque, the former Gothic cathedral of St Sophia." },
  { name: "Golden Beach", where: "Karpaz peninsula", img: "golden-beach", text: "Kilometres of dunes and sand with almost nothing built on them, often called the best beach in Cyprus." },
  { name: "Salamis", where: "North of Famagusta", img: "salamis", text: "Roman gymnasium, baths and theatre, among the largest ancient sites in Cyprus." },
  { name: "Varosha (Maraş)", where: "Famagusta", img: "varosha", text: "A 1970s resort left empty for decades, partly open to visitors by day since 2020." },
  { name: "Kantara Castle", where: "Eastern Kyrenia range", img: "kantara", text: "The easternmost mountain castle, with views over both coasts on a clear day." },
  { name: "Wild donkeys of the Karpaz", where: "Karpaz National Park", img: "karpaz-donkeys", text: "Hundreds of donkeys roam free and greet cars at the park entrance." },
  { name: "Apostolos Andreas Monastery", where: "Tip of the Karpaz", img: "apostolos-andreas", text: "A seaside pilgrimage site near the island's eastern tip, Cape Zafer." },
  { name: "Soli and Vouni", where: "Near Lefke, west coast", img: "soli", text: "A restored Roman theatre and early Christian mosaics at Soli, and the hilltop palace of Vouni above the bay." },
  { name: "Alagadi Turtle Beach", where: "East of Kyrenia", img: "alagadi", text: "Protected nesting beach for green and loggerhead turtles; guided night visits in season." },
];

const SEASONS: { name: string; months: string; text: string }[] = [
  { name: "Spring", months: "March to May", text: "Wild flowers and orchids, comfortable heat for walking and sightseeing. The sea warms up through May." },
  { name: "Summer", months: "June to September", text: "Hot, dry and sunny with a warm sea. Sightsee early or late; turtle nesting and hatching season." },
  { name: "Autumn", months: "October and November", text: "Warm sea, softer heat and fewer crowds: many regulars' favourite time. Olive Festival in October." },
  { name: "Winter", months: "December to February", text: "Mild days and most of the year's rain. Ideal for castles, ruins and mountain walks, with quiet roads." },
];

const FESTIVALS: [string, string][] = [
  ["Spring to early summer", "International Bellapais Music Festival, Bellapais Abbey"],
  ["June to July", "Güzelyurt Orange Festival"],
  ["Summer", "International Famagusta Culture and Art Festival"],
  ["October", "Olive Festival, Zeytinlik (Kyrenia)"],
];

const HOTELS = ["Kaya Artemis Resort Hotel", "The Dome Hotel", "Acapulco Hotels & Resort", "Merit Royal Hotels", "Concorde Hotels"];

const FAQ: { q: string; a: string }[] = [
  { q: "Do I need a passport or visa to visit North Cyprus?", a: "British, EU and US citizens can visit for up to 90 days without a visa. EU citizens can enter with a national ID card; other visitors need a passport. Requirements depend on nationality, so check before you travel." },
  { q: "Can I fly directly to North Cyprus?", a: "Flights to Ercan Airport, the North's only passenger airport, operate only from Turkey, so from the UK and Europe you connect in a Turkish airport. Many visitors instead fly direct to Larnaca in the South and cross into the North by road." },
  { q: "Which side of the road do they drive on in North Cyprus?", a: "On the left, as in the UK. Hire cars are right-hand drive, and speed limits and distances are in kilometres." },
  { q: "Can I take an Atoll hire car to South Cyprus?", a: "Yes. You buy the South Cyprus permission from Atoll, then buy the insurance required for the South at the crossing point. See the Driving in South Cyprus page for the step-by-step procedure." },
  { q: "Is my EHIC or GHIC valid in North Cyprus?", a: "No. The European Health Insurance Card and the UK Global Health Insurance Card are not valid in North Cyprus, so take out travel insurance with medical cover." },
  { q: "What currency is used in North Cyprus?", a: "The Turkish lira (TRY). Cards are accepted in most hotels, restaurants and shops, and ATMs are easy to find in the towns. Carry some cash for small cafés and entrance fees." },
  { q: "What is the best time to visit North Cyprus?", a: "May, June, September and October offer warm sea and pleasant heat. July and August are hottest and best for beach holidays; winter is mild and ideal for sightseeing." },
  { q: "What are the emergency numbers in North Cyprus?", a: "Police 155, ambulance 112 and fire service 199. These differ from the emergency numbers used in the South." },
];

// x = (lon - 32.2) * 240, y = (35.78 - lat) * 240 — same projection as the map component.
const MAP: MapPoint[] = [
  { slug: "kyrenia", label: "Kyrenia", x: 268, y: 106, primary: true },
  { slug: "nicosia", label: "Nicosia", x: 278, y: 144, labelAt: "below" },
  { slug: "famagusta", label: "Famagusta", x: 418, y: 158, labelAt: "below" },
  { slug: "guzelyurt", label: "Güzelyurt", x: 190, y: 139, labelAt: "below" },
  { slug: "kantara", label: "Kantara", x: 413, y: 92, labelAt: "above" },
  { slug: "golden-beach", label: "Golden Beach", x: 556, y: 30, labelAt: "left" },
  { slug: "ercan", label: "Ercan Airport", x: 312, y: 151, labelAt: "above" },
];

export default async function GuidePage({ params }: PageProps<"/[locale]/north-cyprus-guide">) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const hero = photo("kyrenia-harbour");
  const latest = posts().slice(0, 3);
  const used = [...new Set<PhotoKey>(["kyrenia-harbour", ...REGIONS.map((r) => r.img), ...SIGHTS.flatMap((s) => (s.img ? [s.img] : []))])];

  return (
    <article lang="en">
      {/* Hero: the harbour photo carries the page */}
      <header className="relative isolate overflow-hidden bg-ink text-white">
        <Image src={hero.src} alt={hero.alt} fill priority sizes="100vw" className="-z-10 object-cover opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-10 md:pb-20 md:pt-16">
          <nav aria-label="Breadcrumb" className="text-sm text-white/80">
            <Link href="/" className="hover:text-white">Atoll Rent A Car</Link> <span aria-hidden>›</span> <span aria-current="page">North Cyprus Guide</span>
          </nav>
          <h1 className="mt-24 max-w-3xl text-display font-extrabold md:mt-40">Your guide to beautiful North Cyprus</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">
            Northern Cyprus is a corner of Earth touched by heaven. Mighty castles high in the mountains, serene beaches with nesting sea turtles, bustling towns and deserted Roman remains: a hire car brings all of it within reach.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/#search" className="btn-primary">Find a car</Link>
            <Link href="/blog" className="inline-flex items-center rounded-full border border-white/40 px-5 py-2.5 font-medium text-white hover:border-white">Read the travel blog</Link>
          </div>
          <p className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
            <span>Updated <time dateTime={UPDATED}>8 November 2026</time></span>
            <span className="[&_a]:text-white/80"><PhotoCredit k="kyrenia-harbour" /></span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5">
        {/* Quick facts */}
        <section aria-labelledby="facts" className="-mt-px py-12">
          <h2 id="facts" className="text-3xl font-extrabold">North Cyprus at a glance</h2>
          <dl className="mt-6 grid gap-px overflow-hidden rounded-panel bg-stone-deep sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map(([k, v]) => (
              <div key={k} className="bg-paper p-5">
                <dt className="text-sm font-semibold text-aegean">{k}</dt>
                <dd className="mt-1 text-[0.97rem] leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Regions */}
        <section aria-labelledby="regions" className="py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 id="regions" className="text-3xl font-extrabold">Where to go</h2>
              <p className="mt-3 max-w-xl text-lg text-ink-soft">
                North Cyprus is small: nowhere is more than about three hours&rsquo; drive from Kyrenia. Most visitors stay on the Kyrenia coast and explore the rest on day trips. Drive times below are from our office in Alsancak.
              </p>
            </div>
            <div className="rounded-panel bg-paper p-4">
              <CyprusMap points={MAP} title="Map of North Cyprus with Kyrenia, Nicosia, Famagusta, Güzelyurt, Kantara, Golden Beach and Ercan Airport" />
            </div>
          </div>
          <div className="mt-10 space-y-14">
            {REGIONS.map((r, i) => (
              <section key={r.name} aria-labelledby={`r-${i}`} className="grid gap-6 md:grid-cols-2 md:items-center">
                <PhotoFigure k={r.img} sizes="(min-width: 768px) 560px, 100vw" className={i % 2 ? "md:order-2" : ""} imgClassName="aspect-[4/3] rounded-panel object-cover" />
                <div>
                  <h3 id={`r-${i}`} className="text-2xl font-extrabold">
                    {r.name} <span className="font-medium text-ink-soft">({r.local})</span>
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-aegean">{r.drive}</p>
                  <p className="mt-3 text-[1.05rem] leading-relaxed">{r.text}</p>
                  <ul className="mt-4 grid gap-1.5 text-ink-soft sm:grid-cols-2">
                    {r.see.map((s) => (
                      <li key={s} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-bougain" />{s}</li>
                    ))}
                  </ul>
                  {r.post && <Link href={`/blog/${r.post}`} className="mt-5 inline-block font-semibold text-aegean underline underline-offset-4 hover:text-ink">Read our {r.name} day plan</Link>}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-12 text-ink-soft">
            More on the towns and their history: <Link href="/about-north-cyprus" className="text-aegean underline underline-offset-2">About North Cyprus</Link>.
          </p>
        </section>

        {/* Sights */}
        <section aria-labelledby="sights" className="py-10">
          <h2 id="sights" className="text-3xl font-extrabold">Sights you shouldn&rsquo;t miss</h2>
          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {SIGHTS.map((s) => (
              <li key={s.name}>
                {s.img && <Image src={PHOTOS[s.img].src} alt={PHOTOS[s.img].alt} width={PHOTOS[s.img].w} height={PHOTOS[s.img].h} sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />}
                <h3 className="mt-3 text-lg font-bold">{s.name}</h3>
                <p className="text-sm font-medium text-aegean">{s.where}</p>
                <p className="mt-1 text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Beaches */}
        <section aria-labelledby="beaches" className="grid gap-8 py-10 md:grid-cols-2 md:items-center">
          <PhotoFigure k="golden-beach" caption="Golden Beach, Karpaz." sizes="(min-width: 768px) 560px, 100vw" />
          <div>
            <h2 id="beaches" className="text-3xl font-extrabold">Beaches</h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed">
              The north coast around Kyrenia is a string of small coves below the mountains. For long sandy beaches head east: the bays north of Famagusta, Bafra, Kaplıca and, best of all, Golden Beach on the Karpaz. Several beaches are turtle nesting sites, closed at night in summer.
            </p>
            <Link href="/blog/best-beaches-north-cyprus" className="mt-5 inline-block font-semibold text-aegean underline underline-offset-4 hover:text-ink">Our pick of the best beaches</Link>
          </div>
        </section>

        {/* When to go */}
        <section aria-labelledby="when" className="py-10">
          <h2 id="when" className="text-3xl font-extrabold">When to visit</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SEASONS.map((s) => (
              <div key={s.name} className="rounded-panel bg-paper p-5">
                <h3 className="text-xl font-bold">{s.name}</h3>
                <p className="text-sm font-medium text-aegean">{s.months}</p>
                <p className="mt-2 text-ink-soft">{s.text}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-10 text-xl font-bold">Festival calendar</h3>
          <dl className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
            {FESTIVALS.map(([when, what]) => (
              <div key={what} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr]">
                <dt className="font-semibold">{when}</dt>
                <dd className="text-ink-soft">{what}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink-soft">Exact dates change each year and are announced by the organisers. <Link href="/blog/best-time-to-visit-north-cyprus" className="text-aegean underline underline-offset-2">Season-by-season guide</Link></p>
        </section>

        {/* Getting here & around */}
        <section aria-labelledby="getting" className="grid gap-10 py-10 lg:grid-cols-2">
          <div>
            <h2 id="getting" className="text-3xl font-extrabold">Getting here</h2>
            <h3 className="mt-6 text-lg font-bold">Ercan Airport, North Cyprus</h3>
            <p className="mt-1 leading-relaxed">
              Ercan is the only passenger airport in Northern Cyprus; its new terminal opened in 2023. Flights arrive from Turkey, so from the UK and Europe you connect in a Turkish airport. Atoll Rent A Car delivers to Ercan Airport every day, free of charge: our representative will meet you at the arrivals gate.
            </p>
            <h3 className="mt-6 text-lg font-bold">Via Larnaca or Paphos</h3>
            <p className="mt-1 leading-relaxed">
              Direct flights from across Europe land in the South. From Larnaca you cross into the North by road; we can arrange your <Link href="/larnaca-airport-transfer-to-girne-kyrenia-north-cyprus" className="text-aegean underline underline-offset-2">taxi transfer to our Kyrenia office</Link>. We can only deliver cars in North Cyprus.
            </p>
            <Link href="/blog/flying-to-north-cyprus-ercan-or-larnaca" className="mt-5 inline-block font-semibold text-aegean underline underline-offset-4 hover:text-ink">Ercan or Larnaca? Compare the options</Link>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold">Getting around</h2>
            <ul className="mt-6 space-y-3 leading-relaxed">
              <li><strong>Drive on the left.</strong> Seatbelts in every seat, no phone in your hand and zero tolerance is the safe rule for alcohol.</li>
              <li><strong>Mountain and Karpaz roads</strong> are narrow and winding; allow extra time, watch for donkeys, and fill up before remote drives.</li>
              <li><strong>Crossing to the South</strong> is possible with an Atoll car: buy the South Cyprus permission from us and the southern insurance at the crossing. <Link href="/driving-in-south-cyprus" className="text-aegean underline underline-offset-2">Step-by-step guide</Link></li>
              <li><strong>Unlimited mileage</strong> is included in every Atoll rental, together with a change of car in case of mechanical breakdown.</li>
            </ul>
            <Link href="/blog/driving-in-north-cyprus-tips" className="mt-5 inline-block font-semibold text-aegean underline underline-offset-4 hover:text-ink">12 driving tips for North Cyprus</Link>
          </div>
        </section>

        {/* Food */}
        <section aria-labelledby="food" className="grid gap-8 py-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 id="food" className="text-3xl font-extrabold">Food to try</h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed">
              Start with a meze, a long parade of small cold and hot dishes. Then look for grilled hellim (halloumi), şeftali kebab, slow-cooked fırın kebabı, molehiya stew and fresh fish on Kyrenia harbour. Finish with fruit preserves and a Turkish coffee.
            </p>
            <Link href="/blog/what-to-eat-in-north-cyprus" className="mt-5 inline-block font-semibold text-aegean underline underline-offset-4 hover:text-ink">What to eat in North Cyprus</Link>
          </div>
          <PhotoFigure k="halloumi" sizes="(min-width: 768px) 560px, 100vw" />
        </section>

        {/* Hotels — carried over from the original guide */}
        <section aria-labelledby="hotels" className="py-10">
          <h2 id="hotels" className="text-3xl font-extrabold">Recommended hotels</h2>
          <p className="mt-3 text-ink-soft">Atoll Rent A Car recommends these North Cyprus hotels. We deliver your car to your hotel or villa.</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {HOTELS.map((h) => (
              <li key={h} className="rounded-full border border-ink/15 bg-paper px-4 py-2 font-medium">{h}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft"><Link href="/delivery-charges" className="text-aegean underline underline-offset-2">Delivery charges by area</Link></p>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="py-10">
          <h2 id="faq" className="text-3xl font-extrabold">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="text-2xl text-aegean transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Blog */}
        <section aria-labelledby="blog" className="py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="blog" className="text-3xl font-extrabold">From the travel blog</h2>
            <Link href="/blog" className="font-semibold text-aegean underline underline-offset-4">All articles</Link>
          </div>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {latest.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <Image src={PHOTOS[p.cover].src} alt={PHOTOS[p.cover].alt} width={PHOTOS[p.cover].w} height={PHOTOS[p.cover].h} sizes="(min-width: 768px) 360px, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
                  <h3 className="mt-3 text-lg font-bold leading-snug group-hover:text-aegean">{p.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="my-10 rounded-panel bg-ink px-6 py-10 text-white md:px-12">
          <h2 className="max-w-2xl text-3xl font-extrabold">To make the most of your holiday in North Cyprus, hire a car</h2>
          <p className="mt-3 max-w-2xl text-white/85">Pick up at our Kyrenia office or Ercan Airport, or have the car delivered to your hotel. Unlimited mileage, from £{SITE.terms.fromPrice} a day.</p>
          <Link href="/#search" className="btn-primary mt-6">Check availability</Link>
        </section>

        {/* Credits */}
        <section aria-labelledby="credits" className="pb-4 pt-6 text-sm text-ink-soft">
          <h2 id="credits" className="text-base font-semibold text-ink">Photo credits</h2>
          <ul className="mt-2 space-y-1">
            {used.map((k) => (
              <li key={k}>
                {PHOTOS[k].alt}: <a href={PHOTOS[k].source} rel="noopener" className="underline underline-offset-2">{PHOTOS[k].author}</a>, <a href={LICENSE_URL[PHOTOS[k].license]} rel="noopener license" className="underline underline-offset-2">{PHOTOS[k].license}</a>, via Wikimedia Commons
              </li>
            ))}
          </ul>
        </section>
      </div>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: "North Cyprus",
            alternateName: ["Northern Cyprus", "Kuzey Kıbrıs"],
            description: DESCRIPTION,
            url: `${SITE.url}/en${PATH}`,
            image: `${SITE.url}${hero.src}`,
            touristType: ["Beach holidays", "History and culture", "Road trips", "Nature"],
            includesAttraction: SIGHTS.map((s) => ({ "@type": "TouristAttraction", name: s.name, description: s.text, address: { "@type": "PostalAddress", addressLocality: s.where, addressCountry: "North Cyprus" } })),
          },
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: TITLE,
            description: DESCRIPTION,
            inLanguage: "en",
            datePublished: UPDATED,
            dateModified: UPDATED,
            image: `${SITE.url}${hero.src}`,
            mainEntityOfPage: `${SITE.url}/en${PATH}`,
            author: { "@type": "Organization", name: SITE.name, url: SITE.url },
            publisher: { "@type": "Organization", name: SITE.name, url: SITE.url, logo: { "@type": "ImageObject", url: `${SITE.url}/brand/atoll-logo.png` } },
          },
          { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Atoll Rent A Car", item: `${SITE.url}/en` }, { "@type": "ListItem", position: 2, name: "North Cyprus Guide", item: `${SITE.url}/en${PATH}` }] },
          { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ]}
      />
    </article>
  );
}
