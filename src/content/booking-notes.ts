/** Topics for the "Anything we should know?" dropdown on the booking form. Labels here are what staff see. */
export const NOTE_TOPICS = ["late_arrival", "child_seat", "extra_driver", "young_driver", "south_cyprus", "delivery_details", "special_request"] as const;
export type NoteTopic = (typeof NOTE_TOPICS)[number];

export const NOTE_TOPIC_LABELS: Record<NoteTopic, string> = {
  late_arrival: "Late or delayed arrival",
  child_seat: "Child / baby seat",
  extra_driver: "Additional driver",
  young_driver: "Young or newly licensed driver",
  south_cyprus: "Driving to South Cyprus",
  delivery_details: "Delivery / pick-up details",
  special_request: "Other request",
};
