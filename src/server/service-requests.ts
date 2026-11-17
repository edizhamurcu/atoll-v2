import "server-only";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { sendMail } from "@/server/mail";
import { customerServiceEmail, serviceRequestEmail } from "@/server/email-templates";
import { formatQueueNo, SERVICE_KIND_LABELS, SERVICE_NOTIFY_DEFAULT, type ServiceKindKey } from "@/content/service";

export function serviceRecipients(): string[] {
  const list = (process.env.SERVICE_NOTIFY_EMAILS ?? "").split(",").map((s) => s.trim()).filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
  return list.length ? list : SERVICE_NOTIFY_DEFAULT;
}

/** Mails the request to manager@ and info@ (and a confirmation to the customer if they gave an address). Never throws. */
export async function notifyServiceRequest(id: string) {
  try {
    const r = await db.serviceRequest.findUnique({ where: { id } });
    if (!r) return false;
    const queueNo = formatQueueNo(r.queueNo);
    const m = serviceRequestEmail({
      queueNo, name: r.name, phone: r.phone, email: r.email, vehicleMake: r.vehicleMake, vehiclePlate: r.vehiclePlate, vehicleYear: r.vehicleYear,
      boughtFromOsk: r.boughtFromOsk, services: r.services.map((k) => SERVICE_KIND_LABELS[k as ServiceKindKey] ?? k), details: r.details,
      preferredDate: r.preferredDate ? r.preferredDate.toISOString().slice(0, 10) : null, locale: r.locale, createdAt: r.createdAt,
    });
    const sent = await sendMail({ to: serviceRecipients(), ...m });
    if (sent) await db.serviceRequest.update({ where: { id }, data: { emailedAt: new Date() } });
    if (r.email) {
      const link = `${SITE.url.replace(/\/$/, "")}/${r.locale}/service/${r.queueNo}`;
      const c = customerServiceEmail({ queueNo, name: r.name, locale: r.locale }, link);
      await sendMail({ to: r.email, subject: c.subject, text: c.text, replyTo: SITE.email });
    }
    return sent;
  } catch (e) {
    console.error("[notify] service request", id, e instanceof Error ? e.message : e);
    return false;
  }
}

/** Public tracking data: no phone, e-mail, name or plate. */
export async function trackServiceRequest(queueNo: number) {
  const r = await db.serviceRequest.findUnique({
    where: { queueNo },
    select: { queueNo: true, status: true, services: true, vehicleMake: true, publicNote: true, createdAt: true, updatedAt: true },
  });
  return r;
}

export async function listServiceRequestsAdmin() {
  return db.serviceRequest.findMany({ orderBy: [{ createdAt: "desc" }], take: 300 });
}
