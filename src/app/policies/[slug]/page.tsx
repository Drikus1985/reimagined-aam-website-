import { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Policy pages. These are clearly-marked placeholder drafts pending the
 * store's official wording — see reports/data-quality-report.md. Replace the
 * body text with the live site's policies during content migration.
 */
const POLICIES: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms & Conditions",
    body: [
      "DRAFT — placeholder pending migration of the official store terms.",
      "All prices are in South African Rand and include VAT unless stated otherwise. Orders are subject to stock availability and confirmation of payment via PayFast. We reserve the right to correct pricing errors; if a corrected price is not acceptable you may cancel for a full refund.",
      "Fitment information is provided in good faith from verified data and manufacturer sources. Where a part is marked as requiring verification, please confirm fitment with us before ordering. Performance parts may affect vehicle warranties, insurance and roadworthiness — you are responsible for compliance with applicable regulations.",
      "Special-order and imported items may carry longer lead times, which we communicate before payment. Nothing in these terms limits your rights under the Consumer Protection Act 68 of 2008.",
    ],
  },
  privacy: {
    title: "Privacy & POPIA",
    body: [
      "DRAFT — placeholder pending migration of the official policy.",
      "We collect only the personal information needed to process your order, deliver it, and respond to enquiries: name, contact details, delivery address and order history. Payment card details are handled entirely by PayFast — we never see or store them.",
      "In line with the Protection of Personal Information Act (POPIA), we process your information with consent, use it only for the purpose you gave it, and never sell it. Enquiry forms and the AI specialist capture contact details only with your explicit consent.",
      "You may request access to, correction of, or deletion of your personal information at any time via parts@allamericanmuscle.co.za. Analytics on this site are consent-aware and anonymised.",
    ],
  },
  returns: {
    title: "Returns & Refunds",
    body: [
      "DRAFT — placeholder pending migration of the official policy.",
      "Unused parts in original, unopened packaging may be returned within 14 days of delivery for a refund or exchange. Special-order/imported items and electrical components are excluded unless defective.",
      "Defective items are handled under the manufacturer's warranty and the Consumer Protection Act — contact us with your order number and photos and we'll manage the claim with the supplier.",
      "Return shipping for change-of-mind returns is for the customer's account; we arrange and cover collection for confirmed defects. Refunds are processed to the original payment method within 7 working days of receiving the returned item.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) return {};
  return { title: policy.title, alternates: { canonical: `/policies/${slug}` } };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="headline text-3xl text-paper-50">{policy.title}</h1>
      <div className="rule-red mt-2" />
      <div className="prose-dark mt-6">
        {policy.body.map((p, i) =>
          p.startsWith("DRAFT") ? (
            <p key={i} className="rounded border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">{p}</p>
          ) : (
            <p key={i}>{p}</p>
          ),
        )}
      </div>
    </div>
  );
}
