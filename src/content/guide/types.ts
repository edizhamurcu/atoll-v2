/** Inline text with one link: rendered as `before <a>link</a> after`. */
export type Linked = { before: string; link: string; after?: string };

/** Every visible string of the North Cyprus guide, per language. Arrays line up with the photo lists in the page. */
export type GuideContent = {
  meta: { title: string; description: string };
  breadcrumb: string;
  hero: { title: string; lead: string; findCar: string; readBlog: string; updated: string; updatedDate: string };
  facts: { title: string; items: [string, string][] };
  regions: {
    title: string;
    lead: string;
    mapTitle: string;
    mapLabels: { kyrenia: string; nicosia: string; famagusta: string; guzelyurt: string; kantara: string; goldenBeach: string; ercan: string };
    /** Same order as REGION_PHOTOS: Kyrenia, Nicosia, Famagusta, Karpaz, Güzelyurt. */
    items: { name: string; local: string; drive: string; text: string; see: string[]; cta?: string }[];
    more: Linked;
  };
  /** Same order as SIGHT_PHOTOS. */
  sights: { title: string; items: { name: string; where: string; text: string }[] };
  beaches: { title: string; text: string; caption: string; link: string };
  when: { title: string; seasons: { name: string; months: string; text: string }[]; festivalsTitle: string; festivals: [string, string][]; note: string; link: string };
  getting: { title: string; ercanTitle: string; ercanText: string; viaTitle: string; viaText: Linked; compare: string };
  around: { title: string; items: { strong: string; text: string; link?: string }[]; tips: string };
  food: { title: string; text: string; link: string };
  hotels: { title: string; text: string; delivery: string };
  faq: { title: string; items: { q: string; a: string }[] };
  blog: { title: string; all: string };
  cta: { title: string; text: string; button: string };
  credits: { title: string };
  touristTypes: string[];
};
