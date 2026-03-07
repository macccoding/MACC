import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() }
          : {}),
        ...(body.deadline !== undefined
          ? { deadline: body.deadline ? new Date(body.deadline as string) : null }
          : {}),
        ...(typeof body.status === "string" ? { status: body.status } : {}),
      },
    });

    return NextResponse.json(goal);
  } catch (err) {
    console.error("[goals] Update error:", err);
    return NextResponse.json(
      { error: "Goal not found or update failed" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[goals] Delete error:", err);
    return NextResponse.json(
      { error: "Goal not found" },
      { status: 404 }
    );
  }
}
