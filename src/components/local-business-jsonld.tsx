import { PHONE, EMAIL } from "@/lib/contact";

/** schema.org AutoRental for rich results (address, hours, pick-up points). */
export function LocalBusinessJsonLd({ site }: { site: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: "Atoll Rent a Car",
    url: site,
    logo: `${site}/brand/atoll-logo.png`,
    image: `${site}/brand/atoll-logo.png`,
    telephone: PHONE.replace(/\s/g, ""),
    email: EMAIL,
    priceRange: "££",
    currenciesAccepted: "GBP",
    address: { "@type": "PostalAddress", streetAddress: "154 Karaoğlanoğlu Caddesi", addressLocality: "Alsancak, Kyrenia", addressCountry: "CY" },
    geo: { "@type": "GeoCoordinates", latitude: 35.343, longitude: 33.188 },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "21:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "19:00" },
    ],
    areaServed: ["Kyrenia", "Ercan Airport", "Larnaca Airport", "Paphos Airport", "Nicosia", "Famagusta"],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
