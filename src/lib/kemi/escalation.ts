import { prisma } from "@/lib/prisma";
import { getPreference } from "./preferences";

export interface EscalationResult {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
}

const SENSITIVE_KEYWORDS = [
  "contract", "legal", "termination", "lawsuit",
  "attorney", "settlement", "confidential",
];

const AUTONOMOUS_ACTIONS = new Set([
  "task_created", "task_updated", "task_completed", "task_queried",
  "action_logged", "action_queried",
  "project_queried", "project_activity_updated",
  "email_checked", "email_searched",
  "habit_logged", "journal_entry_created",
  "reading_session_logged", "reading_progress_updated",
  "subscription_created", "subscription_cancelled",
  "memory_stored", "memory_searched",
  "calendar_rule_created", "calendar_rule_updated",
]);

export async function checkEscalation(
  actionType: string,
  details: Record<string, unknown> = {},
): Promise<EscalationResult> {
  const ok: EscalationResult = { allowed: true, reason: "", requiresApproval: false };

  // 1. Kill switch — highest priority
  const killSwitch = await getPreference<boolean>("kill_switch", false);
  if (killSwitch) {
    return {
      allowed: false,
      reason: "Kill switch is active. All autonomous actions paused.",
      requiresApproval: true,
    };
  }

  // 2. Caricom Freight — always escalate
  const category = (details.category as string) || "";
  if (
    category.toLowerCase().includes("caricom") ||
    JSON.stringify(details).toLowerCase().includes("caricom")
  ) {
    return {
      allowed: false,
      reason: "Caricom Freight matters always require Mike's explicit approval.",
      requiresApproval: true,
    };
  }

  // 3. Deletions require explicit confirmation
  if (actionType.includes("deleted") && !details.confirmed) {
    return {
      allowed: false,
      reason: "Deletions require explicit confirmation.",
      requiresApproval: true,
    };
  }

  // 4. External meeting invitations
  if (["calendar_event_created", "calendar_event_updated"].includes(actionType)) {
    const attendees = (details.external_attendees || details.attendees) as string[] | undefined;
    if (attendees?.length && !details.confirmed) {
      return {
        allowed: false,
        reason: `Calendar event with external attendees (${attendees.join(", ")}) requires confirmation.`,
        requiresApproval: true,
      };
    }
  }

  // 5. Email to unknown contacts
  if (actionType === "email_sent" && !details.confirmed) {
    const toEmail = details.to as string;
    if (toEmail) {
      const contact = await prisma.contact.findFirst({
        where: { email: toEmail },
      });
      if (!contact) {
        return {
          allowed: false,
          reason: `First email to unknown contact (${toEmail}) — confirm before sending.`,
          requiresApproval: true,
        };
      }
    }

    // 6. Sensitive keywords in email
    const combined = `${details.subject || ""} ${details.body || ""}`.toLowerCase();
    if (SENSITIVE_KEYWORDS.some((kw) => combined.includes(kw))) {
      return {
        allowed: false,
        reason: "Email contains sensitive keywords — confirm before sending.",
        requiresApproval: true,
      };
    }
  }

  // 7. Spending thresholds
  const amount = details.amount as number | undefined;
  const currency = (details.currency as string) || "JMD";
  if (amount && amount > 0) {
    const thresholdUsd = (await getPreference<number>("spending_threshold_usd", 100))!;
    const thresholdJmd = (await getPreference<number>("spending_threshold_jmd", 15000))!;
    const threshold = currency.toUpperCase() === "USD" ? thresholdUsd : thresholdJmd;
    if (amount > threshold) {
      return {
        allowed: false,
        reason: `Spending ${currency} $${amount.toLocaleString()} exceeds threshold of ${currency} $${threshold.toLocaleString()}. Confirm?`,
        requiresApproval: true,
      };
    }
  }

  // 8. Autonomous allowed actions
  if (AUTONOMOUS_ACTIONS.has(actionType)) return ok;

  return ok;
}
