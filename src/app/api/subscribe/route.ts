import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // TODO: Wire Mailchimp/ConvertKit integration and persist the submitted email.
  await request.json().catch(() => null);
  return NextResponse.json({ success: true });
}
