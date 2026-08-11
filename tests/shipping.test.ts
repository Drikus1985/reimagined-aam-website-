import { describe, expect, it } from "vitest";
import { FlatRateProvider } from "@/lib/shipping";

const flat = new FlatRateProvider();
const jhb = { city: "Johannesburg", province: "Gauteng", postalCode: "2000" };
const karoo = { city: "Graaff-Reinet", province: "Eastern Cape", postalCode: "6280" };

describe("FlatRateProvider (Courier Guy fallback)", () => {
  it("quotes main centres cheaper than regional", async () => {
    const [main] = await flat.quote(jhb, 4000, 100_000);
    const [regional] = await flat.quote(karoo, 4000, 100_000);
    expect(main.amountCents).toBeLessThan(regional.amountCents);
  });

  it("adds weight surcharge above 5kg", async () => {
    const [light] = await flat.quote(jhb, 4000, 100_000);
    const [heavy] = await flat.quote(jhb, 16_000, 100_000);
    expect(heavy.amountCents).toBeGreaterThan(light.amountCents);
  });

  it("gives free shipping over R2500 for light parcels", async () => {
    const [quote] = await flat.quote(jhb, 4000, 300_000);
    expect(quote.amountCents).toBe(0);
  });

  it("does not give free shipping to heavy parcels", async () => {
    const [quote] = await flat.quote(jhb, 40_000, 300_000);
    expect(quote.amountCents).toBeGreaterThan(0);
  });
});
