import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateDigest } from "@/lib/email/gmail-sync";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const digest = await generateDigest();

  return NextResponse.json({ digest });
}
