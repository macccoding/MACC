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
];
