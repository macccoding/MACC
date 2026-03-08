import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const VALID_TYPES = ["reflection", "capture", "note"] as const;

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const days = parseInt(searchParams.get("days") || "30", 10) || 30;
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50),
    100
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    createdAt: { gte: cutoff },
  };

  if (type && VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { body: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(entries);
  } catch (err) {
    console.error("[journal] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: {
    type?: string;
    body?: string;
    title?: string;
    prompt?: string;
    tags?: string[];
    date?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.type || !VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json(
      { error: "type is required and must be 'reflection', 'capture', or 'note'" },
      { status: 400 }
    );
  }

  if (!body.body || typeof body.body !== "string") {
    return NextResponse.json(
      { error: "body is required and must be a string" },
      { status: 400 }
    );
  }

  const now = new Date();
  const entryDate = body.date
    ? new Date(body.date)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        type: body.type,
        body: body.body,
        title: body.title || null,
        prompt: body.prompt || null,
        tags: body.tags || [],
        date: entryDate,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[journal] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
