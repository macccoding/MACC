import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const shot = request.nextUrl.searchParams.get("shot");

  try {
    if (shot) {
      const guide = await prisma.tTTechniqueGuide.findUnique({ where: { shot } });
      if (!guide) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(guide);
    }
    const guides = await prisma.tTTechniqueGuide.findMany({ orderBy: { shot: "asc" } });
    return NextResponse.json(guides);
  } catch (err) {
    console.error("[tt/guides] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

  const { shot, ...data } = body as {
    shot?: string;
    readyPosition?: string;
    gripAdjustment?: string;
    preparation?: string;
    contact?: string;
    wristForearm?: string;
    followThrough?: string;
    commonMistakes?: string;
    whenToUse?: string;
    whenNotToUse?: string;
    cuePhrase?: string;
    imageUrl?: string;
  };

  if (!shot) {
    return NextResponse.json({ error: "shot is required" }, { status: 400 });
  }

  try {
    const guide = await prisma.tTTechniqueGuide.upsert({
      where: { shot },
      create: { shot, ...data, updatedAt: new Date() },
      update: { ...data, updatedAt: new Date() },
    });
    return NextResponse.json(guide, { status: 201 });
  } catch (err) {
    console.error("[tt/guides] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { shot, ...data } = body as {
    shot?: string;
    readyPosition?: string;
    gripAdjustment?: string;
    preparation?: string;
    contact?: string;
    wristForearm?: string;
    followThrough?: string;
    commonMistakes?: string;
    whenToUse?: string;
    whenNotToUse?: string;
    cuePhrase?: string;
    imageUrl?: string;
  };

  if (!shot) {
    return NextResponse.json({ error: "shot is required" }, { status: 400 });
  }

  try {
    const guide = await prisma.tTTechniqueGuide.update({
      where: { shot },
      data: { ...data, updatedAt: new Date() },
    });
    return NextResponse.json(guide);
  } catch (err) {
    console.error("[tt/guides] Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
