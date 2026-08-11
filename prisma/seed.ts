import { PrismaClient, FitmentStatus, RelationType, SourceType, StockStatus } from "@prisma/client";
import { brands, categories, childCategoryName, engineFamilies, makes, products, articles } from "./seed-data";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const toCents = (r: number) => Math.round(r * 100);

/** Generate a dark blueprint-style placeholder SVG for a category. */
function placeholderSvg(label: string): string {
  const safe = label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${safe} placeholder image">
<rect width="800" height="800" fill="#1a1d21"/>
<g stroke="#2c3138" stroke-width="1">${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="800"/><line x1="0" y1="${i * 50}" x2="800" y2="${i * 50}"/>`).join("")}</g>
<circle cx="400" cy="360" r="150" fill="none" stroke="#3d444d" stroke-width="3" stroke-dasharray="8 6"/>
<circle cx="400" cy="360" r="95" fill="none" stroke="#3d444d" stroke-width="2"/>
<line x1="230" y1="360" x2="570" y2="360" stroke="#3d444d" stroke-width="1.5"/>
<line x1="400" y1="190" x2="400" y2="530" stroke="#3d444d" stroke-width="1.5"/>
<text x="400" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#8a919b" letter-spacing="2">${safe.toUpperCase()}</text>
<text x="400" y="665" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#5c636c">PRODUCT IMAGE PENDING IMPORT</text>
</svg>`;
}

async function main() {
  // Guard: this dev seed WIPES the catalogue. Never run it once real
  // (imported) data is present, unless explicitly forced.
  const importedCount = await prisma.product.count({ where: { sourceType: { in: ["WOO_IMPORT", "SCRAPED"] } } });
  if (importedCount > 0 && !process.argv.includes("--force")) {
    console.error(
      `REFUSING TO SEED: database holds ${importedCount} imported (live) products.\n` +
      "The seed would delete them. Re-run with --force only if you really want a dev reset.",
    );
    process.exit(1);
  }

  console.log("Seeding database…");

  // Wipe (dev seed is idempotent-by-reset)
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.knowledgeChunk.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.productRelation.deleteMany(),
    prisma.fitment.deleteMany(),
    prisma.productEngine.deleteMany(),
    prisma.productCategory.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.vehicleModel.deleteMany(),
    prisma.vehicleMake.deleteMany(),
    prisma.engineFamily.deleteMany(),
    prisma.category.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.article.deleteMany(),
    prisma.redirect.deleteMany(),
  ]);

  // Brands
  const brandIds: Record<string, string> = {};
  for (const b of brands) {
    const row = await prisma.brand.create({ data: b });
    brandIds[b.slug] = row.id;
  }

  // Categories (parents then children)
  const catIds: Record<string, string> = {};
  let pos = 0;
  for (const c of categories) {
    const parent = await prisma.category.create({
      data: { slug: c.slug, name: c.name, position: pos++ },
    });
    catIds[c.slug] = parent.id;
    for (const child of c.children) {
      const row = await prisma.category.create({
        data: { slug: child, name: childCategoryName(child), parentId: parent.id, position: pos++ },
      });
      catIds[child] = row.id;
    }
  }

  // Engine families
  const engineIds: Record<string, string> = {};
  for (const e of engineFamilies) {
    const row = await prisma.engineFamily.create({
      data: { slug: e.slug, name: e.name, make: e.make, aliases: e.aliases },
    });
    engineIds[e.slug] = row.id;
  }

  // Vehicles
  const makeIds: Record<string, string> = {};
  const modelIds: Record<string, string> = {};
  for (const m of makes) {
    const make = await prisma.vehicleMake.create({ data: { slug: m.slug, name: m.name } });
    makeIds[m.slug] = make.id;
    for (const mod of m.models) {
      const row = await prisma.vehicleModel.create({
        data: { slug: mod.slug, makeId: make.id, name: mod.name, yearFrom: mod.yearFrom, yearTo: mod.yearTo },
      });
      modelIds[mod.slug] = row.id;
    }
  }

  // Placeholder images per top-level category
  const imgDir = path.join(process.cwd(), "public", "products");
  fs.mkdirSync(imgDir, { recursive: true });
  const parentOf: Record<string, string> = {};
  for (const c of categories) {
    parentOf[c.slug] = c.slug;
    for (const child of c.children) parentOf[child] = c.slug;
    const file = path.join(imgDir, `${c.slug}.svg`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, placeholderSvg(c.name));
  }

  // Products
  const productIds: Record<string, string> = {};
  for (const p of products) {
    const topCat = parentOf[p.cats[0]] ?? "engines-components";
    const row = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        brandId: brandIds[p.brand],
        regularPriceCents: toCents(p.priceR),
        salePriceCents: p.saleR ? toCents(p.saleR) : null,
        stockStatus: (p.stock ?? "IN_STOCK") as StockStatus,
        stockQty: p.qty ?? (p.stock === "BACKORDER" || p.stock === "OUT_OF_STOCK" ? 0 : 1),
        shortDescription: p.short,
        description: p.desc,
        specs: p.specs ? p.specs.map(([label, value]) => ({ label, value })) : undefined,
        included: p.included,
        requiredParts: p.required,
        installNotes: p.installNotes,
        weightGrams: p.weightG,
        universalFit: !!p.universal,
        requiresFitmentCheck: !!p.fitmentCheck,
        safetyCritical: !!p.safety,
        isFeatured: !!p.featured,
        isBestSeller: !!p.bestSeller,
        popularity: p.popularity ?? 0,
        sourceType: SourceType.SAMPLE,
        needsReview: true,
        seoTitle: `${p.name} | All American Muscle`,
        seoDescription: p.short,
        images: {
          create: [{ url: `/products/${topCat}.svg`, alt: `${p.name} — product image pending import`, position: 0 }],
        },
        categories: {
          create: p.cats.filter((c) => catIds[c]).map((c) => ({ categoryId: catIds[c] })),
        },
        engineFamilies: {
          create: (p.engines ?? []).filter((e) => engineIds[e]).map((e) => ({ engineFamilyId: engineIds[e] })),
        },
      },
    });
    productIds[p.slug] = row.id;
  }

  // Fitments
  for (const p of products) {
    for (const f of p.fitments ?? []) {
      await prisma.fitment.create({
        data: {
          productId: productIds[p.slug],
          makeId: f.make ? makeIds[f.make] : null,
          modelId: f.model ? modelIds[f.model] : null,
          yearFrom: f.yearFrom,
          yearTo: f.yearTo,
          engineFamilyId: f.engine ? engineIds[f.engine] : null,
          status: f.status as FitmentStatus,
          notes: f.notes,
          source: "STAFF",
          approved: true,
          approvedBy: "seed",
          approvedAt: new Date(),
        },
      });
    }
  }

  // Relations
  for (const p of products) {
    for (const r of p.relations ?? []) {
      if (!productIds[r.slug]) continue;
      await prisma.productRelation.create({
        data: {
          productId: productIds[p.slug],
          relatedId: productIds[r.slug],
          type: r.type as RelationType,
          note: r.note,
        },
      });
    }
  }

  // Articles
  for (const a of articles) {
    await prisma.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        body: a.body,
        category: a.category,
        seoTitle: `${a.title} | All American Muscle`,
        seoDescription: a.excerpt,
        sourceType: SourceType.MANUAL,
      },
    });
  }

  // Redirect map: old WooCommerce URL patterns -> new routes (sample of known public URLs)
  const redirects: [string, string][] = [
    ["/product/holley-classic-carburetor-750cfm/", "/products/holley-classic-carburetor-750cfm"],
    ["/product/performer-eps-intake-manifold-for-1955-86-small-bl/", "/products/edelbrock-performer-eps-intake-manifold-sbc"],
    ["/product/mastodon-throttle-return-springs-bracket-kit/", "/products/mastodon-throttle-return-springs-bracket-kit"],
    ["/product/edelbrock-performer-carburetor-600-cfm-manual-choke-2/", "/products/edelbrock-performer-carburetor-600-cfm-manual-choke"],
    ["/product/holley-carburetor-service-parts-renew-kit/", "/products/holley-carburettor-service-renew-kit"],
    ["/product/holley-street-warrior-carburetor-600-cfm-manual-choke-sa/", "/products/holley-street-warrior-600-cfm-manual"],
    ["/muscle-car-services/", "/services/restorations"],
    ["/about-us/", "/about"],
    ["/contact-us/", "/contact"],
    ["/pages/contact", "/contact"],
    ["/shop/", "/shop"],
  ];
  for (const [fromPath, toPath] of redirects) {
    await prisma.redirect.create({ data: { fromPath, toPath } });
  }

  // Approved AI knowledge: articles + store policies + workshop facts
  for (const a of articles) {
    await prisma.knowledgeChunk.create({
      data: {
        sourceType: "article",
        sourceId: a.slug,
        title: a.title,
        content: `${a.excerpt}\n\n${a.body}`,
        approved: true,
      },
    });
  }
  await prisma.knowledgeChunk.createMany({
    data: [
      {
        sourceType: "workshop",
        title: "About All American Muscle",
        content:
          "All American Muscle (Pty) Ltd is an American muscle car specialist in Alberton, Gauteng, South Africa (15 Tarry Road, Alrode South). It runs a fully equipped 2000 m² workshop handling frame-off restorations, engine building and performance upgrades for classic Ford, Chevrolet, Dodge and Mopar vehicles, and stocks 600+ performance parts including the Mastodon house brand plus US brands such as ARP, Holley, Edelbrock, COMP Cams and Moog. Nationwide delivery across South Africa. Phone +27 10 592 1706, WhatsApp +27 72 042 6477, email parts@allamericanmuscle.co.za.",
        approved: true,
      },
      {
        sourceType: "policy",
        title: "Delivery policy (placeholder)",
        content:
          "Orders are shipped nationwide in South Africa via The Courier Guy. Delivery estimates are typically 1-3 working days for main centres and 3-5 working days for regional areas once an order has been collected. Collection from the Alberton workshop is free. NOTE: placeholder policy pending confirmation by store staff.",
        approved: true,
      },
      {
        sourceType: "policy",
        title: "Returns policy (placeholder)",
        content:
          "Unused parts in original packaging may be returned within 14 days for a refund or exchange, excluding special-order and electrical items. Warranty claims are handled per manufacturer terms. NOTE: placeholder policy pending confirmation by store staff.",
        approved: true,
      },
      {
        sourceType: "workshop",
        title: "Safety-critical parts guidance",
        content:
          "Brake, steering, suspension and fuel system components are safety-critical. All American Muscle recommends professional installation or inspection for these systems. The AI specialist must always recommend complete supporting hardware (e.g. dual-circuit master cylinder with disc conversions, pressure regulator with electric fuel pumps), must not present partial safety-critical setups as complete, and must refer customers to the workshop for final verification.",
        approved: true,
      },
    ],
  });

  const counts = {
    brands: await prisma.brand.count(),
    categories: await prisma.category.count(),
    engineFamilies: await prisma.engineFamily.count(),
    makes: await prisma.vehicleMake.count(),
    models: await prisma.vehicleModel.count(),
    products: await prisma.product.count(),
    fitments: await prisma.fitment.count(),
    relations: await prisma.productRelation.count(),
    articles: await prisma.article.count(),
    redirects: await prisma.redirect.count(),
    knowledge: await prisma.knowledgeChunk.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
