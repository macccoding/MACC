-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "birthday" DATE,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "contactFrequency" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "importance" TEXT,
ADD COLUMN     "nextReachOut" DATE,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "relationship" TEXT;

-- AlterTable
ALTER TABLE "habit_logs" ADD COLUMN     "note" TEXT,
ADD COLUMN     "skipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#e04835',
ADD COLUMN     "frequencyPerPeriod" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "period" TEXT NOT NULL DEFAULT 'day',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetValue" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'daily';

-- AlterTable
ALTER TABLE "reading_items" ADD COLUMN     "author" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "format" TEXT,
ADD COLUMN     "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "takeaway" TEXT;

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'reflection',
    "title" TEXT,
    "body" TEXT NOT NULL,
    "prompt" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_logs" (
    "id" TEXT NOT NULL,
    "readingItemId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "minutesRead" INTEGER,
    "pagesRead" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_scores" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "score" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "nextDate" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_scores_date_key" ON "budget_scores"("date");

-- AddForeignKey
ALTER TABLE "reading_logs" ADD CONSTRAINT "reading_logs_readingItemId_fkey" FOREIGN KEY ("readingItemId") REFERENCES "reading_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
