import { cookies } from "next/headers";
import { GarageVehicle } from "./fitment";

export const GARAGE_COOKIE = "aam_garage";

export type GarageState = {
  vehicles: GarageVehicle[];
  activeId: string | null;
};

export function parseGarage(raw: string | undefined): GarageState {
  if (!raw) return { vehicles: [], activeId: null };
  try {
    const data = JSON.parse(raw) as GarageState;
    if (!Array.isArray(data.vehicles)) return { vehicles: [], activeId: null };
    return {
      vehicles: data.vehicles.slice(0, 10).filter((v) => v && typeof v.makeSlug === "string"),
      activeId: typeof data.activeId === "string" ? data.activeId : null,
    };
  } catch {
    return { vehicles: [], activeId: null };
  }
}

/** Server-side: read the active garage vehicle from the request cookie. */
export async function getActiveVehicle(): Promise<GarageVehicle | null> {
  const store = await cookies();
  const state = parseGarage(store.get(GARAGE_COOKIE)?.value);
  if (!state.activeId) return null;
  return state.vehicles.find((v) => v.id === state.activeId) ?? null;
}

export async function getGarage(): Promise<GarageState> {
  const store = await cookies();
  return parseGarage(store.get(GARAGE_COOKIE)?.value);
}
