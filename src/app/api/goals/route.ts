import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // Build filter
  const where: { status?: string } = {};
  if (status && ["active", "completed", "paused"].includes(status)) {
    where.status = status;
  }

  try {
    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (err) {
    console.error("[goals] List error:", err);
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
  let deadline: string | undefined;
  let status: string | undefined;

  try {
    const body = await request.json();
    title = body.title;
    description = body.description;
    deadline = body.deadline;
    status = body.status;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate title
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        title: title.trim(),
        ...(description ? { description: description.trim() } : {}),
        ...(deadline ? { deadline: new Date(deadline) } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (err) {
    console.error("[goals] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
