import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { executeRoute } from "@/lib/captures/auto-route";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  let route: string;
  let data: Record<string, unknown>;

  try {
    const body = await request.json();
    route = body.route;
    data = body.data || {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!route) {
    return NextResponse.json({ error: "route is required" }, { status: 400 });
  }

  const capture = await prisma.capture.findUnique({ where: { id } });
  if (!capture) {
    return NextResponse.json({ error: "Capture not found" }, { status: 404 });
  }

  const result = await executeRoute(id, route, data);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ routed: true, route });
}
