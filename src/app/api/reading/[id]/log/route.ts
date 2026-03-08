import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const item = await prisma.readingItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json(
        { error: "Reading item not found" },
        { status: 404 }
      );
    }

    const logs = await prisma.readingLog.findMany({
      where: { readingItemId: id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error("[reading/log] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate readingItem exists
  try {
    const item = await prisma.readingItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json(
        { error: "Reading item not found" },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("[reading/log] Lookup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  // Parse date — default to today
  const dateStr = typeof body.date === "string" ? body.date : null;
  const date = dateStr ? new Date(dateStr) : new Date();
  // Normalize to date-only (strip time)
  date.setUTCHours(0, 0, 0, 0);

  const minutesRead =
    typeof body.minutesRead === "number" ? body.minutesRead : null;
  const pagesRead =
    typeof body.pagesRead === "number" ? body.pagesRead : null;
  const note = typeof body.note === "string" ? body.note.trim() || null : null;

  try {
    const log = await prisma.readingLog.create({
      data: {
        readingItemId: id,
        date,
        minutesRead,
        pagesRead,
        note,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("[reading/log] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
