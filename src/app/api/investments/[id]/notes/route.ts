import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let content: string;

  try {
    const body = await request.json();
    content = body.content;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate content
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  try {
    const note = await prisma.investmentNote.create({
      data: {
        investmentId: id,
        content: content.trim(),
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("[investments] Create note error:", err);
    return NextResponse.json(
      { error: "Investment not found or note creation failed" },
      { status: 404 }
    );
  }
}
