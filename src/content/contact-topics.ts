/** Subject dropdown on the contact form. English labels are what staff see in the inbox and admin. */
export const CONTACT_TOPICS = [
  "booking_enquiry",
  "change_booking",
  "airport_transfer",
  "delivery",
  "long_term",
  "south_cyprus",
  "prices_offers",
  "documents",
  "business",
  "feedback",
  "other",
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  booking_enquiry: "Booking enquiry / availability",
  change_booking: "Change or cancel a booking",
  airport_transfer: "Airport pick-up or transfer",
  delivery: "Delivery to hotel or villa",
  long_term: "Long-term or monthly rental",
  south_cyprus: "Driving to South Cyprus",
  prices_offers: "Prices and special offers",
  documents: "Driving licence, age and documents",
  business: "Business / corporate rental",
  feedback: "Feedback or complaint",
  other: "Other",
};
