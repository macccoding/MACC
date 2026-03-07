import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();

  // Rate limit check
  const record = attempts.get(ip);
  if (record) {
    if (now < record.resetAt) {
      if (record.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many attempts" },
          { status: 429 }
        );
      }
    } else {
      attempts.delete(ip);
    }
  }

  const { pin } = await request.json();

  if (!pin || typeof pin !== "string" || pin.length !== 4) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
  }

  const correctPin = process.env.DASHBOARD_PIN;
  if (!correctPin) {
    // PIN not configured — allow access in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  if (pin !== correctPin) {
    // Track failed attempt
    const existing = attempts.get(ip);
    if (existing && now < existing.resetAt) {
      existing.count++;
    } else {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
    return NextResponse.json({ error: "Incorrect" }, { status: 401 });
  }

  // PIN correct — set a session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set("mikeos-session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
