import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  try {
    const items = await prisma.travelItem.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("[travel] List error:", err);
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
  let category: string | undefined;
  let status: string | undefined;
  let budget: number | undefined;

  try {
    const body = await request.json();
    title = body.title;
    category = body.category;
    status = body.status;
    budget = body.budget;
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
    const item = await prisma.travelItem.create({
      data: {
        title: title.trim(),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
        ...(typeof budget === "number" ? { budget } : {}),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[travel] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
