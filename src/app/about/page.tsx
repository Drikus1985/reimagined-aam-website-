import { Metadata } from "next";
import Link from "next/link";
import { businessInfo } from "../../../prisma/seed-data";

export const metadata: Metadata = {
  title: "About Us",
  description: "All American Muscle: an American muscle car restoration workshop and parts supplier in Alberton, South Africa. Classic Ford, Chevrolet, Dodge and Mopar only.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="headline text-3xl text-paper-50">About All American Muscle</h1>
      <div className="rule-red mt-2" />
      <div className="prose-dark mt-6">
        <p>
          All American Muscle (Pty) Ltd is an automotive restoration workshop specialising in well-built, high quality
          American muscle cars and trucks. From our fully equipped 2000&nbsp;m² facility in Alrode South, Alberton, we
          restore, build and supply parts for classic Ford, Chevrolet, Dodge and Mopar — and nothing else.
        </p>
        <p>
          The parts business exists because the workshop needed it: reliable components, honestly described, from
          brands we trust on our own builds — our Mastodon house range alongside ARP, Holley, Edelbrock, COMP Cams,
          Fel-Pro, MSD, Moog and more. With a wide network of suppliers across the US we source and ship
          hard-to-find parts quickly and cost-effectively.
        </p>
        <p>
          Everything we sell ships nationwide across South Africa, and everything we recommend is backed by people
          who work on these cars every day. If our fitment data doesn't confirm a part fits your vehicle, the website
          says so — and we'll verify it before you spend a cent.
        </p>
        <h2>Find us</h2>
        <p>
          {businessInfo.address}<br />
          Phone: <a href={`tel:${businessInfo.phone.replace(/\s/g, "")}`}>{businessInfo.phone}</a><br />
          WhatsApp: <a href={businessInfo.whatsappLink}>{businessInfo.whatsapp}</a><br />
          Email: <a href={`mailto:${businessInfo.email}`}>{businessInfo.email}</a>
        </p>
      </div>
      <div className="mt-8 flex gap-3">
        <Link href="/services/restorations" className="rounded bg-race-600 px-5 py-2.5 font-bold text-white hover:bg-race-700">Our restoration work</Link>
        <Link href="/contact" className="rounded border border-ink-600 px-5 py-2.5 font-semibold text-paper-100 hover:border-race-600">Contact &amp; hours</Link>
      </div>
    </div>
  );
}
