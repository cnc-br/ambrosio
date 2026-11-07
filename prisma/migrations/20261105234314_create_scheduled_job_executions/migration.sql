-- CreateEnum
CREATE TYPE "scheduled_job_status" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "scheduled_job_executions" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "scheduled_job_status" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "error" TEXT,

    CONSTRAINT "scheduled_job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_job_executions_jobName_startedAt_idx" ON "scheduled_job_executions"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "scheduled_job_executions_startedAt_idx" ON "scheduled_job_executions"("startedAt");
