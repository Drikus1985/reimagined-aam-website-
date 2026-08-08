import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AssistantWidget } from "@/components/assistant-widget";
import { businessInfo } from "../../prisma/seed-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "All American Muscle | American Muscle Car Parts, Restorations & Engine Builds — South Africa",
    template: "%s | All American Muscle",
  },
  description:
    "600+ performance parts for classic Ford, Chevrolet, Dodge and Mopar. Restorations, engine building and nationwide delivery from our Alberton workshop.",
  openGraph: {
    siteName: "All American Muscle",
    type: "website",
    locale: "en_ZA",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  name: "All American Muscle (Pty) Ltd",
  url: siteUrl,
  telephone: businessInfo.phone,
  email: businessInfo.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "15 Tarry Road, Alrode South",
    addressLocality: "Alberton",
    postalCode: "1451",
    addressRegion: "Gauteng",
    addressCountry: "ZA",
  },
  sameAs: [businessInfo.facebook, businessInfo.tiktok],
  areaServed: "ZA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body className="min-h-screen">
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <AssistantWidget />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
