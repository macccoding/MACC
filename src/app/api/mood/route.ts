import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const days = parseInt(
    request.nextUrl.searchParams.get("days") || "30",
    10
  );
  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const entries = await prisma.moodEntry.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (err) {
    console.error("[mood] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { mood, energy, note } = body as {
    mood?: number;
    energy?: number;
    note?: string;
  };

  if (
    typeof mood !== "number" ||
    typeof energy !== "number" ||
    mood < 1 ||
    mood > 5 ||
    energy < 1 ||
    energy > 5
  ) {
    return NextResponse.json(
      { error: "mood and energy must be numbers between 1 and 5" },
      { status: 400 }
    );
  }

  try {
    const entry = await prisma.moodEntry.create({
      data: {
        mood,
        energy,
        ...(note ? { note } : {}),
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[mood] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
