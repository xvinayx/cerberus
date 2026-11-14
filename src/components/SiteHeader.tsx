import Link from "next/link";
import AccountMenu from "./AccountMenu";
import Logo from "./Logo";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1100] border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-brand-700">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight text-ink">
            Cerberus<span className="hidden font-medium text-slate-500 sm:inline"> Commercial</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link href="/" className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
            Buy
          </Link>
          <Link
            href="/?listing=lease"
            className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
          >
            Lease
          </Link>
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
