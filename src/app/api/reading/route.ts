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
      orderBy: { updatedAt: "desc" },
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

  let title: string;
  let type: string | undefined;
  let status: string | undefined;

  try {
    const body = await request.json();
    title = body.title;
    type = body.type;
    status = body.status;
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
    const item = await prisma.readingItem.create({
      data: {
        title: title.trim(),
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
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
