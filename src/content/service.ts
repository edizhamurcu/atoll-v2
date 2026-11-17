/** OSK after-sales service requests (Car Sales page, #after). */
export const SERVICE_KINDS = ["MECHANICAL", "BODY", "PAINT", "ELECTRICAL", "WASH"] as const;
export type ServiceKindKey = (typeof SERVICE_KINDS)[number];

/** English labels: what staff see in e-mails and admin. */
export const SERVICE_KIND_LABELS: Record<ServiceKindKey, string> = {
  MECHANICAL: "Mechanical service / repair",
  BODY: "Body work (kaporta)",
  PAINT: "Paint",
  ELECTRICAL: "Auto electrics",
  WASH: "Car wash",
};

export const SERVICE_STATUSES = ["RECEIVED", "SCHEDULED", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"] as const;
export type ServiceStatusKey = (typeof SERVICE_STATUSES)[number];

/** Queue numbers are shown as "S-1001". */
export const formatQueueNo = (n: number) => `S-${n}`;
/** Accepts "S-1001", "s1001", "1001". */
export function parseQueueNo(input: string): number | null {
  const m = /^\s*s?-?\s*(\d{3,9})\s*$/i.exec(input);
  return m ? Number(m[1]) : null;
}

/** Service requests are mailed to these inboxes (SERVICE_NOTIFY_EMAILS overrides). */
export const SERVICE_NOTIFY_DEFAULT = ["manager@atollrentacar.com", "info@atollrentacar.com"];
