import type { TravelPage } from "../types";

const en: TravelPage = {
  meta: {
    title: "Driving in South Cyprus with an Atoll rental car: permit, insurance and rules",
    description: "How to take your Atoll rental car to South Cyprus: the £50 permit, Greek Cypriot insurance at the Metehan crossing, opening hours, documents, crossing points and road rules.",
  },
  breadcrumb: "Driving in South Cyprus",
  heroPhoto: "cyprus-road-sign",
  hero: {
    title: "Driving to South Cyprus with your Atoll car",
    lead: "Atoll cars may cross from North Cyprus into South Cyprus. You need our crossing permit and Greek Cypriot insurance bought at the border. Here is everything to know before you set off.",
    primary: { label: "Find a car", href: "/#search" },
    secondary: { label: "South Cyprus travel guide", href: "/south-cyprus-guide" },
    updated: "Updated:",
    updatedDate: "12 November 2026",
  },
  facts: {
    title: "At a glance",
    items: [
      ["Crossing permit", "£50, bought from Atoll Rent A Car before you go."],
      ["Insurance and road tax", "About £21, bought at the Greek Cypriot checkpoint (paid at the border, may change)."],
      ["Where to buy", "Only at the Metehan (Agios Dometios) crossing in Nicosia, on weekdays until 14:00."],
      ["Closed", "After 14:00 on weekdays, at weekends and on Greek Cypriot public holidays."],
      ["Cover in the south", "Third-party only. The rental car itself is not covered."],
      ["Documents", "Passport or EU ID card, driving licence, rental agreement and our crossing permit."],
      ["Speed limits", "50 km/h in towns, 80 km/h on open roads, 100 km/h on motorways (minimum 65 km/h)."],
      ["Emergency", "112 or 199 in the south."],
    ],
  },
  sections: [
    {
      kind: "callout",
      id: "insurance",
      tone: "warn",
      title: "Your insurance in the south",
      text: "From the moment the car crosses into South Cyprus, it is no longer fully insured by Atoll Rent A Car. At the Greek Cypriot checkpoint you must buy insurance that is third-party (traffic) cover only, and it does not cover the rental car. Please read the terms of the insurance you buy at the border.",
    },
    {
      kind: "steps",
      id: "steps",
      title: "Taking your rental car to South Cyprus, step by step",
      items: [
        { title: "Buy the permit from us", text: "The crossing permit costs £50. It allows you to take the car from the Turkish Cypriot checkpoint to the Greek Cypriot checkpoint." },
        { title: "Show it at the Turkish Cypriot checkpoint", text: "Hand the permit to the officer at the Turkish Cypriot side of the crossing." },
        { title: "Show your passports on the Greek Cypriot side", text: "After the Turkish Cypriot checkpoint you reach the Greek Cypriot checkpoint, where everyone in the car shows a passport or EU ID card." },
        { title: "Buy insurance and road tax", text: "Buy the Greek Cypriot insurance and road tax at the offices at the checkpoint: about £21, paid at the border (the price may change)." },
        { title: "Drive in South Cyprus", text: "Keep the permit and insurance papers in the car, and enjoy the drive." },
      ],
    },
    {
      kind: "callout",
      id: "hours",
      tone: "info",
      title: "Plan around the office hours",
      text: "The Greek Cypriot insurance offices are only at the Metehan crossing in Nicosia. They open on weekdays until 14:00 and close on Greek Cypriot public holidays. Without these documents you will not be allowed to drive in South Cyprus. To check whether the offices are open, call the Greek Cypriot insurance office on +357 22 454700 or the local police on +357 22 802838. Atoll Rent A Car cannot be held responsible if you are unable to cross for any reason.",
    },
    {
      kind: "rules",
      id: "crossings",
      title: "Crossing points",
      lead: "With an Atoll car, cross at Metehan, where the insurance offices are. The other checkpoints are listed so you know the options; ask us before you plan to use one.",
      items: [
        { strong: "Metehan (Agios Dometios), Nicosia:", text: "cars and pedestrians. The only crossing with the Greek Cypriot insurance offices; use it with an Atoll car." },
        { strong: "Lokmacı (Ledra Street) and Ledra Palace, Nicosia:", text: "pedestrians only. Handy for a walk between the two halves of the old town; park on the north side." },
        { strong: "Bostancı (Zodia) and Yeşilırmak (Limnitis):", text: "vehicle crossings in the west, towards the Troodos and Paphos." },
        { strong: "Beyarmudu (Pergamos), Akyar (Strovilia) and Derinya (Deryneia):", text: "vehicle crossings in the east, towards Larnaca and Ayia Napa." },
      ],
    },
    {
      kind: "rules",
      id: "rules",
      title: "Rules of the road in the south",
      items: [
        { strong: "Speed:", text: "50 km/h in towns, 80 km/h on open roads and 100 km/h on motorways, with a minimum of 65 km/h. Fixed and mobile cameras are common and fines are issued automatically." },
        { strong: "Alcohol:", text: "the limit is 22 µg per 100 ml of breath, and 9 µg for drivers who have held a licence for less than three years. The safest plan is not to drink at all." },
        { strong: "Seat belts and phones:", text: "seat belts are compulsory in every seat, and holding a phone while driving is not allowed." },
        { strong: "Children:", text: "need a suitable child seat. Ask us for a baby or booster seat when you book." },
        { strong: "Roundabouts:", text: "give way to traffic coming from your right, as in the north." },
        { strong: "Parking:", text: "don't park on yellow lines; use marked bays and car parks, many of which take coins or cards." },
      ],
      photo: "cyprus-speed-sign",
    },
    {
      kind: "rules",
      id: "tips",
      title: "Practical tips",
      items: [
        { strong: "Go on a weekday morning.", text: "The insurance offices close at 14:00 and queues build up before holidays." },
        { strong: "Carry euros.", text: "Prices in the south are in euros; keep some cash for the border, parking and small shops." },
        { strong: "Mind your phone plan.", text: "North Cyprus SIM cards roam in the south at extra cost. Download offline maps before you cross." },
        { strong: "No toll roads.", text: "Motorways in the south are free to use, and road signs are in Greek and English." },
        { strong: "If something happens,", text: "call 112, take photos, and then call us on +90 539 103 61 66." },
        { strong: "Keep the papers in the car.", text: "Keep the crossing permit and the border insurance documents in the car until you are back in the north." },
      ],
    },
    {
      kind: "split",
      id: "where",
      title: "Where to go once you're across",
      paragraphs: [
        "From the Metehan crossing, South Nicosia is minutes away, Larnaca about 45 minutes, Limassol an hour and Paphos around an hour and three quarters by motorway.",
        "Our South Cyprus guide covers the regions, the best sights and beaches, the seasons and food, with drive times from our Alsancak office.",
      ],
      photo: "aphrodite-rock",
      caption: "Aphrodite's Rock, between Limassol and Paphos.",
      link: { label: "Read the South Cyprus travel guide", href: "/south-cyprus-guide" },
    },
  ],
  faq: {
    title: "Frequently asked questions",
    items: [
      { q: "Can I take an Atoll rental car to South Cyprus?", a: "Yes. Atoll cars may leave North Cyprus only to cross into South Cyprus. You need our crossing permit (£50) and the Greek Cypriot insurance and road tax bought at the Metehan crossing (about £21)." },
      { q: "Can I cross at the weekend?", a: "Plan to buy the insurance on a weekday before 14:00, because the offices at Metehan are closed at the weekend and on Greek Cypriot public holidays." },
      { q: "Is the car covered by Atoll's insurance in the south?", a: "No. In the south the car has only the third-party insurance you buy at the border, which does not cover damage to the rental car." },
      { q: "What documents do I need at the border?", a: "Your passport or EU ID card, your driving licence, the rental agreement and our crossing permit. Everyone in the car shows a passport or ID card." },
      { q: "Can I take the car to any other country?", a: "No. Atoll cars may leave North Cyprus only to cross into South Cyprus." },
      { q: "What should I do after an accident in the south?", a: "Call 112 or 199, take photos of the scene and the vehicles, keep the border insurance papers to hand, and then call us on +90 539 103 61 66." },
    ],
  },
  blog: { title: "From our travel blog", all: "All blog posts" },
  cta: { title: "Book a car you can take south", text: "Unlimited mileage, free delivery to Ercan Airport and Kyrenia, from {price} a day.", button: "Check availability" },
  credits: { title: "Photo credits" },
};

export default en;
