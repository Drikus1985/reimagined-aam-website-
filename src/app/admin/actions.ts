"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { invalidateSearchIndex } from "@/lib/search";
import { FitmentStatus, LeadStatus, OrderStatus, StockStatus } from "@prisma/client";

async function guard(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Not authorised");
}

async function audit(action: string, entity: string, entityId: string, meta?: object) {
  await prisma.auditLog.create({ data: { actor: "admin", action, entity, entityId, meta } });
}

export async function updateProduct(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const priceR = parseFloat(String(formData.get("price")));
  const stockQty = parseInt(String(formData.get("stockQty")), 10);
  const stockStatus = String(formData.get("stockStatus")) as StockStatus;
  const needsReview = formData.get("needsReview") === "on";

  await prisma.product.update({
    where: { id },
    data: {
      regularPriceCents: Number.isFinite(priceR) && priceR > 0 ? Math.round(priceR * 100) : undefined,
      stockQty: Number.isFinite(stockQty) && stockQty >= 0 ? stockQty : undefined,
      stockStatus: Object.values(StockStatus).includes(stockStatus) ? stockStatus : undefined,
      needsReview,
    },
  });
  invalidateSearchIndex();
  await audit("product.updated", "Product", id, { priceR, stockQty, stockStatus });
  revalidatePath("/admin/products");
}

export async function approveFitment(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await prisma.fitment.update({
    where: { id },
    data: { approved: true, approvedBy: "admin", approvedAt: new Date() },
  });
  await audit("fitment.approved", "Fitment", id);
  revalidatePath("/admin/fitment");
}

export async function rejectFitment(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await prisma.fitment.delete({ where: { id } });
  await audit("fitment.rejected", "Fitment", id);
  revalidatePath("/admin/fitment");
}

export async function updateOrderStatus(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (!Object.values(OrderStatus).includes(status)) return;
  await prisma.order.update({ where: { id }, data: { status } });
  await audit("order.status_changed", "Order", id, { status });
  revalidatePath("/admin/orders");
}

export async function updateLeadStatus(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as LeadStatus;
  if (!Object.values(LeadStatus).includes(status)) return;
  await prisma.lead.update({ where: { id }, data: { status } });
  await audit("lead.status_changed", "Lead", id, { status });
  revalidatePath("/admin/leads");
}

export async function toggleKnowledge(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const chunk = await prisma.knowledgeChunk.findUnique({ where: { id } });
  if (!chunk) return;
  await prisma.knowledgeChunk.update({ where: { id }, data: { approved: !chunk.approved } });
  await audit(chunk.approved ? "knowledge.unapproved" : "knowledge.approved", "KnowledgeChunk", id);
  revalidatePath("/admin/knowledge");
}

export async function addKnowledge(formData: FormData) {
  await guard();
  const title = String(formData.get("title") ?? "").slice(0, 300);
  const content = String(formData.get("content") ?? "").slice(0, 20000);
  if (!title || !content) return;
  const chunk = await prisma.knowledgeChunk.create({
    data: { title, content, sourceType: "workshop", approved: true },
  });
  await audit("knowledge.added", "KnowledgeChunk", chunk.id);
  revalidatePath("/admin/knowledge");
}

export async function addRedirect(formData: FormData) {
  await guard();
  const fromPath = String(formData.get("fromPath") ?? "").trim();
  const toPath = String(formData.get("toPath") ?? "").trim();
  if (!fromPath.startsWith("/") || !toPath.startsWith("/")) return;
  await prisma.redirect.upsert({
    where: { fromPath },
    create: { fromPath, toPath },
    update: { toPath },
  });
  await audit("redirect.saved", "Redirect", fromPath, { toPath });
  revalidatePath("/admin/redirects");
}

export async function deleteRedirect(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await prisma.redirect.delete({ where: { id } });
  await audit("redirect.deleted", "Redirect", id);
  revalidatePath("/admin/redirects");
}

export async function addFitment(formData: FormData) {
  await guard();
  const productId = String(formData.get("productId"));
  const status = String(formData.get("status")) as FitmentStatus;
  const makeSlug = String(formData.get("make") ?? "");
  const modelSlug = String(formData.get("model") ?? "");
  const engineSlug = String(formData.get("engine") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 500) || null;
  if (!Object.values(FitmentStatus).includes(status)) return;

  const [make, model, engine] = await Promise.all([
    makeSlug ? prisma.vehicleMake.findUnique({ where: { slug: makeSlug } }) : null,
    modelSlug ? prisma.vehicleModel.findUnique({ where: { slug: modelSlug } }) : null,
    engineSlug ? prisma.engineFamily.findUnique({ where: { slug: engineSlug } }) : null,
  ]);

  const fitment = await prisma.fitment.create({
    data: {
      productId,
      makeId: make?.id,
      modelId: model?.id,
      engineFamilyId: engine?.id,
      status,
      notes,
      source: "STAFF",
      approved: true,
      approvedBy: "admin",
      approvedAt: new Date(),
    },
  });
  await audit("fitment.added", "Fitment", fitment.id, { productId, status });
  revalidatePath("/admin/fitment");
}
