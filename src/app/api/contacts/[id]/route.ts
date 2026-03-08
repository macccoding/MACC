import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
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

  try {
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") data.name = (body.name as string).trim();
    if (typeof body.context === "string") data.context = (body.context as string).trim();
    if (typeof body.email === "string") data.email = (body.email as string).trim() || null;
    if (typeof body.phone === "string") data.phone = (body.phone as string).trim() || null;
    if (typeof body.company === "string") data.company = (body.company as string).trim() || null;
    if (typeof body.relationship === "string") data.relationship = (body.relationship as string).trim() || null;
    if (typeof body.importance === "string") data.importance = body.importance || null;
    if (typeof body.contactFrequency === "string") data.contactFrequency = body.contactFrequency || null;

    // Handle birthday — accept string date or null to clear
    if (body.birthday === null) {
      data.birthday = null;
    } else if (typeof body.birthday === "string" && body.birthday) {
      data.birthday = new Date(body.birthday as string);
    }

    // Handle nextReachOut — accept string date or null to clear
    if (body.nextReachOut === null) {
      data.nextReachOut = null;
    } else if (typeof body.nextReachOut === "string" && body.nextReachOut) {
      data.nextReachOut = new Date(body.nextReachOut as string);
    }

    // Handle lastInteraction
    if (body.lastInteraction) {
      data.lastInteraction = new Date(body.lastInteraction as string);
    }

    const contact = await prisma.contact.update({
      where: { id },
      data,
    });

    return NextResponse.json(contact);
  } catch (err) {
    console.error("[contacts] Update error:", err);
    return NextResponse.json(
      { error: "Contact not found or update failed" },
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
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[contacts] Delete error:", err);
    return NextResponse.json(
      { error: "Contact not found" },
      { status: 404 }
    );
  }
}
