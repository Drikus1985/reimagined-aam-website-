/**
 * Shipping abstraction. The Courier Guy (Shiplogic) provider is the intended
 * production integration; a configurable flat-rate provider keeps checkout
 * functional when the API key is absent or the API is down.
 */

export type ShippingAddress = {
  city: string;
  province: string;
  postalCode: string;
  suburb?: string;
};

export type ShippingQuote = {
  provider: string;
  service: string;
  amountCents: number;
  estimatedDays: string;
  fallback?: boolean;
};

export interface ShippingProvider {
  name: string;
  quote(address: ShippingAddress, totalWeightGrams: number, subtotalCents: number): Promise<ShippingQuote[]>;
}

const MAIN_CENTRES = ["gauteng", "western cape", "kwazulu-natal", "kwazulu natal"];

export class FlatRateProvider implements ShippingProvider {
  name = "flat-rate";
  async quote(address: ShippingAddress, totalWeightGrams: number, subtotalCents: number): Promise<ShippingQuote[]> {
    const main = MAIN_CENTRES.includes(address.province.trim().toLowerCase());
    const heavy = totalWeightGrams > 30_000;
    // Free shipping over R2500 for parcels under 30kg (configurable business rule).
    if (subtotalCents >= 250_000 && !heavy) {
      return [{ provider: this.name, service: "Economy (free over R2,500)", amountCents: 0, estimatedDays: main ? "1-3 working days" : "3-5 working days", fallback: true }];
    }
    const base = main ? 14_900 : 19_900; // R149 / R199
    const weightSurcharge = Math.max(0, Math.ceil((totalWeightGrams - 5_000) / 5_000)) * 5_000; // R50 per extra 5kg
    return [
      {
        provider: this.name,
        service: "The Courier Guy — Economy",
        amountCents: base + weightSurcharge,
        estimatedDays: main ? "1-3 working days" : "3-5 working days",
        fallback: true,
      },
    ];
  }
}

export class CourierGuyProvider implements ShippingProvider {
  name = "courier-guy";
  constructor(
    private apiKey: string,
    private apiUrl: string = process.env.COURIER_GUY_API_URL ?? "https://api.shiplogic.com/v2",
  ) {}

  async quote(address: ShippingAddress, totalWeightGrams: number, subtotalCents: number): Promise<ShippingQuote[]> {
    const body = {
      collection_address: {
        type: "business",
        company: "All American Muscle",
        street_address: "15 Tarry Road",
        local_area: "Alrode South",
        city: "Alberton",
        zone: "Gauteng",
        country: "ZA",
        code: "1451",
      },
      delivery_address: {
        type: "residential",
        street_address: "-",
        local_area: address.suburb ?? address.city,
        city: address.city,
        zone: address.province,
        country: "ZA",
        code: address.postalCode,
      },
      parcels: [
        {
          submitted_length_cm: 40,
          submitted_width_cm: 30,
          submitted_height_cm: 20,
          submitted_weight_kg: Math.max(1, Math.ceil(totalWeightGrams / 1000)),
        },
      ],
      declared_value: Math.round(subtotalCents / 100),
    };
    const res = await fetch(`${this.apiUrl}/rates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Courier Guy rates request failed: ${res.status}`);
    const data = (await res.json()) as { rates?: { service_level: { name: string; delivery_date_to?: string }; rate: number }[] };
    return (data.rates ?? []).map((r) => ({
      provider: this.name,
      service: `The Courier Guy — ${r.service_level.name}`,
      amountCents: Math.round(r.rate * 100),
      estimatedDays: r.service_level.delivery_date_to ? `by ${r.service_level.delivery_date_to.slice(0, 10)}` : "1-5 working days",
    }));
  }
}

/** Resolve quotes with graceful degradation to flat rates. */
export async function getShippingQuotes(
  address: ShippingAddress,
  totalWeightGrams: number,
  subtotalCents: number,
): Promise<ShippingQuote[]> {
  const key = process.env.COURIER_GUY_API_KEY;
  const flat = new FlatRateProvider();
  if (key) {
    try {
      const quotes = await new CourierGuyProvider(key).quote(address, totalWeightGrams, subtotalCents);
      if (quotes.length > 0) return quotes;
    } catch {
      // fall through to flat rate
    }
  }
  return flat.quote(address, totalWeightGrams, subtotalCents);
}

export const COLLECTION_OPTION: ShippingQuote = {
  provider: "collection",
  service: "Collect from our Alberton workshop (free)",
  amountCents: 0,
  estimatedDays: "Ready within 1 working day",
};
