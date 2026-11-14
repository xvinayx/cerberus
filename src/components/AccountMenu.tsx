"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AccountMenu() {
  const { enabled, ready, user, error } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!enabled) return null;
  // Reserve the space while the session loads so the header doesn't jump.
  if (!ready) return <span className="inline-block h-9 w-20" aria-hidden="true" />;

  if (!user) {
    const next = pathname === "/login" ? "/" : pathname;
    return (
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="ml-1 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Sign in
      </Link>
    );
  }

  const email = user.email ?? "Account";
  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Account menu for ${email}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold uppercase text-brand-800 hover:ring-2 hover:ring-brand-100"
      >
        {email[0]}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[1200] mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <p className="truncate px-3 py-2 text-sm text-slate-500">{email}</p>
          {error && <p className="px-3 pb-2 text-xs text-red-700">{error}</p>}
          <Link
            href="/saved"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-slate-100"
          >
            Saved properties
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-slate-100"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
