import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const items = await prisma.creativeProject.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("[creative] List error:", err);
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
  let description: string | undefined;
  let status: string | undefined;

  try {
    const body = await request.json();
    title = body.title;
    description = body.description;
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
    const item = await prisma.creativeProject.create({
      data: {
        title: title.trim(),
        ...(typeof description === "string"
          ? { description: description.trim() }
          : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[creative] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
