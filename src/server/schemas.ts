import { z } from "zod";

const isoDate = z.iso.datetime({ offset: true }).transform((s) => new Date(s));
const slug = z.string().regex(/^[a-z0-9-]{1,80}$/);

export const searchSchema = z
  .object({
    pickupAt: isoDate,
    returnAt: isoDate,
    pickupLocation: slug,
    returnLocation: slug.optional(),
    deliveryZone: slug.optional().nullable(),
    class: z.enum(["ECONOMY", "MIDDLE", "LUXURY", "SUV", "PEOPLE_CARRIER", "SPORT", "PREMIUM"]).optional(),
    locale: z.enum(["en", "tr", "de", "ru"]).default("en"),
  })
  .transform((v) => ({ ...v, returnLocation: v.returnLocation ?? v.pickupLocation }));

const extrasSchema = z
  .array(z.object({ code: z.string().regex(/^[a-z0-9_]{1,40}$/), quantity: z.number().int().min(1).max(10) }))
  .max(20)
  .refine((a) => new Set(a.map((e) => e.code)).size === a.length, "Duplicate extras")
  .default([]);

export const quoteSchema = z
  .object({
    modelSlug: slug,
    pickupAt: isoDate,
    returnAt: isoDate,
    pickupLocation: slug,
    returnLocation: slug.optional(),
    deliveryZone: slug.optional().nullable(),
    extras: extrasSchema,
    locale: z.enum(["en", "tr", "de", "ru"]).default("en"),
  })
  .transform((v) => ({ ...v, returnLocation: v.returnLocation ?? v.pickupLocation }));

const name = z.string().trim().min(1).max(80);
export const confirmSchema = z.object({
  paymentMode: z.enum(["deposit", "pay_on_pickup"]),
  customer: z.object({
    email: z.email().max(200),
    firstName: name,
    lastName: name,
    phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Invalid phone number"),
    country: z.string().trim().max(60).optional(),
    licenseNumber: z.string().trim().max(40).optional(),
    flightNumber: z.string().trim().max(12).optional(),
    deliveryAddress: z.string().trim().max(300).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
  acceptTerms: z.literal(true, { error: "You must accept the rental terms" }),
});
