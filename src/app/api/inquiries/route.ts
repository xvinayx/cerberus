import { NextResponse } from "next/server";
import { getPropertyById } from "@/lib/properties";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/inquiries — a buyer/tenant contacting the listing broker.
 *
 * For now this validates the request and logs it. Hook it up to email
 * (e.g. Resend, SES) or a CRM to deliver inquiries for real.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const str = (key: string, max: number) =>
    typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";

  const inquiry = {
    propertyId: str("propertyId", 50),
    name: str("name", 100),
    email: str("email", 200),
    phone: str("phone", 40),
    message: str("message", 2000),
  };

  const property = getPropertyById(inquiry.propertyId);
  if (!property) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (!inquiry.name || !inquiry.message) {
    return NextResponse.json({ error: "Please fill in your name and a message." }, { status: 400 });
  }
  if (!EMAIL.test(inquiry.email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  console.info("[inquiry]", {
    ...inquiry,
    broker: property.broker.email,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
