import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const type = searchParams.get("type");

  try {
    const where: Record<string, unknown> = {};
    const conditions: Record<string, unknown>[] = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } },
        ],
      });
    }

    if (type) {
      conditions.push({ tags: { has: type.toLowerCase() } });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const nodes = await prisma.node.findMany({
      where,
      include: {
        recalls: true,
        sourceLinks: {
          take: 5,
          include: { targetNode: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(nodes);
  } catch (err) {
    console.error("[kioku/nodes] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let name: string;
  let tags: string[];

  try {
    const body = await request.json();
    name = body.name;
    tags = body.tags || [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const slug = slugify(name.trim());
  if (!slug) {
    return NextResponse.json(
      { error: "Invalid name — cannot generate slug" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.node.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A node with this name already exists", node: existing },
        { status: 409 }
      );
    }

    const node = await prisma.node.create({
      data: {
        name: name.trim(),
        slug,
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()) : [],
      },
    });

    return NextResponse.json(node, { status: 201 });
  } catch (err) {
    console.error("[kioku/nodes] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
