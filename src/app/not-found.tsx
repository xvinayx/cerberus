import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">This listing isn’t available</h1>
      <p className="mt-2 text-slate-600">It may have sold, been leased, or been taken off the market.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Search listings
      </Link>
    </main>
  );
}
