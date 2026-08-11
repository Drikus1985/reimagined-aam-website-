import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="headline text-6xl text-race-600">404</p>
      <h1 className="headline mt-2 text-2xl text-paper-50">That page has left the garage.</h1>
      <p className="mt-3 text-steel-300">
        The part you're after might still be in the catalogue — try a search, or ask a specialist.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/shop" className="rounded bg-race-600 px-5 py-2.5 font-bold text-white hover:bg-race-700">Shop parts</Link>
        <Link href="/contact" className="rounded border border-ink-600 px-5 py-2.5 font-semibold text-paper-100 hover:border-race-600">Contact us</Link>
      </div>
    </div>
  );
}
