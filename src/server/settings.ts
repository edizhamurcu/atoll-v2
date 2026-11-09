import "server-only";
import { db } from "@/lib/db";
import type { RentalRules } from "./pricing";

export interface BusinessSettings extends RentalRules {
  holdMinutes: number;
  leadTimeMinutes: number; // earliest pickup from now
  openingHour: number; // pickup/return allowed window (business TZ)
  closingHour: number;
  currency: "GBP";
  whatsapp: string;
  phone: string;
  email: string;
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  timezone: process.env.BUSINESS_TZ ?? "Asia/Famagusta",
  graceMinutes: 59,
  minDays: 1,
  maxDays: 90,
  bufferMinutes: 120,
  deposit: { type: "firstDay", value: 0, min: 30 },
  holdMinutes: 15,
  leadTimeMinutes: 120,
  openingHour: 0,
  closingHour: 24,
  currency: "GBP",
  phone: "+905391036166", // primary
  whatsapp: "+905338236555",
  email: "info@atollrentacar.com",
};

export async function getSettings(): Promise<BusinessSettings> {
  const rows = await db.setting.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...overrides } as BusinessSettings;
}
