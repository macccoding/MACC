import { prisma } from "@/lib/prisma";

/**
 * Execute a Kemi tool by name with the given input.
 * Returns the result data to be serialized as a tool_result.
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (name) {
    // ─── Read Tools ───────────────────────────────────────────

    case "get_habits": {
      const habits = await prisma.habit.findMany({
        include: {
          logs: {
            where: { date: today },
            take: 1,
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return habits.map((h) => ({
        id: h.id,
        title: h.title,
        frequency: h.frequency,
        streakProtection: h.streakProtection,
        completedToday: h.logs.length > 0 && h.logs[0].completed,
      }));
    }

    case "get_goals": {
      const status = input.status as string | undefined;
      const goals = await prisma.goal.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
      });
      return goals;
    }

    case "get_portfolio": {
      const investments = await prisma.investment.findMany({
        include: {
          notes: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { symbol: "asc" },
      });
      return investments.map((inv) => ({
        id: inv.id,
        symbol: inv.symbol,
        assetType: inv.assetType,
        thesis: inv.thesis,
        entryPrice: inv.entryPrice,
        currentPrice: inv.currentPrice,
        quantity: inv.quantity,
        costBasis: inv.costBasis,
        gain:
          inv.currentPrice && inv.entryPrice
            ? ((inv.currentPrice - inv.entryPrice) / inv.entryPrice) * 100
            : null,
        recentNotes: inv.notes.map((n) => ({
          content: n.content,
          date: n.createdAt,
        })),
      }));
    }

    case "get_finances": {
      const snapshot = await prisma.financialSnapshot.findFirst({
        orderBy: { date: "desc" },
      });
      return snapshot ?? { message: "No financial data available yet." };
    }

    case "get_transactions": {
      const days = (input.days as number) || 7;
      const category = input.category as string | undefined;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const transactions = await prisma.transaction.findMany({
        where: {
          date: { gte: since },
          ...(category ? { category: { contains: category, mode: "insensitive" as const } } : {}),
        },
        orderBy: { date: "desc" },
        take: 50,
      });
      return transactions;
    }

    case "get_health": {
      const healthDays = (input.days as number) || 7;
      const healthSince = new Date();
      healthSince.setDate(healthSince.getDate() - healthDays);

      const snapshots = await prisma.healthSnapshot.findMany({
        where: { date: { gte: healthSince } },
        orderBy: { date: "desc" },
      });
      return snapshots;
    }

    case "get_emails": {
      const emailCategory = input.category as string | undefined;
      const unread = input.unread as boolean | undefined;
      const limit = (input.limit as number) || 20;

      const emails = await prisma.emailCache.findMany({
        where: {
          ...(emailCategory
            ? { category: { contains: emailCategory, mode: "insensitive" as const } }
            : {}),
          ...(unread !== undefined ? { isRead: !unread } : {}),
        },
        orderBy: { date: "desc" },
        take: limit,
        select: {
          id: true,
          subject: true,
          sender: true,
          snippet: true,
          date: true,
          isRead: true,
          isStarred: true,
          category: true,
          summary: true,
        },
      });
      return emails;
    }

    case "get_journal": {
      const journalDays = (input.days as number) || 7;
      const journalSince = new Date();
      journalSince.setDate(journalSince.getDate() - journalDays);

      const entries = await prisma.journal.findMany({
        where: { date: { gte: journalSince } },
        orderBy: { date: "desc" },
      });
      return entries;
    }

    case "get_contacts": {
      const search = input.search as string | undefined;
      const contacts = await prisma.contact.findMany({
        where: search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : undefined,
        include: {
          interactions: {
            orderBy: { date: "desc" },
            take: 5,
          },
        },
        orderBy: { lastInteraction: { sort: "desc", nulls: "last" } },
        take: 20,
      });
      return contacts;
    }

    case "get_learning": {
      const tracks = await prisma.learningTrack.findMany({
        include: {
          logs: {
            orderBy: { date: "desc" },
            take: 5,
          },
        },
        orderBy: { updatedAt: "desc" },
      });
      return tracks;
    }

    case "get_reading": {
      const readingStatus = input.status as string | undefined;
      const items = await prisma.readingItem.findMany({
        where: readingStatus ? { status: readingStatus } : undefined,
        orderBy: { updatedAt: "desc" },
      });
      return items;
    }

    case "get_travel": {
      const travelStatus = input.status as string | undefined;
      const travelItems = await prisma.travelItem.findMany({
        where: travelStatus ? { status: travelStatus } : undefined,
        orderBy: { updatedAt: "desc" },
      });
      return travelItems;
    }

    case "get_creative": {
      const creativeStatus = input.status as string | undefined;
      const projects = await prisma.creativeProject.findMany({
        where: creativeStatus ? { status: creativeStatus } : undefined,
        orderBy: { updatedAt: "desc" },
      });
      return projects;
    }

    case "get_captures": {
      const captures = await prisma.capture.findMany({
        where: { processed: false },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return captures;
    }

    case "search_knowledge": {
      const query = input.query as string;
      const nodes = await prisma.node.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { tags: { has: query.toLowerCase() } },
          ],
        },
        include: {
          sourceLinks: {
            include: { targetNode: { select: { name: true, slug: true } } },
          },
          targetLinks: {
            include: { sourceNode: { select: { name: true, slug: true } } },
          },
        },
        take: 10,
      });
      return nodes;
    }

    // ─── Write Tools ──────────────────────────────────────────

    case "log_habit": {
      const habitName = input.habit_name as string;
      const habit = await prisma.habit.findFirst({
        where: { title: { contains: habitName, mode: "insensitive" as const } },
      });
      if (!habit) {
        return { error: `No habit found matching "${habitName}"` };
      }
      const log = await prisma.habitLog.upsert({
        where: {
          habitId_date: { habitId: habit.id, date: today },
        },
        update: { completed: true },
        create: { habitId: habit.id, date: today, completed: true },
      });
      return { success: true, habit: habit.title, date: log.date };
    }

    case "add_goal": {
      const goal = await prisma.goal.create({
        data: {
          title: input.title as string,
          description: (input.description as string) || "",
          deadline: input.deadline
            ? new Date(input.deadline as string)
            : undefined,
        },
      });
      return { success: true, goal };
    }

    case "add_capture": {
      const capture = await prisma.capture.create({
        data: {
          content: input.content as string,
          category: (input.category as string) || "",
        },
      });
      return { success: true, capture };
    }

    case "add_journal": {
      const content = input.content as string;
      const existing = await prisma.journal.findUnique({
        where: { date: today },
      });

      if (existing) {
        const updated = await prisma.journal.update({
          where: { date: today },
          data: { content: existing.content + "\n\n" + content },
        });
        return { success: true, journal: updated };
      }

      const journal = await prisma.journal.create({
        data: { date: today, content },
      });
      return { success: true, journal };
    }

    case "log_interaction": {
      const contactName = input.contact_name as string;
      const notes = input.notes as string;

      const contact = await prisma.contact.findFirst({
        where: { name: { contains: contactName, mode: "insensitive" as const } },
      });
      if (!contact) {
        return { error: `No contact found matching "${contactName}"` };
      }

      const interaction = await prisma.contactInteraction.create({
        data: {
          contactId: contact.id,
          notes,
        },
      });

      await prisma.contact.update({
        where: { id: contact.id },
        data: { lastInteraction: new Date() },
      });

      return { success: true, contact: contact.name, interaction };
    }

    case "add_reading": {
      const readingItem = await prisma.readingItem.create({
        data: {
          title: input.title as string,
          type: (input.type as string) || "book",
        },
      });
      return { success: true, item: readingItem };
    }

    case "update_goal_status": {
      const goalId = input.goal_id as string;
      const newStatus = input.status as string;

      const updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: { status: newStatus },
      });
      return { success: true, goal: updatedGoal };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
