import { Metadata } from "next";
import { ProductListing, ListingSearchParams } from "@/components/product-listing";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  return (
    <ProductListing
      title={q ? `Search: ${q}` : "Search"}
      intro="Search understands part numbers, abbreviations like SBC, BBC and 302, and common misspellings."
      basePath="/search"
      searchParams={params}
    />
  );
}
