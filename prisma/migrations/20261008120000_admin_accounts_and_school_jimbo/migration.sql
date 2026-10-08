ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "School" ADD COLUMN "jimboId" TEXT REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "School_jimboId_idx" ON "School"("jimboId");
