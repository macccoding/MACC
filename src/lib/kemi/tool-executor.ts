import { prisma } from "@/lib/prisma";
import { logAction, getActionLog } from "./action-log";
import { checkEscalation } from "./escalation";
import { todayJamaica, startOfWeek } from "./utils";
import { remember, recall } from "./memory";

import type { Prisma } from "@/generated/prisma/client";

// Google modules loaded lazily to avoid bundling googleapis at module init
async function getGmailModule() {
  return import("./google/gmail");
}
async function getCalendarModule() {
  return import("./google/calendar");
}
async function getSheetsModule() {
  return import("./google/sheets");
}

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

    // ─── Task Management ──────────────────────────────────────

    case "create_task": {
      const task = await prisma.kemiTask.create({
        data: {
          title: input.title as string,
          description: (input.description as string) || "",
          priority: (input.priority as string) || "medium",
          category: (input.category as string) || null,
          dueDate: input.due_date
            ? new Date(input.due_date as string)
            : null,
          tags: (input.tags as string[]) || [],
        },
      });
      await logAction("task_created", `Created task: ${task.title}`, {
        taskId: task.id,
      });
      return { success: true, task };
    }

    case "update_task": {
      const taskId = input.task_id as string;
      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.status !== undefined) {
        data.status = input.status;
        if (input.status === "done") data.completedAt = new Date();
      }
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.due_date !== undefined)
        data.dueDate = new Date(input.due_date as string);
      if (input.notes !== undefined) data.notes = input.notes;

      const task = await prisma.kemiTask.update({
        where: { id: taskId },
        data,
      });
      await logAction("task_updated", `Updated task: ${task.title}`, {
        taskId: task.id,
        changes: Object.keys(data),
      });
      return { success: true, task };
    }

    case "complete_task": {
      const task = await prisma.kemiTask.update({
        where: { id: input.task_id as string },
        data: { status: "done", completedAt: new Date() },
      });
      await logAction("task_completed", `Completed task: ${task.title}`, {
        taskId: task.id,
      });
      return { success: true, task };
    }

    case "query_tasks": {
      const statuses = (input.status as string[]) || [
        "open",
        "in_progress",
      ];
      const taskCategory = input.category as string | undefined;
      const taskSearch = input.search as string | undefined;
      const taskLimit = (input.limit as number) || 20;

      const where: Prisma.KemiTaskWhereInput = {
        AND: [
          { status: { in: statuses } },
          ...(taskCategory ? [{ category: taskCategory }] : []),
          ...(taskSearch
            ? [
                {
                  OR: [
                    {
                      title: {
                        contains: taskSearch,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      description: {
                        contains: taskSearch,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              ]
            : []),
        ],
      };

      const tasks = await prisma.kemiTask.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: taskLimit,
      });
      return tasks;
    }

    // ─── Contact CRM ────────────────────────────────────────────

    case "create_contact": {
      const contact = await prisma.contact.create({
        data: {
          name: input.name as string,
          email: (input.email as string) || null,
          phone: (input.phone as string) || null,
          company: (input.company as string) || null,
          relationship: (input.relationship as string) || null,
          context: (input.context as string) || "",
          birthday: input.birthday
            ? new Date(input.birthday as string)
            : null,
          importance: (input.importance as string) || null,
          contactFrequency: (input.contact_frequency as string) || null,
        },
      });
      await logAction("contact_created", `Created contact: ${contact.name}`, {
        contactId: contact.id,
      });
      return { success: true, contact };
    }

    case "update_contact": {
      const contactId = input.contact_id as string;
      const contactData: Record<string, unknown> = {};
      if (input.name !== undefined) contactData.name = input.name;
      if (input.email !== undefined) contactData.email = input.email;
      if (input.phone !== undefined) contactData.phone = input.phone;
      if (input.company !== undefined) contactData.company = input.company;
      if (input.relationship !== undefined)
        contactData.relationship = input.relationship;
      if (input.importance !== undefined)
        contactData.importance = input.importance;
      if (input.contact_frequency !== undefined)
        contactData.contactFrequency = input.contact_frequency;
      if (input.notes !== undefined) contactData.context = input.notes;

      const contact = await prisma.contact.update({
        where: { id: contactId },
        data: contactData,
      });
      await logAction(
        "contact_updated",
        `Updated contact: ${contact.name}`,
        { contactId: contact.id, changes: Object.keys(contactData) }
      );
      return { success: true, contact };
    }

    case "search_contacts": {
      const q = input.query as string;
      const contactLimit = (input.limit as number) || 20;

      const contacts = await prisma.contact.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { company: { contains: q, mode: "insensitive" as const } },
          ],
        },
        include: {
          interactions: {
            orderBy: { date: "desc" },
            take: 3,
          },
        },
        orderBy: { lastInteraction: { sort: "desc", nulls: "last" } },
        take: contactLimit,
      });
      return contacts;
    }

    case "set_contact_frequency": {
      const freqContactId = input.contact_id as string;
      const frequency = input.frequency as string;

      const freqDays: Record<string, number> = {
        daily: 1,
        weekly: 7,
        biweekly: 14,
        monthly: 30,
        quarterly: 90,
      };
      const daysUntilNext = freqDays[frequency] || 30;
      const nextReachOut = new Date(todayJamaica());
      nextReachOut.setDate(nextReachOut.getDate() + daysUntilNext);

      const contact = await prisma.contact.update({
        where: { id: freqContactId },
        data: {
          contactFrequency: frequency,
          nextReachOut,
        },
      });
      await logAction(
        "contact_frequency_set",
        `Set ${contact.name} frequency to ${frequency}`,
        { contactId: contact.id, frequency, nextReachOut }
      );
      return { success: true, contact };
    }

    case "get_relationship_summary": {
      const todayDate = todayJamaica();

      // Overdue reachouts
      const overdue = await prisma.contact.findMany({
        where: {
          nextReachOut: { not: null, lt: todayDate },
        },
        orderBy: { nextReachOut: "asc" },
      });

      // Upcoming birthdays (within 7 days)
      const sevenDaysOut = new Date(todayDate);
      sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

      const allContactsWithBirthday = await prisma.contact.findMany({
        where: { birthday: { not: null } },
      });

      const todayMonth = todayDate.getMonth();
      const todayDay = todayDate.getDate();
      const upcomingBirthdays = allContactsWithBirthday.filter((c) => {
        if (!c.birthday) return false;
        const bMonth = c.birthday.getMonth();
        const bDay = c.birthday.getDate();
        // Check if birthday falls within the next 7 days
        for (let i = 0; i <= 7; i++) {
          const checkDate = new Date(todayDate);
          checkDate.setDate(todayDay + i);
          if (
            checkDate.getMonth() === bMonth &&
            checkDate.getDate() === bDay
          ) {
            return true;
          }
        }
        return false;
      });

      return {
        overdueReachouts: overdue.map((c) => ({
          id: c.id,
          name: c.name,
          nextReachOut: c.nextReachOut,
          frequency: c.contactFrequency,
          daysPastDue: Math.floor(
            (todayDate.getTime() - (c.nextReachOut?.getTime() || 0)) /
              (1000 * 60 * 60 * 24)
          ),
        })),
        upcomingBirthdays: upcomingBirthdays.map((c) => ({
          id: c.id,
          name: c.name,
          birthday: c.birthday,
        })),
        totalContacts: await prisma.contact.count(),
        withFrequency: await prisma.contact.count({
          where: { contactFrequency: { not: null } },
        }),
      };
    }

    // ─── Strategy ───────────────────────────────────────────────

    case "set_goal": {
      const goal = await prisma.strategicGoal.create({
        data: {
          title: input.title as string,
          description: (input.description as string) || "",
          type: "goal",
          category: (input.category as string) || null,
          targetDate: input.target_date
            ? new Date(input.target_date as string)
            : null,
        },
      });
      await logAction("goal_created", `Created goal: ${goal.title}`, {
        goalId: goal.id,
      });
      return { success: true, goal };
    }

    case "set_priority": {
      const priority = await prisma.strategicGoal.create({
        data: {
          title: input.title as string,
          description: (input.description as string) || "",
          type: "priority",
          category: (input.category as string) || null,
        },
      });
      await logAction(
        "priority_created",
        `Created priority: ${priority.title}`,
        { goalId: priority.id }
      );
      return { success: true, priority };
    }

    case "set_okr": {
      const okr = await prisma.strategicGoal.create({
        data: {
          title: input.title as string,
          description: (input.description as string) || "",
          type: "okr",
          category: (input.category as string) || null,
          targetDate: input.target_date
            ? new Date(input.target_date as string)
            : null,
        },
      });
      await logAction("okr_created", `Created OKR: ${okr.title}`, {
        goalId: okr.id,
      });
      return { success: true, okr };
    }

    case "review_goals": {
      const contextType = (input.context_type as string) || "all";
      const where: Prisma.StrategicGoalWhereInput = {
        status: "active",
        ...(contextType !== "all" ? { type: contextType } : {}),
      };
      const goals = await prisma.strategicGoal.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      return goals;
    }

    case "update_goal_progress": {
      const goalId = input.goal_id as string;
      const progressData: Record<string, unknown> = {};
      if (input.progress !== undefined) progressData.progress = input.progress;
      if (input.status !== undefined) progressData.status = input.status;

      const goal = await prisma.strategicGoal.update({
        where: { id: goalId },
        data: progressData,
      });
      await logAction(
        "goal_progress_updated",
        `Updated goal progress: ${goal.title}`,
        { goalId: goal.id, ...progressData }
      );
      return { success: true, goal };
    }

    // ─── Calendar Rules ─────────────────────────────────────────

    case "create_calendar_rule": {
      const rule = await prisma.calendarRule.create({
        data: {
          ruleType: input.rule_type as string,
          title: input.title as string,
          description: (input.description as string) || "",
          dayOfWeek: (input.day_of_week as string[]) || [],
          startTime: (input.start_time as string) || null,
          endTime: (input.end_time as string) || null,
          calendarId: (input.calendar_id as string) || null,
          metadata: (input.metadata as Prisma.InputJsonValue) || {},
        },
      });
      await logAction("calendar_rule_created", `Created rule: ${rule.title}`, {
        ruleId: rule.id,
        ruleType: rule.ruleType,
      });
      return { success: true, rule };
    }

    case "update_calendar_rule": {
      const ruleId = input.rule_id as string;
      const ruleData: Record<string, unknown> = {};
      if (input.title !== undefined) ruleData.title = input.title;
      if (input.description !== undefined)
        ruleData.description = input.description;
      if (input.day_of_week !== undefined)
        ruleData.dayOfWeek = input.day_of_week;
      if (input.start_time !== undefined) ruleData.startTime = input.start_time;
      if (input.end_time !== undefined) ruleData.endTime = input.end_time;
      if (input.active !== undefined) ruleData.active = input.active;
      if (input.metadata !== undefined) ruleData.metadata = input.metadata;

      const rule = await prisma.calendarRule.update({
        where: { id: ruleId },
        data: ruleData,
      });
      await logAction("calendar_rule_updated", `Updated rule: ${rule.title}`, {
        ruleId: rule.id,
        changes: Object.keys(ruleData),
      });
      return { success: true, rule };
    }

    case "get_calendar_rules": {
      const activeOnly = input.active_only !== false;
      const rules = await prisma.calendarRule.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: { createdAt: "desc" },
      });
      return rules;
    }

    case "delete_calendar_rule": {
      const escalation = await checkEscalation("calendar_rule_deleted", {
        confirmed: (input.confirmed as boolean) || false,
      });
      if (!escalation.allowed) {
        return { error: escalation.reason, requiresApproval: escalation.requiresApproval };
      }

      const rule = await prisma.calendarRule.delete({
        where: { id: input.rule_id as string },
      });
      await logAction("calendar_rule_deleted", `Deleted rule: ${rule.title}`, {
        ruleId: rule.id,
      });
      return { success: true, deleted: rule };
    }

    // ─── Google Integration ──────────────────────────────────────

    case "check_email": {
      const gmail = await getGmailModule();
      const maxResults = (input.max_results as number) || 10;
      return await gmail.getUnreadEmails(maxResults);
    }

    case "read_email": {
      const gmail = await getGmailModule();
      const messageId = input.message_id as string;
      return await gmail.getEmailBody(messageId);
    }

    case "send_email": {
      const to = input.to as string;
      const subject = input.subject as string;
      const body = input.body as string;
      const threadId = input.thread_id as string | undefined;
      const confirmed = (input.confirmed as boolean) || false;

      const escalation = await checkEscalation("email_sent", {
        to,
        confirmed,
        subject,
        body,
      });
      if (!escalation.allowed) {
        return { error: escalation.reason, requiresApproval: true };
      }

      const gmail = await getGmailModule();
      const result = await gmail.sendEmail(to, subject, body, threadId);
      await logAction("email_sent", `Sent email to ${to}: ${subject}`, {
        to,
        subject,
        messageId: result.id,
      });

      // Try to find contact by email and log interaction
      try {
        const contact = await prisma.contact.findFirst({
          where: { email: to },
        });
        if (contact) {
          await prisma.contactInteraction.create({
            data: {
              contactId: contact.id,
              notes: `Sent email: ${subject}`,
            },
          });
          await prisma.contact.update({
            where: { id: contact.id },
            data: { lastInteraction: new Date() },
          });
        }
      } catch {
        // Non-critical — don't fail the send
      }

      return { success: true, messageId: result.id };
    }

    case "search_email": {
      const query = input.query as string;
      const maxResults = (input.max_results as number) || 10;
      const gmail = await getGmailModule();
      return await gmail.searchEmails(query, maxResults);
    }

    case "get_calendar_events": {
      const cal = await getCalendarModule();
      const startDate = input.start_date as string;
      const endDate = input.end_date as string;
      return await cal.getEvents(startDate, endDate);
    }

    case "create_calendar_event": {
      const summary = input.summary as string;
      const start = input.start as string;
      const end = input.end as string;
      const description = input.description as string | undefined;
      const location = input.location as string | undefined;
      const attendees = input.attendees as string[] | undefined;
      const confirmed = (input.confirmed as boolean) || false;

      const escalation = await checkEscalation("calendar_event_created", {
        attendees,
        confirmed,
      });
      if (!escalation.allowed) {
        return { error: escalation.reason, requiresApproval: true };
      }

      const cal = await getCalendarModule();
      try {
        const result = await cal.createEvent(
          summary,
          start,
          end,
          description,
          location,
          attendees,
        );
        await logAction(
          "calendar_event_created",
          `Created event: ${summary}`,
          { eventId: result.id, attendees },
        );
        return { success: true, event: result };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[create_calendar_event] Error:", msg, { summary, start, end });
        return { error: `Failed to create event: ${msg}`, summary, start, end };
      }
    }

    case "update_calendar_event": {
      const confirmed = (input.confirmed as boolean) || false;
      const escalation = await checkEscalation("calendar_event_updated", {
        confirmed,
      });
      if (!escalation.allowed) {
        return { error: escalation.reason, requiresApproval: escalation.requiresApproval };
      }

      const eventId = input.event_id as string;
      const updates: Record<string, string | undefined> = {};
      if (input.summary !== undefined) updates.summary = input.summary as string;
      if (input.start !== undefined) updates.start = input.start as string;
      if (input.end !== undefined) updates.end = input.end as string;
      if (input.description !== undefined) updates.description = input.description as string;
      if (input.location !== undefined) updates.location = input.location as string;

      const cal = await getCalendarModule();
      const result = await cal.updateEvent(eventId, updates);
      await logAction(
        "calendar_event_updated",
        `Updated event: ${result.summary}`,
        { eventId: result.id, changes: Object.keys(updates) },
      );
      return { success: true, event: result };
    }

    case "delete_calendar_event": {
      const eventId = input.event_id as string;
      const confirmed = (input.confirmed as boolean) || false;

      const escalation = await checkEscalation("calendar_event_deleted", {
        confirmed,
      });
      if (!escalation.allowed) {
        return { error: escalation.reason, requiresApproval: true };
      }

      const cal = await getCalendarModule();
      const result = await cal.deleteEvent(eventId);
      await logAction(
        "calendar_event_deleted",
        `Deleted calendar event: ${eventId}`,
        { eventId },
      );
      return { success: true, ...result };
    }

    case "read_sheet": {
      const sheets = await getSheetsModule();
      const spreadsheetId = input.spreadsheet_id as string;
      const range = input.range as string;
      return await sheets.getSheetValues(spreadsheetId, range);
    }

    case "update_sheet": {
      const sheets = await getSheetsModule();
      const spreadsheetId = input.spreadsheet_id as string;
      const range = input.range as string;
      const values = input.values as unknown[][];

      const result = await sheets.updateSheetValues(spreadsheetId, range, values);
      await logAction("sheet_updated", `Updated sheet ${spreadsheetId} range ${range}`, {
        spreadsheetId,
        range,
        updatedCells: result.updatedCells,
      });
      return { success: true, ...result };
    }

    case "append_sheet": {
      const sheets = await getSheetsModule();
      const spreadsheetId = input.spreadsheet_id as string;
      const range = input.range as string;
      const rows = input.rows as unknown[][];

      const result = await sheets.appendRows(spreadsheetId, range, rows);
      await logAction("sheet_appended", `Appended ${rows.length} rows to ${spreadsheetId}`, {
        spreadsheetId,
        range,
        updatedRows: result.updatedRows,
      });
      return { success: true, ...result };
    }

    // ─── Action Log + Personal Entries ──────────────────────────

    case "log_action": {
      await logAction(
        input.action_type as string,
        input.description as string,
        (input.details as Record<string, unknown>) || {},
        (input.triggered_by as string) || "user_request"
      );
      return { success: true };
    }

    case "get_action_log": {
      const hoursAgo = (input.hours_ago as number) || 24;
      const logLimit = (input.limit as number) || 20;
      const logs = await getActionLog(hoursAgo, logLimit);
      return logs;
    }

    case "log_entry": {
      const entryCategory = input.category as string;
      const entryTitle = input.title as string;
      let entryAmount = (input.amount as number) || 0;
      const entryCurrency = (input.currency as string) || "JMD";

      // Escalation check for expense entries (spending threshold)
      if (entryCategory === "expense" && entryAmount) {
        const escalation = await checkEscalation("personal_entry_logged", {
          amount: Math.abs(entryAmount),
          currency: entryCurrency,
        });
        if (!escalation.allowed) {
          return { error: escalation.reason, requiresApproval: escalation.requiresApproval };
        }
      }

      const entryDate = input.date
        ? new Date(input.date as string)
        : todayJamaica();

      // For expenses, ensure amount is negative
      if (entryCategory === "expense" && entryAmount > 0) {
        entryAmount = -entryAmount;
      }

      const externalId = `kemi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const transaction = await prisma.transaction.create({
        data: {
          externalId,
          date: entryDate,
          name: entryTitle,
          amount: entryAmount,
          category: entryCategory,
          account: "manual",
          reviewed: false,
        },
      });
      await logAction("entry_logged", `Logged ${entryCategory}: ${entryTitle}`, {
        transactionId: transaction.id,
        amount: entryAmount,
        currency: entryCurrency,
      });
      return { success: true, transaction };
    }

    case "query_entries": {
      const qCategory = input.category as string | undefined;
      const dateFrom = input.date_from
        ? new Date(input.date_from as string)
        : undefined;
      const dateTo = input.date_to
        ? new Date(input.date_to as string)
        : undefined;
      const qLimit = (input.limit as number) || 50;

      const entries = await prisma.transaction.findMany({
        where: {
          ...(qCategory
            ? { category: { contains: qCategory, mode: "insensitive" as const } }
            : {}),
          ...(dateFrom || dateTo
            ? {
                date: {
                  ...(dateFrom ? { gte: dateFrom } : {}),
                  ...(dateTo ? { lte: dateTo } : {}),
                },
              }
            : {}),
        },
        orderBy: { date: "desc" },
        take: qLimit,
      });
      return entries;
    }

    case "get_summary": {
      const summaryCategory = input.category as string | undefined;
      const period = (input.period as string) || "month";

      let periodStart: Date;
      const periodEnd = new Date();

      if (period === "week") {
        periodStart = startOfWeek();
      } else if (period === "year") {
        periodStart = new Date(todayJamaica());
        periodStart.setMonth(0, 1);
      } else {
        // month
        periodStart = new Date(todayJamaica());
        periodStart.setDate(1);
      }

      const where: Prisma.TransactionWhereInput = {
        date: { gte: periodStart, lte: periodEnd },
        ...(summaryCategory
          ? { category: { contains: summaryCategory, mode: "insensitive" as const } }
          : {}),
      };

      const transactions = await prisma.transaction.findMany({ where });

      // Group by category
      const breakdown: Record<string, { total: number; count: number }> = {};
      let totalIncome = 0;
      let totalExpenses = 0;

      for (const tx of transactions) {
        const cat = tx.category || "uncategorized";
        if (!breakdown[cat]) breakdown[cat] = { total: 0, count: 0 };
        breakdown[cat].total += tx.amount;
        breakdown[cat].count += 1;
        if (tx.amount >= 0) totalIncome += tx.amount;
        else totalExpenses += tx.amount;
      }

      return {
        period,
        periodStart,
        periodEnd,
        totalIncome,
        totalExpenses,
        net: totalIncome + totalExpenses,
        breakdown,
        transactionCount: transactions.length,
      };
    }

    // ─── Budget / Reading / Journal ─────────────────────────────

    case "get_budget_overview": {
      // Get latest allocation per category
      const allocations = await prisma.budgetAllocation.findMany({
        orderBy: { effectiveFrom: "desc" },
      });
      // Deduplicate: keep latest per category
      const latestAllocations = new Map<
        string,
        { category: string; amount: number; percentage: number | null }
      >();
      for (const a of allocations) {
        if (!latestAllocations.has(a.category)) {
          latestAllocations.set(a.category, {
            category: a.category,
            amount: a.amount,
            percentage: a.percentage,
          });
        }
      }

      // Current month spending
      const monthStart = new Date(todayJamaica());
      monthStart.setDate(1);
      const transactions = await prisma.transaction.findMany({
        where: { date: { gte: monthStart } },
      });

      const spentByCategory: Record<string, number> = {};
      for (const tx of transactions) {
        const cat = tx.category || "uncategorized";
        spentByCategory[cat] = (spentByCategory[cat] || 0) + tx.amount;
      }

      const overview = Array.from(latestAllocations.values()).map((a) => ({
        category: a.category,
        allocated: a.amount,
        spent: Math.abs(spentByCategory[a.category] || 0),
        remaining: a.amount - Math.abs(spentByCategory[a.category] || 0),
        percentUsed:
          a.amount > 0
            ? Math.round(
                (Math.abs(spentByCategory[a.category] || 0) / a.amount) * 100
              )
            : 0,
      }));

      return { month: monthStart, allocations: overview };
    }

    case "get_subscriptions": {
      const subs = await prisma.recurringTransaction.findMany({
        where: { active: true },
        orderBy: { nextDate: "asc" },
      });
      return subs;
    }

    case "add_subscription": {
      const sub = await prisma.recurringTransaction.create({
        data: {
          name: input.name as string,
          amount: input.amount as number,
          currency: (input.currency as string) || "USD",
          category: (input.category as string) || null,
          frequency: (input.frequency as string) || "monthly",
          nextDate: input.next_date
            ? new Date(input.next_date as string)
            : null,
        },
      });
      await logAction(
        "subscription_added",
        `Added subscription: ${sub.name}`,
        { subscriptionId: sub.id, amount: sub.amount }
      );
      return { success: true, subscription: sub };
    }

    case "cancel_subscription": {
      const escalation = await checkEscalation("subscription_cancelled", {
        confirmed: (input.confirmed as boolean) || false,
      });
      if (!escalation.allowed) {
        return { error: escalation.reason, requiresApproval: escalation.requiresApproval };
      }

      const sub = await prisma.recurringTransaction.update({
        where: { id: input.subscription_id as string },
        data: { active: false },
      });
      await logAction(
        "subscription_cancelled",
        `Cancelled subscription: ${sub.name}`,
        { subscriptionId: sub.id }
      );
      return { success: true, subscription: sub };
    }

    case "log_reading_session": {
      const readingLog = await prisma.readingLog.create({
        data: {
          readingItemId: input.reading_item_id as string,
          date: todayJamaica(),
          minutesRead: (input.minutes_read as number) || null,
          pagesRead: (input.pages_read as number) || null,
          note: (input.note as string) || null,
        },
      });
      await logAction("reading_session_logged", "Logged reading session", {
        readingLogId: readingLog.id,
        readingItemId: input.reading_item_id,
      });
      return { success: true, readingLog };
    }

    case "update_reading_progress": {
      const readingItemId = input.reading_item_id as string;

      // Fetch current state to handle status transitions
      const currentItem = await prisma.readingItem.findUniqueOrThrow({
        where: { id: readingItemId },
      });

      const readingData: Record<string, unknown> = {};
      if (input.progress !== undefined) readingData.progress = input.progress;
      if (input.rating !== undefined) readingData.rating = input.rating;
      if (input.takeaway !== undefined) readingData.takeaway = input.takeaway;
      if (input.status !== undefined) {
        readingData.status = input.status;
        const newStatus = input.status as string;
        if (newStatus === "reading" && !currentItem.startedAt) {
          readingData.startedAt = new Date();
        }
        if (newStatus === "completed") {
          readingData.finishedAt = new Date();
        }
      }

      const item = await prisma.readingItem.update({
        where: { id: readingItemId },
        data: readingData,
      });
      await logAction(
        "reading_progress_updated",
        `Updated reading: ${item.title}`,
        { readingItemId: item.id, changes: Object.keys(readingData) }
      );
      return { success: true, item };
    }

    case "create_journal_entry": {
      const entry = await prisma.journalEntry.create({
        data: {
          body: input.body as string,
          type: (input.type as string) || "reflection",
          title: (input.title as string) || null,
          prompt: (input.prompt as string) || null,
          tags: (input.tags as string[]) || [],
          date: todayJamaica(),
        },
      });
      await logAction("journal_entry_created", "Created journal entry", {
        entryId: entry.id,
        type: entry.type,
      });
      return { success: true, entry };
    }

    case "query_journal": {
      const journalType = input.type as string | undefined;
      const journalSearch = input.search as string | undefined;
      const journalDaysBack = (input.days as number) || 7;
      const journalLimit = (input.limit as number) || 20;

      const journalSince = new Date(todayJamaica());
      journalSince.setDate(journalSince.getDate() - journalDaysBack);

      const journalWhere: Prisma.JournalEntryWhereInput = {
        date: { gte: journalSince },
        ...(journalType ? { type: journalType } : {}),
        ...(journalSearch
          ? {
              OR: [
                {
                  body: {
                    contains: journalSearch,
                    mode: "insensitive" as const,
                  },
                },
                {
                  title: {
                    contains: journalSearch,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      };

      const journalEntries = await prisma.journalEntry.findMany({
        where: journalWhere,
        orderBy: { date: "desc" },
        take: journalLimit,
      });
      return journalEntries;
    }

    // ─── Memory ──────────────────────────────────────────────

    case "search_memories": {
      const query = input.query as string;
      const limit = (input.limit as number) || 5;
      const memoryType = input.memory_type as string | undefined;
      const threshold = (input.threshold as number) || 0.7;

      const results = await recall(query, limit, memoryType, threshold);
      if (results.length === 0) {
        return { message: "No relevant memories found." };
      }
      return results;
    }

    case "store_memory": {
      const content = input.content as string;
      const memoryType = (input.memory_type as string) || "note";
      const metadata = (input.metadata as Record<string, unknown>) || {};
      const importance = (input.importance as number) || 0.5;

      const id = await remember(content, memoryType, metadata, undefined, importance);
      if (!id) {
        return { error: "Failed to store memory." };
      }
      await logAction("store_memory", `Stored ${memoryType} memory`, {
        memoryId: id,
        contentPreview: content.slice(0, 100),
      });
      return { stored: true, id };
    }

    case "log_mood": {
      const mood = input.mood as number;
      const energy = input.energy as number;
      const note = input.note as string | undefined;

      if (mood < 1 || mood > 5 || energy < 1 || energy > 5) {
        return { error: "mood and energy must be between 1 and 5" };
      }

      const entry = await prisma.moodEntry.create({
        data: { mood, energy, note: note || null },
      });
      await logAction("log_mood", `Logged mood ${mood}/5, energy ${energy}/5`, {
        entryId: entry.id,
      });
      const labels = ["", "怒 Angry", "憂 Low", "平 Neutral", "楽 Good", "喜 Great"];
      return {
        logged: true,
        id: entry.id,
        mood: `${mood}/5 (${labels[mood]})`,
        energy: `${energy}/5`,
      };
    }

    case "get_mood": {
      const days = (input.days as number) || 7;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const entries = await prisma.moodEntry.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
      });

      if (entries.length === 0) {
        return { message: `No mood entries in the last ${days} days.` };
      }

      const avgMood = entries.reduce((s, e) => s + e.mood, 0) / entries.length;
      const avgEnergy = entries.reduce((s, e) => s + e.energy, 0) / entries.length;

      return {
        entries: entries.map((e) => ({
          date: e.createdAt.toISOString().split("T")[0],
          mood: e.mood,
          energy: e.energy,
          note: e.note,
        })),
        averages: {
          mood: Math.round(avgMood * 10) / 10,
          energy: Math.round(avgEnergy * 10) / 10,
        },
        count: entries.length,
      };
    }

    case "start_focus": {
      const type = (input.type as string) || "pomodoro";
      const durationMinutes = (input.duration_minutes as number) || 25;
      const label = input.label as string | undefined;

      const session = await prisma.focusSession.create({
        data: {
          type,
          durationMinutes,
          label: label || null,
          status: "active",
        },
      });
      await logAction("start_focus", `Started ${durationMinutes}min ${type} session`, {
        sessionId: session.id,
      });
      return {
        started: true,
        id: session.id,
        type,
        durationMinutes,
        label: label || null,
      };
    }

    case "get_focus_stats": {
      const days = (input.days as number) || 7;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const sessions = await prisma.focusSession.findMany({
        where: {
          status: "completed",
          startedAt: { gte: since },
        },
        orderBy: { startedAt: "desc" },
      });

      const totalMinutes = sessions.reduce((s, f) => s + (f.actualMinutes || 0), 0);
      const todayStr = new Date().toISOString().split("T")[0];
      const todayMinutes = sessions
        .filter((s) => s.startedAt.toISOString().startsWith(todayStr))
        .reduce((s, f) => s + (f.actualMinutes || 0), 0);

      return {
        period: `${days} days`,
        totalSessions: sessions.length,
        totalMinutes,
        todayMinutes,
        recentSessions: sessions.slice(0, 5).map((s) => ({
          date: s.startedAt.toISOString().split("T")[0],
          type: s.type,
          minutes: s.actualMinutes || s.durationMinutes,
          label: s.label,
        })),
      };
    }

    case "get_weekly_review": {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      const review = await prisma.weeklyReview.findUnique({
        where: { weekOf: monday },
      });

      if (!review) {
        return { message: "No weekly review generated yet for this week. The user can generate one from the Review page." };
      }

      return {
        weekOf: review.weekOf.toISOString().split("T")[0],
        status: review.status,
        stats: review.stats,
        aiPrompts: review.aiPrompts,
        reflections: review.reflections,
        highlights: review.highlights,
      };
    }

    case "get_insights": {
      const insights = await prisma.insight.findMany({
        where: { dismissed: false },
        orderBy: { score: "desc" },
        take: 5,
      });

      if (insights.length === 0) {
        return { message: "No active insights. Insights are generated periodically from cross-module data." };
      }

      return insights.map((i) => ({
        type: i.type,
        title: i.title,
        body: i.body,
        modules: i.modules,
        score: i.score,
        weekOf: i.weekOf.toISOString().split("T")[0],
      }));
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
