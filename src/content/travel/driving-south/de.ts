import type { TravelPage } from "../types";

const de: TravelPage = {
  meta: {
    title: "Mit dem Atoll-Mietwagen in Südzypern fahren: Genehmigung, Versicherung und Regeln",
    description: "So nehmen Sie Ihren Atoll-Mietwagen mit nach Südzypern: Genehmigung für £50, griechisch-zyprische Versicherung am Übergang Metehan, Öffnungszeiten, Dokumente, Übergänge und Verkehrsregeln.",
  },
  breadcrumb: "Fahren in Südzypern",
  heroPhoto: "cyprus-road-sign",
  hero: {
    title: "Mit Ihrem Atoll-Auto nach Südzypern",
    lead: "Atoll-Fahrzeuge dürfen von Nordzypern nach Südzypern fahren. Dafür brauchen Sie unsere Grenzgenehmigung und eine griechisch-zyprische Versicherung, die Sie an der Grenze kaufen. Hier steht alles, was Sie vor der Fahrt wissen müssen.",
    primary: { label: "Auto finden", href: "/#search" },
    secondary: { label: "Reiseführer Südzypern", href: "/south-cyprus-guide" },
    updated: "Aktualisiert:",
    updatedDate: "12. November 2026",
  },
  facts: {
    title: "Auf einen Blick",
    items: [
      ["Grenzgenehmigung", "£50, vor der Fahrt bei Atoll Rent A Car zu kaufen."],
      ["Versicherung und Straßensteuer", "Etwa £21, am griechisch-zyprischen Kontrollpunkt zu kaufen (an der Grenze zu zahlen, Änderungen möglich)."],
      ["Wo kaufen", "Nur am Übergang Metehan (Agios Dometios) in Nikosia, werktags bis 14:00 Uhr."],
      ["Geschlossen", "Werktags nach 14:00 Uhr, am Wochenende und an griechisch-zyprischen Feiertagen."],
      ["Schutz im Süden", "Nur Haftpflicht. Der Mietwagen selbst ist nicht versichert."],
      ["Dokumente", "Reisepass oder EU-Personalausweis, Führerschein, Mietvertrag und unsere Grenzgenehmigung."],
      ["Tempolimits", "50 km/h innerorts, 80 km/h auf Landstraßen, 100 km/h auf Autobahnen (mindestens 65 km/h)."],
      ["Notruf", "112 oder 199 im Süden."],
    ],
  },
  sections: [
    {
      kind: "callout",
      id: "insurance",
      tone: "warn",
      title: "Ihre Versicherung im Süden",
      text: "Sobald das Fahrzeug die Grenze nach Südzypern überquert, ist es nicht mehr vollständig über Atoll Rent A Car versichert. Am griechisch-zyprischen Kontrollpunkt müssen Sie eine Versicherung abschließen, die nur eine Haftpflichtversicherung ist. Diese Haftpflichtversicherung deckt den Mietwagen nicht ab. Bitte lesen Sie unbedingt die Bedingungen der an der Grenze gekauften Versicherung.",
    },
    {
      kind: "steps",
      id: "steps",
      title: "Mit dem Mietwagen nach Südzypern, Schritt für Schritt",
      items: [
        { title: "Genehmigung bei uns kaufen", text: "Die Grenzgenehmigung kostet £50. Sie erlaubt die Fahrt vom türkisch-zyprischen bis zum griechisch-zyprischen Kontrollpunkt." },
        { title: "Am türkisch-zyprischen Kontrollpunkt vorzeigen", text: "Zeigen Sie die Genehmigung dem Beamten auf der türkisch-zyprischen Seite des Übergangs." },
        { title: "Pässe auf der griechisch-zyprischen Seite zeigen", text: "Danach erreichen Sie den griechisch-zyprischen Kontrollpunkt, wo alle Insassen Reisepass oder EU-Ausweis vorzeigen." },
        { title: "Versicherung und Straßensteuer kaufen", text: "Kaufen Sie Versicherung und Straßensteuer in den Büros am Kontrollpunkt: etwa £21, an der Grenze zu zahlen (der Preis kann sich ändern)." },
        { title: "In Südzypern losfahren", text: "Bewahren Sie Genehmigung und Versicherungspapiere im Auto auf und genießen Sie die Fahrt." },
      ],
    },
    {
      kind: "callout",
      id: "hours",
      tone: "info",
      title: "Planen Sie nach den Öffnungszeiten",
      text: "Die griechisch-zyprischen Versicherungsbüros gibt es nur am Übergang Metehan in Nikosia. Sie sind nur werktags bis 14:00 Uhr geöffnet und an griechisch-zyprischen Feiertagen geschlossen. Ohne diese Dokumente dürfen Sie in Südzypern nicht fahren. Ob die Büros geöffnet sind, erfahren Sie beim griechisch-zyprischen Versicherungsbüro unter +357 22 454700 oder bei der örtlichen Polizei unter +357 22 802838. Atoll Rent A Car haftet nicht, wenn Sie die Grenze aus irgendeinem Grund nicht überqueren können.",
    },
    {
      kind: "rules",
      id: "crossings",
      title: "Grenzübergänge",
      lead: "Mit einem Atoll-Auto fahren Sie über Metehan, wo die Versicherungsbüros sind. Die anderen Übergänge stehen hier zur Orientierung; sprechen Sie uns an, bevor Sie einen davon nutzen möchten.",
      items: [
        { strong: "Metehan (Agios Dometios), Nikosia:", text: "Autos und Fußgänger. Der einzige Übergang mit griechisch-zyprischen Versicherungsbüros; nutzen Sie ihn mit einem Atoll-Auto." },
        { strong: "Lokmacı (Ledra-Straße) und Ledra Palace, Nikosia:", text: "nur für Fußgänger. Praktisch für einen Spaziergang zwischen beiden Hälften der Altstadt; parken Sie auf der Nordseite." },
        { strong: "Bostancı (Zodia) und Yeşilırmak (Limnitis):", text: "Übergänge für Fahrzeuge im Westen, Richtung Troodos und Paphos." },
        { strong: "Beyarmudu (Pergamos), Akyar (Strovilia) und Derinya (Deryneia):", text: "Übergänge für Fahrzeuge im Osten, Richtung Larnaka und Ayia Napa." },
      ],
    },
    {
      kind: "rules",
      id: "rules",
      title: "Verkehrsregeln im Süden",
      items: [
        { strong: "Tempo:", text: "50 km/h innerorts, 80 km/h auf Landstraßen und 100 km/h auf Autobahnen, dort mindestens 65 km/h. Feste und mobile Blitzer sind häufig, Bußgelder kommen automatisch." },
        { strong: "Alkohol:", text: "Grenze 22 µg pro 100 ml Atemluft, 9 µg für Fahrer mit Führerschein unter drei Jahren. Am sichersten ist es, gar nicht zu trinken." },
        { strong: "Gurt und Handy:", text: "Anschnallpflicht auf allen Plätzen; das Handy beim Fahren in der Hand zu halten ist verboten." },
        { strong: "Kinder:", text: "brauchen einen passenden Kindersitz. Fragen Sie bei der Buchung nach Babyschale oder Sitzerhöhung." },
        { strong: "Kreisverkehr:", text: "Wie im Norden haben Fahrzeuge von rechts Vorfahrt." },
        { strong: "Parken:", text: "nicht auf gelben Linien parken; markierte Stellplätze und Parkplätze nutzen, viele nehmen Münzen oder Karten." },
      ],
      photo: "cyprus-speed-sign",
    },
    {
      kind: "rules",
      id: "tips",
      title: "Praktische Tipps",
      items: [
        { strong: "Fahren Sie werktags morgens.", text: "Die Versicherungsbüros schließen um 14:00 Uhr, und vor Feiertagen bilden sich Schlangen." },
        { strong: "Nehmen Sie Euro mit.", text: "Im Süden wird in Euro bezahlt; etwas Bargeld für Grenze, Parken und kleine Läden einstecken." },
        { strong: "Achten Sie auf Ihren Handytarif.", text: "SIM-Karten aus Nordzypern funktionieren im Süden nur über teures Roaming. Laden Sie vorher Offline-Karten herunter." },
        { strong: "Keine Maut.", text: "Die Autobahnen im Süden sind kostenlos, Verkehrsschilder sind griechisch und englisch." },
        { strong: "Wenn etwas passiert,", text: "rufen Sie 112, machen Sie Fotos und rufen Sie dann uns an: +90 539 103 61 66." },
        { strong: "Papiere im Auto lassen.", text: "Bewahren Sie Grenzgenehmigung und Versicherungspapiere im Auto auf, bis Sie wieder im Norden sind." },
      ],
    },
    {
      kind: "split",
      id: "where",
      title: "Wohin nach der Grenze",
      paragraphs: [
        "Vom Übergang Metehan sind es nach Süd-Nikosia nur Minuten, nach Larnaka etwa 45 Minuten, nach Limassol eine Stunde und nach Paphos über die Autobahn rund eine Stunde und 45 Minuten.",
        "Unser Reiseführer Südzypern stellt Regionen, die schönsten Sehenswürdigkeiten und Strände, die Reisezeit und das Essen vor, mit Fahrzeiten ab unserem Büro in Alsancak.",
      ],
      photo: "aphrodite-rock",
      caption: "Der Felsen der Aphrodite zwischen Limassol und Paphos.",
      link: { label: "Reiseführer Südzypern lesen", href: "/south-cyprus-guide" },
    },
  ],
  faq: {
    title: "Häufige Fragen",
    items: [
      { q: "Darf ich mit einem Atoll-Mietwagen nach Südzypern fahren?", a: "Ja. Atoll-Fahrzeuge dürfen Nordzypern nur für die Fahrt nach Südzypern verlassen. Sie brauchen unsere Grenzgenehmigung (£50) sowie Versicherung und Straßensteuer vom Übergang Metehan (etwa £21)." },
      { q: "Kann ich am Wochenende über die Grenze?", a: "Planen Sie den Versicherungskauf werktags vor 14:00 Uhr ein, denn die Büros in Metehan sind am Wochenende und an griechisch-zyprischen Feiertagen geschlossen." },
      { q: "Ist das Auto im Süden über Atoll versichert?", a: "Nein. Im Süden hat das Auto nur die an der Grenze gekaufte Haftpflichtversicherung, die keine Schäden am Mietwagen deckt." },
      { q: "Welche Dokumente brauche ich an der Grenze?", a: "Reisepass oder EU-Personalausweis, Führerschein, Mietvertrag und unsere Grenzgenehmigung. Alle Insassen zeigen Pass oder Ausweis." },
      { q: "Darf ich mit dem Auto in ein anderes Land?", a: "Nein. Atoll-Fahrzeuge dürfen Nordzypern nur für die Fahrt nach Südzypern verlassen." },
      { q: "Was tue ich nach einem Unfall im Süden?", a: "Rufen Sie 112 oder 199, fotografieren Sie Unfallstelle und Fahrzeuge, halten Sie die Papiere der Grenzversicherung bereit und rufen Sie dann uns an: +90 539 103 61 66." },
    ],
  },
  blog: { title: "Aus unserem Reiseblog", all: "Alle Blogartikel" },
  cta: { title: "Mieten Sie ein Auto, mit dem Sie auch in den Süden dürfen", text: "Unbegrenzte Kilometer, kostenlose Zustellung zum Flughafen Ercan und nach Kyrenia, ab {price} pro Tag.", button: "Verfügbarkeit prüfen" },
  credits: { title: "Bildnachweise" },
};

export default de;
