/** Business facts — taken 1:1 from the WordPress site (pages, footer widget, office records, CF7). */
export const SITE = {
  name: "Atoll Rent A Car",
  tagline: "Lowest guaranteed prices for car rentals in North Cyprus",
  footerTitle: "Number 1 Car Rental Company in North Cyprus",
  footerLead: "Lowest Rental Prices!",
  url: process.env.PUBLIC_SITE_URL ?? "https://atollrentacar.com",
  email: "info@atollrentacar.com",
  /** Primary number: shown first everywhere (owner decision 2026-11-09). */
  phone: "+90 539 103 61 66",
  whatsapp: "+90 533 823 65 55",
  address: { street: "157 Karaoğlanoğlu Caddesi", locality: "Alsancak", region: "Girne (Kyrenia)", country: "North Cyprus", lat: 35.343, lng: 33.188 },
  hours: "Mon - Fri: 09:00AM - 09:00PM; Saturday: 09:00AM - 07:00PM; Sunday: Closed",
  copyright: "Atoll. Designed and Developed by Arekan Bilgi Teknolojileri Ltd.",
  developerUrl: "https://arekanteknoloji.com",
  /** Rental terms (from /rental-terms, /driving-in-south-cyprus, /extra-insurance, /fuel-options, /delivery-charges). */
  terms: {
    minAge: 25,
    includes: ["Full 24 hours day", "Unlimited mileage", "Oil and greasing", "Safety belts in all cars", "Change of car in case of mechanical breakdown"],
    cancellation: "10% cancellation fee for bookings cancelled less than 48 hours before the agreed pick-up time",
    payment: "Cash at the time of taking delivery of the car, or by card through the secure online system",
    fromPrice: 30,
  },
} as const;

export const waLink = (text?: string) => `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
export const telLink = (n: string) => `tel:${n.replace(/\s/g, "")}`;
