import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (!authEnabled) return NextResponse.next();
  // Visitors who never signed in have no session to refresh.
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  // Pages and auth routes only; skip static files, images and the public listings API.
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico|api/properties|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)"],
};
