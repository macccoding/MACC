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
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(typeof body.name === "string"
          ? { name: body.name.trim() }
          : {}),
        ...(typeof body.context === "string"
          ? { context: body.context.trim() }
          : {}),
        ...(body.lastInteraction
          ? { lastInteraction: new Date(body.lastInteraction as string) }
          : {}),
      },
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
