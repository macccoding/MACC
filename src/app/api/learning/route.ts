import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const tracks = await prisma.learningTrack.findMany({
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(tracks);
  } catch (err) {
    console.error("[learning] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let title: string;
  let type: string | undefined;

  try {
    const body = await request.json();
    title = body.title;
    type = body.type;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  try {
    const track = await prisma.learningTrack.create({
      data: {
        title: title.trim(),
        ...(type && typeof type === "string" ? { type } : {}),
      },
    });

    return NextResponse.json(track, { status: 201 });
  } catch (err) {
    console.error("[learning] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
