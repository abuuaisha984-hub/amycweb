-- CreateTable
CREATE TABLE "VisitEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pathname" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "referrerHost" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "VisitEvent_createdAt_idx" ON "VisitEvent"("createdAt");

-- CreateIndex
CREATE INDEX "VisitEvent_pathname_createdAt_idx" ON "VisitEvent"("pathname", "createdAt");
