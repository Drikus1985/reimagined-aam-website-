import { describe, expect, it } from "vitest";
import { parseCart, serializeCart, MAX_QTY } from "@/lib/cart";
import { effectivePriceCents, formatZar, isOnSale } from "@/lib/money";

describe("parseCart — never trusts the cookie", () => {
  it("parses valid lines", () => {
    expect(parseCart(JSON.stringify([{ productId: "a", qty: 2 }]))).toEqual([{ productId: "a", qty: 2 }]);
  });
  it("drops malformed rows and clamps quantities", () => {
    const raw = JSON.stringify([
      { productId: "a", qty: 500 },
      { productId: "b", qty: -3 },
      { productId: 42, qty: 1 },
      "junk",
      { qty: 1 },
    ]);
    expect(parseCart(raw)).toEqual([{ productId: "a", qty: MAX_QTY }]);
  });
  it("survives garbage input", () => {
    expect(parseCart("not json")).toEqual([]);
    expect(parseCart(undefined)).toEqual([]);
    expect(parseCart(JSON.stringify({ hack: true }))).toEqual([]);
  });
  it("caps line count", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ productId: `p${i}`, qty: 1 }));
    expect(parseCart(JSON.stringify(many)).length).toBeLessThanOrEqual(50);
  });
  it("round-trips through serializeCart", () => {
    const lines = [{ productId: "a", qty: 3 }];
    expect(parseCart(serializeCart(lines))).toEqual(lines);
  });
});

describe("pricing helpers", () => {
  it("uses sale price only when lower than regular", () => {
    expect(effectivePriceCents({ regularPriceCents: 1000, salePriceCents: 800 })).toBe(800);
    expect(effectivePriceCents({ regularPriceCents: 1000, salePriceCents: 1200 })).toBe(1000);
    expect(effectivePriceCents({ regularPriceCents: 1000, salePriceCents: null })).toBe(1000);
    expect(isOnSale({ regularPriceCents: 1000, salePriceCents: 800 })).toBe(true);
    expect(isOnSale({ regularPriceCents: 1000, salePriceCents: 0 })).toBe(false);
  });
  it("formats ZAR", () => {
    expect(formatZar(879999).replace(/ /g, " ")).toMatch(/R\s?8[ ,]800|R\s?8[ ,]799[.,]99/);
  });
});
