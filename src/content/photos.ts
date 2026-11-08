/**
 * Photos used by the North Cyprus Guide and the blog.
 * All are from Wikimedia Commons under free licences; attribution (author, licence, source) is shown under
 * every photo and on the guide's credits list, as the licences require.
 */
export type Photo = {
  src: string;
  w: number;
  h: number;
  alt: string;
  author: string;
  license: "CC0" | "CC BY 2.0" | "CC BY 3.0" | "CC BY-SA 2.0" | "CC BY-SA 3.0" | "CC BY-SA 4.0";
  source: string;
};

export const LICENSE_URL: Record<Photo["license"], string> = {
  CC0: "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;

export const PHOTOS = {
  "kyrenia-harbour": { src: "/photos/kyrenia-harbour.webp", w: 1280, h: 853, alt: "Kyrenia's horseshoe-shaped old harbour with boats and waterfront restaurants below the Kyrenia mountains", author: "Michal Klajban", license: "CC BY-SA 4.0", source: commons("Harbour, Kyrenia, Northern Cyprus 07.jpg") },
  "kyrenia-castle": { src: "/photos/kyrenia-castle.webp", w: 1280, h: 954, alt: "Kyrenia Castle behind the boats moored in the old harbour", author: "Zairon", license: "CC BY-SA 4.0", source: commons("Kyrenia - Girne Festung Kyrenia 01.jpg") },
  "kyrenia-from-hilarion": { src: "/photos/kyrenia-from-hilarion.webp", w: 1280, h: 960, alt: "View from St Hilarion Castle down to Kyrenia and the coast", author: "Chris06", license: "CC0", source: commons("Kyrenia castle (view from St Hilarion Castle).JPG") },
  bellapais: { src: "/photos/bellapais.webp", w: 1280, h: 851, alt: "A Gothic rose window in the ruined walls of Bellapais Abbey", author: "Jorge-11", license: "CC BY 2.0", source: commons("Bellapais Abbey 7.jpg") },
  "st-hilarion": { src: "/photos/st-hilarion.webp", w: 1280, h: 960, alt: "The lower ward of St Hilarion Castle seen from the upper levels, with the mountain road below", author: "Héctor Ochoa 'Robot8A'", license: "CC BY-SA 4.0", source: commons("St Hilarion Castle 20180402 img 2.jpg") },
  salamis: { src: "/photos/salamis.webp", w: 1280, h: 720, alt: "Marble columns of the Roman gymnasium at the ancient city of Salamis", author: "Michal Klajban", license: "CC BY-SA 4.0", source: commons("Columns in Roman gymnasium, Salamis, Northern Cyprus.jpg") },
  "famagusta-mosque": { src: "/photos/famagusta-mosque.webp", w: 1280, h: 1707, alt: "The Gothic facade of Lala Mustafa Pasha Mosque, formerly St Nicholas Cathedral, in Famagusta", author: "Ayratayrat", license: "CC BY-SA 4.0", source: commons("Lala Mustafa Pasha Mosque (Famagusta).jpg") },
  varosha: { src: "/photos/varosha.webp", w: 1280, h: 853, alt: "Empty hotel blocks behind the beach at Varosha (Maraş), Famagusta, on a misty morning", author: "Julian Nyča", license: "CC BY-SA 3.0", source: commons("Varosha 2016 1.jpg") },
  selimiye: { src: "/photos/selimiye.webp", w: 1280, h: 853, alt: "Café tables in a shady square of North Nicosia's old town, near Selimiye Mosque", author: "Michal Klajban", license: "CC BY-SA 4.0", source: commons("Café by Selimiye Mosque, North Nicosia, Cyprus.jpg") },
  kantara: { src: "/photos/kantara.webp", w: 1280, h: 700, alt: "View from the walls of Kantara Castle over the eastern Kyrenia mountains", author: "Mike McBey", license: "CC BY 2.0", source: commons("Kantara Castle (44105075700).jpg") },
  "golden-beach": { src: "/photos/golden-beach.webp", w: 1280, h: 853, alt: "Golden Beach on the Karpaz peninsula: kilometres of sand and dunes along a turquoise sea", author: "Michal Klajban", license: "CC BY-SA 4.0", source: commons("Golden Beach, Karpaz, Northern Cyprus.jpg") },
  "karpaz-donkeys": { src: "/photos/karpaz-donkeys.webp", w: 1280, h: 893, alt: "Wild donkeys on the road in the Karpaz National Park", author: "Michal Klajban", license: "CC BY-SA 4.0", source: commons("Cyprus donkeys, Karpaz, Northern Cyprus.jpg") },
  "apostolos-andreas": { src: "/photos/apostolos-andreas.webp", w: 1280, h: 794, alt: "Apostolos Andreas Monastery by the sea near the tip of the Karpaz peninsula", author: "Michal Klajban", license: "CC BY-SA 4.0", source: commons("Apostolos Andreas Monastery in Northern Cyprus.jpg") },
  alagadi: { src: "/photos/alagadi.webp", w: 1280, h: 960, alt: "Alagadi Turtle Beach, a protected nesting beach east of Kyrenia", author: "CAPTAIN RAJU", license: "CC BY-SA 4.0", source: commons("Alagadi Turtle Beach in 2020.01.jpg") },
  soli: { src: "/photos/soli.webp", w: 1280, h: 960, alt: "The restored Roman theatre of ancient Soli near Lefke, looking out to Güzelyurt Bay", author: "Gerhard Haubold", license: "CC BY-SA 3.0", source: commons("Amphitheater Soli C.jpg") },
  "buyuk-han": { src: "/photos/buyuk-han.webp", w: 1280, h: 837, alt: "The arcaded courtyard of Büyük Han, the Ottoman Great Inn in North Nicosia", author: "Michal Klajban", license: "CC BY-SA 4.0", source: commons("Büyük Han, Nicosia, Cyprus.jpg") },
  halloumi: { src: "/photos/halloumi.webp", w: 1280, h: 853, alt: "Slices of grilled hellim (halloumi) cheese", author: "Anatoliy Smaga", license: "CC BY-SA 4.0", source: commons("Grilled haloumi cheese in Cyprus.JPG") },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
export const photo = (k: PhotoKey): Photo => PHOTOS[k];
