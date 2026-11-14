import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import SiteHeader from "@/components/SiteHeader";
import { getSupabaseConfig, isAuthEnabled } from "@/lib/supabase/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cerberus — Commercial Real Estate for Sale & Lease",
    template: "%s | Cerberus",
  },
  description:
    "Search office, retail, industrial, multifamily, and land listings for sale and lease on an interactive map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-full flex-col">
        {isAuthEnabled() ? (
          <AuthProvider config={getSupabaseConfig()}>
            <SiteHeader />
            {children}
          </AuthProvider>
        ) : (
          <>
            <SiteHeader />
            {children}
          </>
        )}
      </body>
    </html>
  );
}
