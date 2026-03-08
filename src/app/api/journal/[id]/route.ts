import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const VALID_TYPES = ["reflection", "capture", "note"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let body: {
    title?: string;
    body?: string;
    tags?: string[];
    type?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.type && !VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json(
      { error: "type must be 'reflection', 'capture', or 'note'" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = { updatedAt: new Date() };
  if (body.title !== undefined) data.title = body.title;
  if (body.body !== undefined) data.body = body.body;
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.type !== undefined) data.type = body.type;

  try {
    const entry = await prisma.journalEntry.update({
      where: { id },
      data,
    });

    return NextResponse.json(entry);
  } catch (err) {
    console.error("[journal/[id]] PATCH error:", err);
    return NextResponse.json(
      { error: "Entry not found" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[journal/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Entry not found" },
      { status: 404 }
    );
  }
}
