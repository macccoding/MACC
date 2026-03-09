import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body as { id?: string };

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  try {
    const insight = await prisma.insight.update({
      where: { id },
      data: { dismissed: true },
    });

    return NextResponse.json(insight);
  } catch (err) {
    console.error("[insights/dismiss] PATCH error:", err);
    return NextResponse.json(
      { error: "Insight not found" },
      { status: 404 }
    );
  }
}
