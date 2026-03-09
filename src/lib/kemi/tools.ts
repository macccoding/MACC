import type Anthropic from "@anthropic-ai/sdk";

export const KEMI_TOOLS: Anthropic.Messages.Tool[] = [
  // ─── Read Tools (15) ──────────────────────────────────────────

  {
    name: "get_habits",
    description:
      "Get all habits with today's completion status. Returns habit names, frequencies, and whether each was logged today.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_goals",
    description:
      "Get goals, optionally filtered by status. Returns title, description, deadline, and status.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description:
            'Filter by status: "active", "completed", "paused", "cancelled". Omit for all goals.',
        },
      },
      required: [],
    },
  },
  {
    name: "get_portfolio",
    description:
      "Get investment portfolio with current prices, gains/losses, and recent notes.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_finances",
    description:
      "Get the latest financial snapshot (net worth, accounts, balances).",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_transactions",
    description:
      "Get recent transactions, optionally filtered by category and time range.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "Number of days to look back. Default 7.",
        },
        category: {
          type: "string",
          description: "Filter by category name.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_health",
    description:
      "Get health snapshots (steps, calories, heart rate, sleep) for recent days.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "Number of days to look back. Default 7.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_emails",
    description: "Get cached emails, optionally filtered by category or unread status.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description: "Filter by category.",
        },
        unread: {
          type: "boolean",
          description: "If true, only return unread emails.",
        },
        limit: {
          type: "number",
          description: "Max emails to return. Default 20.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_journal",
    description: "Get journal entries for recent days.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "Number of days to look back. Default 7.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_contacts",
    description:
      "Get contacts, optionally searching by name. Includes recent interactions.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search contacts by name.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_learning",
    description: "Get learning tracks with progress and recent logs.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_reading",
    description:
      "Get reading list items, optionally filtered by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description:
            'Filter by status: "to_read", "reading", "completed". Omit for all.',
        },
      },
      required: [],
    },
  },
  {
    name: "get_travel",
    description: "Get travel items, optionally filtered by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description:
            'Filter by status: "planning", "booked", "completed". Omit for all.',
        },
      },
      required: [],
    },
  },
  {
    name: "get_creative",
    description: "Get creative projects, optionally filtered by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description:
            'Filter by status: "in_progress", "completed", "paused". Omit for all.',
        },
      },
      required: [],
    },
  },
  {
    name: "get_captures",
    description: "Get unprocessed captures (quick thoughts, ideas, voice note transcripts).",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "search_knowledge",
    description:
      "Search the knowledge graph (Kioku) by name or tags. Returns nodes with their fields and connections.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term to match against node names and tags.",
        },
      },
      required: ["query"],
    },
  },

  // ─── Write Tools (7) ──────────────────────────────────────────

  {
    name: "log_habit",
    description:
      "Log a habit as completed for today. Finds the habit by name (case-insensitive partial match).",
    input_schema: {
      type: "object" as const,
      properties: {
        habit_name: {
          type: "string",
          description: "Name of the habit to log (partial match OK).",
        },
      },
      required: ["habit_name"],
    },
  },
  {
    name: "add_goal",
    description: "Create a new goal.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Goal title.",
        },
        description: {
          type: "string",
          description: "Goal description.",
        },
        deadline: {
          type: "string",
          description: "ISO date string for the deadline.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "add_capture",
    description:
      "Capture a quick thought, idea, or note for later processing.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "The capture content.",
        },
        category: {
          type: "string",
          description: "Optional category tag.",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "add_journal",
    description:
      "Add to today's journal entry. If an entry exists for today, appends to it.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "Journal content to add.",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "log_interaction",
    description:
      "Log an interaction with a contact. Finds the contact by name.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_name: {
          type: "string",
          description: "Name of the contact.",
        },
        notes: {
          type: "string",
          description: "Notes about the interaction.",
        },
      },
      required: ["contact_name", "notes"],
    },
  },
  {
    name: "add_reading",
    description: "Add a book, article, or other reading item to the list.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Title of the reading item.",
        },
        type: {
          type: "string",
          description: 'Type: "book", "article", "paper". Default "book".',
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_goal_status",
    description: "Update the status of an existing goal.",
    input_schema: {
      type: "object" as const,
      properties: {
        goal_id: {
          type: "string",
          description: "The goal ID.",
        },
        status: {
          type: "string",
          description:
            'New status: "active", "completed", "paused", "cancelled".',
        },
      },
      required: ["goal_id", "status"],
    },
  },

  // ─── Task Management (4) ─────────────────────────────────────

  {
    name: "create_task",
    description:
      "Create a new task with optional priority, category, due date, and tags.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Task title (required)." },
        description: { type: "string", description: "Task description." },
        priority: {
          type: "string",
          description:
            'Priority level: "urgent", "high", "medium", "low". Default "medium".',
        },
        category: { type: "string", description: "Task category." },
        due_date: {
          type: "string",
          description: "Due date in YYYY-MM-DD format.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the task.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Update fields on an existing task.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: { type: "string", description: "The task ID (required)." },
        title: { type: "string", description: "New title." },
        description: { type: "string", description: "New description." },
        status: {
          type: "string",
          description:
            'New status: "open", "in_progress", "done", "cancelled", "parked".',
        },
        priority: {
          type: "string",
          description:
            'New priority: "urgent", "high", "medium", "low".',
        },
        due_date: {
          type: "string",
          description: "New due date in YYYY-MM-DD format.",
        },
        notes: { type: "string", description: "Notes to set on the task." },
      },
      required: ["task_id"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as done.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: { type: "string", description: "The task ID (required)." },
      },
      required: ["task_id"],
    },
  },
  {
    name: "query_tasks",
    description:
      "Search and filter tasks by status, category, or search term.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "array",
          items: { type: "string" },
          description:
            'Filter by statuses. Default ["open", "in_progress"].',
        },
        category: { type: "string", description: "Filter by category." },
        search: {
          type: "string",
          description: "Search term (matches title or description).",
        },
        limit: {
          type: "number",
          description: "Max results to return. Default 20.",
        },
      },
      required: [],
    },
  },

  // ─── Contact CRM (5) ────────────────────────────────────────

  {
    name: "create_contact",
    description: "Create a new contact with CRM fields.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Contact name (required)." },
        email: { type: "string", description: "Email address." },
        phone: { type: "string", description: "Phone number." },
        company: { type: "string", description: "Company name." },
        relationship: {
          type: "string",
          description: "Relationship type (e.g. friend, colleague, mentor).",
        },
        context: {
          type: "string",
          description: "How you know this person / context.",
        },
        birthday: {
          type: "string",
          description: "Birthday in YYYY-MM-DD format.",
        },
        importance: {
          type: "string",
          description: 'Importance: "high", "medium", "low".',
        },
        contact_frequency: {
          type: "string",
          description:
            'How often to reach out: "daily", "weekly", "biweekly", "monthly", "quarterly".',
        },
        notes: { type: "string", description: "Additional notes." },
      },
      required: ["name"],
    },
  },
  {
    name: "update_contact",
    description: "Update fields on an existing contact.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: {
          type: "string",
          description: "The contact ID (required).",
        },
        name: { type: "string", description: "New name." },
        email: { type: "string", description: "New email." },
        phone: { type: "string", description: "New phone." },
        company: { type: "string", description: "New company." },
        relationship: { type: "string", description: "New relationship." },
        importance: {
          type: "string",
          description: 'New importance: "high", "medium", "low".',
        },
        contact_frequency: {
          type: "string",
          description:
            'New frequency: "daily", "weekly", "biweekly", "monthly", "quarterly".',
        },
        notes: { type: "string", description: "New notes." },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "search_contacts",
    description: "Search contacts by name, email, or company.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query (required). Matches name, email, or company.",
        },
        limit: {
          type: "number",
          description: "Max results to return. Default 20.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "set_contact_frequency",
    description:
      "Set how often to reach out to a contact, and calculate the next reachout date.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: {
          type: "string",
          description: "The contact ID (required).",
        },
        frequency: {
          type: "string",
          description:
            'Frequency: "daily", "weekly", "biweekly", "monthly", "quarterly" (required).',
        },
      },
      required: ["contact_id", "frequency"],
    },
  },
  {
    name: "get_relationship_summary",
    description:
      "Overview of relationship health: overdue reachouts, upcoming birthdays.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },

  // ─── Strategy (5) ───────────────────────────────────────────

  {
    name: "set_goal",
    description: "Create a strategic goal.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Goal title (required)." },
        description: { type: "string", description: "Goal description." },
        category: { type: "string", description: "Category." },
        target_date: {
          type: "string",
          description: "Target date in YYYY-MM-DD format.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "set_priority",
    description: "Create a strategic priority.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Priority title (required)." },
        description: { type: "string", description: "Priority description." },
        category: { type: "string", description: "Category." },
      },
      required: ["title"],
    },
  },
  {
    name: "set_okr",
    description: "Create an OKR (Objective and Key Result).",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "OKR title (required)." },
        description: { type: "string", description: "OKR description." },
        category: { type: "string", description: "Category." },
        target_date: {
          type: "string",
          description: "Target date in YYYY-MM-DD format.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "review_goals",
    description:
      "Review active strategic goals, priorities, and/or OKRs.",
    input_schema: {
      type: "object" as const,
      properties: {
        context_type: {
          type: "string",
          description:
            'Filter by type: "all", "goal", "priority", "okr". Default "all".',
        },
      },
      required: [],
    },
  },
  {
    name: "update_goal_progress",
    description: "Update progress and/or status on a strategic goal.",
    input_schema: {
      type: "object" as const,
      properties: {
        goal_id: { type: "string", description: "The goal ID (required)." },
        progress: {
          type: "number",
          description: "Progress percentage (0-100).",
        },
        status: {
          type: "string",
          description:
            'New status: "active", "completed", "paused", "abandoned".',
        },
      },
      required: ["goal_id"],
    },
  },

  // ─── Calendar Rules (4) ─────────────────────────────────────

  {
    name: "create_calendar_rule",
    description:
      "Create a calendar rule (block recurring time, auto-decline, focus time, or reminder).",
    input_schema: {
      type: "object" as const,
      properties: {
        rule_type: {
          type: "string",
          description:
            'Rule type (required): "block_recurring", "auto_decline", "focus_time", "reminder".',
        },
        title: { type: "string", description: "Rule title (required)." },
        description: { type: "string", description: "Rule description." },
        day_of_week: {
          type: "array",
          items: { type: "string" },
          description:
            'Days of week this rule applies (e.g. ["Monday", "Wednesday"]).',
        },
        start_time: {
          type: "string",
          description: "Start time in HH:MM format.",
        },
        end_time: {
          type: "string",
          description: "End time in HH:MM format.",
        },
        calendar_id: {
          type: "string",
          description: "Calendar ID this rule applies to.",
        },
        metadata: {
          type: "object",
          description: "Additional metadata for the rule.",
        },
      },
      required: ["rule_type", "title"],
    },
  },
  {
    name: "update_calendar_rule",
    description: "Update an existing calendar rule.",
    input_schema: {
      type: "object" as const,
      properties: {
        rule_id: {
          type: "string",
          description: "The rule ID (required).",
        },
        title: { type: "string", description: "New title." },
        description: { type: "string", description: "New description." },
        day_of_week: {
          type: "array",
          items: { type: "string" },
          description: "New days of week.",
        },
        start_time: { type: "string", description: "New start time." },
        end_time: { type: "string", description: "New end time." },
        active: { type: "boolean", description: "Whether the rule is active." },
        metadata: { type: "object", description: "New metadata." },
      },
      required: ["rule_id"],
    },
  },
  {
    name: "get_calendar_rules",
    description: "List calendar rules, optionally filtered to active only.",
    input_schema: {
      type: "object" as const,
      properties: {
        active_only: {
          type: "boolean",
          description: "If true, only return active rules. Default true.",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_calendar_rule",
    description: "Delete a calendar rule (requires confirmation).",
    input_schema: {
      type: "object" as const,
      properties: {
        rule_id: {
          type: "string",
          description: "The rule ID (required).",
        },
        confirmed: {
          type: "boolean",
          description: "Must be true to confirm deletion (required).",
        },
      },
      required: ["rule_id", "confirmed"],
    },
  },

  // ─── Action Log + Personal Entries (5) ──────────────────────

  {
    name: "log_action",
    description: "Log an autonomous action taken by Kemi.",
    input_schema: {
      type: "object" as const,
      properties: {
        action_type: {
          type: "string",
          description: "Type of action (required).",
        },
        description: {
          type: "string",
          description: "Description of the action (required).",
        },
        details: {
          type: "object",
          description: "Additional details as key-value pairs.",
        },
        triggered_by: {
          type: "string",
          description: 'What triggered this action. Default "user_request".',
        },
        status: {
          type: "string",
          description: "Status of the action.",
        },
      },
      required: ["action_type", "description"],
    },
  },
  {
    name: "get_action_log",
    description: "Get recent actions from the action log.",
    input_schema: {
      type: "object" as const,
      properties: {
        hours_ago: {
          type: "number",
          description: "How many hours back to look. Default 24.",
        },
        limit: {
          type: "number",
          description: "Max entries to return. Default 20.",
        },
      },
      required: [],
    },
  },
  {
    name: "log_entry",
    description:
      "Log a personal entry: expense, income, health event, learning note, or general note.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description:
            'Category (required): "expense", "income", "health", "learning", "note".',
        },
        title: {
          type: "string",
          description: "Title/name for the entry (required).",
        },
        amount: {
          type: "number",
          description: "Amount (for expense/income entries).",
        },
        currency: {
          type: "string",
          description: 'Currency code. Default "JMD".',
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the entry.",
        },
        notes: { type: "string", description: "Additional notes." },
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format. Default today.",
        },
      },
      required: ["category", "title"],
    },
  },
  {
    name: "query_entries",
    description: "Search transactions/entries by category and date range.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: { type: "string", description: "Filter by category." },
        date_from: {
          type: "string",
          description: "Start date in YYYY-MM-DD format.",
        },
        date_to: {
          type: "string",
          description: "End date in YYYY-MM-DD format.",
        },
        limit: {
          type: "number",
          description: "Max entries to return. Default 50.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_summary",
    description:
      "Get spending/income summary grouped by category for a given period.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description: "Filter to a specific category.",
        },
        period: {
          type: "string",
          description: 'Period: "week", "month", "year". Default "month".',
        },
      },
      required: [],
    },
  },

  // ─── Google Integration (11) ────────────────────────────────

  {
    name: "check_email",
    description:
      "Check unread emails from Gmail.",
    input_schema: {
      type: "object" as const,
      properties: {
        max_results: {
          type: "number",
          description: "Max emails to return. Default 10.",
        },
      },
      required: [],
    },
  },
  {
    name: "read_email",
    description:
      "Read the full body of a specific email by message ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        message_id: {
          type: "string",
          description: "Gmail message ID (required).",
        },
      },
      required: ["message_id"],
    },
  },
  {
    name: "send_email",
    description:
      "Send an email via Gmail. Requires escalation check (unknown contacts, sensitive content).",
    input_schema: {
      type: "object" as const,
      properties: {
        to: {
          type: "string",
          description: "Recipient email address (required).",
        },
        subject: {
          type: "string",
          description: "Email subject line (required).",
        },
        body: {
          type: "string",
          description: "Email body text (required).",
        },
        thread_id: {
          type: "string",
          description: "Gmail thread ID to reply in (optional).",
        },
        confirmed: {
          type: "boolean",
          description:
            "Set to true to confirm sending after escalation check.",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "search_email",
    description:
      "Search emails using Gmail query syntax (e.g. from:, subject:, has:attachment).",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Gmail search query (required).",
        },
        max_results: {
          type: "number",
          description: "Max results to return. Default 10.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_calendar_events",
    description:
      "Get calendar events in a date range from Google Calendar.",
    input_schema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "Start date in ISO format (required).",
        },
        end_date: {
          type: "string",
          description: "End date in ISO format (required).",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "create_calendar_event",
    description:
      "Create a Google Calendar event. Escalates if attendees are present and not confirmed.",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: {
          type: "string",
          description: "Event title (required).",
        },
        start: {
          type: "string",
          description: "Start datetime in ISO format (required).",
        },
        end: {
          type: "string",
          description: "End datetime in ISO format (required).",
        },
        description: {
          type: "string",
          description: "Event description.",
        },
        location: {
          type: "string",
          description: "Event location.",
        },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "List of attendee email addresses.",
        },
        confirmed: {
          type: "boolean",
          description:
            "Set to true to confirm creation with attendees.",
        },
      },
      required: ["summary", "start", "end"],
    },
  },
  {
    name: "update_calendar_event",
    description: "Update a Google Calendar event by event ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        event_id: {
          type: "string",
          description: "Google Calendar event ID (required).",
        },
        summary: {
          type: "string",
          description: "New event title.",
        },
        start: {
          type: "string",
          description: "New start datetime in ISO format.",
        },
        end: {
          type: "string",
          description: "New end datetime in ISO format.",
        },
        description: {
          type: "string",
          description: "New event description.",
        },
        location: {
          type: "string",
          description: "New event location.",
        },
      },
      required: ["event_id"],
    },
  },
  {
    name: "delete_calendar_event",
    description:
      "Delete a Google Calendar event. Requires confirmed=true.",
    input_schema: {
      type: "object" as const,
      properties: {
        event_id: {
          type: "string",
          description: "Google Calendar event ID (required).",
        },
        confirmed: {
          type: "boolean",
          description: "Must be true to confirm deletion (required).",
        },
      },
      required: ["event_id", "confirmed"],
    },
  },
  {
    name: "read_sheet",
    description:
      "Read values from a Google Sheet by spreadsheet ID and range.",
    input_schema: {
      type: "object" as const,
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "Google Sheets spreadsheet ID (required).",
        },
        range: {
          type: "string",
          description:
            'Sheet range in A1 notation, e.g. "Sheet1!A1:D10" (required).',
        },
      },
      required: ["spreadsheet_id", "range"],
    },
  },
  {
    name: "update_sheet",
    description: "Update cells in a Google Sheet.",
    input_schema: {
      type: "object" as const,
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "Google Sheets spreadsheet ID (required).",
        },
        range: {
          type: "string",
          description: 'Sheet range in A1 notation (required).',
        },
        values: {
          type: "array",
          items: {
            type: "array",
            items: { type: "string" },
          },
          description: "2D array of values to write (required).",
        },
      },
      required: ["spreadsheet_id", "range", "values"],
    },
  },
  {
    name: "append_sheet",
    description: "Append rows to a Google Sheet.",
    input_schema: {
      type: "object" as const,
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "Google Sheets spreadsheet ID (required).",
        },
        range: {
          type: "string",
          description: 'Sheet range in A1 notation (required).',
        },
        rows: {
          type: "array",
          items: {
            type: "array",
            items: { type: "string" },
          },
          description: "2D array of rows to append (required).",
        },
      },
      required: ["spreadsheet_id", "range", "rows"],
    },
  },

  // ─── Budget / Reading / Journal (8) ─────────────────────────

  {
    name: "get_budget_overview",
    description:
      "Get budget allocations vs actual spending for the current month.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_subscriptions",
    description: "List all active recurring subscriptions.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "add_subscription",
    description: "Add a new recurring subscription/transaction.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Subscription name (required).",
        },
        amount: {
          type: "number",
          description: "Recurring amount (required).",
        },
        currency: {
          type: "string",
          description: 'Currency code. Default "USD".',
        },
        category: { type: "string", description: "Category." },
        frequency: {
          type: "string",
          description:
            'Billing frequency: "monthly", "weekly", "yearly". Default "monthly".',
        },
        next_date: {
          type: "string",
          description: "Next billing date in YYYY-MM-DD format.",
        },
      },
      required: ["name", "amount"],
    },
  },
  {
    name: "cancel_subscription",
    description: "Cancel (deactivate) a recurring subscription.",
    input_schema: {
      type: "object" as const,
      properties: {
        subscription_id: {
          type: "string",
          description: "The subscription ID (required).",
        },
      },
      required: ["subscription_id"],
    },
  },
  {
    name: "log_reading_session",
    description: "Log a reading session for a reading item.",
    input_schema: {
      type: "object" as const,
      properties: {
        reading_item_id: {
          type: "string",
          description: "The reading item ID (required).",
        },
        minutes_read: {
          type: "number",
          description: "Minutes spent reading.",
        },
        pages_read: {
          type: "number",
          description: "Pages read.",
        },
        note: {
          type: "string",
          description: "Notes about this reading session.",
        },
      },
      required: ["reading_item_id"],
    },
  },
  {
    name: "update_reading_progress",
    description:
      "Update reading item progress, status, rating, or takeaway.",
    input_schema: {
      type: "object" as const,
      properties: {
        reading_item_id: {
          type: "string",
          description: "The reading item ID (required).",
        },
        progress: {
          type: "number",
          description: "Progress percentage (0-100).",
        },
        status: {
          type: "string",
          description:
            'New status: "to_read", "reading", "completed".',
        },
        rating: {
          type: "number",
          description: "Rating (1-5).",
        },
        takeaway: {
          type: "string",
          description: "Key takeaway or summary.",
        },
      },
      required: ["reading_item_id"],
    },
  },
  {
    name: "create_journal_entry",
    description: "Create a structured journal entry.",
    input_schema: {
      type: "object" as const,
      properties: {
        body: {
          type: "string",
          description: "Journal entry body text (required).",
        },
        type: {
          type: "string",
          description:
            'Entry type: "reflection", "capture", "note". Default "reflection".',
        },
        title: { type: "string", description: "Entry title." },
        prompt: {
          type: "string",
          description: "The prompt that inspired this entry.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the entry.",
        },
      },
      required: ["body"],
    },
  },
  {
    name: "query_journal",
    description: "Query journal entries by type, search term, and time range.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          description: 'Filter by type: "reflection", "capture", "note".',
        },
        search: {
          type: "string",
          description: "Search term (matches body and title).",
        },
        days: {
          type: "number",
          description: "Number of days to look back. Default 7.",
        },
        limit: {
          type: "number",
          description: "Max entries to return. Default 20.",
        },
      },
      required: [],
    },
  },

  // ─── Memory (2) ──────────────────────────────────────────────

  {
    name: "search_memories",
    description:
      "Search long-term semantic memory using natural language. Returns relevant memories ranked by similarity.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Natural language query to search memories (required).",
        },
        limit: {
          type: "number",
          description: "Max memories to return. Default 5.",
        },
        memory_type: {
          type: "string",
          description:
            'Filter by memory type: "conversation", "task", "receipt", "preference", "fact", "note". Omit for all types.',
        },
        threshold: {
          type: "number",
          description:
            "Minimum similarity threshold (0-1). Default 0.7. Lower = more results but less relevant.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "store_memory",
    description:
      "Store information in long-term semantic memory for future recall. Use for preferences, facts, and important notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "The content to remember (required).",
        },
        memory_type: {
          type: "string",
          description:
            'Memory type: "preference", "fact", "note". Default "note".',
        },
        metadata: {
          type: "object",
          description: "Additional metadata as key-value pairs.",
        },
        importance: {
          type: "number",
          description: "Importance score (0-1). Default 0.5. Higher = more likely to surface.",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "log_mood",
    description:
      "Log a mood and energy check-in. Mood and energy are 1-5 scale.",
    input_schema: {
      type: "object" as const,
      properties: {
        mood: { type: "number", description: "Mood score 1-5 (1=awful, 5=great)" },
        energy: { type: "number", description: "Energy score 1-5 (1=drained, 5=peak)" },
        note: { type: "string", description: "Optional note about how they're feeling" },
      },
      required: ["mood", "energy"],
    },
  },
  {
    name: "get_mood",
    description:
      "Get recent mood and energy entries. Returns check-ins from the last N days.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: { type: "number", description: "Number of days to look back. Default 7." },
      },
      required: [],
    },
  },
  {
    name: "start_focus",
    description:
      "Start a focus/pomodoro timer session.",
    input_schema: {
      type: "object" as const,
      properties: {
        duration_minutes: { type: "number", description: "Duration in minutes (default 25)" },
        type: { type: "string", description: '"pomodoro", "deep_work", or "break". Default "pomodoro".' },
        label: { type: "string", description: "What they're working on" },
      },
      required: [],
    },
  },
  {
    name: "get_focus_stats",
    description:
      "Get focus session statistics and recent history.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: { type: "number", description: "Number of days to look back. Default 7." },
      },
      required: [],
    },
  },
  {
    name: "get_weekly_review",
    description:
      "Get the current week's review with stats, reflection prompts, and user reflections.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_insights",
    description:
      "Get recent AI-generated insights and cross-module patterns (mood correlations, focus trends, etc.).",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];
