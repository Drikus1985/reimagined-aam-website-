import { describe, expect, it } from "vitest";
import { evaluateFitment, FitmentRecord, GarageVehicle, recordMatchesVehicle } from "@/lib/fitment";

const mustang67: GarageVehicle = {
  id: "v1",
  makeSlug: "ford",
  makeName: "Ford",
  modelSlug: "mustang-1964-1973",
  modelName: "Mustang",
  year: 1967,
  engineFamilySlug: "ford-windsor",
  engineFamilyName: "Ford Windsor",
};

const confirmedMustang: FitmentRecord = {
  status: "CONFIRMED", approved: true,
  makeSlug: "ford", modelSlug: "mustang-1964-1973", yearFrom: 1964, yearTo: 1973,
};

describe("recordMatchesVehicle", () => {
  it("matches wildcards (null fields)", () => {
    expect(recordMatchesVehicle({ status: "CONFIRMED", approved: true }, mustang67)).toBe(true);
  });
  it("rejects out-of-range years", () => {
    expect(recordMatchesVehicle({ ...confirmedMustang, yearFrom: 1969 }, mustang67)).toBe(false);
  });
  it("rejects wrong make", () => {
    expect(recordMatchesVehicle({ ...confirmedMustang, makeSlug: "chevrolet" }, mustang67)).toBe(false);
  });
  it("does not match engine-specific record when vehicle engine unknown", () => {
    const noEngine = { ...mustang67, engineFamilySlug: undefined };
    expect(recordMatchesVehicle({ status: "CONFIRMED", approved: true, engineFamilySlug: "ford-windsor" }, noEngine)).toBe(false);
  });
});

describe("evaluateFitment", () => {
  const product = { universalFit: false, requiresFitmentCheck: true, engineFamilySlugs: ["ford-windsor"] };

  it("returns CONFIRMED for a matching approved record", () => {
    expect(evaluateFitment(product, [confirmedMustang], mustang67).status).toBe("CONFIRMED");
  });

  it("NOT_COMPATIBLE always wins over CONFIRMED", () => {
    const incompatible: FitmentRecord = { status: "NOT_COMPATIBLE", approved: true, makeSlug: "ford" };
    expect(evaluateFitment(product, [confirmedMustang, incompatible], mustang67).status).toBe("NOT_COMPATIBLE");
  });

  it("ignores unapproved records — AI suggestions never surface without approval", () => {
    const unapproved: FitmentRecord = { ...confirmedMustang, approved: false };
    const result = evaluateFitment({ ...product, engineFamilySlugs: [] }, [unapproved], mustang67);
    expect(result.status).not.toBe("CONFIRMED");
  });

  it("downgrades engine-family overlap without explicit record to POTENTIAL, never CONFIRMED", () => {
    const result = evaluateFitment(product, [], mustang67);
    expect(result.status).toBe("POTENTIAL");
  });

  it("reports NOT_COMPATIBLE when every vehicle-specific record targets other makes", () => {
    const chevyOnly: FitmentRecord = { status: "CONFIRMED", approved: true, makeSlug: "chevrolet" };
    const result = evaluateFitment({ universalFit: false, requiresFitmentCheck: true }, [chevyOnly], mustang67);
    expect(result.status).toBe("NOT_COMPATIBLE");
  });

  it("universal products report UNIVERSAL when nothing matches explicitly", () => {
    const result = evaluateFitment({ universalFit: true, requiresFitmentCheck: false }, [
      { status: "UNIVERSAL_WITH_REQUIREMENTS", approved: true, notes: "Square-bore flange required." },
    ], mustang67);
    expect(result.status).toBe("UNIVERSAL");
    expect(result.detail).toContain("Square-bore");
  });

  it("no vehicle selected → UNKNOWN prompt (not a fit claim)", () => {
    const result = evaluateFitment(product, [confirmedMustang], null);
    expect(result.status).toBe("UNKNOWN");
  });
});
