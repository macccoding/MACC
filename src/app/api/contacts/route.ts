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
        ? { name: { contains: search, mode: "insensitive" } }
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

  let name: string;
  let context: string | undefined;

  try {
    const body = await request.json();
    name = body.name;
    context = body.context;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        name: name.trim(),
        ...(context && typeof context === "string"
          ? { context: context.trim() }
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
