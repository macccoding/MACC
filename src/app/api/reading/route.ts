import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  try {
    const items = await prisma.readingItem.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      },
      include: { logs: true },
      orderBy: [{ updatedAt: "desc" }],
    });

    // Sort: currently-reading first, then by updatedAt desc
    items.sort((a, b) => {
      if (a.status === "reading" && b.status !== "reading") return -1;
      if (b.status === "reading" && a.status !== "reading") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("[reading] List error:", err);
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

  const title = body.title;
  const type = body.type as string | undefined;
  const status = body.status as string | undefined;
  const author = body.author as string | undefined;
  const coverUrl = body.coverUrl as string | undefined;
  const format = body.format as string | undefined;

  if (!title || typeof title !== "string" || (title as string).trim().length === 0) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  try {
    const item = await prisma.readingItem.create({
      data: {
        title: (title as string).trim(),
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(typeof author === "string" ? { author: author.trim() || null } : {}),
        ...(typeof coverUrl === "string" ? { coverUrl: coverUrl.trim() || null } : {}),
        ...(typeof format === "string" ? { format } : {}),
      },
      include: { logs: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[reading] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
