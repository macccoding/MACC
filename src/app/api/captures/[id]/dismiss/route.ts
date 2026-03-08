import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  const capture = await prisma.capture.findUnique({ where: { id } });
  if (!capture) {
    return NextResponse.json({ error: "Capture not found" }, { status: 404 });
  }

  await prisma.capture.update({
    where: { id },
    data: { processed: true },
  });

  return NextResponse.json({ dismissed: true });
}
