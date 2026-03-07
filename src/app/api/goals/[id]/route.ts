import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

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
  const authError = requireAuth(request);
  if (authError) return authError;

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
