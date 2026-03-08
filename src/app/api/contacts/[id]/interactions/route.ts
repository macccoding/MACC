import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
};

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
    // First, fetch the contact to get contactFrequency
    const contact = await prisma.contact.findUniqueOrThrow({
      where: { id },
      select: { contactFrequency: true },
    });

    // Compute nextReachOut based on contactFrequency
    let nextReachOut: Date | undefined;
    if (contact.contactFrequency && FREQUENCY_DAYS[contact.contactFrequency]) {
      const days = FREQUENCY_DAYS[contact.contactFrequency];
      nextReachOut = new Date(interactionDate);
      nextReachOut.setDate(nextReachOut.getDate() + days);
    }

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
        data: {
          lastInteraction: interactionDate,
          ...(nextReachOut ? { nextReachOut } : {}),
        },
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
