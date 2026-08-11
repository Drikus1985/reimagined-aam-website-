"use client";

/**
 * Client-side cart & garage state, persisted in cookies so server components
 * can read them for SSR (fitment badges, priced basket). Prices are NEVER
 * stored client-side — only product IDs and quantities.
 */

import { GarageVehicle } from "../fitment";

const CART_COOKIE = "aam_cart";
const GARAGE_COOKIE = "aam_garage";
const YEAR = 60 * 60 * 24 * 365;

export type CartLine = { productId: string; qty: number };
export type GarageState = { vehicles: GarageVehicle[]; activeId: string | null };

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${YEAR}; samesite=lax`;
}

// ---------- Cart ----------

export function getCartClient(): CartLine[] {
  try {
    const data = JSON.parse(readCookie(CART_COOKIE) ?? "[]");
    return Array.isArray(data) ? data.filter((l) => l?.productId && l?.qty > 0) : [];
  } catch {
    return [];
  }
}

function setCart(lines: CartLine[]) {
  writeCookie(CART_COOKIE, JSON.stringify(lines.slice(0, 50)));
  window.dispatchEvent(new CustomEvent("aam:cart"));
}

export function addToCart(productId: string, qty = 1) {
  const cart = getCartClient();
  const existing = cart.find((l) => l.productId === productId);
  if (existing) existing.qty = Math.min(existing.qty + qty, 99);
  else cart.push({ productId, qty: Math.min(qty, 99) });
  setCart(cart);
}

export function setCartQty(productId: string, qty: number) {
  let cart = getCartClient();
  if (qty <= 0) cart = cart.filter((l) => l.productId !== productId);
  else {
    const line = cart.find((l) => l.productId === productId);
    if (line) line.qty = Math.min(qty, 99);
    else cart.push({ productId, qty: Math.min(qty, 99) });
  }
  setCart(cart);
}

export function clearCart() {
  setCart([]);
}

export function cartCount(): number {
  return getCartClient().reduce((s, l) => s + l.qty, 0);
}

// ---------- Garage ----------

export function getGarageClient(): GarageState {
  try {
    const data = JSON.parse(readCookie(GARAGE_COOKIE) ?? "{}");
    return {
      vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
      activeId: typeof data.activeId === "string" ? data.activeId : null,
    };
  } catch {
    return { vehicles: [], activeId: null };
  }
}

function setGarage(state: GarageState) {
  writeCookie(GARAGE_COOKIE, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("aam:garage"));
}

export function saveVehicle(vehicle: Omit<GarageVehicle, "id">): GarageVehicle {
  const state = getGarageClient();
  const v: GarageVehicle = { ...vehicle, id: `v${Date.now().toString(36)}` };
  state.vehicles = [...state.vehicles, v].slice(-10);
  state.activeId = v.id;
  setGarage(state);
  return v;
}

export function removeVehicle(id: string) {
  const state = getGarageClient();
  state.vehicles = state.vehicles.filter((v) => v.id !== id);
  if (state.activeId === id) state.activeId = state.vehicles[0]?.id ?? null;
  setGarage(state);
}

export function setActiveVehicleClient(id: string | null) {
  const state = getGarageClient();
  state.activeId = id && state.vehicles.some((v) => v.id === id) ? id : null;
  setGarage(state);
}

export function activeVehicle(): GarageVehicle | null {
  const state = getGarageClient();
  return state.vehicles.find((v) => v.id === state.activeId) ?? null;
}
