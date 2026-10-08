-- Preserve content while collapsing editorial states to DRAFT and PUBLISHED.
UPDATE "Article"
SET "status" = CASE
  WHEN "status" IN ('PUBLISHED', 'APPROVED') THEN 'PUBLISHED'
  ELSE 'DRAFT'
END;

UPDATE "Gallery"
SET "status" = CASE WHEN "status" = 'PUBLISHED' THEN 'PUBLISHED' ELSE 'DRAFT' END;

UPDATE "Document"
SET "status" = CASE WHEN "status" = 'PUBLISHED' THEN 'PUBLISHED' ELSE 'DRAFT' END;

-- Existing page-view records have no visitor identifier, so retain them as page views.
CREATE TABLE "Visitor" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "visitorHash" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'Unknown',
  "firstVisitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastVisitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Visitor_visitorHash_key" ON "Visitor"("visitorHash");
CREATE INDEX "Visitor_lastVisitedAt_idx" ON "Visitor"("lastVisitedAt");
CREATE INDEX "Visitor_country_lastVisitedAt_idx" ON "Visitor"("country", "lastVisitedAt");

CREATE TABLE "new_VisitEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "visitorId" TEXT,
  "pathname" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "referrerHost" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisitEvent_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_VisitEvent" ("id", "pathname", "locale", "referrerHost", "createdAt")
SELECT "id", "pathname", "locale", "referrerHost", "createdAt" FROM "VisitEvent";

DROP TABLE "VisitEvent";
ALTER TABLE "new_VisitEvent" RENAME TO "VisitEvent";

CREATE INDEX "VisitEvent_createdAt_idx" ON "VisitEvent"("createdAt");
CREATE INDEX "VisitEvent_pathname_createdAt_idx" ON "VisitEvent"("pathname", "createdAt");
CREATE INDEX "VisitEvent_visitorId_createdAt_idx" ON "VisitEvent"("visitorId", "createdAt");
