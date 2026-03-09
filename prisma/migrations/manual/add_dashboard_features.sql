-- Dashboard Features: Mood, Focus, Weekly Review, Insights

CREATE TABLE IF NOT EXISTS "mood_entries" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "mood" INTEGER NOT NULL,
  "energy" INTEGER NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "focus_sessions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL DEFAULT 'pomodoro',
  "durationMinutes" INTEGER NOT NULL,
  "actualMinutes" INTEGER,
  "label" TEXT,
  "goalId" TEXT,
  "learningTrackId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "weekly_reviews" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "weekOf" DATE NOT NULL,
  "stats" JSONB NOT NULL DEFAULT '{}',
  "aiPrompts" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "reflections" TEXT,
  "highlights" JSONB DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "weekly_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "weekly_reviews_weekOf_key" UNIQUE ("weekOf")
);

CREATE TABLE IF NOT EXISTS "insights" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "weekOf" DATE NOT NULL,
  "dismissed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);
