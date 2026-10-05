-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TRI', 'TEXT', 'NUMBER', 'SELECT');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('PRIVATE', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "custom_questions" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "help" TEXT,
    "type" "QuestionType" NOT NULL,
    "options" JSONB,
    "unit" TEXT,
    "section" TEXT NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'PRIVATE',
    "submitNote" TEXT,
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_questions_key_key" ON "custom_questions"("key");

-- CreateIndex
CREATE INDEX "custom_questions_status_idx" ON "custom_questions"("status");

-- CreateIndex
CREATE INDEX "custom_questions_authorId_idx" ON "custom_questions"("authorId");

-- AddForeignKey
ALTER TABLE "custom_questions" ADD CONSTRAINT "custom_questions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
