import { describe, expect, it } from "vitest";
import { rentalInfoHtml } from "./wp-format";

const RAW = "Driver & licence requirements\n\nWhen you pick the car up, you'll need:\n\n\n\n \tPassport or national ID card\n\n \tDriving licence\n\n\n\nAll drivers must be aged between 25 and over.\n\nDamage Excess£450.00\n\nIf the car’s bodywork gets damaged, the most you’ll pay is the damage excess (£450.00).\n\nFuel Policy\n\nOur fuel policy is prepaid, the hire car will be delivered with £20.00 worth of fuel inside.\n\nMileageUnlimited\n\nYour rental includes unlimited free kilometres. <script>x</script>";

describe("rentalInfoHtml", () => {
  const h = rentalInfoHtml(RAW);
  it("turns headings and glued values into readable headings", () => {
    expect(h).toContain("<h3>Driver &amp; licence requirements</h3>");
    expect(h).toContain("<h3>Damage Excess: £450.00</h3>");
    expect(h).toContain("<h3>Fuel Policy</h3>");
    expect(h).toContain("<h3>Mileage: Unlimited</h3>");
  });
  it("groups tab-indented lines into one list", () => {
    expect(h).toContain("<ul><li>Passport or national ID card</li><li>Driving licence</li></ul>");
  });
  it("keeps all original sentences and escapes markup", () => {
    expect(h).toContain("All drivers must be aged between 25 and over.");
    expect(h).toContain("£20.00 worth of fuel inside");
    expect(h).not.toContain("<script>");
    expect(h).toContain("&lt;script&gt;");
  });
});
