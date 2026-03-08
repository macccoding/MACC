import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function todayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const date = todayMidnight();

  try {
    // Check new JournalEntry model first (reflection for today)
    const newEntry = await prisma.journalEntry.findFirst({
      where: { date, type: "reflection" },
      orderBy: { createdAt: "desc" },
    });

    if (newEntry) {
      return NextResponse.json(newEntry);
    }

    // Fall back to old Journal model
    const entry = await prisma.journal.findUnique({ where: { date } });

    if (entry) {
      return NextResponse.json(entry);
    }

    return NextResponse.json({ date: date.toISOString(), content: "" });
  } catch (err) {
    console.error("[journal/today] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let content: string;

  try {
    const body = await request.json();
    content = body.content;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "content must be a string" },
      { status: 400 }
    );
  }

  const date = todayMidnight();

  try {
    const entry = await prisma.journal.upsert({
      where: { date },
      create: { date, content },
      update: { content },
    });

    return NextResponse.json(entry);
  } catch (err) {
    console.error("[journal/today] PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
