import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: { description: { startsWith: string }; status?: string } = {
    description: { startsWith: "[blueprint]" },
  };

  if (status && ["active", "completed", "paused"].includes(status)) {
    where.status = status;
  }

  try {
    const blueprints = await prisma.goal.findMany({
      where,
      orderBy: { deadline: { sort: "asc", nulls: "last" } },
    });

    return NextResponse.json(blueprints);
  } catch (err) {
    console.error("[blueprint] List error:", err);
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
        description: `[blueprint] ${description?.trim() || ""}`,
        ...(deadline ? { deadline: new Date(deadline) } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (err) {
    console.error("[blueprint] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
