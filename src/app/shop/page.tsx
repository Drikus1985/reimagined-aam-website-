import { Metadata } from "next";
import { ProductListing, ListingSearchParams } from "@/components/product-listing";

export const metadata: Metadata = {
  title: "Shop American Muscle Car Parts",
  description:
    "Browse 600+ performance parts for classic Ford, Chevrolet, Dodge and Mopar — engines, carburettors, brakes, suspension, cooling and more. Nationwide SA delivery.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  return (
    <ProductListing
      title="Shop Parts"
      intro="Every part in our live catalogue — filter by category, brand, engine family or your garage vehicle."
      basePath="/shop"
      searchParams={await searchParams}
    />
  );
}
