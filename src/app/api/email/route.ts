import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const unread = searchParams.get("unread");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (unread === "true") where.isRead = false;

  const emails = await prisma.emailCache.findMany({
    where,
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json(emails);
}
