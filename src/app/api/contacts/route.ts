import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const search = request.nextUrl.searchParams.get("search");

  try {
    const contacts = await prisma.contact.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { lastInteraction: { sort: "desc", nulls: "last" } },
      include: {
        interactions: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json(contacts);
  } catch (err) {
    console.error("[contacts] List error:", err);
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

  const name = body.name;

  // Validate name
  if (!name || typeof name !== "string" || (name as string).trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        name: (name as string).trim(),
        ...(typeof body.context === "string"
          ? { context: (body.context as string).trim() }
          : {}),
        ...(typeof body.email === "string"
          ? { email: (body.email as string).trim() || null }
          : {}),
        ...(typeof body.phone === "string"
          ? { phone: (body.phone as string).trim() || null }
          : {}),
        ...(typeof body.company === "string"
          ? { company: (body.company as string).trim() || null }
          : {}),
        ...(typeof body.relationship === "string"
          ? { relationship: (body.relationship as string).trim() || null }
          : {}),
        ...(typeof body.birthday === "string" && body.birthday
          ? { birthday: new Date(body.birthday as string) }
          : {}),
        ...(typeof body.importance === "string"
          ? { importance: body.importance as string }
          : {}),
        ...(typeof body.contactFrequency === "string"
          ? { contactFrequency: body.contactFrequency as string }
          : {}),
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (err) {
    console.error("[contacts] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
