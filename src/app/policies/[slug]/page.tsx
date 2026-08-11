import { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Policy pages — verbatim text from the live site (captured 11.08.2026, see
 * reports/handover/). The live pages themselves are marked "Starter policy …
 * review with your legal advisor", so the draft banner stays until legal
 * sign-off (routed to legal@allamericanmuscle.co.za / Focus Legal per the
 * handover). Replace DRAFT_BANNER-flagged pages with signed-off wording only.
 */
const DRAFT_BANNER =
  "Starter policy for All American Muscle (Pty) Ltd — under review with our legal advisors. The wording below matches the current live site.";

const POLICIES: Record<string, { title: string; sections: [string, string][] }> = {
  terms: {
    title: "Terms & Conditions",
    sections: [
      ["", "These terms govern purchases from All American Muscle (Pty) Ltd, 15 Tarry Rd, Alrode South, Alberton, 1451, South Africa."],
      ["1. Orders & Pricing", "All prices are listed in South African Rand (ZAR). We reserve the right to correct pricing errors. Placing an order constitutes an offer to purchase, which we accept once payment is confirmed."],
      ["2. Payment", "Payments are processed securely via Payfast. Orders are confirmed once payment has cleared."],
      ["3. Shipping & Delivery", "Orders are shipped within South Africa via The Courier Guy. Delivery timeframes are estimates and not guaranteed."],
      ["4. Backorders", "Items marked “Available on backorder” may be ordered but are not in stock; we will advise expected lead times after your order is placed."],
      ["5. Returns & Refunds", "Please contact us within 7 days of delivery regarding returns. Items must be unused and in original packaging. Made-to-order and special-order items may be non-returnable."],
      ["6. Warranty", "Products carry the manufacturer's warranty where applicable. Fitment and installation are the customer's responsibility."],
      ["7. Contact", "All American Muscle — Phone 010 592 1706 · WhatsApp 072 042 6477 · parts@allamericanmuscle.co.za"],
      ["8. Governing Law", "These terms are governed by the laws of the Republic of South Africa."],
    ],
  },
  privacy: {
    title: "Privacy & POPIA",
    sections: [
      ["1. Who we are", "All American Muscle (Pty) Ltd, 15 Tarry Rd, Alrode South, Alberton, 1451, South Africa. Contact: parts@allamericanmuscle.co.za · 010 592 1706."],
      ["2. Information we collect", "When you place an order or create an account we collect your name, contact details, delivery/billing address, and order history. Payment card details are handled by our payment provider, not stored by us."],
      ["3. How we use it", "To process and deliver orders, manage your account, provide support, and (where you opt in) send updates. We process your information lawfully under the Protection of Personal Information Act (POPIA)."],
      ["4. Sharing", "We share only what is necessary with our payment processor (Payfast) and courier (The Courier Guy) to fulfil your order. We do not sell your personal information."],
      ["5. Cookies & analytics", "We use cookies for cart/checkout functionality and may use analytics to improve the site. Analytics on this site run only after you opt in, and count page views without identifying you."],
      ["6. Your rights", "Under POPIA you may request access to, correction of, or deletion of your personal information by contacting us."],
      ["7. Retention", "We keep order records for as long as required for tax, legal and warranty purposes."],
    ],
  },
  returns: {
    title: "Returns & Refunds",
    sections: [
      ["1. Returns window", "Please notify us within 7 days of delivery if you wish to return an item. Items must be unused, in original packaging and in resaleable condition."],
      ["2. Non-returnable items", "Special-order, made-to-order and electrical items may not be returnable unless faulty."],
      ["3. Faulty or incorrect goods", "If goods are defective, damaged or incorrect, contact us immediately. Your rights under the Consumer Protection Act (CPA) are not affected."],
      ["4. Refunds", "Approved refunds are processed to your original payment method once the returned item is received and inspected. Please allow several business days for the refund to reflect."],
      ["5. Return shipping", "Return shipping costs are for the customer's account unless the item is faulty or incorrect."],
      ["6. How to start a return", "Contact parts@allamericanmuscle.co.za or WhatsApp 072 042 6477 with your order number and reason for return."],
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
        <p className="rounded border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">{DRAFT_BANNER}</p>
        {policy.sections.map(([heading, text]) => (
          <div key={heading || text.slice(0, 20)}>
            {heading && <h2>{heading}</h2>}
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
