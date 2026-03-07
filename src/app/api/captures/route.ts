import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Auth check
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let content: string;
  let category: string | undefined;

  try {
    const body = await request.json();
    content = body.content;
    category = body.category;
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
    const capture = await prisma.capture.create({
      data: {
        content: content.trim(),
        ...(category ? { category } : {}),
      },
    });

    return NextResponse.json(capture, { status: 201 });
  } catch (err) {
    console.error("[captures] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Auth check
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const processedParam = searchParams.get("processed");

  // Build filter
  const where: { processed?: boolean } = {};
  if (processedParam === "true") {
    where.processed = true;
  } else if (processedParam === "false") {
    where.processed = false;
  }

  try {
    const captures = await prisma.capture.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(captures);
  } catch (err) {
    console.error("[captures] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
