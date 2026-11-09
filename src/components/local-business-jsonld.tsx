import { SITE } from "@/lib/site";
import { JsonLd } from "./json-ld";

/** schema.org AutoRental + WebSite (rich results, Google Business consistency, AI answer engines). */
export function LocalBusinessJsonLd() {
  return (
    <JsonLd
      data={[
        {
          "@context": "https://schema.org",
          "@type": "AutoRental",
          "@id": `${SITE.url}/#business`,
          name: SITE.name,
          slogan: SITE.tagline,
          description: "Atoll Rent A Car offers Northern Cyprus car rental service at the lowest guaranteed prices, with car rentals starting from £30 per day.",
          url: SITE.url,
          logo: `${SITE.url}/brand/atoll-logo.png`,
          image: `${SITE.url}/brand/og.png`,
          telephone: SITE.phone.replace(/\s/g, ""),
          email: SITE.email,
          priceRange: "£30+",
          currenciesAccepted: "GBP",
          paymentAccepted: "Cash, Credit Card",
          address: { "@type": "PostalAddress", streetAddress: SITE.address.street, addressLocality: `${SITE.address.locality}, ${SITE.address.region}`, addressCountry: "CY" },
          geo: { "@type": "GeoCoordinates", latitude: SITE.address.lat, longitude: SITE.address.lng },
          openingHoursSpecification: [
            { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "21:00" },
            { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "19:00" },
          ],
          areaServed: [{ "@type": "Place", name: "North Cyprus" }, { "@type": "Airport", name: "Ercan Airport" }, { "@type": "Airport", name: "Larnaca International Airport" }, { "@type": "Airport", name: "Paphos International Airport" }],
          contactPoint: [
            { "@type": "ContactPoint", telephone: SITE.phone.replace(/\s/g, ""), contactType: "reservations", availableLanguage: ["English", "Turkish", "German", "Russian"] },
            { "@type": "ContactPoint", telephone: SITE.phone2.replace(/\s/g, ""), contactType: "customer service", availableLanguage: ["English", "Turkish", "German", "Russian"] },
          ],
        },
        { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE.url}/#website`, name: SITE.name, url: SITE.url, inLanguage: ["en", "tr", "de", "ru"], publisher: { "@id": `${SITE.url}/#business` } },
      ]}
    />
  );
}
