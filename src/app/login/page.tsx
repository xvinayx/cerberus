import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isAuthEnabled, safeNextPath } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

// Depends on who is signed in and on runtime settings: never pre-build it.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isAuthEnabled()) notFound();
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(next);

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-16">
      <h1 className="text-2xl font-bold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Save properties you like and find them again from any device. No password needed: we&apos;ll email you a
        link.
      </p>
      <div className="mt-6">
        <LoginForm next={next} linkError={params.error === "link"} />
      </div>
    </main>
  );
}
