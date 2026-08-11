import { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { businessInfo } from "../../../prisma/seed-data";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact All American Muscle — phone, WhatsApp, email or visit our Alberton workshop. Parts advice, restorations and engine builds.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="headline text-3xl text-paper-50">Contact Us</h1>
      <div className="rule-red mt-2" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-lg border border-ink-800 bg-ink-900 p-5">
            <h2 className="headline text-lg text-paper-50">Workshop</h2>
            <p className="mt-2 text-sm leading-relaxed text-steel-300">{businessInfo.address}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a className="font-semibold text-paper-100 hover:text-white" href={`tel:${businessInfo.phone.replace(/\s/g, "")}`}>📞 {businessInfo.phone}</a></li>
              <li><a className="font-semibold text-paper-100 hover:text-white" href={businessInfo.whatsappLink} target="_blank" rel="noopener noreferrer">💬 WhatsApp {businessInfo.whatsapp}</a></li>
              <li><a className="font-semibold text-paper-100 hover:text-white" href={`mailto:${businessInfo.email}`}>✉️ {businessInfo.email}</a></li>
            </ul>
          </div>
          <div className="rounded-lg border border-ink-800 bg-ink-900 p-5">
            <h2 className="headline text-lg text-paper-50">Trading hours</h2>
            <dl className="mt-2 space-y-1.5 text-sm">
              {businessInfo.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt className="text-steel-300">{h.days}</dt>
                  <dd className="font-semibold text-paper-100">{h.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
        <EnquiryForm type="GENERAL" heading="Send us a message" />
      </div>
    </div>
  );
}
