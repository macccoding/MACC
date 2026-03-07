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

  let notes: string;
  let date: string | undefined;

  try {
    const body = await request.json();
    notes = body.notes;
    date = body.date;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate notes
  if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
    return NextResponse.json(
      { error: "Notes are required" },
      { status: 400 }
    );
  }

  const interactionDate = date ? new Date(date) : new Date();

  try {
    const [interaction] = await prisma.$transaction([
      prisma.contactInteraction.create({
        data: {
          contactId: id,
          notes: notes.trim(),
          date: interactionDate,
        },
      }),
      prisma.contact.update({
        where: { id },
        data: { lastInteraction: interactionDate },
      }),
    ]);

    return NextResponse.json(interaction, { status: 201 });
  } catch (err) {
    console.error("[contacts] Create interaction error:", err);
    return NextResponse.json(
      { error: "Contact not found or creation failed" },
      { status: 404 }
    );
  }
}
