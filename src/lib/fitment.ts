/**
 * Vehicle fitment evaluation.
 *
 * Core rule: never present uncertain compatibility as confirmed. Absence of a
 * matching fitment record downgrades to POTENTIAL/UNKNOWN — it is never
 * treated as proof of compatibility, and an explicit NOT_COMPATIBLE record
 * always wins.
 */

export type GarageVehicle = {
  id: string;
  makeSlug: string;
  makeName: string;
  modelSlug?: string;
  modelName?: string;
  year?: number;
  engineFamilySlug?: string;
  engineFamilyName?: string;
  nickname?: string;
};

export type FitmentRecord = {
  status: "CONFIRMED" | "UNIVERSAL_WITH_REQUIREMENTS" | "POTENTIAL" | "NOT_COMPATIBLE";
  approved: boolean;
  notes?: string | null;
  makeSlug?: string | null;
  modelSlug?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  engineFamilySlug?: string | null;
};

export type FitmentVerdict = {
  status: "CONFIRMED" | "UNIVERSAL" | "POTENTIAL" | "NOT_COMPATIBLE" | "UNKNOWN";
  label: string;
  detail?: string;
};

const LABELS: Record<FitmentVerdict["status"], string> = {
  CONFIRMED: "Confirmed fit",
  UNIVERSAL: "Universal — check requirements",
  POTENTIAL: "Potential fit — verification needed",
  NOT_COMPATIBLE: "Not compatible",
  UNKNOWN: "Compatibility unknown",
};

export function verdictLabel(status: FitmentVerdict["status"]): string {
  return LABELS[status];
}

/** Does a fitment record's scope match the given vehicle? Null fields are wildcards. */
export function recordMatchesVehicle(rec: FitmentRecord, v: GarageVehicle): boolean {
  if (rec.makeSlug && rec.makeSlug !== v.makeSlug) return false;
  if (rec.modelSlug && v.modelSlug && rec.modelSlug !== v.modelSlug) return false;
  if (rec.modelSlug && !v.modelSlug) return false; // record is model-specific, vehicle model unknown
  if (rec.yearFrom != null && v.year != null && v.year < rec.yearFrom) return false;
  if (rec.yearTo != null && v.year != null && v.year > rec.yearTo) return false;
  if (rec.engineFamilySlug && v.engineFamilySlug && rec.engineFamilySlug !== v.engineFamilySlug) return false;
  // Record engine-specific but vehicle engine unknown → year/model may match but engine unverified
  if (rec.engineFamilySlug && !v.engineFamilySlug) return false;
  return true;
}

export function evaluateFitment(
  product: {
    universalFit: boolean;
    requiresFitmentCheck: boolean;
    engineFamilySlugs?: string[];
  },
  fitments: FitmentRecord[],
  vehicle: GarageVehicle | null,
): FitmentVerdict {
  const approved = fitments.filter((f) => f.approved);

  if (!vehicle) {
    if (product.universalFit) {
      const uni = approved.find((f) => f.status === "UNIVERSAL_WITH_REQUIREMENTS");
      return { status: "UNIVERSAL", label: LABELS.UNIVERSAL, detail: uni?.notes ?? undefined };
    }
    return { status: "UNKNOWN", label: "Select a vehicle to check fitment" };
  }

  // Explicit incompatibility always wins.
  const notCompatible = approved.find((f) => f.status === "NOT_COMPATIBLE" && recordMatchesVehicle(f, vehicle));
  if (notCompatible) {
    return { status: "NOT_COMPATIBLE", label: LABELS.NOT_COMPATIBLE, detail: notCompatible.notes ?? undefined };
  }

  const confirmed = approved.find((f) => f.status === "CONFIRMED" && recordMatchesVehicle(f, vehicle));
  if (confirmed) {
    return { status: "CONFIRMED", label: LABELS.CONFIRMED, detail: confirmed.notes ?? undefined };
  }

  if (product.universalFit) {
    const uni = approved.find((f) => f.status === "UNIVERSAL_WITH_REQUIREMENTS");
    return { status: "UNIVERSAL", label: LABELS.UNIVERSAL, detail: uni?.notes ?? undefined };
  }

  const potential = approved.find((f) => f.status === "POTENTIAL" && recordMatchesVehicle(f, vehicle));
  if (potential) {
    return { status: "POTENTIAL", label: LABELS.POTENTIAL, detail: potential.notes ?? undefined };
  }

  // Engine family overlap without an explicit record → potential, never confirmed.
  if (vehicle.engineFamilySlug && product.engineFamilySlugs?.includes(vehicle.engineFamilySlug)) {
    return {
      status: "POTENTIAL",
      label: LABELS.POTENTIAL,
      detail: "Listed for your engine family, but fitment for your exact vehicle has not been verified.",
    };
  }

  // A CONFIRMED record scoped to a different make/model is a strong signal of
  // non-fit for vehicle-specific parts, but we stay honest: report unknown
  // rather than inventing incompatibility, unless every record targets another make.
  const vehicleSpecific = approved.filter((f) => f.status === "CONFIRMED" && f.makeSlug);
  if (vehicleSpecific.length > 0 && vehicleSpecific.every((f) => f.makeSlug !== vehicle.makeSlug)) {
    return {
      status: "NOT_COMPATIBLE",
      label: LABELS.NOT_COMPATIBLE,
      detail: "This part is listed only for other makes.",
    };
  }

  return { status: "UNKNOWN", label: LABELS.UNKNOWN, detail: "No verified fitment data for your vehicle — ask us to check." };
}

export function describeVehicle(v: GarageVehicle): string {
  return [v.year, v.makeName, v.modelName, v.engineFamilyName ? `(${v.engineFamilyName})` : null]
    .filter(Boolean)
    .join(" ");
}
