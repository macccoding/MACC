import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const [
      habits,
      activeGoals,
      overdueGoals,
      health,
      investments,
      finances,
      unreadEmails,
      actionEmails,
      pendingCaptures,
      learningTrack,
      currentlyReading,
      queuedReading,
      journalToday,
      planningTravel,
      overdueContacts,
      inProgressCreative,
      activeBlueprints,
    ] = await Promise.all([
      prisma.habit.findMany({
        include: { logs: { where: { date: today }, take: 1 } },
      }),
      prisma.goal.count({ where: { status: "active" } }),
      prisma.goal.count({
        where: { status: "active", deadline: { lt: today } },
      }),
      prisma.healthSnapshot.findFirst({ orderBy: { date: "desc" } }),
      prisma.investment.findMany(),
      prisma.financialSnapshot.findFirst({ orderBy: { date: "desc" } }),
      prisma.emailCache.count({ where: { isRead: false } }),
      prisma.emailCache.count({ where: { category: "action_needed", isRead: false } }),
      prisma.capture.count({ where: { processed: false } }),
      prisma.learningTrack.findFirst({ orderBy: { updatedAt: "desc" } }),
      prisma.readingItem.findFirst({ where: { status: "reading" }, orderBy: { updatedAt: "desc" } }),
      prisma.readingItem.count({ where: { status: "to_read" } }),
      prisma.journal.findUnique({ where: { date: today } }),
      prisma.travelItem.count({ where: { status: "planning" } }),
      prisma.contact.count({ where: { lastInteraction: { lt: thirtyDaysAgo } } }),
      prisma.creativeProject.count({ where: { status: "in_progress" } }),
      prisma.goal.count({ where: { status: "active" } }),
    ]);

    const habitsCompleted = habits.filter((h) => h.logs.length > 0).length;
    const portfolioValue = investments.reduce(
      (sum, i) => sum + (i.currentPrice ?? 0) * (i.quantity ?? 0), 0
    );
    const financesData = finances?.data as Record<string, unknown> | undefined;

    return NextResponse.json({
      habits: { completed: habitsCompleted, total: habits.length },
      goals: { active: activeGoals, overdue: overdueGoals },
      health: { steps: health?.steps ?? null, sleep: health?.sleep ?? null },
      portfolio: { totalValue: portfolioValue, positions: investments.length },
      finances: { netWorth: financesData?.netWorth ?? null, debt: financesData?.debt ?? null },
      email: { unread: unreadEmails, actionNeeded: actionEmails },
      captures: { pending: pendingCaptures },
      learning: { trackName: learningTrack?.title ?? null, progress: learningTrack?.progress ?? null },
      reading: { currentlyReading: currentlyReading?.title ?? null, queued: queuedReading },
      journal: { writtenToday: !!journalToday },
      travel: { planning: planningTravel },
      people: { overdueReachouts: overdueContacts },
      creative: { inProgress: inProgressCreative },
      blueprint: { active: activeBlueprints },
    });
  } catch (err) {
    console.error("[dashboard] Brief error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
