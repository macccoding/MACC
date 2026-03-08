import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

type RouteResult = {
  route: string;
  confidence: number;
  data: Record<string, unknown>;
};

export async function classifyCapture(content: string): Promise<RouteResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Classify this quick capture into a category and extract structured data.

Capture: "${content}"

Routes: reading, goal, habit, travel, creative, investment_note, journal, contact, none

Rules:
- "reading" → extract title and type (book/article/paper/podcast)
- "goal" → extract title
- "habit" → extract title
- "travel" → extract title and category (trip/destination/experience)
- "creative" → extract title
- "investment_note" → extract symbol and note
- "journal" → the capture IS the journal content
- "contact" → extract person name and notes
- "none" → doesn't fit any category

Respond as JSON only: {"route": "...", "confidence": 0.0-1.0, "data": {...}}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    return {
      route: parsed.route || "none",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      data: parsed.data || {},
    };
  } catch {
    return { route: "none", confidence: 0, data: {} };
  }
}

export async function executeRoute(
  captureId: string,
  route: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (route) {
      case "reading":
        await prisma.readingItem.create({
          data: {
            title: (data.title as string) || "Untitled",
            type: (data.type as string) || "book",
            status: "to_read",
          },
        });
        break;
      case "goal":
        await prisma.goal.create({
          data: { title: (data.title as string) || "Untitled" },
        });
        break;
      case "habit":
        await prisma.habit.create({
          data: { title: (data.title as string) || "Untitled" },
        });
        break;
      case "travel":
        await prisma.travelItem.create({
          data: {
            title: (data.title as string) || "Untitled",
            category: (data.category as string) || "trip",
          },
        });
        break;
      case "creative":
        await prisma.creativeProject.create({
          data: {
            title: (data.title as string) || "Untitled",
            status: "idea",
          },
        });
        break;
      case "investment_note": {
        const symbol = (data.symbol as string)?.toUpperCase();
        if (!symbol) return { success: false, error: "No symbol provided" };
        const investment = await prisma.investment.findFirst({
          where: { symbol },
        });
        if (!investment)
          return {
            success: false,
            error: `No investment found for ${symbol}`,
          };
        await prisma.investmentNote.create({
          data: {
            investmentId: investment.id,
            content: (data.note as string) || "",
          },
        });
        break;
      }
      case "journal": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await prisma.journal.findUnique({
          where: { date: today },
        });
        if (existing) {
          await prisma.journal.update({
            where: { date: today },
            data: {
              content: existing.content + "\n\n" + (data.content || ""),
            },
          });
        } else {
          await prisma.journal.create({
            data: {
              date: today,
              content: (data.content as string) || "",
            },
          });
        }
        break;
      }
      case "contact": {
        const name = (data.name as string) || "";
        if (!name) return { success: false, error: "No contact name" };
        const contact = await prisma.contact.findFirst({
          where: { name: { contains: name, mode: "insensitive" } },
        });
        if (contact) {
          await prisma.contactInteraction.create({
            data: {
              contactId: contact.id,
              notes: (data.notes as string) || "",
            },
          });
          await prisma.contact.update({
            where: { id: contact.id },
            data: { lastInteraction: new Date() },
          });
        }
        break;
      }
      default:
        return { success: false, error: `Unknown route: ${route}` };
    }

    await prisma.capture.update({
      where: { id: captureId },
      data: { processed: true, routedTo: route },
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
